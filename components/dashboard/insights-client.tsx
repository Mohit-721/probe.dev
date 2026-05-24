"use client"

import * as React from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import {
  Activity,
  ArrowUp,
  Boxes,
  Check,
  Copy,
  Loader2,
  RotateCcw,
  Sparkles,
  Wand2,
  Siren,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "probe.insights.history.v1"

const SUGGESTIONS = [
  { icon: Wand2, label: "What's the most likely cause of recent failures?" },
  { icon: Activity, label: "Which monitor has the worst latency this week?" },
  { icon: Siren, label: "Summarize all open incidents and recommend a fix order." },
  { icon: Boxes, label: "Suggest one new assertion per monitor I should add." },
]

export function InsightsClient({
  monitorsCount,
  failedRuns24h,
  openIncidents,
}: {
  monitorsCount: number
  failedRuns24h: number
  openIncidents: number
}) {
  const [input, setInput] = React.useState("")
  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/insights" }),
  })

  const isStreaming = status === "streaming" || status === "submitted"
  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  // Restore from sessionStorage on mount
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed)
      }
    } catch {
      // ignore corrupted storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist whenever messages settle (don't write while streaming)
  React.useEffect(() => {
    if (isStreaming) return
    try {
      if (messages.length > 0) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
      } else {
        sessionStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ignore quota
    }
  }, [messages, isStreaming])

  // Auto-scroll to latest as new content streams in
  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [messages])

  function submit(text: string) {
    if (!text.trim()) return
    sendMessage({ text })
    setInput("")
  }

  function reset() {
    setMessages([])
    setInput("")
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      {/* Conversation */}
      <div className="flex min-h-[500px] flex-col overflow-hidden rounded-2xl border border-border bg-card">
        {/* Stream / hero */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 md:p-7">
          {messages.length === 0 ? (
            <Hero onPick={submit} suggestions={SUGGESTIONS} />
          ) : (
            <div className="space-y-5">
              {messages.map((m) => {
                const text = (m.parts ?? [])
                  .filter((p): p is { type: "text"; text: string } => p.type === "text")
                  .map((p) => p.text)
                  .join("")
                return <MessageBubble key={m.id} role={m.role} text={text} />
              })}
              {isStreaming && messages[messages.length - 1]?.role === "user" ? (
                <MessageBubble role="assistant" text="" streaming />
              ) : null}
            </div>
          )}
        </div>

        {error ? (
          <div className="border-t border-destructive/30 bg-destructive/10 px-5 py-3 font-mono text-xs text-destructive">
            {error.message ?? "Something went wrong. Set OPENAI_API_KEY in your project to enable Insights."}
          </div>
        ) : null}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit(input)
          }}
          className="flex items-center gap-2 border-t border-border bg-background/60 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder="Ask about latency, failures, or which monitors to add…"
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          {messages.length > 0 ? (
            <Button type="button" variant="ghost" size="sm" onClick={reset} className="rounded-full text-muted-foreground">
              <RotateCcw className="mr-1.5 size-3.5" /> Reset
            </Button>
          ) : null}
          <Button
            type="submit"
            size="icon"
            disabled={isStreaming || !input.trim()}
            className="size-9 rounded-full"
          >
            {isStreaming ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>

      {/* Side panel */}
      <aside className="space-y-3">
        <SidePanelStat icon={Boxes} label="Monitors" value={monitorsCount} />
        <SidePanelStat icon={Activity} label="Failed runs · 24h" value={failedRuns24h} tone={failedRuns24h > 0 ? "warn" : "ok"} />
        <SidePanelStat icon={Siren} label="Open incidents" value={openIncidents} tone={openIncidents > 0 ? "destructive" : "ok"} />

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Sparkles className="size-3.5 text-primary" /> How it works
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Probe sends a compact, RLS-safe summary of <em>your</em> monitors and recent runs to the configured AI
            model. Nothing else leaves your workspace. Responses stream in real time.
          </p>
        </div>
      </aside>
    </div>
  )
}

function Hero({
  onPick,
  suggestions,
}: {
  onPick: (text: string) => void
  suggestions: typeof SUGGESTIONS
}) {
  return (
    <div className="grid place-items-center py-12">
      <div className="grid size-12 place-items-center rounded-xl border border-primary/30 bg-primary/10">
        <Sparkles className="size-5 text-primary" />
      </div>
      <h2 className="mt-4 text-balance text-center font-sans text-2xl font-semibold tracking-tight md:text-3xl">
        What do you want to know about your APIs?
      </h2>
      <p className="mt-2 max-w-md text-balance text-center text-sm text-muted-foreground">
        Probe Insights reads your latest runs and surfaces patterns. Pick a starter, or ask anything.
      </p>
      <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-2 md:grid-cols-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onPick(s.label)}
            className="group flex items-center gap-2.5 rounded-xl border border-border bg-background p-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
          >
            <s.icon className="size-3.5 shrink-0 text-primary opacity-70 group-hover:opacity-100" />
            <span className="truncate">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({
  role,
  text,
  streaming,
}: {
  role: "user" | "assistant" | "system"
  text: string
  streaming?: boolean
}) {
  const isUser = role === "user"
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // ignore
    }
  }

  return (
    <div className={cn("group flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <div className="grid size-7 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10">
          <Sparkles className="size-3.5 text-primary" />
        </div>
      ) : null}
      <div className="relative max-w-[80ch]">
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-background text-foreground",
          )}
        >
          {text || streaming ? (
            <FormattedText text={text} />
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary" />
              Reading your runs…
            </span>
          )}
          {streaming && text ? (
            <span className="ml-1 inline-block h-3.5 w-[2px] animate-pulse bg-primary align-middle" />
          ) : null}
        </div>
        {!isUser && text && !streaming ? (
          <button
            onClick={copy}
            className="absolute -bottom-3 right-3 inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-foreground group-hover:opacity-100"
            aria-label="Copy message"
          >
            {copied ? (
              <>
                <Check className="size-3 text-primary" /> copied
              </>
            ) : (
              <>
                <Copy className="size-3" /> copy
              </>
            )}
          </button>
        ) : null}
      </div>
    </div>
  )
}

// Lightweight markdown rendering: paragraphs, bold, code spans, bullets, headings.
function FormattedText({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/)
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.startsWith("### ")) {
          return (
            <h3 key={i} className="text-sm font-semibold text-foreground">
              {renderInline(block.slice(4))}
            </h3>
          )
        }
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="text-base font-semibold text-foreground">
              {renderInline(block.slice(3))}
            </h2>
          )
        }
        // Bullet list
        if (block.split("\n").every((l) => /^\s*[-•]\s+/.test(l) || l.trim() === "")) {
          const items = block
            .split("\n")
            .filter((l) => l.trim())
            .map((l) => l.replace(/^\s*[-•]\s+/, ""))
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {items.map((it, idx) => (
                <li key={idx}>{renderInline(it)}</li>
              ))}
            </ul>
          )
        }
        // Numbered
        if (block.split("\n").every((l) => /^\s*\d+\.\s+/.test(l) || l.trim() === "")) {
          const items = block
            .split("\n")
            .filter((l) => l.trim())
            .map((l) => l.replace(/^\s*\d+\.\s+/, ""))
          return (
            <ol key={i} className="list-decimal space-y-1 pl-5">
              {items.map((it, idx) => (
                <li key={idx}>{renderInline(it)}</li>
              ))}
            </ol>
          )
        }
        return <p key={i}>{renderInline(block)}</p>
      })}
    </div>
  )
}

function renderInline(text: string): React.ReactNode {
  // Tokenize: **bold**, `code`
  const parts: React.ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {tok.slice(2, -2)}
        </strong>,
      )
    } else {
      parts.push(
        <code
          key={key++}
          className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[12px] text-foreground"
        >
          {tok.slice(1, -1)}
        </code>,
      )
    }
    last = m.index + tok.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function SidePanelStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  tone?: "ok" | "warn" | "destructive"
}) {
  const cls =
    tone === "destructive"
      ? "text-destructive"
      : tone === "warn"
        ? "text-amber-500"
        : tone === "ok"
          ? "text-primary"
          : "text-foreground"
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
        <Icon className="size-3.5" />
      </div>
      <div className={cn("mt-1.5 text-2xl font-semibold tabular-nums", cls)}>{value}</div>
    </div>
  )
}
