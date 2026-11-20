import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./styles/Impact.css";

gsap.registerPlugin(ScrollTrigger);

type Stat = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix: string;
  label: string;
  note: string;
};

const stats: Stat[] = [
  { value: 500, suffix: "K+", label: "Records / day", note: "Production Medallion pipeline on Databricks" },
  { value: 99.1, decimals: 1, suffix: "%", label: "Ingestion reliability", note: "Across 6+ merged ERP / CRM sources" },
  { value: 50, suffix: "K+", label: "Events / sec", note: "Streamed through Redpanda with exactly-once" },
  { value: 2, prefix: "<", suffix: "s", label: "End-to-end latency", note: "Real-time inventory synchronization" },
  { value: 85, suffix: "%", label: "Fewer inconsistencies", note: "In cross-company reporting" },
  { value: 9.23, decimals: 2, suffix: "", label: "CGPA", note: "B.E. Computer Science · 2 IEEE papers" },
];

const marqueeA = ["Databricks", "PySpark", "Apache Airflow", "Kafka", "Redpanda", "dbt", "Delta Lake", "AWS S3", "Docker"];
const marqueeB = ["PostgreSQL", "SQL Server", "DuckDB", "Redis", "Power BI", "DAX", "Pandas", "scikit-learn", "Great Expectations"];

const Row = ({ items, reverse }: { items: string[]; reverse?: boolean }) => (
  <div className={`impact-marquee-row ${reverse ? "is-reverse" : ""}`} aria-hidden="true">
    {/* duplicated once so the -50% translate loops seamlessly */}
    {[0, 1].map((k) => (
      <div className="impact-marquee-track" key={k}>
        {items.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    ))}
  </div>
);

const Impact = () => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    // Pause the CSS marquee while off-screen (no wasted compositing)
    const io = new IntersectionObserver(
      ([e]) => root.classList.toggle("is-inview", e.isIntersecting),
      { rootMargin: "100px 0px" }
    );
    io.observe(root);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      const nums = gsap.utils.toArray<HTMLElement>(".impact-num", root);
      nums.forEach((el) => {
        const target = Number(el.dataset.value);
        const decimals = Number(el.dataset.decimals || 0);
        const obj = { v: reduce ? target : 0 };
        el.textContent = obj.v.toFixed(decimals);
        if (reduce) return;
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          // textContent only — no layout-affecting properties
          onUpdate: () => {
            el.textContent = obj.v.toFixed(decimals);
          },
        });
      });
    }, root);

    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <section className="impact-section" id="impact" ref={ref}>
      <div className="impact-marquee">
        <Row items={marqueeA} />
        <Row items={marqueeB} reverse />
      </div>
      <div className="impact-container section-container">
        <div className="impact-head" data-reveal>
          <span className="impact-eyebrow">By the numbers</span>
          <h2>
            Impact, <span>measured.</span>
          </h2>
        </div>
        <div className="impact-grid">
          {stats.map((s) => (
            <div className="impact-card" key={s.label} data-reveal>
              <div className="impact-value">
                {s.prefix && <span className="impact-affix">{s.prefix}</span>}
                <span
                  className="impact-num"
                  data-value={s.value}
                  data-decimals={s.decimals ?? 0}
                >
                  {s.value}
                </span>
                <span className="impact-affix">{s.suffix}</span>
              </div>
              <h4>{s.label}</h4>
              <p>{s.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Impact;
