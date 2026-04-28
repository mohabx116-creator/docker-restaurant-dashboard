const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "RD";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", symbol: "OV" },
  { id: "orders", label: "Orders", symbol: "OR" },
  { id: "analytics", label: "Analytics", symbol: "AN" },
  { id: "customers", label: "Customers", symbol: "CU" },
  { id: "settings", label: "Settings", symbol: "ST" },
];

function Sidebar({ currentUser, activePage, onPageChange }) {
  return (
    <aside className="sidebar-shell">
      <div className="sidebar-brand">
        <div className="brand-mark">RD</div>
        <div className="sidebar-brand-copy">
          <strong>Restaurant Dashboard</strong>
          <span>Editorial Admin</span>
        </div>
      </div>

      <p className="sidebar-copy">Dashboard Lite</p>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activePage === item.id ? "active" : ""}
            onClick={() => onPageChange(item.id)}
            aria-current={activePage === item.id ? "page" : undefined}
          >
            <span className="sidebar-nav-icon">{item.symbol}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-user-card">
        <div className="sidebar-user-avatar">{getInitials(currentUser?.name)}</div>
        <div className="sidebar-user-meta">
          <strong>{currentUser?.name || "Restaurant Manager"}</strong>
          <span>{currentUser?.email || "manager@dashboard.local"}</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
