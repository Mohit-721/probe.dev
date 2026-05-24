"use client"

import * as React from "react"
import { gsap, ScrollTrigger } from "@/lib/gsap"
import { Copy, Check, FileCode2, Github, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"

const TABS = [
  { id: "yaml", label: "monitoring.yaml", icon: FileCode2 },
  { id: "ci", label: ".github/workflows/probe.yml", icon: Github },
  { id: "cli", label: "terminal", icon: Terminal },
]

const SNIPPETS: Record<string, { code: string; lang: string }> = {
  yaml: {
    lang: "yaml",
    code: `# probe/monitoring.yaml
version: 1
project: checkout-api

variables:
  base_url: https://api.acme.com

flows:
  - name: checkout-suite
    schedule: "*/2 * * * *"
    region: [iad1, fra1, syd1]
    steps:
      - id: login
        request:
          method: POST
          url: "{{base_url}}/v2/auth/login"
          body: { email: "{{secrets.EMAIL}}", password: "{{secrets.PASS}}" }
        extract:
          token: $.data.access_token

      - id: get_orders
        request:
          method: GET
          url: "{{base_url}}/v2/orders"
          headers:
            Authorization: "Bearer {{login.token}}"
        assert:
          - status: 200
          - schema: ./schemas/orders.schema.json
          - latency_p95_ms: { lt: 250 }
          - security:
              headers: [hsts, csp, x-content-type]
              tls: ">= 1.3"

      - id: place_order
        when: "{{get_orders.body.length}} > 0"
        request: { method: POST, url: "{{base_url}}/v2/orders", body: { ... } }

alerts:
  - on: failure
    channels: [slack#oncall, pagerduty.api-team]`,
  },
  ci: {
    lang: "yaml",
    code: `# .github/workflows/probe.yml
name: API contract gate

on:
  pull_request:
  push: { branches: [main] }

jobs:
  probe:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: probe-dev/setup@v1
        with: { token: \${{ secrets.PROBE_TOKEN }} }

      - name: Run staging flows
        run: probe run --env staging --fail-fast

      - name: Block deploy on contract breach
        run: probe assert --schema ./schemas --against production`,
  },
  cli: {
    lang: "bash",
    code: `$ probe init
✓ Created probe/monitoring.yaml
✓ Linked project: checkout-api

$ probe run --flow checkout-suite
→ login              POST  /v2/auth/login         200  142ms  extracted: token
→ get_orders         GET   /v2/orders             200   88ms  schema ✓ headers ✓
→ place_order        POST  /v2/orders             201  211ms  schema ✓
✓ 3 / 3 passed in 441ms

$ probe deploy
→ Pushed monitors to 3 regions: iad1, fra1, syd1
→ Live at https://probe.dev/p/checkout-api`,
  },
}

export function CodeShowcase() {
  const [tab, setTab] = React.useState("yaml")
  const [copied, setCopied] = React.useState(false)
  const root = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!root.current) return
    const ctx = gsap.context(() => {
      gsap.from(".code-head > *", {
        scrollTrigger: { trigger: ".code-head", start: "top 80%" },
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
      })
      gsap.from(".code-frame", {
        scrollTrigger: { trigger: ".code-frame", start: "top 80%" },
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
      })
    }, root)
    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach((s) => s.kill())
    }
  }, [])

  // animate lines on tab switch
  React.useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".code-line", {
        opacity: 0,
        x: -8,
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.012,
      })
    }, root)
    return () => ctx.revert()
  }, [tab])

  const onCopy = async () => {
    await navigator.clipboard.writeText(SNIPPETS[tab].code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  const lines = SNIPPETS[tab].code.split("\n")

  return (
    <section ref={root} id="code" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <div className="code-head grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Terminal className="size-3" />
              Config as code
            </div>
            <h2 className="mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-5xl">
              Live in your repo. Run in your pipeline.
            </h2>
          </div>
          <p className="max-w-md text-pretty text-muted-foreground">
            Define monitors next to the code they protect. Version them. Review them. Block bad
            deploys before they reach prod.
          </p>
        </div>

        <div className="code-frame mt-12 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/30">
            <div className="flex">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 font-mono text-[12px] transition-colors ${
                    tab === t.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="size-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={onCopy} className="mr-2 gap-1.5">
              {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
              <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>

          {/* Code body */}
          <div className="grid grid-cols-[auto_1fr]">
            <div className="select-none border-r border-border/60 bg-muted/20 px-3 py-4 text-right font-mono text-[11px] text-muted-foreground/60">
              {lines.map((_, i) => (
                <div key={i} className="leading-6">
                  {i + 1}
                </div>
              ))}
            </div>
            <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-6">
              <code>
                {lines.map((line, i) => (
                  <div key={i} className="code-line whitespace-pre">
                    {colorize(line, SNIPPETS[tab].lang)}
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Works with GitHub Actions, GitLab CI, CircleCI, Vercel, Netlify, Buildkite.
        </p>
      </div>
    </section>
  )
}

// Tiny syntax highlighter (intentionally lightweight — no extra deps)
function colorize(line: string, lang: string): React.ReactNode {
  if (lang === "bash") {
    if (line.startsWith("$")) {
      return (
        <>
          <span className="text-primary">{line.slice(0, 1)}</span>
          <span>{line.slice(1)}</span>
        </>
      )
    }
    if (line.startsWith("→")) return <span className="text-muted-foreground">{line}</span>
    if (line.startsWith("✓")) return <span className="text-primary">{line}</span>
    return <span>{line}</span>
  }

  // YAML-ish
  // comment
  if (line.trimStart().startsWith("#")) {
    return <span className="text-muted-foreground/70">{line}</span>
  }

  // key: value
  const m = line.match(/^(\s*)([A-Za-z0-9_.\- ]+)(:)(.*)$/)
  if (m) {
    const [, indent, key, colon, rest] = m
    return (
      <>
        <span>{indent}</span>
        <span className="text-foreground">{key}</span>
        <span className="text-muted-foreground">{colon}</span>
        <span className="text-primary/90">{rest}</span>
      </>
    )
  }
  // list item
  const m2 = line.match(/^(\s*)(-)(\s.*)$/)
  if (m2) {
    const [, indent, dash, rest] = m2
    return (
      <>
        <span>{indent}</span>
        <span className="text-primary">{dash}</span>
        <span>{rest}</span>
      </>
    )
  }
  return <span>{line}</span>
}
