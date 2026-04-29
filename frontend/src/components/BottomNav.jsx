import AppIcon from "./AppIcon";

const NAV_ITEMS = [
  { id: "overview", label: "Home", icon: "overview" },
  { id: "products", label: "Menu", icon: "products" },
  { id: "cart", label: "Cart", icon: "cart", hasBadge: true },
  { id: "orders", label: "Orders", icon: "orders" },
  { id: "analytics", label: "Analytics", icon: "analytics" },
  { id: "settings", label: "Settings", icon: "settings" },
];

function BottomNav({ activePage, onPageChange, onPrimaryAction, cartItemsCount = 0 }) {
  const showFloatingAction = activePage === "products" || activePage === "orders";

  return (
    <>
      {showFloatingAction && (
        <button
          type="button"
          className="floating-order-button"
          aria-label="Create item"
          onClick={onPrimaryAction}
        >
          <AppIcon name="add" size={24} />
        </button>
      )}

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activePage === item.id ? "active" : ""}
            onClick={() => onPageChange(item.id)}
            aria-current={activePage === item.id ? "page" : undefined}
          >
            <span className="bottom-nav-icon">
              <AppIcon name={item.icon} size={18} />
              {item.hasBadge && cartItemsCount > 0 && (
                <span className="bottom-cart-badge">{cartItemsCount}</span>
              )}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

export default BottomNav;
