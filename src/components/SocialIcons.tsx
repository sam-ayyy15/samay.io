import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import "./styles/SocialIcons.css";
import { TbNotes } from "react-icons/tb";
import { useEffect } from "react";
import HoverLinks from "./HoverLinks";

const SocialIcons = () => {
  useEffect(() => {
    const social = document.getElementById("social");
    if (!social || !window.matchMedia("(hover: hover)").matches) return;

    // One shared listener + one rAF loop that sleeps when idle.
    // (Previously: 4 never-ending rAF loops and listeners that were never removed.)
    const items = Array.from(social.querySelectorAll("span")).map((elem) => {
      const link = elem.querySelector("a") as HTMLElement;
      return {
        elem,
        link,
        rect: elem.getBoundingClientRect(),
        mouseX: 0,
        mouseY: 0,
        currentX: 0,
        currentY: 0,
      };
    });
    const center = (it: (typeof items)[number]) => {
      it.mouseX = it.rect.width / 2;
      it.mouseY = it.rect.height / 2;
    };
    items.forEach((it) => {
      center(it);
      it.currentX = it.mouseX;
      it.currentY = it.mouseY;
    });

    let rafId = 0;
    let running = false;
    const tick = () => {
      let moving = false;
      items.forEach((it) => {
        const dx = it.mouseX - it.currentX;
        const dy = it.mouseY - it.currentY;
        if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) moving = true;
        it.currentX += dx * 0.1;
        it.currentY += dy * 0.1;
        it.link.style.setProperty("--siLeft", `${it.currentX}px`);
        it.link.style.setProperty("--siTop", `${it.currentY}px`);
      });
      if (moving) rafId = requestAnimationFrame(tick);
      else running = false;
    };
    const start = () => {
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(tick);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      items.forEach((it) => {
        const x = e.clientX - it.rect.left;
        const y = e.clientY - it.rect.top;
        if (x < 40 && x > 10 && y < 40 && y > 5) {
          it.mouseX = x;
          it.mouseY = y;
        } else {
          center(it);
        }
      });
      start();
    };
    const onResize = () => {
      items.forEach((it) => (it.rect = it.elem.getBoundingClientRect()));
    };

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="icons-section">
      <div className="social-icons" data-cursor="icons" id="social">
        <span>
          <a href="https://github.com/Sam-ayyy15" target="_blank">
            <FaGithub />
          </a>
        </span>
        <span>
          <a href="https://www.linkedin.com/in/samayshetty" target="_blank">
            <FaLinkedinIn />
          </a>
        </span>
        <span>
          <a href="https://x.com/samay_x15" target="_blank">
            <FaXTwitter />
          </a>
        </span>
        <span>
          <a href="https://www.instagram.com/sam.ayyy15" target="_blank">
            <FaInstagram />
          </a>
        </span>
      </div>
      <a className="resume-button" href="/resume.pdf" target="_blank">
        <HoverLinks text="RESUME" />
        <span>
          <TbNotes />
        </span>
      </a>
    </div>
  );
};

export default SocialIcons;
