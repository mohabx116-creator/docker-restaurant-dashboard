function OrdersTable({
  orders,
  totalOrders,
  hasActiveFilters,
  editingOrderId,
  deletingOrderId,
  isBusy,
  isLoading,
  onEdit,
  onDelete,
  formatCurrency,
  formatDate,
  getOrderStatus,
  statusLabels,
}) {
  if (isLoading && totalOrders === 0) {
    return <p className="status-message">Loading orders...</p>;
  }

  if (orders.length === 0) {
    return (
      <p className="status-message">
        {totalOrders === 0
          ? "No orders yet. Add your first order to get started."
          : hasActiveFilters
            ? "No orders match the active search and status filters."
            : "No orders available for this account yet."}
      </p>
    );
  }

  return (
    <>
      <div className="mobile-orders-list">
        {orders.map((order) => {
          const status = getOrderStatus(order.status);

          return (
            <article
              key={order.id}
              className={`mobile-order-card ${editingOrderId === order.id ? "active" : ""}`}
            >
              <div className="mobile-order-card-top">
                <div className="mobile-order-ident">
                  <span className="mobile-order-id">#{order.id}</span>
                  <div>
                    <strong>{order.customer_name || "Walk-in Guest"}</strong>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                </div>

                <span className={`status-badge status-${status}`}>
                  {statusLabels[status]}
                </span>
              </div>

              <div className="mobile-order-card-bottom">
                <div className="mobile-order-amount">
                  <span>Amount</span>
                  <strong>{formatCurrency(order.total_price)}</strong>
                </div>

                <div className="table-actions">
                  <button
                    type="button"
                    className="table-action-button"
                    onClick={() => onEdit(order)}
                    disabled={isBusy}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="table-action-button danger-button"
                    onClick={() => onDelete(order.id)}
                    disabled={isBusy}
                  >
                    {deletingOrderId === order.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="table-wrapper desktop-orders-table">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => {
              const status = getOrderStatus(order.status);

              return (
                <tr
                  key={order.id}
                  className={editingOrderId === order.id ? "table-row-active" : ""}
                >
                  <td>#{order.id}</td>
                  <td>{order.customer_name || "Walk-in Guest"}</td>
                  <td>
                    <span className={`status-badge status-${status}`}>
                      {statusLabels[status]}
                    </span>
                  </td>
                  <td>{formatCurrency(order.total_price)}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="table-action-button"
                        onClick={() => onEdit(order)}
                        disabled={isBusy}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="table-action-button danger-button"
                        onClick={() => onDelete(order.id)}
                        disabled={isBusy}
                      >
                        {deletingOrderId === order.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
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
