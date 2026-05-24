// Shared types for Probe data model.

export type MonitorKind = "simple" | "flow"
export type RunStatus = "running" | "success" | "failed" | "degraded"
export type IncidentStatus = "open" | "acknowledged" | "resolved"
export type IncidentSeverity = "minor" | "major" | "critical"
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD"

export type Assertion =
  | { kind: "status"; op: "eq" | "neq" | "lt" | "gt"; value: number }
  | { kind: "header"; name: string; op: "eq" | "contains" | "exists"; value?: string }
  | { kind: "body"; jsonPath: string; op: "eq" | "neq" | "contains" | "exists" | "type"; value?: string | number | boolean }
  | { kind: "duration_ms"; op: "lt" | "lte"; value: number }

export interface MonitorStep {
  name: string
  method: HttpMethod
  url: string
  headers?: Record<string, string>
  body?: string
  // capture: extract value from response into named slot reusable by later steps
  capture?: { from: "body" | "header"; jsonPath?: string; name: string; as: string }[]
  assertions: Assertion[]
}

export interface MonitorConfig {
  steps: MonitorStep[]
}

export interface Monitor {
  id: string
  user_id: string
  name: string
  slug: string
  description: string | null
  kind: MonitorKind
  config: MonitorConfig
  schedule: string
  enabled: boolean
  last_status: "success" | "failed" | "degraded" | "pending" | null
  last_run_at: string | null
  uptime_30d: number | null
  public_token?: string | null
  created_at: string
  updated_at: string
}

export interface AssertionResult {
  name: string
  ok: boolean
  expected: unknown
  actual: unknown
}

export interface StepResult {
  step: string
  status: "success" | "failed"
  status_code: number | null
  duration_ms: number
  assertions: AssertionResult[]
  error?: string
}

export interface Run {
  id: string
  monitor_id: string
  user_id: string
  status: RunStatus
  region: string
  duration_ms: number | null
  step_results: StepResult[]
  error_message: string | null
  trigger: "schedule" | "manual" | "webhook"
  started_at: string
  completed_at: string | null
}

export interface Incident {
  id: string
  monitor_id: string
  user_id: string
  title: string
  summary: string | null
  severity: IncidentSeverity
  status: IncidentStatus
  opened_at: string
  resolved_at: string | null
  first_run_id: string | null
}
