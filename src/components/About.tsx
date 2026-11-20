import "./styles/About.css";

// Scannable highlights: recruiters skim, so the numbers get their own callouts
// instead of being buried in a paragraph.
const stats = [
  { value: "500K+", label: "records processed a day" },
  { value: "99%+", label: "pipeline reliability" },
  { value: "<2s", label: "streaming latency" },
  { value: "2", label: "IEEE publications" },
];

const stack = ["Databricks", "PySpark", "Airflow", "Kafka / Redpanda", "AWS"];

const About = () => {
  return (
    <div className="about-section" id="about">
      <div className="about-me">
        <h3 className="title">About Me</h3>

        <p className="para about-lead">
          I build data pipelines people can <span>trust</span>.
        </p>

        <p className="about-body">
          Computer Science engineer and dual IEEE-published researcher. I design
          Medallion and ETL/ELT architectures, from daily batch jobs to
          real-time streaming, and I care about clean models, trustworthy data
          and dashboards people actually use.
        </p>

        <ul className="about-stats">
          {stats.map((s) => (
            <li key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>

        <div className="about-stack" aria-label="Core stack">
          {stack.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
