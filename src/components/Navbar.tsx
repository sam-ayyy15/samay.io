import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HoverLinks from "./HoverLinks";
import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import "./styles/Navbar.css";

gsap.registerPlugin(ScrollSmoother, ScrollTrigger);
export let smoother: ScrollSmoother;

const Navbar = () => {
  useEffect(() => {
    smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      // 1.7s of smoothing made scrolling feel like it was lagging behind input
      smooth: 1.1,
      speed: 1.7,
      effects: true,
      autoResize: true,
      ignoreMobileResize: true,
    });

    smoother.scrollTop(0);
    smoother.paused(true);

    const onLinkClick = (e: Event) => {
      if (window.innerWidth > 1024) {
        e.preventDefault();
        const elem = e.currentTarget as HTMLAnchorElement;
        const section = elem.getAttribute("data-href");
        smoother.scrollTo(section, true, "top top");
      }
    };
    const links = document.querySelectorAll(".header ul a");
    links.forEach((elem) => elem.addEventListener("click", onLinkClick));
    // (Removed a duplicate window "resize" -> ScrollSmoother.refresh(true):
    // ScrollTrigger already auto-refreshes on resize, debounced.)
    return () => {
      links.forEach((elem) => elem.removeEventListener("click", onLinkClick));
    };
  }, []);
  return (
    <>
      <div className="header">
        <a href="/#" className="navbar-title" data-cursor="disable">
          SS<span style={{ color: "var(--textColor)" }}>.</span>
        </a>
        <a
          href="mailto:samayshetty1234@gmail.com"
          className="navbar-connect"
          data-cursor="disable"
        >
          samayshetty1234@gmail.com
        </a>
        <ul>
          <li>
            <a data-href="#about" href="#about">
              <HoverLinks text="ABOUT" />
            </a>
          </li>
          <li>
            <a data-href="#work" href="#work">
              <HoverLinks text="WORK" />
            </a>
          </li>
          <li className="nav-optional">
            <a data-href="#research" href="#research">
              <HoverLinks text="RESEARCH" />
            </a>
          </li>
          <li>
            <a data-href="#contact" href="#contact">
              <HoverLinks text="CONTACT" />
            </a>
          </li>
        </ul>
      </div>

      <div className="landing-circle1"></div>
      <div className="landing-circle2"></div>
      <div className="nav-fade"></div>
    </>
  );
};

export default Navbar;
