const NAV_ITEMS = [
  { id: "overview", label: "Home", short: "HM" },
  { id: "orders", label: "Orders", short: "OR" },
  { id: "analytics", label: "Analytics", short: "AN" },
  { id: "customers", label: "Customers", short: "CU" },
  { id: "settings", label: "Settings", short: "ST" },
];

function BottomNav({ activePage, onPageChange, onCreateOrder }) {
  return (
    <>
      <button
        type="button"
        className="floating-order-button"
        aria-label="Create order"
        onClick={onCreateOrder}
      >
        +
      </button>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activePage === item.id ? "active" : ""}
            onClick={() => onPageChange(item.id)}
            aria-current={activePage === item.id ? "page" : undefined}
          >
            <span className="bottom-nav-icon">{item.short}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

export default BottomNav;
