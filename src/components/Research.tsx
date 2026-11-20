import { MdArrowOutward } from "react-icons/md";
import { HiOutlineAcademicCap, HiOutlineTrophy, HiOutlineHeart } from "react-icons/hi2";
import "./styles/Research.css";

const papers = [
  {
    venue: "IEEE ICoICI-2025",
    year: "2025",
    title: "Model Management & Hyperparameter Optimization in Predictive Regression Pipelines",
    tags: ["MLOps", "Regression", "Hyperparameter tuning"],
  },
  {
    venue: "IEEE CICN-2024",
    year: "2024",
    title: "Fortifying IoT Networks: A Blockchain-Based Communication Security Paradigm",
    tags: ["IoT", "Blockchain", "Network security"],
  },
];

const certs = [
  { name: "Google Data Analytics Professional Certificate", by: "Google · Coursera", year: "2024" },
  { name: "Git Mastery", by: "Frontend Masters", year: "2024" },
  { name: "MATLAB Onramp", by: "MathWorks", year: "2023" },
];

type Paper = (typeof papers)[number];

const PaperContent = ({ paper, index }: { paper: Paper; index: number }) => (
  <>
    <div className="paper-top">
      <span className="paper-index">0{index + 1}</span>
      <span className="paper-venue">{paper.venue}</span>
    </div>
    <h3>“{paper.title}”</h3>
    <div className="paper-bottom">
      <div className="paper-tags">
        {paper.tags.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <span className="paper-arrow" aria-hidden="true">
        <MdArrowOutward />
      </span>
    </div>
  </>
);

const Research = () => {
  return (
    <section className="research-section" id="research">
      <div className="research-container section-container">
        <div className="research-head" data-reveal>
          <span className="research-eyebrow">Research & recognition</span>
          <h2>
            Published on <span>IEEE Xplore</span>
          </h2>
        </div>

        <div className="research-papers">
          {papers.map((p, i) => (
            <a
              className="paper-card"
              key={p.title}
              href="https://ieeexplore.ieee.org/"
              target="_blank"
              rel="noreferrer"
              data-reveal
              data-cursor="disable"
            >
              <PaperContent paper={p} index={i} />
              {/* Red sweep with a white copy of the same content, clipped to a
                  growing circle: text stays black on white, white on red. */}
              <div className="paper-fill" aria-hidden="true">
                <PaperContent paper={p} index={i} />
              </div>
            </a>
          ))}
        </div>

        <div className="research-lower">
          <div className="research-col" data-reveal>
            <h4>
              <HiOutlineAcademicCap /> Certifications
            </h4>
            <ul>
              {certs.map((c) => (
                <li key={c.name}>
                  <div>
                    <strong>{c.name}</strong>
                    <span>{c.by}</span>
                  </div>
                  <em>{c.year}</em>
                </li>
              ))}
            </ul>
          </div>
          <div className="research-col" data-reveal>
            <h4>
              <HiOutlineTrophy /> Achievements
            </h4>
            <ul>
              <li>
                <div>
                  <strong>HackToFuture 3.0 — Top 5</strong>
                  <span>National-level hackathon</span>
                </div>
                <em>Top 5</em>
              </li>
              <li>
                <div>
                  <strong>
                    <HiOutlineHeart className="research-inline-icon" /> STEM &
                    programming outreach
                  </strong>
                  <span>Kaliyona Computers · IEEE STEM Outreach</span>
                </div>
                <em>Volunteer</em>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Research;
