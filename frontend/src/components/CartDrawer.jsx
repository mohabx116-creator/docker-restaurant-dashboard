import AppIcon from "./AppIcon";
import Watermark from "./Watermark";

function CartDrawer({
  isOpen,
  cartItems,
  customerName,
  isCheckingOut,
  onCustomerNameChange,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onClear,
  onCheckout,
  formatCurrency,
}) {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.subtotal ?? Number(item.price) * item.quantity),
    0
  );
  const serviceTax = subtotal * 0.05;
  const total = subtotal + serviceTax;

  if (!isOpen) return null;

  return (
    <div className="cart-overlay" role="presentation" onClick={onClose}>
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cart-header">
          <div>
            <span className="feedback-eyebrow">Shopping Cart</span>
            <h2 id="cart-drawer-title">Shopping Cart</h2>
            <p>
              {totalItems
                ? `${totalItems} item${totalItems > 1 ? "s" : ""} selected`
                : "Select products to start a new order."}
            </p>
          </div>

          <button type="button" className="modal-close-button" onClick={onClose}>
            <AppIcon name="close" size={18} />
            <span>Close</span>
          </button>
        </div>

        <label className="form-field cart-customer-field">
          <span>Customer Name</span>
          <input
            type="text"
            value={customerName}
            onChange={(event) => onCustomerNameChange(event.target.value)}
            placeholder="Walk-in Guest"
            disabled={isCheckingOut}
          />
        </label>

        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="cart-empty-state">
              <Watermark />
              <strong>Your cart is empty</strong>
              <p>Add available menu items from the Products page.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <article className="cart-item" key={item.product_id}>
                <img src={item.image_url} alt={item.name} />

                <div className="cart-item-copy">
                  <strong>{item.name}</strong>
                  <span>{item.category}</span>
                  <small>{formatCurrency(item.price)} each</small>

                  <div className="cart-quantity-row">
                    <button
                      type="button"
                      onClick={() => onDecrease(item.product_id)}
                      disabled={isCheckingOut}
                      aria-label={`Decrease ${item.name}`}
                    >
                      <AppIcon name="remove" size={15} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onIncrease(item.product_id)}
                      disabled={isCheckingOut}
                      aria-label={`Increase ${item.name}`}
                    >
                      <AppIcon name="add" size={15} />
                    </button>
                  </div>
                </div>

                <div className="cart-item-end">
                  <strong>
                    {formatCurrency(item.subtotal ?? Number(item.price) * item.quantity)}
                  </strong>
                  <button
                    type="button"
                    onClick={() => onRemove(item.product_id)}
                    disabled={isCheckingOut}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="cart-summary">
          <div>
            <span>Subtotal</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          <div>
            <span>Service Tax (5%)</span>
            <strong>{formatCurrency(serviceTax)}</strong>
          </div>
          <div>
            <span>Delivery Fee</span>
            <strong>Free</strong>
          </div>
          <div className="cart-summary-total">
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
        </div>

        <div className="cart-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClear}
            disabled={isCheckingOut || cartItems.length === 0}
          >
            Clear Cart
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={onCheckout}
            disabled={isCheckingOut || cartItems.length === 0 || customerName.trim() === ""}
          >
            <AppIcon name="checkout" size={18} />
            <span>{isCheckingOut ? "Creating Order..." : "Create Order"}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

export default CartDrawer;
