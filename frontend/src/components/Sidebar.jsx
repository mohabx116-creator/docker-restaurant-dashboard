import AppIcon from "./AppIcon";
import Logo from "./Logo";

const PRIMARY_NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: "dashboard" },
  { id: "orders", label: "Orders", icon: "orders" },
  { id: "products", label: "Menu", icon: "menu" },
  { id: "analytics", label: "Analytics", icon: "analytics" },
];

const UTILITY_NAV_ITEMS = [
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "support", page: "settings", label: "Support", icon: "support" },
];

function Sidebar({
  activePage,
  onPageChange,
  isMobileOpen,
  onClose,
}) {
  const renderNavButton = (item) => {
    const targetPage = item.page || item.id;
    const isActive = activePage === targetPage && item.id !== "support";

    return (
      <button
        key={item.id}
        type="button"
        className={isActive ? "active" : ""}
        onClick={() => {
          onPageChange(targetPage);
          onClose?.();
        }}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="sidebar-nav-icon">
          <AppIcon name={item.icon} size={18} />
        </span>
        <span>{item.label}</span>
      </button>
    );
  };

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
        {PRIMARY_NAV_ITEMS.map(renderNavButton)}
      </nav>

      <nav className="sidebar-footer" aria-label="Secondary navigation">
        {UTILITY_NAV_ITEMS.map(renderNavButton)}
      </nav>
    </aside>
  );
}

export default Sidebar;
