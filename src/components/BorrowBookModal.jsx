import React, { useState, useEffect } from 'react'

const BorrowBookModal = ({
  show,
  selectedBook,
  initialType = 'OFFLINE',
  availableCopies = 1,
  onClose,
  onConfirm,
}) => {
  const [borrowType, setBorrowType] = useState(initialType)
  const [numCopies, setNumCopies] = useState(1)
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (show) {
      setBorrowType(initialType)
      setNumCopies(1)
      setErrorMsg('')
      // Default due date: 14 days from today for offline, 90 days for online
      const defaultDue = new Date()
      defaultDue.setDate(defaultDue.getDate() + (initialType === 'ONLINE' ? 90 : 14))
      setDueDate(defaultDue.toISOString().split('T')[0])
    }
  }, [show, initialType])

  if (!show || !selectedBook) return null

  // Minimum date: tomorrow
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  const handleTypeChange = (type) => {
    setBorrowType(type)
    setErrorMsg('')
    const defaultDue = new Date()
    defaultDue.setDate(defaultDue.getDate() + (type === 'ONLINE' ? 90 : 14))
    setDueDate(defaultDue.toISOString().split('T')[0])
  }

  const handleCopiesChange = (val) => {
    const max = Math.max(1, availableCopies)
    const validVal = Math.min(Math.max(1, val), max)
    setNumCopies(validVal)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (borrowType === 'OFFLINE' && availableCopies <= 0) {
      setErrorMsg('No physical copies available on shelf.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      await onConfirm({
        bookId: selectedBook.id,
        type: borrowType,
        numCopies: borrowType === 'OFFLINE' ? numCopies : 0,
        dueDate: dueDate ? `${dueDate}T23:59:59` : null,
      })
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to borrow book')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fx-modal-overlay" onClick={onClose}>
      <div className="fx-borrow-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="fx-borrow-modal-header">
          <h3 className="fx-borrow-modal-title">Borrow Book</h3>
          <button className="fx-borrow-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="fx-borrow-modal-body">
          {errorMsg && (
            <div className="fx-borrow-error-banner">
              {errorMsg}
            </div>
          )}

          {/* Book Summary Card */}
          <div className="fx-borrow-summary">
            {selectedBook.thumbnail && (
              <img src={selectedBook.thumbnail} alt={selectedBook.title} className="fx-borrow-thumb" />
            )}
            <div className="fx-borrow-info">
              <h4 className="fx-borrow-book-title">{selectedBook.title}</h4>
              <p className="fx-borrow-book-author">
                by {selectedBook.authors?.map(a => a.name).join(', ') || 'Unknown Author'}
              </p>
              <div className="fx-borrow-stock-badge">
                Available shelf copies: <strong>{availableCopies}</strong>
              </div>
            </div>
          </div>

          {/* Loan Type Selection */}
          <div className="fx-borrow-form-group">
            <label className="fx-borrow-label">Loan Type</label>
            <div className="fx-borrow-type-grid">
              <div
                className={`fx-borrow-type-card ${borrowType === 'ONLINE' ? 'active' : ''}`}
                onClick={() => handleTypeChange('ONLINE')}
              >
                <div className="fx-borrow-type-header">
                  <span className="fx-borrow-type-icon">💻</span>
                  <span className="fx-borrow-type-name">ONLINE</span>
                </div>
                <p className="fx-borrow-type-desc">Read E-Book / PDF instantly on your browser (90 days)</p>
              </div>

              <div
                className={`fx-borrow-type-card ${borrowType === 'OFFLINE' ? 'active' : ''} ${availableCopies <= 0 ? 'disabled' : ''}`}
                onClick={() => availableCopies > 0 && handleTypeChange('OFFLINE')}
              >
                <div className="fx-borrow-type-header">
                  <span className="fx-borrow-type-icon">📖</span>
                  <span className="fx-borrow-type-name">OFFLINE</span>
                </div>
                <p className="fx-borrow-type-desc">
                  {availableCopies > 0 ? 'Borrow physical copies from library shelf' : 'Out of physical stock'}
                </p>
              </div>
            </div>
          </div>

          {/* OFFLINE specific settings */}
          {borrowType === 'OFFLINE' && (
            <div className="fx-borrow-form-group">
              <label className="fx-borrow-label">Number of Copies</label>
              <div className="fx-borrow-copies-stepper">
                <button
                  type="button"
                  className="fx-stepper-btn"
                  onClick={() => handleCopiesChange(numCopies - 1)}
                  disabled={numCopies <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  className="fx-stepper-input"
                  min="1"
                  max={Math.max(1, availableCopies)}
                  value={numCopies}
                  onChange={(e) => handleCopiesChange(parseInt(e.target.value) || 1)}
                />
                <button
                  type="button"
                  className="fx-stepper-btn"
                  onClick={() => handleCopiesChange(numCopies + 1)}
                  disabled={numCopies >= availableCopies}
                >
                  +
                </button>
                <span className="fx-stepper-hint">(Max: {availableCopies})</span>
              </div>
            </div>
          )}

          {/* Expected Due Date */}
          <div className="fx-borrow-form-group">
            <label className="fx-borrow-label">Expected Return Due Date</label>
            <input
              type="date"
              className="fx-borrow-date-input"
              min={minDateStr}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          {/* Modal Actions */}
          <div className="fx-borrow-modal-footer">
            <button type="button" className="fx-btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="fx-btn-primary-borrow" disabled={loading}>
              {loading ? 'Processing...' : 'Confirm Borrow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BorrowBookModal
