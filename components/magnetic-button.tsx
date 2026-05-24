"use client"

import * as React from "react"
import Link from "next/link"
import { gsap } from "@/lib/gsap"
import { cn } from "@/lib/utils"

type Props = {
  href: string
  children: React.ReactNode
  className?: string
  strength?: number
}

export function MagneticButton({ href, children, className, strength = 0.35 }: Props) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const innerRef = React.useRef<HTMLAnchorElement>(null)

  React.useEffect(() => {
    const wrap = wrapRef.current
    const inner = innerRef.current
    if (!wrap || !inner) return

    const onMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect()
      const x = e.clientX - (rect.left + rect.width / 2)
      const y = e.clientY - (rect.top + rect.height / 2)
      gsap.to(wrap, { x: x * strength, y: y * strength, duration: 0.45, ease: "power3.out" })
      gsap.to(inner, { x: x * strength * 0.4, y: y * strength * 0.4, duration: 0.45, ease: "power3.out" })
    }
    const onLeave = () => {
      gsap.to(wrap, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" })
      gsap.to(inner, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" })
    }

    wrap.addEventListener("mousemove", onMove)
    wrap.addEventListener("mouseleave", onLeave)
    return () => {
      wrap.removeEventListener("mousemove", onMove)
      wrap.removeEventListener("mouseleave", onLeave)
    }
  }, [strength])

  return (
    <div ref={wrapRef} className="inline-block will-change-transform">
      <Link
        ref={innerRef}
        href={href}
        className={cn(
          "relative inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground will-change-transform",
          "shadow-[0_0_0_0_var(--primary)] hover:shadow-[0_0_40px_-4px_var(--primary)] transition-shadow",
          className,
        )}
      >
        {children}
      </Link>
    </div>
  )
}
