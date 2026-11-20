import "./styles/Career.css";

const timeline = [
  {
    role: "Higher Secondary (HSC), Science",
    place: "Vidyalankar Group of Educational Institutes, Mumbai",
    year: "2020",
    text: "Completed HSC in the Science stream with 82.17%.",
  },
  {
    role: "B.E. Computer Science & Engineering",
    place: "Alva's Institute of Engineering & Technology, Mangalore",
    year: "2022",
    text: "Graduating 2026 with a CGPA of 9.23 / 10. Two research papers published on IEEE Xplore (ICoICI-2025, CICN-2024) and a Top-5 finish at the HackToFuture 3.0 national hackathon.",
  },
  {
    role: "Google Data Analytics Professional Certificate",
    place: "Google · Coursera",
    year: "2024",
    text: "8-course program covering data cleaning, SQL, R, Tableau and visualization, with hands-on dashboards and case studies.",
  },
  {
    role: "Data Engineer Intern",
    place: "Glowlogics Solutions Pvt Ltd, Bengaluru",
    year: "2026",
    text: "Built a production Medallion pipeline on Databricks unifying 6+ ERP/CRM sources (500K+ records/day, 99.1% reliability, 85% fewer reporting inconsistencies). Automated Silver-layer cleansing and upserts, saving 8+ engineering hours a week, and modeled a 2M+ row star schema that cut query time ~45%.",
  },
];

const Career = () => {
  return (
    <div className="career-section section-container" id="experience">
      <div className="career-container">
        <h2>
          My career <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline">
            <div className="career-dot"></div>
          </div>
          {timeline.map((item) => (
            <div className="career-info-box" key={item.role}>
              <div className="career-info-in">
                <div className="career-role">
                  <h4>{item.role}</h4>
                  <h5>{item.place}</h5>
                </div>
                <h3>{item.year}</h3>
              </div>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Career;
