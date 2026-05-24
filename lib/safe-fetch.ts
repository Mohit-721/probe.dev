// SSRF-safe HTTP client used by the runner.
//
// Defenses applied to every outbound request:
//   1. Protocol allowlist: http(s) only.
//   2. Hostname → IP resolution with denylist of private/loopback/link-local/CGNAT
//      ranges (IPv4 + IPv6) BEFORE the request is fired.
//   3. Pin the connection to the resolved IP address (defeats DNS rebinding).
//   4. Cap on response body bytes (DoS protection).
//   5. Hard timeout with AbortController.
//   6. No automatic redirect-following — every hop is re-validated.

import dns from "node:dns/promises"
import net from "node:net"
import http from "node:http"
import https from "node:https"
import { URL } from "node:url"

export type SafeFetchOptions = {
  method?: string
  headers?: Record<string, string>
  body?: string
  /** Total request timeout in ms (default 30s). */
  timeoutMs?: number
  /** Maximum response body bytes (default 2 MiB). */
  maxBytes?: number
  /** Maximum redirect hops we will follow (each re-validated). Default 0. */
  maxRedirects?: number
}

export type SafeFetchResult = {
  status: number
  headers: Headers
  body: string
  bodyTruncated: boolean
}

const DEFAULT_TIMEOUT = 30_000
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024 // 2 MiB
const DEFAULT_MAX_REDIRECTS = 0

/** Reject any address that should never be reachable from the public internet. */
function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number)
    if (a === 10) return true
    if (a === 127) return true // loopback
    if (a === 0) return true // "this" network
    if (a === 169 && b === 254) return true // link-local + AWS metadata 169.254.169.254
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
    if (a >= 224) return true // multicast / reserved
    return false
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase()
    if (lower === "::1" || lower === "::") return true
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true // ULA
    if (lower.startsWith("fe80")) return true // link-local
    if (lower.startsWith("ff")) return true // multicast
    // IPv4-mapped (::ffff:x.x.x.x) → recurse on the v4 part
    if (lower.startsWith("::ffff:")) {
      const v4 = lower.slice(7)
      if (net.isIPv4(v4)) return isPrivateAddress(v4)
    }
    return false
  }
  // Unknown family — treat as unsafe.
  return true
}

class SsrfError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SsrfError"
  }
}

async function resolvePublicIp(hostname: string): Promise<string> {
  // Reject literal IP hostnames that are private up front.
  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new SsrfError(`Refusing to connect to private IP ${hostname}`)
    }
    return hostname
  }
  if (hostname === "localhost") {
    throw new SsrfError("Refusing to connect to localhost")
  }
  let addrs: dns.LookupAddress[]
  try {
    addrs = await dns.lookup(hostname, { all: true, verbatim: true })
  } catch (err) {
    throw new SsrfError(
      `DNS lookup failed for ${hostname}: ${err instanceof Error ? err.message : "unknown"}`,
    )
  }
  if (addrs.length === 0) {
    throw new SsrfError(`No DNS records for ${hostname}`)
  }
  for (const a of addrs) {
    if (isPrivateAddress(a.address)) {
      throw new SsrfError(
        `Refusing to connect to ${hostname}: resolves to private address ${a.address}`,
      )
    }
  }
  return addrs[0].address
}

/**
 * Validate a URL string and resolve it to a public IP.
 * Throws SsrfError if the URL targets a non-routable address.
 */
export async function validateUrlForOutbound(rawUrl: string): Promise<{ url: URL; ip: string }> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new SsrfError("URL is not valid")
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SsrfError(`Unsupported protocol ${url.protocol}`)
  }
  const ip = await resolvePublicIp(url.hostname)
  return { url, ip }
}

/**
 * SSRF-safe fetch. Performs the request against the *resolved* IP while
 * preserving the original Host header (so SNI + virtual hosting still work).
 */
export async function safeFetch(rawUrl: string, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES
  const maxRedirects = opts.maxRedirects ?? DEFAULT_MAX_REDIRECTS

  let currentUrl = rawUrl
  let hops = 0

  while (true) {
    const { url, ip } = await validateUrlForOutbound(currentUrl)
    const isHttps = url.protocol === "https:"
    const port = url.port ? Number(url.port) : isHttps ? 443 : 80

    const headers: Record<string, string> = {
      ...(opts.headers ?? {}),
      // Force Host header — we connected by IP, the server still needs to know
      // which virtual host we want.
      Host: url.host,
      "User-Agent": opts.headers?.["User-Agent"] ?? "Probe/1.0 (+https://probe.dev)",
      Accept: opts.headers?.Accept ?? "*/*",
    }

    const requestOptions: http.RequestOptions = {
      method: opts.method ?? "GET",
      host: ip, // pin to resolved IP — defeats DNS rebinding
      port,
      path: `${url.pathname}${url.search}`,
      headers,
      // SNI: send the original hostname during the TLS handshake.
      servername: isHttps ? url.hostname : undefined,
    } as http.RequestOptions

    const result = await new Promise<{
      status: number
      headers: Headers
      body: string
      bodyTruncated: boolean
      redirectTo: string | null
    }>((resolve, reject) => {
      const req = (isHttps ? https : http).request(requestOptions, (res) => {
        const collected: Buffer[] = []
        let received = 0
        let truncated = false

        res.on("data", (chunk: Buffer) => {
          received += chunk.length
          if (received > maxBytes) {
            truncated = true
            req.destroy()
            return
          }
          collected.push(chunk)
        })
        res.on("end", () => {
          const responseHeaders = new Headers()
          for (const [k, v] of Object.entries(res.headers)) {
            if (Array.isArray(v)) {
              v.forEach((vv) => responseHeaders.append(k, vv))
            } else if (typeof v === "string") {
              responseHeaders.set(k, v)
            }
          }
          const status = res.statusCode ?? 0
          // Detect redirects we may want to follow ourselves (re-validated).
          const isRedirect = status >= 300 && status < 400 && res.headers.location
          resolve({
            status,
            headers: responseHeaders,
            body: Buffer.concat(collected).toString("utf8"),
            bodyTruncated: truncated,
            redirectTo: isRedirect ? String(res.headers.location) : null,
          })
        })
        res.on("error", reject)
      })

      const timeout = setTimeout(() => {
        req.destroy(new Error(`Timed out after ${timeoutMs}ms`))
      }, timeoutMs)
      req.on("close", () => clearTimeout(timeout))
      req.on("error", (err) => {
        clearTimeout(timeout)
        if (truncatedRequestError(err)) {
          // Treat early aborts (size cap hit) as a successful-ish response with truncated body.
          resolve({
            status: 0,
            headers: new Headers(),
            body: "",
            bodyTruncated: true,
            redirectTo: null,
          })
        } else {
          reject(err)
        }
      })

      const method = (opts.method ?? "GET").toUpperCase()
      if (opts.body && method !== "GET" && method !== "HEAD") {
        if (!headers["Content-Type"] && !headers["content-type"]) {
          req.setHeader("Content-Type", "application/json")
        }
        req.write(opts.body)
      }
      req.end()
    })

    if (result.redirectTo && hops < maxRedirects) {
      hops += 1
      currentUrl = new URL(result.redirectTo, url).toString()
      continue
    }

    return {
      status: result.status,
      headers: result.headers,
      body: result.body,
      bodyTruncated: result.bodyTruncated,
    }
  }
}

function truncatedRequestError(err: unknown): boolean {
  // Node throws ERR_STREAM_DESTROYED when we destroy the stream mid-read.
  if (!(err instanceof Error)) return false
  return /ERR_STREAM_DESTROYED|aborted|socket hang up/i.test(err.message)
}

export { SsrfError }
