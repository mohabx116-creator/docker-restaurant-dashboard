function BrandMark({ className = "", variant = "default" }) {
  const isLight = variant === "light";
  const stroke = isLight ? "currentColor" : "currentColor";

  return (
    <svg
      className={`brand-mark-svg ${className}`}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 32C10 32 12.5 24 20 24C27.5 24 30 32 30 32"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M6 32H34" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <path d="M20 8V24" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <path
        d="M10 16L20 8L30 16"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="20" cy="8" r="2.5" fill="currentColor" />
    </svg>
  );
}

export default BrandMark;
