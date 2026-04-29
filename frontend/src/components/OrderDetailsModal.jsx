import AppIcon from "./AppIcon";
import Watermark from "./Watermark";

function OrderDetailsModal({
  open,
  onClose,
  order,
  items,
  loading,
  formatCurrency,
  formatDate,
  statusLabels,
  getOrderStatus,
}) {
  if (!open) return null;

  const status = getOrderStatus(order?.status);
  const itemsTotal = items.reduce(
    (sum, item) => sum + Number(item.subtotal ?? Number(item.unit_price) * item.quantity),
    0
  );
  const orderTotal = Number(order?.total_price ?? itemsTotal);

  return (
    <div className="modal-overlay order-details-overlay" role="presentation">
      <section
        className="order-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
      >
        <header className="order-details-header">
          <div>
            <span className="feedback-eyebrow">Order Details</span>
            <h2 id="order-details-title">Order #{order?.id}</h2>
            <p>{order ? `${formatDate(order.created_at)} - ${order.customer_name}` : ""}</p>
          </div>

          <button type="button" className="modal-close-button" onClick={onClose}>
            <AppIcon name="close" size={18} />
            <span>Close</span>
          </button>
        </header>

        <div className="order-details-summary">
          <div>
            <span>Customer</span>
            <strong>{order?.customer_name || "Walk-in Guest"}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong className={`orders-status orders-status-${status}`}>
              {statusLabels[status]}
            </strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{formatCurrency(orderTotal)}</strong>
          </div>
        </div>

        <div className="order-details-items">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div className="order-details-skeleton" key={index}>
                <span />
                <div>
                  <i />
                  <i />
                </div>
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="order-details-empty">
              <Watermark />
              <h3>No item details found</h3>
              <p>This order may have been created manually without product line items.</p>
            </div>
          ) : (
            items.map((item) => {
              const subtotal = Number(
                item.subtotal ?? Number(item.unit_price) * Number(item.quantity)
              );

              return (
                <article className="order-details-item" key={item.id || item.product_id}>
                  <img
                    src={item.image_url || "/products/smokehouse-royale-burger.jpg"}
                    alt={item.name}
                  />
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.category || "Menu item"}</span>
                    <small>
                      {item.quantity} x {formatCurrency(item.unit_price)}
                    </small>
                  </div>
                  <strong>{formatCurrency(subtotal)}</strong>
                </article>
              );
            })
          )}
        </div>

        <footer className="order-details-footer">
          <span>Secure backend total</span>
          <strong>{formatCurrency(orderTotal)}</strong>
        </footer>
      </section>
    </div>
  );
}

export default OrderDetailsModal;
