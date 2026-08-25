import React from 'react'

const ManageCopiesModal = ({
  show,
  copiesBook,
  isCopiesLoading,
  availableCopiesText,
  totalCopiesInput,
  setTotalCopiesInput,
  onClose,
  onSubmit
}) => {
  if (!show || !copiesBook) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card copies-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Copies Stock Update</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={onSubmit}>
          <div className="modal-body" style={{ gap: '1.25rem' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Updating copies for: <strong style={{ color: 'var(--text-primary)' }}>{copiesBook.title}</strong>
            </p>
            
            {isCopiesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
                <div className="db-spinner" style={{ width: '30px', height: '30px' }}></div>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Available Copies (Current)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={availableCopiesText}
                    disabled
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Total Copies *</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    required
                    value={totalCopiesInput}
                    onChange={(e) => setTotalCopiesInput(Math.max(0, Number(e.target.value)))}
                  />
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="catalog-btn-primary" disabled={isCopiesLoading}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ManageCopiesModal
