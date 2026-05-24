import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { StatusTicker } from "@/components/status-ticker"
import { LogoCloud } from "@/components/logo-cloud"
import { ProblemSection } from "@/components/problem-section"
import { FeatureGrid } from "@/components/feature-grid"
import { StatefulFlow } from "@/components/stateful-flow"
import { CaseFiles } from "@/components/case-files"
import { StatsCounter } from "@/components/stats-counter"
import { CodeShowcase } from "@/components/code-showcase"
import { Comparison } from "@/components/comparison"
import { Cta } from "@/components/cta"
import { SiteFooter } from "@/components/site-footer"
import { ScrollProgress } from "@/components/scroll-progress"

export default function Page() {
  return (
    <main className="relative">
      <ScrollProgress />
      <SiteHeader />
      <Hero />
      <StatusTicker />
      <LogoCloud />
      <ProblemSection />
      <FeatureGrid />
      <StatefulFlow />
      <CaseFiles />
      <StatsCounter />
      <CodeShowcase />
      <Comparison />
      <Cta />
      <SiteFooter />
    </main>
  )
}
