import AppIcon from "./AppIcon";
import BrandMark from "./BrandMark";

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
  onLogout,
  notificationCount,
  isBusy,
  onToggleSidebar,
  isMobileSidebarOpen,
  cartItemsCount = 0,
  onCartClick,
}) {
  const searchPlaceholder =
    pageTitle === "Products"
      ? "Search menu items..."
      : pageTitle === "Cart"
        ? "Search cart items..."
        : pageTitle === "Orders"
          ? "Search orders..."
          : "Search products, orders, or customers...";

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
          <AppIcon name={isMobileSidebarOpen ? "close" : "dashboard"} size={18} />
          <span>{isMobileSidebarOpen ? "Close" : "Menu"}</span>
        </button>

        <div className="topbar-mobile-brand">
          <div className="topbar-avatar topbar-brand-mark">
            <BrandMark />
          </div>
          <div>
            <strong>RestoDash Lite</strong>
            <span>{pageTitle}</span>
          </div>
        </div>
      </div>

      <div className="topbar-leading">
        <span className="topbar-page-pill">{pageTitle}</span>

        <label className="topbar-search">
          <span className="topbar-search-icon">
            <AppIcon name="search" size={17} />
          </span>
          <span className="sr-only">Search</span>
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="icon-button topbar-cart-button"
          aria-label="Open cart"
          onClick={onCartClick}
        >
          <AppIcon name="cart" size={18} />
          {cartItemsCount > 0 && <small>{cartItemsCount}</small>}
        </button>

        <button type="button" className="icon-button" aria-label="Notifications">
          <AppIcon name="notification" size={18} />
          <small>{notificationCount}</small>
        </button>

        <button type="button" className="icon-button" aria-label="Help">
          <AppIcon name="settings" size={18} />
        </button>

        <div className="topbar-user">
          <div className="topbar-avatar">{getInitials(currentUser?.name)}</div>
          <div className="topbar-user-meta">
            <strong>{currentUser?.name || "Restaurant Manager"}</strong>
            <span>Executive workspace</span>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={onLogout}
          disabled={isBusy}
        >
          <AppIcon name="logout" size={17} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Topbar;
