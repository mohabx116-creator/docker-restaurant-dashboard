const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "RD";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", symbol: "OV" },
  { id: "products", label: "Products / Menu", symbol: "MN" },
  { id: "cart", label: "Order Cart", symbol: "CT", hasBadge: true },
  { id: "orders", label: "Orders", symbol: "OR" },
  { id: "analytics", label: "Analytics", symbol: "AN" },
  { id: "customers", label: "Customers", symbol: "CU" },
  { id: "settings", label: "Settings", symbol: "ST" },
];

function Sidebar({
  currentUser,
  activePage,
  onPageChange,
  isMobileOpen,
  onClose,
  primaryActionLabel,
  onPrimaryAction,
  onLogout,
  cartItemsCount = 0,
}) {
  return (
    <aside className={`sidebar-shell ${isMobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-mark">RD</div>
          <div className="sidebar-brand-copy">
            <strong>RestoDash Lite</strong>
            <span>Premium Operations</span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-close-button"
          onClick={onClose}
          aria-label="Close navigation"
        >
          Close
        </button>
      </div>

      <p className="sidebar-copy">
        Executive view for live orders, menu control, revenue performance, and customer service.
      </p>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activePage === item.id ? "active" : ""}
            onClick={() => {
              onPageChange(item.id);
              onClose?.();
            }}
            aria-current={activePage === item.id ? "page" : undefined}
          >
            <span className="sidebar-nav-icon">{item.symbol}</span>
            <span>{item.label}</span>

            {item.hasBadge && cartItemsCount > 0 && (
              <span className="sidebar-cart-badge">{cartItemsCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="primary-button sidebar-cta-button"
          onClick={() => {
            onPrimaryAction?.();
            onClose?.();
          }}
        >
          {primaryActionLabel}
        </button>

        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">{getInitials(currentUser?.name)}</div>
          <div className="sidebar-user-meta">
            <strong>{currentUser?.name || "Restaurant Manager"}</strong>
            <span>{currentUser?.email || "manager@dashboard.local"}</span>
          </div>
        </div>

        <button type="button" className="sidebar-logout-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
