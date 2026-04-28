function ConfirmDialog({ config, isBusy, onCancel, onConfirm }) {
  if (!config) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <section
        className="modal-card confirm-dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="feedback-eyebrow">{config.eyebrow || "Confirmation"}</span>
        <h2 id="confirm-dialog-title">{config.title}</h2>
        <p>{config.message}</p>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={isBusy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="table-action-button danger-button confirm-danger-button"
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? "Working..." : config.confirmLabel || "Confirm"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
