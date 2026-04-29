import BrandMark from "./BrandMark";

function Logo({ className = "", variant = "default", compact = false }) {
  const isLight = variant === "light";

  return (
    <div className={`app-logo app-logo-${variant} ${className}`}>
      <span className="app-logo-mark">
        <BrandMark variant={variant} />
      </span>
      {!compact && (
        <span className="app-logo-text">
          <strong>RestoDash</strong>
          <span>Lite</span>
        </span>
      )}
      <span className="sr-only">
        {isLight ? "RestoDash Lite navigation" : "RestoDash Lite"}
      </span>
    </div>
  );
}

export default Logo;
