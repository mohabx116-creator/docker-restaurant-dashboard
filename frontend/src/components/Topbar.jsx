const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "RD";

function Topbar({
  currentUser,
  searchTerm,
  onSearchChange,
  onExport,
  onLogout,
  notificationCount,
  isBusy,
  canExport,
}) {
  return (
    <header className="topbar-shell">
      <div className="topbar-mobile-brand">
        <div className="brand-mark">RD</div>
        <div>
          <strong>Restaurant Dashboard</strong>
          <span>Dashboard Lite</span>
        </div>
      </div>

      <label className="topbar-search">
        <span className="sr-only">Search</span>
        <input
          type="search"
          placeholder="Search analytics, orders, or customers..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </label>

      <div className="topbar-actions">
        <button type="button" className="icon-button" aria-label="Notifications">
          <span>🔔</span>
          <small>{notificationCount}</small>
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={onExport}
          disabled={!canExport}
        >
          Export Snapshot
        </button>

        <div className="topbar-user">
          <div className="topbar-avatar">{getInitials(currentUser?.name)}</div>
          <div className="topbar-user-meta">
            <strong>{currentUser?.name || "Restaurant Manager"}</strong>
            <span>{currentUser?.email || "manager@dashboard.local"}</span>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={onLogout}
          disabled={isBusy}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Topbar;
