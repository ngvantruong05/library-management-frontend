import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import '../styles/dashboard.css'

const AdminFines = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // State for raw data from API
  const [fines, setFines] = useState([])
  const [filteredFines, setFilteredFines] = useState([])

  // State for filters, search, and pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All') // All, UNPAID, PENDING, PAID
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchNavbarQuery, setSearchNavbarQuery] = useState('')
  const [notification, setNotification] = useState(null)

  // Debounce ref for search field
  const searchTimeoutRef = useRef(null)

  // Show Toast notification
  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

  // Handle closing avatar dropdown clicking outside
  useEffect(() => {
    const handleClose = () => setShowDropdown(false)
    window.addEventListener('click', handleClose)
    return () => {
      window.removeEventListener('click', handleClose)
    }
  }, [])

  // Fetch fines on mount
  useEffect(() => {
    fetchFines()
  }, [])

  // Apply filters on client side
  useEffect(() => {
    applyFilters()
  }, [fines, searchQuery, statusFilter, page, pageSize])

  const fetchFines = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('/api/fines')
      setFines(response.data || [])
    } catch (err) {
      console.error('Failed to load fines:', err)
      setError('Failed to fetch fines list. Make sure you are logged in as an Admin.')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let temp = [...fines]
    const search = searchQuery.toLowerCase().trim()
    
    // 1. Search (Reader name, Email, Book title, ID)
    if (search) {
      temp = temp.filter(f => 
        (f.userDisplayName && f.userDisplayName.toLowerCase().includes(search)) ||
        (f.userEmail && f.userEmail.toLowerCase().includes(search)) ||
        (f.bookTitle && f.bookTitle.toLowerCase().includes(search)) ||
        String(f.id).includes(search) ||
        String(f.bookLoanId).includes(search)
      )
    }

    // 2. Status Filter (UNPAID / PENDING / PAID)
    if (statusFilter !== 'All') {
      temp = temp.filter(f => f.status === statusFilter)
    }

    setTotalElements(temp.length)

    // 3. Slice for client-side pagination
    const startIndex = page * pageSize
    const paginated = temp.slice(startIndex, startIndex + pageSize)
    setFilteredFines(paginated)
  }

  // Handle search field input
  const handleSearchChange = (e) => {
    const val = e.target.value
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(val)
      setPage(0) // Reset to first page
    }, 500)
  }

  // Handle pagination size change
  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value))
    setPage(0)
  }

  const handleNextPage = () => {
    if ((page + 1) * pageSize < totalElements) {
      setPage(prev => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (page > 0) {
      setPage(prev => prev - 1)
    }
  }

  // Top navbar search submit
  const handleNavbarSearchSubmit = (e) => {
    e.preventDefault()
    if (searchNavbarQuery.trim()) {
      setSearchQuery(searchNavbarQuery)
      setPage(0)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    } catch (e) {
      return dateStr
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0)
  }

  // Confirm Payment Action Handler
  const handleConfirmPayment = async (fine) => {
    const confirmPay = window.confirm(`Confirm payment of ${formatCurrency(fine.fineAmount)} for "${fine.bookTitle}" from reader "${fine.userDisplayName || fine.userEmail}"?`)
    if (!confirmPay) return

    try {
      await api.post(`/api/fines/${fine.id}/pay`)
      showToast(`Successfully confirmed payment for Fine ID ${fine.id}!`)
      fetchFines() // Reload data
    } catch (err) {
      console.error('Failed to pay fine:', err)
      const errorMsg = err.response?.data?.message || 'Failed to confirm payment. Please try again.'
      alert(`Error: ${errorMsg}`)
    }
  }

  return (
    <div className="db-container">
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`notification-banner ${notification.type === 'error' ? 'notification-error' : 'notification-success'}`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="fx-navbar">
        <div className="fx-navbar-left">
          <Link to="/dashboard" className="fx-logo-container">
            <div className="fx-logo-icon">
              <div className="fx-logo-bar fx-logo-bar-1"></div>
              <div className="fx-logo-bar fx-logo-bar-2"></div>
              <div className="fx-logo-bar fx-logo-bar-3"></div>
            </div>
            <span className="fx-logo-text">Library Manager</span>
          </Link>
        </div>

        <div className="fx-navbar-middle">
          <form onSubmit={handleNavbarSearchSubmit} className="fx-search-form">
            <input
              type="text"
              className="fx-search-input"
              placeholder="Search fine..."
              value={searchNavbarQuery}
              onChange={(e) => setSearchNavbarQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="fx-navbar-right">
          <nav className="fx-nav-links">
            <Link to="/dashboard" className="fx-nav-link">Home</Link>
            <Link to="/books" className="fx-nav-link">All Books</Link>
            <Link to="/categories" className="fx-nav-link">Categories</Link>
            <Link to="/loans" className="fx-nav-link">My Loans</Link>
            <Link to="/favorites" className="fx-nav-link">My Favorites</Link>
          </nav>

          {user && (
            <div className="fx-user-menu-container">
              <div
                className="fx-user-avatar"
                style={{ border: '2px solid var(--color-primary)' }}
                title={user.displayName || 'Admin'}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDropdown(!showDropdown)
                }}
              >
                {getInitials(user.displayName)}
              </div>

              {showDropdown && (
                <div className="fx-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  <div className="fx-dropdown-header">
                    <span className="fx-dropdown-name">{user.displayName || 'Administrator'}</span>
                    <span className="fx-dropdown-email">{user.email || ''}</span>
                    <span className="db-badge db-badge-admin" style={{ marginTop: '0.25rem', display: 'inline-block' }}>Admin</span>
                  </div>

                  <div className="fx-dropdown-item" style={{ cursor: 'default' }}>
                    <span>Theme:</span>
                    <button className="fx-theme-switch-btn" onClick={toggleTheme}>
                      {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
                    </button>
                  </div>

                  <button className="fx-dropdown-item logout-item" onClick={logout}>
                    Log out ➔
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Admin Sidebar & Content Layout */}
      <div className="admin-books-layout">
        {/* Left Sidebar */}
        <aside className="db-sidebar">
          <button className="db-sidebar-btn" onClick={() => navigate('/admin/dashboard')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Dashboard
          </button>
          
          <button className="db-sidebar-btn" onClick={() => navigate('/admin/books')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Books
          </button>

          <button className="db-sidebar-btn" onClick={() => navigate('/admin/loans')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Loans
          </button>

          <button className="db-sidebar-btn" onClick={() => navigate('/admin/users')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Users
          </button>

          <button className="db-sidebar-btn active" onClick={() => navigate('/admin/fines')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Fines
          </button>

          <button className="db-sidebar-btn" onClick={() => navigate('/admin/categories')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Categories
          </button>
        </aside>

        {/* Content Area */}
        <main className="admin-books-content">
          <div className="admin-books-header">
            <h1 className="admin-books-title">Manage Fines</h1>
          </div>

          {/* Action Row - Search, Filters, and pagination */}
          <div className="admin-controls-row">
            <div className="admin-control-group">
              <span className="admin-control-label">Search:</span>
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search reader, book title..."
                defaultValue={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <div className="admin-control-group">
              <span className="admin-control-label">Status:</span>
              <select
                className="admin-select-filter"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              >
                <option value="All">All Fines</option>
                <option value="UNPAID">UNPAID</option>
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
              </select>
            </div>

            {/* Pagination Controls Right Aligned */}
            <div className="admin-pagination-right">
              <span className="admin-pagination-text">
                Showing {totalElements > 0 ? page * pageSize + 1 : 0} to{' '}
                {Math.min((page + 1) * pageSize, totalElements)} of {totalElements}
              </span>

              <select
                className="admin-select-filter"
                style={{ width: '80px' }}
                value={pageSize}
                onChange={handlePageSizeChange}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              <button
                className="admin-btn-default"
                onClick={handlePrevPage}
                disabled={page === 0 || isLoading}
              >
                Previous
              </button>
              <button
                className="admin-btn-default"
                onClick={handleNextPage}
                disabled={(page + 1) * pageSize >= totalElements || isLoading}
              >
                Next
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{ color: 'var(--color-danger)', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          {/* Main Datatable */}
          <div className="admin-table-container">
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
                <div className="db-spinner"></div>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading fines datatable...</p>
              </div>
            ) : filteredFines.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No fine records found.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Fine ID</th>
                    <th>Loan ID</th>
                    <th>Reader</th>
                    <th>Book ID</th>
                    <th>Book Cover</th>
                    <th>Book Title</th>
                    <th>Overdue Days</th>
                    <th>Fine Amount</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFines.map((fine) => {
                    const initials = getInitials(fine.userDisplayName)
                    
                    return (
                      <tr key={fine.id}>
                        <td style={{ fontWeight: '600' }}>{fine.id}</td>
                        <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{fine.bookLoanId}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="fx-user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem', background: '#3b82f6', color: '#fff', border: 'none' }}>
                              {initials}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: '500' }}>{fine.userDisplayName || 'User'}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fine.userEmail}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{fine.bookId}</td>
                        <td>
                          {fine.bookThumbnail ? (
                            <img
                              src={fine.bookThumbnail}
                              alt={fine.bookTitle}
                              className="admin-table-thumb"
                              style={{ width: '40px', height: '52px' }}
                              onError={(e) => { e.target.src = 'https://books.google.com/books/content?id=&printsec=frontcover&img=1&zoom=0&edge=curl&source=gbs_api' }}
                            />
                          ) : (
                            <div className="admin-table-placeholder-thumb" style={{ width: '40px', height: '52px' }}>
                              <span style={{ fontSize: '0.5rem' }}>No Cover</span>
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: '500', minWidth: '150px' }}>{fine.bookTitle}</td>
                        <td>{fine.overdueDays} {fine.overdueDays === 1 ? 'day' : 'days'}</td>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(fine.fineAmount)}</td>
                        <td>
                          <span className={`admin-badge-status-${(fine.status || 'UNPAID').toLowerCase()}`}>
                            {fine.status}
                          </span>
                        </td>
                        <td>{formatDate(fine.createdAt)}</td>
                        <td>
                          {fine.status !== 'PAID' && (
                            <div className="admin-table-actions">
                              <button
                                className="admin-btn-action admin-btn-action-edit"
                                style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)', background: 'transparent', minWidth: '95px' }}
                                onClick={() => handleConfirmPayment(fine)}
                              >
                                Confirm Pay
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminFines
