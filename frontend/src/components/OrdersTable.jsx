import AppIcon from "./AppIcon";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "WG";

const formatRelativeTime = (value) => {
  const timestamp = new Date(value).getTime();
  if (!timestamp) return "--";

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 1) return "Now";
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;

  const hours = Math.round(diffMinutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
};

function OrdersTable({
  orders,
  totalOrders,
  hasActiveFilters,
  editingOrderId,
  isBusy,
  isLoading,
  deletingOrderId,
  onEdit,
  onDelete,
  onCreate,
  onView,
  onUpdateStatus,
  formatCurrency,
  formatDate,
  getOrderStatus,
  statusLabels,
}) {
  if (isLoading) {
    return (
      <div className="orders-loading" aria-label="Loading orders">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="orders-skeleton-row" key={index}>
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders-empty-state">
        <h3>
          {totalOrders === 0
            ? "No orders yet"
            : hasActiveFilters
              ? "No matching orders"
              : "No orders available"}
        </h3>
        <p>
          {totalOrders === 0
            ? "Create the first order to start tracking customer tickets."
            : hasActiveFilters
              ? "Adjust search or status filters to reveal more orders."
              : "Orders will appear here when they are available."}
        </p>
        <button type="button" className="orders-create-button" onClick={onCreate}>
          Create Order
        </button>
      </div>
    );
  }

  const renderActions = (order) => (
    <div className="orders-actions">
      <button
        type="button"
        className="orders-action-button"
        onClick={() => onView?.(order)}
        disabled={isBusy || !onView}
      >
        <AppIcon name="view" size={15} />
        <span>View</span>
      </button>
      <button
        type="button"
        className="orders-action-button"
        onClick={() => onEdit(order)}
        disabled={isBusy}
      >
        Edit
      </button>
      <button
        type="button"
        className="orders-action-button orders-delete-button"
        onClick={() => onDelete?.(order.id)}
        disabled={isBusy || deletingOrderId === order.id || !onDelete}
      >
        <AppIcon name="delete" size={14} />
        <span className="sr-only">Delete</span>
      </button>
      <button
        type="button"
        className="orders-action-button orders-more-button"
        onClick={() => onUpdateStatus?.(order)}
        disabled={isBusy || !onUpdateStatus}
        aria-label="Update status"
      >
        ...
      </button>
    </div>
  );

  return (
    <>
      <div className="orders-mobile-list">
        {orders.map((order) => {
          const status = getOrderStatus(order.status);

          return (
            <article
              key={order.id}
              className={`orders-mobile-card ${editingOrderId === order.id ? "active" : ""}`}
            >
              <div className="orders-mobile-card-top">
                <div className="orders-mobile-ident">
                  <span className="orders-mobile-id">#{order.id}</span>
                  <div>
                    <strong>{order.customer_name || "Walk-in Guest"}</strong>
                    <span>{order.items_summary || "Manual order"}</span>
                  </div>
                </div>

                <span className={`orders-status orders-status-${status}`}>
                  {statusLabels[status]}
                </span>
              </div>

              <div className="orders-mobile-card-bottom">
                <div className="orders-mobile-amount">
                  <span>Amount</span>
                  <strong>{formatCurrency(order.total_price)}</strong>
                </div>

                {renderActions(order)}
              </div>
            </article>
          );
        })}
      </div>

      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th className="orders-cell">Order ID</th>
              <th className="orders-cell">Customer</th>
              <th className="orders-cell">Items</th>
              <th className="orders-cell">Total</th>
              <th className="orders-cell">Status</th>
              <th className="orders-cell">Time</th>
              <th className="orders-cell orders-cell-actions">Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => {
              const status = getOrderStatus(order.status);

              return (
                <tr
                  key={order.id}
                  className={`orders-row ${editingOrderId === order.id ? "active" : ""}`}
                >
                  <td className="orders-cell">#{order.id}</td>
                  <td className="orders-cell">
                    <div className="orders-customer-cell">
                      <span>{getInitials(order.customer_name)}</span>
                      <strong>{order.customer_name || "Walk-in Guest"}</strong>
                    </div>
                  </td>
                  <td className="orders-cell orders-items-cell">
                    {order.items_summary || "Manual order"}
                  </td>
                  <td className="orders-cell">{formatCurrency(order.total_price)}</td>
                  <td className="orders-cell">
                    <span className={`orders-status orders-status-${status}`}>
                      {statusLabels[status]}
                    </span>
                  </td>
                  <td className="orders-cell">{formatRelativeTime(order.created_at) || formatDate(order.created_at)}</td>
                  <td className="orders-cell orders-cell-actions">{renderActions(order)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default OrdersTable;
