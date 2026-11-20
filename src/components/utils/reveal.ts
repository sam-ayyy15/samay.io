import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let mm: gsap.MatchMedia | null = null;

/**
 * Site-wide entrance animation for any element with [data-reveal].
 * ScrollTrigger.batch groups elements entering together into ONE staggered
 * tween (instead of a trigger + tween per element), and only animates
 * transform/opacity. Users with reduced-motion get content immediately.
 */
export function initReveal() {
  mm?.revert();
  mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const els = gsap.utils.toArray<HTMLElement>("[data-reveal]");
    gsap.set(els, { autoAlpha: 0, y: 48 });
    ScrollTrigger.batch(els, {
      start: "top 88%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          overwrite: true,
        }),
    });
  });
}

/** Thin cherry progress bar at the top of the viewport. */
export function initScrollProgress(bar: HTMLElement) {
  const setScale = gsap.quickSetter(bar, "scaleX") as (v: number) => void;
  const st = ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => setScale(self.progress),
  });
  return () => st.kill();
}
