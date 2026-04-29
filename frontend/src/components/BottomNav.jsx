const NAV_ITEMS = [
  { id: "overview", label: "Home", short: "HM" },
  { id: "products", label: "Menu", short: "MN" },
  { id: "cart", label: "Cart", short: "CT", hasBadge: true },
  { id: "orders", label: "Orders", short: "OR" },
  { id: "analytics", label: "Analytics", short: "AN" },
  { id: "settings", label: "Settings", short: "ST" },
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
          +
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
              {item.short}
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
