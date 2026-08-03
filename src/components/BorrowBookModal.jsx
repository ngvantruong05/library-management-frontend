import React from 'react'

const BorrowBookModal = ({
  show,
  selectedBook,
  borrowType,
  setBorrowType,
  numCopies,
  setNumCopies,
  onClose,
  onSubmit,
}) => {
  if (!show || !selectedBook) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Request Borrow</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="borrow-info-box">
            <h4 className="borrow-book-title">{selectedBook.title}</h4>
            <p className="borrow-book-author">
              Author: {selectedBook.authors?.map(a => a.name).join(', ') || 'Unknown'}
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Select Loan Type</label>
            <div className="loan-type-selector">
              <div
                className={`loan-type-option ${borrowType === 'ONLINE' ? 'active' : ''}`}
                onClick={() => setBorrowType('ONLINE')}
              >
                <h4>ONLINE</h4>
                <p>Read E-Book / PDF instantly</p>
              </div>
              <div
                className={`loan-type-option ${borrowType === 'OFFLINE' ? 'active' : ''}`}
                onClick={() => setBorrowType('OFFLINE')}
              >
                <h4>OFFLINE</h4>
                <p>Borrow physical book from library</p>
              </div>
            </div>
          </div>

          {borrowType === 'OFFLINE' && (
            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label className="form-label">Number of Copies</label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="5"
                value={numCopies}
                onChange={(e) => setNumCopies(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="catalog-btn-primary" onClick={onSubmit}>
            Confirm Borrow
          </button>
        </div>
      </div>
    </div>
  )
}

export default BorrowBookModal
