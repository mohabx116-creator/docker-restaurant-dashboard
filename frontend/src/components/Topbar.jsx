const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "RD";

function Topbar({
  currentUser,
  pageTitle,
  searchTerm,
  onSearchChange,
  onExport,
  onLogout,
  notificationCount,
  isBusy,
  canExport,
  onToggleSidebar,
  isMobileSidebarOpen,
}) {
  return (
    <header className="topbar-shell">
      <div className="topbar-mobile-row">
        <button
          type="button"
          className="topbar-menu-button"
          onClick={onToggleSidebar}
          aria-label={isMobileSidebarOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isMobileSidebarOpen}
        >
          {isMobileSidebarOpen ? "Close" : "Menu"}
        </button>

        <div className="topbar-mobile-brand">
          <div className="brand-mark">RD</div>
          <div>
            <strong>Restaurant Dashboard</strong>
            <span>Dashboard Lite</span>
          </div>
        </div>
      </div>

      <div className="topbar-leading">
        <span className="topbar-page-pill">{pageTitle}</span>

        <label className="topbar-search">
          <span className="topbar-search-icon">/</span>
          <span className="sr-only">Search</span>
          <input
            type="search"
            placeholder="Search analytics, orders, or customers..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>
      </div>

      <div className="topbar-actions">
        <button type="button" className="icon-button" aria-label="Notifications">
          <span>!</span>
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
