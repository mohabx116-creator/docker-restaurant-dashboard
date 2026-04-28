const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "RD";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "orders", label: "Orders" },
  { id: "analytics", label: "Analytics" },
  { id: "customers", label: "Customers" },
  { id: "settings", label: "Settings" },
];

function Sidebar({ currentUser, activePage, onPageChange }) {
  return (
    <aside className="sidebar-shell">
      <div className="sidebar-brand">
        <div className="brand-mark">RD</div>
        <div>
          <strong>Restaurant Dashboard</strong>
          <span>Dashboard Lite</span>
        </div>
      </div>

      <p className="sidebar-copy">
        Berry-inspired structure tailored to a restaurant SaaS workspace.
      </p>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activePage === item.id ? "active" : ""}
            onClick={() => onPageChange(item.id)}
            aria-current={activePage === item.id ? "page" : undefined}
          >
            {item.label}
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
