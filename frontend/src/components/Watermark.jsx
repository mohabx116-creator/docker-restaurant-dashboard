function Watermark({ className = "" }) {
  return (
    <svg
      className={`watermark-svg ${className}`}
      width="160"
      height="160"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 32C10 32 12.5 24 20 24C27.5 24 30 32 30 32"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M6 32H34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 8V24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M10 16L20 8L30 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default Watermark;
