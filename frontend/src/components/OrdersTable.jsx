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
  onCreate,
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
                    <span>{formatDate(order.created_at)}</span>
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

                <div className="orders-actions">
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
                    className="orders-action-button"
                    onClick={() => onEdit(order)}
                    disabled={isBusy}
                  >
                    Update Status
                  </button>
                  <button
                    type="button"
                    className="orders-action-button danger"
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

      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th className="orders-cell">Order ID</th>
              <th className="orders-cell">Customer Name</th>
              <th className="orders-cell">Total Price</th>
              <th className="orders-cell">Status</th>
              <th className="orders-cell">Date</th>
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
                  <td className="orders-cell">{order.customer_name || "Walk-in Guest"}</td>
                  <td className="orders-cell">{formatCurrency(order.total_price)}</td>
                  <td className="orders-cell">
                    <span className={`orders-status orders-status-${status}`}>
                      {statusLabels[status]}
                    </span>
                  </td>
                  <td className="orders-cell">{formatDate(order.created_at)}</td>
                  <td className="orders-cell">
                    <div className="orders-actions">
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
                        className="orders-action-button"
                        onClick={() => onEdit(order)}
                        disabled={isBusy}
                      >
                        Update Status
                      </button>
                      <button
                        type="button"
                        className="orders-action-button danger"
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
