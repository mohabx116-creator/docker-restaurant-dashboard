import AppIcon from "./AppIcon";
import Logo from "./Logo";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "RD";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "products", label: "Products / Menu", icon: "products" },
  { id: "cart", label: "Order Cart", icon: "cart", hasBadge: true },
  { id: "orders", label: "Orders", icon: "orders" },
  { id: "analytics", label: "Analytics", icon: "analytics" },
  { id: "customers", label: "Customers", icon: "customers" },
  { id: "settings", label: "Settings", icon: "settings" },
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
          <Logo variant="light" className="sidebar-logo" />
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
            <span className="sidebar-nav-icon">
              <AppIcon name={item.icon} size={18} />
            </span>
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
          <AppIcon name="logout" size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
