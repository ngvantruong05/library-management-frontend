import React, { useState, useEffect, useMemo } from 'react'
import Navbar from '../components/Navbar'
import BookDetailsModal from '../components/BookDetailsModal'
import api from '../services/api'
import '../styles/catalog.css'

const MyLoans = () => {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [validityFilter, setValidityFilter] = useState('All')
  const [modeFilter, setModeFilter] = useState('All')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(0)

  const [selectedBook, setSelectedBook] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [returningId, setReturningId] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchLoans = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/book-loans/my-loans')
      setLoans(response.data || [])
    } catch (error) {
      console.error('Failed to load user loans:', error)
      showToast('Failed to load your loans', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  // Filtered loans based on search, validity, and mode
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      // Search by title
      const titleMatch = !searchTerm || (loan.bookTitle && loan.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()))
      
      // Filter by validity
      let validityMatch = true
      if (validityFilter === 'Valid') {
        validityMatch = loan.valid === true
      } else if (validityFilter === 'Invalid') {
        validityMatch = loan.valid === false
      }

      // Filter by mode
      let modeMatch = true
      if (modeFilter === 'Online') {
        modeMatch = loan.type === 'ONLINE'
      } else if (modeFilter === 'Offline') {
        modeMatch = loan.type === 'OFFLINE'
      }

      return titleMatch && validityMatch && modeMatch
    })
  }, [loans, searchTerm, validityFilter, modeFilter])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0)
  }, [searchTerm, validityFilter, modeFilter, pageSize])

  // Pagination calculation
  const totalResults = filteredLoans.length
  const totalPages = Math.ceil(totalResults / pageSize) || 1
  const paginatedLoans = useMemo(() => {
    const start = currentPage * pageSize
    return filteredLoans.slice(start, start + pageSize)
  }, [filteredLoans, currentPage, pageSize])

  // Handle return book
  const handleReturnBook = async (loan) => {
    if (!window.confirm(`Are you sure you want to return "${loan.bookTitle}"?`)) {
      return
    }

    setReturningId(loan.id)
    try {
      const response = await api.post(`/api/book-loans/${loan.id}/return`)
      const updatedLoan = response.data
      setLoans((prev) =>
        prev.map((item) => (item.id === loan.id ? updatedLoan : item))
      )
      showToast(`Book "${loan.bookTitle}" returned successfully!`)
    } catch (error) {
      console.error('Failed to return book:', error)
      showToast(error.response?.data?.message || 'Failed to return book', 'error')
    } finally {
      setReturningId(null)
    }
  }

  // Handle read online book (placeholder for now)
  const handleReadBook = (loan) => {
    showToast('Tính năng đọc sách online đang được hoàn thiện...', 'info')
  }

  // Handle book title or re-borrow click to open detail
  const handleOpenBook = async (bookId) => {
    try {
      const res = await api.get(`/api/books/${bookId}`)
      setSelectedBook(res.data)
      setShowDetailModal(true)
    } catch (err) {
      console.error('Failed to fetch book details:', err)
      showToast('Failed to load book details', 'error')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  return (
    <div className="fx-catalog-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {toast && (
        <div className={`notification-banner ${toast.type === 'error' ? 'notification-error' : 'notification-success'}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <Navbar />

      <main className="fx-content-container" style={{ maxWidth: '1300px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <h1 className="fx-welcome-title">My Book Loans</h1>

        {/* Filter & Control Bar */}
        <div className="fx-loans-toolbar">
          <div className="fx-loans-search-box">
            <input
              type="text"
              className="fx-loans-search-input"
              placeholder="Search loans by book title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="fx-loans-results-badge">{totalResults} results found</span>
          </div>

          <div className="fx-loans-filters">
            {/* Validity filter */}
            <div className="fx-filter-group">
              <label className="fx-filter-label">Validity:</label>
              <select
                className="fx-filter-select"
                value={validityFilter}
                onChange={(e) => setValidityFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Valid">Valid</option>
                <option value="Invalid">Expired / Returned</option>
              </select>
            </div>

            {/* Mode filter */}
            <div className="fx-filter-group">
              <label className="fx-filter-label">Mode:</label>
              <select
                className="fx-filter-select"
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </div>

            {/* Page Size */}
            <div className="fx-filter-group">
              <label className="fx-filter-label">Page Size:</label>
              <select
                className="fx-filter-select"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loan Items Container */}
        {loading ? (
          <div className="catalog-loader-container">
            <div className="catalog-spinner"></div>
            <p>Loading your book loans...</p>
          </div>
        ) : paginatedLoans.length === 0 ? (
          <div className="catalog-empty-container">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: '#86868c', marginBottom: '1rem' }}
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <h3>No Book Loans Found</h3>
            <p>You haven't borrowed any books matching the current filter.</p>
          </div>
        ) : (
          <div className="fx-loans-grid">
            {paginatedLoans.map((loan) => (
              <div key={loan.id} className="fx-loan-card">
                {/* Thumbnail */}
                <div className="fx-loan-thumb-container" onClick={() => handleOpenBook(loan.bookId)}>
                  {loan.bookThumbnail ? (
                    <img src={loan.bookThumbnail} alt={loan.bookTitle} className="fx-loan-thumb" />
                  ) : (
                    <div className="fx-loan-thumb-placeholder">
                      <span>No Cover</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="fx-loan-details">
                  <h3
                    className="fx-loan-title"
                    title={loan.bookTitle}
                    onClick={() => handleOpenBook(loan.bookId)}
                  >
                    {loan.bookTitle}
                  </h3>

                  <p className="fx-loan-dates">
                    📅 {formatDate(loan.borrowDate)} — {formatDate(loan.dueDate)}
                  </p>

                  {loan.type === 'OFFLINE' && (
                    <p className="fx-loan-copies-count">
                      Copies: <strong>{loan.numCopies}</strong>
                    </p>
                  )}

                  {/* Badges / Chips */}
                  <div className="fx-loan-chips">
                    <span className={`fx-loan-chip ${loan.type === 'ONLINE' ? 'chip-online' : 'chip-offline'}`}>
                      {loan.type}
                    </span>
                    <span className={`fx-loan-chip ${loan.valid ? 'chip-success' : 'chip-danger'}`}>
                      {loan.valid ? 'Valid' : (loan.status === 'RETURNED' ? 'Returned' : 'Expired')}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="fx-loan-actions">
                    {loan.valid ? (
                      <button
                        className="fx-btn-return"
                        onClick={() => handleReturnBook(loan)}
                        disabled={returningId === loan.id}
                      >
                        {returningId === loan.id ? 'Returning...' : 'Return'}
                      </button>
                    ) : (
                      <button
                        className="fx-btn-reborrow"
                        onClick={() => handleOpenBook(loan.bookId)}
                      >
                        Re-borrow
                      </button>
                    )}

                    {loan.type === 'ONLINE' && loan.valid && (
                      <button
                        className="fx-btn-read"
                        onClick={() => handleReadBook(loan)}
                      >
                        Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="fx-loans-pagination">
            <button
              className="fx-pagination-btn"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              ← Prev
            </button>
            <span className="fx-pagination-info">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              className="fx-pagination-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* Book Detail Modal */}
      <BookDetailsModal
        show={showDetailModal}
        book={selectedBook}
        onClose={() => setShowDetailModal(false)}
        onBorrow={() => {
          fetchLoans()
          showToast('Book borrowed successfully!')
        }}
      />
    </div>
  )
}

export default MyLoans
