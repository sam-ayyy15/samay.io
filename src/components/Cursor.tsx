import { useEffect, useRef } from "react";
import "./styles/Cursor.css";
import gsap from "gsap";

const Cursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cursor = cursorRef.current;
    // No custom cursor on touch devices — skip the per-frame loop entirely.
    if (!cursor || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    let hover = false;
    let rafId = 0;
    let running = false;
    const mousePos = { x: 0, y: 0 };
    const cursorPos = { x: 0, y: 0 };
    // quickSetter writes the transform directly. The old code created a brand
    // new gsap tween every animation frame (~60 tweens/sec, forever).
    const setX = gsap.quickSetter(cursor, "x", "px") as (v: number) => void;
    const setY = gsap.quickSetter(cursor, "y", "px") as (v: number) => void;

    const loop = () => {
      if (!hover) {
        const dx = mousePos.x - cursorPos.x;
        const dy = mousePos.y - cursorPos.y;
        cursorPos.x += dx / 6;
        cursorPos.y += dy / 6;
        setX(cursorPos.x);
        setY(cursorPos.y);
        // Stop the loop once the cursor has caught up; restart on next mousemove.
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
          running = false;
          return;
        }
      }
      rafId = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(loop);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
      start();
    };
    document.addEventListener("mousemove", onMouseMove, { passive: true });

    const cleanups: (() => void)[] = [];
    document.querySelectorAll("[data-cursor]").forEach((item) => {
      const element = item as HTMLElement;
      const onOver = (e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        if (element.dataset.cursor === "icons") {
          const rect = target.getBoundingClientRect();
          cursor.classList.add("cursor-icons");
          gsap.to(cursor, { x: rect.left, y: rect.top, duration: 0.1 });
          cursor.style.setProperty("--cursorH", `${rect.height}px`);
          hover = true;
        }
        if (element.dataset.cursor === "disable") {
          cursor.classList.add("cursor-disable");
        }
      };
      const onOut = () => {
        cursor.classList.remove("cursor-disable", "cursor-icons");
        hover = false;
        start();
      };
      element.addEventListener("mouseover", onOver);
      element.addEventListener("mouseout", onOut);
      cleanups.push(() => {
        element.removeEventListener("mouseover", onOver);
        element.removeEventListener("mouseout", onOut);
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMouseMove);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return <div className="cursor-main" ref={cursorRef}></div>;
};

export default Cursor;
