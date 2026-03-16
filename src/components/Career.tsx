import "./styles/Career.css";

const Career = () => {
  return (
    <div className="career-section section-container">
      <div className="career-container">
        <h2>
          My career <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline">
            <div className="career-dot"></div>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>B.Tech in CSE</h4>
                <h5>Alvas Institute of Engineering and Technology</h5>
              </div>
              <h3>2022</h3>
            </div>
            <p>
              Pursuing Bachelor of Technology in Computer Science & Engineering. Solid academic foundation with a CGPA of 9.32 / 10.0.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Google Data Analytics Professional Certificate</h4>
                <h5>Coursera | Google Career Certificates</h5>
              </div>
              <h3> 2023</h3>
            </div>
            <p>
              Completed an 8-course certification covering data analytics fundamentals,
              data cleaning, analysis, and visualization using spreadsheets, SQL, R, and
              Tableau. Built dashboards and case studies while learning data ethics,
              metadata management, and real-world data problem solving.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Data Science Intern</h4>
                <h5>Glowlogics Solutions</h5>
              </div>
              <h3>NOW</h3>
            </div>
            <p>
              Building and deploying ML pipelines, designing data warehouse prototypes, and developing ETL pipelines for analytics workflows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Career;
