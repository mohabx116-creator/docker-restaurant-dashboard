function ProductModal({
  isOpen,
  isSaving,
  productForm,
  categories,
  imageOptions,
  onClose,
  onChange,
  onSubmit,
  isEditing,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="modal-card product-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="feedback-eyebrow">
              {isEditing ? "Edit menu item" : "Add menu item"}
            </span>
            <h2 id="product-modal-title">
              {isEditing ? "Update Product" : "Create Product"}
            </h2>
            <p>
              {isEditing
                ? "Adjust pricing, copy, availability, or category without leaving the dashboard."
                : "Add a new premium menu item using the uploaded product visuals and real protected API flow."}
            </p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            disabled={isSaving}
          >
            Close
          </button>
        </div>

        <form className="product-modal-form" onSubmit={onSubmit}>
          <div className="product-form-grid">
            <label className="form-field">
              <span>Product Name</span>
              <input
                type="text"
                value={productForm.name}
                onChange={(event) => onChange("name", event.target.value)}
                placeholder="Smokehouse Royale Burger"
                disabled={isSaving}
                required
              />
            </label>

            <label className="form-field">
              <span>Category</span>
              <select
                value={productForm.category}
                onChange={(event) => onChange("category", event.target.value)}
                disabled={isSaving}
                required
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={productForm.price}
                onChange={(event) => onChange("price", event.target.value)}
                placeholder="14.95"
                disabled={isSaving}
                required
              />
            </label>

            <label className="form-field">
              <span>Availability</span>
              <select
                value={String(productForm.is_available)}
                onChange={(event) =>
                  onChange("is_available", event.target.value === "true")
                }
                disabled={isSaving}
              >
                <option value="true">Available</option>
                <option value="false">Out of Stock</option>
              </select>
            </label>

            <label className="form-field product-image-field">
              <span>Product Image</span>
              <select
                value={productForm.image_url}
                onChange={(event) => onChange("image_url", event.target.value)}
                disabled={isSaving}
              >
                {imageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field product-description-field">
              <span>Description</span>
              <textarea
                value={productForm.description}
                onChange={(event) => onChange("description", event.target.value)}
                placeholder="Describe the dish in a polished premium restaurant tone."
                rows={5}
                disabled={isSaving}
              />
            </label>
          </div>

          <div className="product-modal-preview">
            <span className="feedback-eyebrow">Preview</span>
            <div className="product-modal-preview-card">
              <img
                src={productForm.image_url}
                alt={productForm.name || "Product preview"}
                className="product-modal-preview-image"
              />
              <div className="product-modal-preview-copy">
                <div className="product-preview-badges">
                  <span className="product-category-badge">{productForm.category}</span>
                  <span
                    className={`status-badge ${
                      productForm.is_available ? "status-completed" : "status-cancelled"
                    }`}
                  >
                    {productForm.is_available ? "Available" : "Out of Stock"}
                  </span>
                </div>
                <h3>{productForm.name || "New menu item"}</h3>
                <strong>{productForm.price ? `$${Number(productForm.price).toFixed(2)}` : "$0.00"}</strong>
                <p>
                  {productForm.description ||
                    "A polished description will appear here as you edit the product."}
                </p>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={
                isSaving ||
                productForm.name.trim() === "" ||
                productForm.category.trim() === "" ||
                productForm.price === ""
              }
            >
              {isSaving
                ? isEditing
                  ? "Updating..."
                  : "Saving..."
                : isEditing
                  ? "Update Product"
                  : "Add Product"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default ProductModal;
