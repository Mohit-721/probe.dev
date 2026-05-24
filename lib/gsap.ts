"use client"

import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)

  // Honor users with `prefers-reduced-motion: reduce`.
  // We don't kill animations entirely — instead we collapse them to ~0 duration
  // so destination state is reached instantly without sweeping motion.
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
  const apply = (reduced: boolean) => {
    if (reduced) {
      gsap.globalTimeline.timeScale(1000)
      ScrollTrigger.config({ ignoreMobileResize: true })
    } else {
      gsap.globalTimeline.timeScale(1)
    }
  }
  apply(mq.matches)
  // Modern browsers
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", (e) => apply(e.matches))
  }
}

/** True when the user has requested reduced motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export { gsap, ScrollTrigger }
