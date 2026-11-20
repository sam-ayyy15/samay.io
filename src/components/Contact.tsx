import { MdArrowOutward, MdCopyright } from "react-icons/md";
import { HiOutlineMapPin } from "react-icons/hi2";
import "./styles/Contact.css";

const socials = [
  { name: "Github", href: "https://github.com/Sam-ayyy15" },
  { name: "Linkedin", href: "https://www.linkedin.com/in/samayshetty" },
  { name: "Twitter", href: "https://x.com/samay_x15" },
  { name: "Instagram", href: "https://www.instagram.com/sam.ayyy15" },
];

const Contact = () => {
  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <div className="contact-cta" data-reveal>
          <span className="contact-status">
            <i aria-hidden="true" /> Open to entry-level Data Engineer roles
          </span>
          <h3>
            Let’s build data
            <br />
            that <span>moves.</span>
          </h3>
          <a
            className="contact-mail"
            href="mailto:samayshetty1234@gmail.com"
            data-cursor="disable"
          >
            samayshetty1234@gmail.com <MdArrowOutward />
          </a>
        </div>
        <div className="contact-flex" data-reveal>
          <div className="contact-box">
            <h4>Phone</h4>
            <p>
              <a href="tel:+919987120987" data-cursor="disable">
                +91 99871 20987
              </a>
            </p>
            <h4>Based in</h4>
            <p className="contact-location">
              <HiOutlineMapPin /> Mumbai, India
            </p>
          </div>
          <div className="contact-box">
            <h4>Social</h4>
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                data-cursor="disable"
                className="contact-social"
              >
                {s.name} <MdArrowOutward />
              </a>
            ))}
          </div>
          <div className="contact-box">
            <h2>
              Designed and Developed <br /> by <span>Samay Shetty</span>
            </h2>
            <h5>
              <MdCopyright /> 2026
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
