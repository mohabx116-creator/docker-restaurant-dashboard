function KpiCard({
  icon,
  label,
  value,
  badge,
  description,
  tone = "neutral",
  compact = false,
}) {
  return (
    <article
      className={`kpi-card ${compact ? "compact" : ""} tone-${tone}`}
    >
      <div className="kpi-card-top">
        <span className="kpi-icon">{icon}</span>
        <span className={`kpi-badge tone-${tone}`}>{badge}</span>
      </div>

      <div className="kpi-card-content">
        <span className="kpi-label">{label}</span>
        <strong className="kpi-value">{value}</strong>
        <p className="kpi-description">{description}</p>
      </div>

      <span className="kpi-accent-line" aria-hidden="true"></span>
    </article>
  );
}

export default KpiCard;
