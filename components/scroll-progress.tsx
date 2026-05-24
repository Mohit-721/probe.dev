"use client"

import * as React from "react"
import { gsap, ScrollTrigger } from "@/lib/gsap"

export function ScrollProgress() {
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    gsap.set(el, { scaleX: 0, transformOrigin: "0 50%" })

    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        gsap.to(el, { scaleX: self.progress, duration: 0.1, ease: "none", overwrite: true })
      },
    })
    return () => trigger.kill()
  }, [])

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent"
      style={{ pointerEvents: "none" }}
    >
      <div ref={ref} className="h-full w-full bg-primary shadow-[0_0_8px_var(--primary)]" />
    </div>
  )
}
