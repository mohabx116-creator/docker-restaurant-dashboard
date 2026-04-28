const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "RD";

function Sidebar({ currentUser }) {
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
        <a className="active">Overview</a>
        <a>Orders</a>
        <a>Analytics</a>
        <a>Customers</a>
        <a>Settings</a>
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
