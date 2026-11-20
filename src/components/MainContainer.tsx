import {
  lazy,
  PropsWithChildren,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import About from "./About";
import Career from "./Career";
import Contact from "./Contact";
import Cursor from "./Cursor";
import Landing from "./Landing";
import Navbar from "./Navbar";
import SocialIcons from "./SocialIcons";
import WhatIDo from "./WhatIDo";
import Work from "./Work";
import Impact from "./Impact";
import Research from "./Research";
import setSplitText from "./utils/splitText";
import { initReveal, initScrollProgress } from "./utils/reveal";
import { useLoading } from "../context/LoadingProvider";

const TechStack = lazy(() => import("./TechStack"));

const TechStackPlaceholder = () => (
  <div className="techstack">
    <h2>
      My <span>Techstack</span>
    </h2>
  </div>
);

/**
 * The tech-stack scene pulls in Rapier physics (WASM), post-processing and an
 * HDR map. Loading it at startup competed with the 3D character for bandwidth
 * and main-thread time, so only load it when the user scrolls close to it.
 */
const DeferredTechStack = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const { isLoading } = useLoading();

  // Load it in the browser's idle time once the intro has played, so the
  // one-time setup cost (WebGL context, physics WASM, shaders) never lands in
  // the middle of a scroll. Scrolling near it first still loads it right away.
  useEffect(() => {
    if (isLoading || shouldLoad) return;
    let idleId: number | undefined;
    const timer = window.setTimeout(() => {
      const load = () => setShouldLoad(true);
      if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(load, { timeout: 4000 });
      else load();
    }, 5000);
    return () => {
      window.clearTimeout(timer);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
    };
  }, [isLoading, shouldLoad]);

  useEffect(() => {
    const el = ref.current;
    if (!el || shouldLoad) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "1200px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoad]);

  if (!shouldLoad) {
    return (
      <div ref={ref}>
        <TechStackPlaceholder />
      </div>
    );
  }
  return (
    <Suspense fallback={<TechStackPlaceholder />}>
      <TechStack />
    </Suspense>
  );
};

const MainContainer = ({ children }: PropsWithChildren) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDesktopView, setIsDesktopView] = useState<boolean>(
    window.innerWidth > 1024
  );

  useEffect(() => {
    let lastWidth = window.innerWidth;
    let timer: number | undefined;

    // Split text only after web fonts are ready, otherwise line breaks are
    // measured with the fallback font and jump when Syne/Manrope arrive.
    document.fonts?.ready.then(() => {
      setSplitText();
      initReveal();
    });
    const killProgress = progressRef.current
      ? initScrollProgress(progressRef.current)
      : undefined;

    const resizeHandler = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        // Ignore height-only resizes (mobile address bar show/hide while scrolling).
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        setSplitText();
        setIsDesktopView(window.innerWidth > 1024);
      }, 150);
    };
    window.addEventListener("resize", resizeHandler);
    return () => {
      killProgress?.();
      window.clearTimeout(timer);
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  return (
    <div className="container-main">
      <div className="scroll-progress" ref={progressRef} aria-hidden="true" />
      <Cursor />
      <Navbar />
      <SocialIcons />
      {isDesktopView && children}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <div className="container-main">
            <Landing>{!isDesktopView && children}</Landing>
            <About />
            <WhatIDo />
            <Career />
            <Impact />
            <Work />
            <Research />
            <DeferredTechStack />
            <Contact />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContainer;
