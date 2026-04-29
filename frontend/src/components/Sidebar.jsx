import AppIcon from "./AppIcon";
import Logo from "./Logo";

const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: "dashboard" },
  { id: "orders", label: "Orders", icon: "orders" },
  { id: "products", label: "Menu", icon: "menu" },
  { id: "analytics", label: "Analytics", icon: "analytics" },
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "support", page: "settings", label: "Support", icon: "support" },
];

function Sidebar({
  activePage,
  onPageChange,
  isMobileOpen,
  onClose,
  onLogout,
}) {
  return (
    <aside className={`sidebar-shell ${isMobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <Logo variant="light" className="sidebar-logo" />
          <span className="sidebar-brand-subtitle">PREMIUM MANAGEMENT</span>
        </div>

        <button
          type="button"
          className="sidebar-close-button"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <AppIcon name="close" size={18} />
          <span>Close</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activePage === item.id ? "active" : ""}
            onClick={() => {
              onPageChange(item.page || item.id);
              onClose?.();
            }}
            aria-current={activePage === item.id ? "page" : undefined}
          >
            <span className="sidebar-nav-icon">
              <AppIcon name={item.icon} size={18} />
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-logout-button" onClick={onLogout}>
          <AppIcon name="logout" size={18} />
          <span>Support</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
