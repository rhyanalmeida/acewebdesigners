import { useEffect } from 'react'

/**
 * Centralized IntersectionObserver for scroll-triggered animations.
 *
 * Handles two patterns side-by-side (extension of the original observer
 * that lived inline in App.tsx — preserves the existing data-animate API
 * for in-flight pages and adds the new data-reveal API used by the new
 * <Reveal> primitive):
 *
 *   1. LEGACY (preserved):
 *      <div data-animate="animate-fade-in-up">      → adds the named class
 *      <div data-stagger>                            → child elements with
 *        <div data-stagger-child>                      data-stagger-child get
 *      </div>                                          .animate-section-reveal
 *                                                      with 100ms stagger.
 *
 *   2. NEW (used by <Reveal>):
 *      <div data-reveal="up">                        → adds .is-visible
 *      <div data-reveal="stagger">                   → child elements with
 *        <div data-reveal-stagger-child />             data-reveal-stagger-child
 *      </div>                                          get .is-visible with stagger.
 *
 * Re-runs on `pageKey` change so newly mounted pages get observed.
 */
export function useScrollReveal(pageKey?: string) {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const observerOptions: IntersectionObserverInit = {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const el = entry.target as HTMLElement

        // --- Legacy data-animate pattern ---
        if (el.dataset.animate) {
          el.classList.add(el.dataset.animate)
        }
        if (el.dataset.stagger !== undefined) {
          const children = el.querySelectorAll<HTMLElement>('[data-stagger-child]')
          children.forEach((child, idx) => {
            window.setTimeout(() => child.classList.add('animate-section-reveal'), idx * 100)
          })
        }

        // --- New data-reveal pattern ---
        if (el.dataset.reveal !== undefined) {
          el.classList.add('is-visible')
          if (el.dataset.reveal === 'stagger') {
            const children = el.querySelectorAll<HTMLElement>('[data-reveal-stagger-child]')
            children.forEach((child, idx) => {
              window.setTimeout(() => child.classList.add('is-visible'), idx * 80)
            })
          }
        }

        // Once revealed, stop observing — entrance animations are one-shot.
        observer.unobserve(el)
      })
    }, observerOptions)

    // Observe every element with either attribute. Need a small defer so
    // children rendered in the same tick are present in the DOM tree.
    const targets = document.querySelectorAll<HTMLElement>('[data-animate], [data-reveal], [data-stagger]')
    targets.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [pageKey])
}

export default useScrollReveal
