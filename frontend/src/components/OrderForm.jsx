function OrderForm({
  editingOrderId,
  customerName,
  totalPrice,
  orderStatus,
  onCustomerNameChange,
  onTotalPriceChange,
  onOrderStatusChange,
  onSubmit,
  onCancel,
  isSavingOrder,
  orderStatuses,
}) {
  return (
    <section className={`panel-card form-panel ${editingOrderId ? "editing" : ""}`}>
      <div className="panel-header">
        <div>
          <h2>{editingOrderId ? "Edit Order" : "Add New Order"}</h2>
          <p>
            {editingOrderId
              ? "Update the selected order without interrupting the live workflow."
              : "Create a fresh order with customer, amount, and kitchen status."}
          </p>
        </div>
        {editingOrderId && <span className="panel-chip">Edit Mode</span>}
      </div>

      {editingOrderId && (
        <p className="edit-note">
          Editing order #{editingOrderId}. Cancel edit to return to add mode.
        </p>
      )}

      <form onSubmit={onSubmit} className="order-form">
        <label className="form-field">
          <span>Customer Name</span>
          <input
            type="text"
            value={customerName}
            placeholder="Customer name"
            onChange={(e) => onCustomerNameChange(e.target.value)}
            disabled={isSavingOrder}
            required
          />
        </label>

        <label className="form-field">
          <span>Total Price</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={totalPrice}
            placeholder="Total price"
            onChange={(e) => onTotalPriceChange(e.target.value)}
            disabled={isSavingOrder}
            required
          />
        </label>

        <label className="form-field">
          <span>Status</span>
          <select
            value={orderStatus}
            onChange={(e) => onOrderStatusChange(e.target.value)}
            disabled={isSavingOrder}
          >
            {orderStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <div className="form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={
              isSavingOrder || customerName.trim() === "" || totalPrice === ""
            }
          >
            {isSavingOrder
              ? editingOrderId
                ? "Updating..."
                : "Adding..."
              : editingOrderId
                ? "Update Order"
                : "Add Order"}
          </button>

          {editingOrderId && (
            <button
              type="button"
              className="secondary-button"
              onClick={onCancel}
              disabled={isSavingOrder}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default OrderForm;
