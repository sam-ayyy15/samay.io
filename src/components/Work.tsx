import { useState, useCallback, useRef } from "react";
import "./styles/Work.css";
import WorkImage from "./WorkImage";
import PipelineDiagram, { Diagram } from "./PipelineDiagram";
import { MdArrowBack, MdArrowForward } from "react-icons/md";

type Project = {
  title: string;
  category: string;
  year: string;
  summary: string;
  tools: string;
  metrics: string[];
  image?: string;
  diagram?: Diagram;
};

const projects: Project[] = [
  {
    title: "Inventory Synchronization Engine",
    category: "Real-time Streaming",
    year: "2026",
    summary:
      "Sub-2-second streaming pipeline with Avro schema validation, Great Expectations quality gates and Redis idempotency for exactly-once semantics. Three-tier storage, orchestrated by Airflow, backed by 58 automated CI tests.",
    tools: "Redpanda, PySpark, PostgreSQL, Redis, Airflow, dbt, Docker",
    metrics: ["50K+ events/sec", "< 2s latency", "58 CI tests"],
    diagram: {
      caption: "Redpanda to PySpark Structured Streaming to anomaly detection to tiered PostgreSQL, DuckDB and S3 storage",
      nodes: [
        { id: "src", x: 20, y: 70, label: "Redpanda", sub: "Kafka · Avro" },
        { id: "redis", x: 20, y: 270, label: "Redis", sub: "idempotency" },
        { id: "spark", x: 215, y: 170, label: "PySpark", sub: "Structured Streaming", accent: true },
        { id: "rules", x: 410, y: 170, label: "Anomaly rules", sub: "Great Expectations" },
        { id: "pg", x: 600, y: 50, label: "PostgreSQL", sub: "hot" },
        { id: "duck", x: 600, y: 170, label: "DuckDB", sub: "warm" },
        { id: "s3", x: 600, y: 290, label: "S3 Parquet", sub: "cold" },
      ],
      edges: [["src", "spark"], ["redis", "spark"], ["spark", "rules"], ["rules", "pg"], ["rules", "duck"], ["rules", "s3"]],
    },
  },
  {
    title: "Real-Time Flight Data ETL",
    category: "Data Engineering",
    year: "2026",
    summary:
      "Live ADS-B aircraft data from the OpenSky API every 15 minutes through a Bronze → Silver → Gold medallion flow, with automated retries, graceful handling of malformed responses and a serverless DuckDB warehouse.",
    tools: "Apache Airflow, Docker, Python, DuckDB",
    metrics: ["6,500+ records/batch", "100+ countries", "15-min cadence"],
    diagram: {
      caption: "OpenSky API to Airflow to Bronze, Silver and Gold layers to DuckDB",
      nodes: [
        { id: "api", x: 20, y: 70, label: "OpenSky API", sub: "ADS-B feed" },
        { id: "af", x: 20, y: 270, label: "Airflow", sub: "every 15 min" },
        { id: "b", x: 215, y: 170, label: "Bronze", sub: "raw JSON" },
        { id: "s", x: 410, y: 170, label: "Silver", sub: "validated", accent: true },
        { id: "g", x: 600, y: 90, label: "Gold", sub: "country KPIs" },
        { id: "db", x: 600, y: 250, label: "DuckDB", sub: "SQL analytics" },
      ],
      edges: [["api", "b"], ["af", "b"], ["b", "s"], ["s", "g"], ["s", "db"]],
    },
  },
  {
    title: "Medallion Lakehouse",
    category: "Data Warehousing",
    year: "2026",
    summary:
      "Production Medallion architecture on Databricks unifying 6+ ERP/CRM sources from two merged companies, with Silver-layer cleansing, hash-based surrogate keys and a star-schema warehouse feeding Sales BI 360 dashboards.",
    tools: "Databricks, PySpark, AWS S3, Delta Tables, SQL Server",
    metrics: ["500K+ rows/day", "99.1% reliability", "−45% query time"],
    image: "/images/data_architecture.webp",
  },
  {
    title: "Sales Analytics Dashboard",
    category: "Analytics & BI",
    year: "2024",
    summary:
      "Interactive Power BI dashboard on a PostgreSQL backend tracking revenue, churn, conversion and regional performance, with DAX-driven automated refresh enabling self-service BI.",
    tools: "Power BI, PostgreSQL, DAX, KPI Reporting",
    metrics: ["10+ KPIs", "−70% manual reporting"],
    image: "/images/zepto.webp",
  },
];

const Work = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const lock = useRef(false);
  const touchX = useRef<number | null>(null);

  const goToSlide = useCallback((index: number) => {
    if (lock.current) return;
    lock.current = true;
    setCurrentIndex((index + projects.length) % projects.length);
    window.setTimeout(() => (lock.current = false), 600);
  }, []);

  const goToPrev = () => goToSlide(currentIndex - 1);
  const goToNext = () => goToSlide(currentIndex + 1);

  return (
    <div className="work-section" id="work">
      <div className="work-container section-container">
        <div className="work-head" data-reveal>
          <h2>
            My <span>Work</span>
          </h2>
          <div className="work-counter" aria-live="polite">
            <span>0{currentIndex + 1}</span> / 0{projects.length}
          </div>
        </div>

        <div
          className="carousel-wrapper"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") goToPrev();
            if (e.key === "ArrowRight") goToNext();
          }}
        >
          <button
            className="carousel-arrow carousel-arrow-left"
            onClick={goToPrev}
            aria-label="Previous project"
            data-cursor="disable"
          >
            <MdArrowBack />
          </button>
          <button
            className="carousel-arrow carousel-arrow-right"
            onClick={goToNext}
            aria-label="Next project"
            data-cursor="disable"
          >
            <MdArrowForward />
          </button>

          <div
            className="carousel-track-container"
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 50) (dx < 0 ? goToNext : goToPrev)();
              touchX.current = null;
            }}
          >
            <div
              className="carousel-track"
              style={{ transform: `translate3d(-${currentIndex * 100}%,0,0)` }}
            >
              {projects.map((project, index) => (
                <div
                  className={`carousel-slide ${index === currentIndex ? "is-active" : ""}`}
                  key={project.title}
                  aria-hidden={index !== currentIndex}
                >
                  <div className="carousel-content">
                    <div className="carousel-info">
                      <div className="carousel-number">
                        <h3>0{index + 1}</h3>
                      </div>
                      <div className="carousel-details">
                        <p className="carousel-category">
                          {project.category} <span>· {project.year}</span>
                        </p>
                        <h4>{project.title}</h4>
                        <p className="carousel-summary">{project.summary}</p>
                        <div className="carousel-metrics">
                          {project.metrics.map((m) => (
                            <span key={m}>{m}</span>
                          ))}
                        </div>
                        <div className="carousel-tools">
                          <span className="tools-label">Stack</span>
                          <p>{project.tools}</p>
                        </div>
                      </div>
                    </div>
                    <div className="carousel-image-wrapper">
                      {project.diagram ? (
                        <PipelineDiagram diagram={project.diagram} />
                      ) : (
                        <WorkImage image={project.image!} alt={project.title} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="carousel-dots">
            {projects.map((p, index) => (
              <button
                key={p.title}
                className={`carousel-dot ${index === currentIndex ? "carousel-dot-active" : ""}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to project ${index + 1}: ${p.title}`}
                data-cursor="disable"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Work;
