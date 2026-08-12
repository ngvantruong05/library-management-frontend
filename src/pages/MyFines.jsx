import React, { useState, useEffect, useMemo } from 'react'
import Navbar from '../components/Navbar'
import BookDetailsModal from '../components/BookDetailsModal'
import api from '../services/api'
import '../styles/catalog.css'

const MyFines = () => {
  const [fines, setFines] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(0)

  const [selectedBook, setSelectedBook] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchFines = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/fines/my-fines')
      setFines(response.data || [])
    } catch (error) {
      console.error('Failed to load user fines:', error)
      showToast('Failed to load your fines', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFines()
  }, [])

  // Filter fines based on search and status
  const filteredFines = useMemo(() => {
    return fines.filter((fine) => {
      // Search by book title
      const titleMatch =
        !searchTerm ||
        (fine.bookTitle && fine.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()))

      // Filter by status
      let statusMatch = true
      if (statusFilter === 'Unpaid') {
        statusMatch = fine.status === 'UNPAID'
      } else if (statusFilter === 'Paid') {
        statusMatch = fine.status === 'PAID'
      }

      return titleMatch && statusMatch
    })
  }, [fines, searchTerm, statusFilter])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0)
  }, [searchTerm, statusFilter, pageSize])

  // Pagination calculation
  const totalResults = filteredFines.length
  const totalPages = Math.ceil(totalResults / pageSize) || 1
  const paginatedFines = useMemo(() => {
    const start = currentPage * pageSize
    return filteredFines.slice(start, start + pageSize)
  }, [filteredFines, currentPage, pageSize])

  // Handle clicking book thumbnail or title to view details
  const handleOpenBook = async (bookId) => {
    if (!bookId) return
    try {
      const res = await api.get(`/api/books/${bookId}`)
      setSelectedBook(res.data)
      setShowDetailModal(true)
    } catch (err) {
      console.error('Failed to fetch book details:', err)
      showToast('Failed to load book details', 'error')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0)
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
        <h1 className="fx-welcome-title">My Fines</h1>

        {/* Filter & Control Bar */}
        <div className="fx-loans-toolbar">
          <div className="fx-loans-search-box">
            <input
              type="text"
              className="fx-loans-search-input"
              placeholder="Search fines by book title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="fx-loans-results-badge">{totalResults} results found</span>
          </div>

          <div className="fx-loans-filters">
            {/* Status filter */}
            <div className="fx-filter-group">
              <label className="fx-filter-label">Status:</label>
              <select
                className="fx-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
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

        {/* Fine Items Container */}
        {loading ? (
          <div className="catalog-loader-container">
            <div className="catalog-spinner"></div>
            <p>Loading your fines...</p>
          </div>
        ) : paginatedFines.length === 0 ? (
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
            <h3>No Fines Found</h3>
            <p>You have no fines matching the current filter.</p>
          </div>
        ) : (
          <div className="fx-loans-grid">
            {paginatedFines.map((fine) => (
              <div key={fine.id} className="fx-loan-card">
                {/* Thumbnail */}
                <div
                  className="fx-loan-thumb-container"
                  onClick={() => handleOpenBook(fine.bookId)}
                  style={{ cursor: fine.bookId ? 'pointer' : 'default' }}
                >
                  {fine.bookThumbnail ? (
                    <img src={fine.bookThumbnail} alt={fine.bookTitle} className="fx-loan-thumb" />
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
                    title={fine.bookTitle}
                    onClick={() => handleOpenBook(fine.bookId)}
                    style={{ cursor: fine.bookId ? 'pointer' : 'default' }}
                  >
                    {fine.bookTitle || 'Book Title Not Available'}
                  </h3>

                  <p className="fx-loan-dates">
                    ⚠️ Overdue: <strong>{fine.overdueDays} {fine.overdueDays === 1 ? 'day' : 'days'}</strong>
                  </p>

                  <p className="fx-loan-copies-count" style={{ color: fine.status === 'UNPAID' ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                    Fine: <strong>{formatCurrency(fine.fineAmount)}</strong>
                  </p>

                  {/* Badges / Chips */}
                  <div className="fx-loan-chips">
                    <span className="fx-loan-chip chip-offline">
                      Loan #{fine.bookLoanId}
                    </span>
                    <span className={`fx-loan-chip ${fine.status === 'PAID' ? 'chip-success' : 'chip-danger'}`}>
                      {fine.status}
                    </span>
                  </div>

                  {fine.createdAt && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Date: {formatDate(fine.createdAt)}
                    </div>
                  )}
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
          fetchFines()
          showToast('Book borrowed successfully!')
        }}
      />
    </div>
  )
}

export default MyFines
