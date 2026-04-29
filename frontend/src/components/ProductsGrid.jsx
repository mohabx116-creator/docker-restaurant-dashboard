function ProductSkeletonCard() {
  return (
    <article className="product-card product-card-skeleton" aria-hidden="true">
      <div className="product-card-image-shell">
        <div className="product-card-image skeleton-block"></div>
      </div>
      <div className="product-card-body">
        <div className="product-card-badges">
          <span className="skeleton-pill"></span>
          <span className="skeleton-pill short"></span>
        </div>
        <div className="skeleton-line title"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line medium"></div>
        <div className="product-card-footer">
          <div className="skeleton-line short"></div>
          <div className="skeleton-switch"></div>
        </div>
      </div>
    </article>
  );
}

function ProductsGrid({
  products,
  isLoading,
  error,
  hasFilters,
  onRetry,
  onEdit,
  onDelete,
  onToggle,
  onAddToCart,
  getCartQuantity,
  isCartBusy = false,
  deletingProductId,
  togglingProductId,
  formatCurrency,
}) {
  if (isLoading && products.length === 0) {
    return (
      <section className="products-grid" aria-label="Loading products">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductSkeletonCard key={`skeleton-${index}`} />
        ))}
      </section>
    );
  }

  if (error && products.length === 0) {
    return (
      <section className="products-feedback-card">
        <span className="feedback-eyebrow">Products error</span>
        <h3>Unable to load menu items</h3>
        <p>{error}</p>
        <button type="button" className="primary-button" onClick={onRetry}>
          Retry Loading
        </button>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="products-feedback-card">
        <span className="feedback-eyebrow">No products</span>
        <h3>No menu items match the current view</h3>
        <p>
          {hasFilters
            ? "Try a different search term, category, or availability filter."
            : "Create your first product to start building the menu."}
        </p>
      </section>
    );
  }

  return (
    <section className="products-grid">
      {products.map((product) => {
        const isDeleting = deletingProductId === product.id;
        const isToggling = togglingProductId === product.id;
        const cartQuantity = getCartQuantity ? getCartQuantity(product.id) : 0;

        return (
          <article className="product-card" key={product.id}>
            <div className="product-card-image-shell">
              <img
                src={product.image_url}
                alt={product.name}
                className={`product-card-image ${product.is_available ? "" : "dimmed"}`}
              />

              <div className="product-card-badge-row">
                <span className="product-category-badge">{product.category}</span>
                <span
                  className={`status-badge ${product.is_available ? "status-completed" : "status-cancelled"
                    }`}
                >
                  {product.is_available ? "Available" : "Out of Stock"}
                </span>
              </div>
            </div>

            <div className="product-card-body">
              <div className="product-card-header">
                <div>
                  <h3>{product.name}</h3>
                  <p className="product-card-description">{product.description}</p>
                </div>
                <strong>{formatCurrency(product.price)}</strong>
              </div>

              <button
                type="button"
                className="add-to-cart-button"
                onClick={() => onAddToCart(product)}
                disabled={
                  !product.is_available ||
                  isCartBusy ||
                  Boolean(deletingProductId) ||
                  Boolean(togglingProductId)
                }
              >
                {cartQuantity > 0 ? `Add More (${cartQuantity})` : "Add to Cart"}
              </button>

              <div className="product-card-footer">
                <div className="product-card-actions">
                  <button
                    type="button"
                    className="table-action-button"
                    onClick={() => onEdit(product)}
                    disabled={Boolean(deletingProductId) || Boolean(togglingProductId)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="table-action-button danger-button"
                    onClick={() => onDelete(product)}
                    disabled={Boolean(deletingProductId) || Boolean(togglingProductId)}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>

                <button
                  type="button"
                  className={`availability-toggle ${product.is_available ? "active" : ""}`}
                  onClick={() => onToggle(product.id)}
                  disabled={Boolean(deletingProductId) || Boolean(togglingProductId)}
                  aria-pressed={product.is_available}
                >
                  <span>{isToggling ? "..." : product.is_available ? "On" : "Off"}</span>
                  <span className="availability-toggle-knob" aria-hidden="true"></span>
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default ProductsGrid;
