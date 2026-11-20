import { useEffect, useState } from "react";
import "./styles/Loading.css";
import { useLoading } from "../context/LoadingProvider";

import Marquee from "react-fast-marquee";

const Loading = ({ percent }: { percent: number }) => {
  const { setIsLoading } = useLoading();
  const [loaded, setLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Was scheduled directly in the render body, so every re-render after 100%
  // queued another pair of timers.
  const isDone = percent >= 100;
  useEffect(() => {
    if (!isDone) return;
    let t2: number | undefined;
    const t1 = window.setTimeout(() => {
      setLoaded(true);
      t2 = window.setTimeout(() => setIsLoaded(true), 450);
    }, 120);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [isDone]);

  useEffect(() => {
    if (!isLoaded) return;
    import("./utils/initialFX").then((module) => {
      setClicked(true);
      setTimeout(() => {
        module.initialFX?.();
        setIsLoading(false);
      }, 700);
    });
  }, [isLoaded]);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  }

  return (
    <>
      <div className="loading-header">
        <a href="/#" className="loader-title" data-cursor="disable">
          SS.
        </a>
        <div className={`loaderGame ${clicked && "loader-out"}`}>
          <div className="loaderGame-container">
            <div className="loaderGame-in">
              {[...Array(27)].map((_, index) => (
                <div className="loaderGame-line" key={index}></div>
              ))}
            </div>
            <div className="loaderGame-ball"></div>
          </div>
        </div>
      </div>
      <div className="loading-screen">
        <div className="loading-marquee">
          <Marquee>
            <span> Data Engineer</span> <span>Data Analyst</span>
            <span> Data Engineer</span> <span>Data Analyst</span>
          </Marquee>
        </div>
        <div
          className="loading-progress"
          style={{ transform: `scaleX(${percent / 100})` }}
        />
        <div
          className={`loading-wrap ${clicked && "loading-clicked"}`}
          onMouseMove={(e) => handleMouseMove(e)}
        >
          <div className="loading-hover"></div>
          <div className={`loading-button ${loaded && "loading-complete"}`}>
            <div className="loading-container">
              <div className="loading-content">
                <div className="loading-content-in">
                  Loading <span>{percent}%</span>
                </div>
              </div>
              <div className="loading-box"></div>
            </div>
            <div className="loading-content2">
              <span>Welcome</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Loading;

export const setProgress = (setLoading: (value: number) => void) => {
  let percent = 0;
  let real = 0;

  // Ease the visible number toward the REAL download progress (0-90%).
  // Before this, the bar faked its way to ~91% and then sat there for seconds.
  let interval = window.setInterval(() => {
    const target = Math.max(real * 90, Math.min(percent + 1, 30));
    if (percent < target) {
      percent = Math.min(
        target,
        percent + Math.max(1, Math.round((target - percent) * 0.3))
      );
      setLoading(Math.round(percent));
    }
  }, 50);

  function report(fraction: number) {
    real = fraction;
  }

  function clear() {
    window.clearInterval(interval);
    setLoading(100);
  }

  function loaded() {
    return new Promise<number>((resolve) => {
      window.clearInterval(interval);
      interval = window.setInterval(() => {
        percent = Math.min(100, Math.round(percent) + 5);
        setLoading(percent);
        if (percent >= 100) {
          window.clearInterval(interval);
          resolve(percent);
        }
      }, 16);
    });
  }
  return { loaded, percent, clear, report };
};
