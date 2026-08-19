import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import '../styles/dashboard.css'

const AdminLoans = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // State for raw data from API
  const [loans, setLoans] = useState([])
  const [filteredLoans, setFilteredLoans] = useState([])

  // State for filters, search, and pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [validFilter, setValidFilter] = useState('All') // All, Active, Returned
  const [typeFilter, setTypeFilter] = useState('All')   // All, ONLINE, OFFLINE
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [isSilentRefreshing, setIsSilentRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchNavbarQuery, setSearchNavbarQuery] = useState('')
  const [notification, setNotification] = useState(null)

  // Modal States for Creating New Loan
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loanFormData, setLoanFormData] = useState({
    userId: '',
    bookId: '',
    type: 'OFFLINE',
    numCopies: 1
  })
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)

  // Debounce ref for search field (PauseTransition 0.5s in JavaFX)
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

  // Silent refresh database and fetch loans on mount
  useEffect(() => {
    const initializeData = async () => {
      setIsSilentRefreshing(true)
      try {
        // Silent database refresh to sync overdue statuses
        await api.post('/api/book-loans/refresh')
      } catch (err) {
        console.error('Failed to auto refresh database on mount:', err)
      } finally {
        setIsSilentRefreshing(false)
        fetchLoans()
      }
    }
    initializeData()
  }, [])

  // Perform search, filter, and pagination on client side whenever dependencies change
  useEffect(() => {
    applyClientSideFilters()
  }, [loans, searchQuery, validFilter, typeFilter, page, pageSize])

  const fetchLoans = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('/api/book-loans')
      setLoans(response.data || [])
    } catch (err) {
      console.error('Failed to load book loans:', err)
      setError('Failed to fetch book loans list. Please check server connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const applyClientSideFilters = () => {
    let temp = [...loans]
    const search = searchQuery.toLowerCase().trim()
    if (search) {
      temp = temp.filter(loan => 
        (loan.userDisplayName && loan.userDisplayName.toLowerCase().includes(search)) ||
        (loan.userEmail && loan.userEmail.toLowerCase().includes(search)) ||
        (loan.bookTitle && loan.bookTitle.toLowerCase().includes(search)) ||
        String(loan.userId).includes(search) ||
        String(loan.bookId).includes(search)
      )
    }

    // Valid Status filter (Active: valid=true, Returned: valid=false)
    if (validFilter === 'Active') {
      temp = temp.filter(loan => loan.valid === true)
    } else if (validFilter === 'Returned') {
      temp = temp.filter(loan => loan.valid === false)
    }

    // Loan Type filter (ONLINE / OFFLINE)
    if (typeFilter !== 'All') {
      temp = temp.filter(loan => loan.type === typeFilter)
    }

    setTotalElements(temp.length)

    // Client side pagination slice
    const startIndex = page * pageSize
    const paginated = temp.slice(startIndex, startIndex + pageSize)
    setFilteredLoans(paginated)
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

  // Handle page size dropdown
  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value))
    setPage(0)
  }

  // Navigation handlers
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

  // Formatter helpers
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

  const getInitials = () => {
    if (!user?.displayName) return 'AD'
    const parts = user.displayName.split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Return Book Action Handler
  const handleReturnBook = async (loan) => {
    const confirmReturn = window.confirm(`Are you sure you want to return the book "${loan.bookTitle}" borrowed by ${loan.userDisplayName || loan.userEmail}?`)
    if (!confirmReturn) return

    try {
      await api.post(`/api/book-loans/${loan.id}/return`)
      showToast(`Successfully returned book "${loan.bookTitle}"!`)
      fetchLoans() // Refresh table list
    } catch (err) {
      console.error('Failed to return book:', err)
      const errorMsg = err.response?.data?.message || 'Failed to return book. Please try again.'
      alert(`Error: ${errorMsg}`)
    }
  }

  // Open Create Loan modal
  const handleCreateLoanClick = () => {
    setLoanFormData({
      userId: '',
      bookId: '',
      type: 'OFFLINE',
      numCopies: 1
    })
    setShowCreateModal(true)
  }

  // Handle Submit of New Loan form
  const handleCreateLoanSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!loanFormData.userId || !loanFormData.bookId) {
      alert('Please fill in both User ID and Book ID.')
      return
    }

    const payload = {
      userId: Number(loanFormData.userId),
      bookId: Number(loanFormData.bookId),
      type: loanFormData.type,
      numCopies: loanFormData.type === 'OFFLINE' ? Number(loanFormData.numCopies) : 0
    }

    const confirmAdd = window.confirm(`Are you sure you want to create a new loan record for Book ID ${payload.bookId} to User ID ${payload.userId}?`)
    if (!confirmAdd) return

    setIsSubmitLoading(true)
    try {
      await api.post('/api/book-loans', payload)
      showToast('Successfully created new book loan!')
      setShowCreateModal(false)
      fetchLoans() // Reload datatable
    } catch (err) {
      console.error('Failed to create new loan:', err)
      const errorMsg = err.response?.data?.message || 'Failed to create loan record. Verify if User ID and Book ID exist and are valid.'
      alert(`Error: ${errorMsg}`)
    } finally {
      setIsSubmitLoading(false)
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
              placeholder="Search book..."
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
                {getInitials()}
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

          <button className="db-sidebar-btn active" onClick={() => navigate('/admin/loans')}>
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
          <div className="admin-books-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 className="admin-books-title">Manage Book Loans</h1>
            {isSilentRefreshing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div className="db-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                <span>Syncing statuses...</span>
              </div>
            )}
          </div>

          {/* Action Row - Search, Filters, buttons and pagination */}
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
              <span className="admin-control-label">Valid Status:</span>
              <select
                className="admin-select-filter"
                value={validFilter}
                onChange={(e) => { setValidFilter(e.target.value); setPage(0); }}
              >
                <option value="All">All</option>
                <option value="Active">Active Loans</option>
                <option value="Returned">Returned</option>
              </select>
            </div>

            <div className="admin-control-group">
              <span className="admin-control-label">Loan Type:</span>
              <select
                className="admin-select-filter"
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
              >
                <option value="All">All</option>
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>

            <button className="admin-btn-primary" onClick={handleCreateLoanClick}>
              New Loan
            </button>

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
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading book loans datatable...</p>
              </div>
            ) : filteredLoans.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No book loan records found.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User ID</th>
                    <th>Reader</th>
                    <th>Book ID</th>
                    <th>Book Cover</th>
                    <th>Book Title</th>
                    <th>Borrow Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Type</th>
                    <th>Copies</th>
                    <th>Status</th>
                    <th>Valid</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((loan) => {
                    const initials = loan.userDisplayName 
                      ? (loan.userDisplayName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()) 
                      : 'U'
                    
                    return (
                      <tr key={loan.id}>
                        <td style={{ fontWeight: '600' }}>{loan.id}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{loan.userId}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="fx-user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem', background: '#3b82f6', color: '#fff', border: 'none' }}>
                              {initials}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: '500' }}>{loan.userDisplayName || 'User'}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{loan.userEmail}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{loan.bookId}</td>
                        <td>
                          {loan.bookThumbnail ? (
                            <img
                              src={loan.bookThumbnail}
                              alt={loan.bookTitle}
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
                        <td style={{ fontWeight: '500', minWidth: '150px' }}>{loan.bookTitle}</td>
                        <td>{formatDate(loan.borrowDate)}</td>
                        <td>{formatDate(loan.dueDate)}</td>
                        <td>{formatDate(loan.returnDate)}</td>
                        <td>
                          <span className="db-chip db-chip-info" style={{ backgroundColor: loan.type === 'ONLINE' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)', color: loan.type === 'ONLINE' ? 'var(--color-success)' : 'var(--color-primary)' }}>
                            {loan.type}
                          </span>
                        </td>
                        <td>{loan.numCopies}</td>
                        <td>
                          <span className={`admin-badge-status-${(loan.status || 'BORROWED').toLowerCase()}`}>
                            {loan.status}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-badge-${loan.valid ? 'active' : 'inactive'}`}>
                            {loan.valid ? 'True' : 'False'}
                          </span>
                        </td>
                        <td>
                          {loan.valid && (
                            <div className="admin-table-actions">
                              <button
                                className="admin-btn-action admin-btn-action-edit"
                                style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)', background: 'transparent' }}
                                onClick={() => handleReturnBook(loan)}
                              >
                                Return
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

      {/* Modal Creating New Loan */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Book Loan</h2>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleCreateLoanSubmit}>
              <div className="modal-body" style={{ gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">User ID (Reader ID) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Enter numerical User ID"
                    required
                    value={loanFormData.userId}
                    onChange={(e) => setLoanFormData({ ...loanFormData, userId: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Book ID *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Enter Book ID"
                    required
                    value={loanFormData.bookId}
                    onChange={(e) => setLoanFormData({ ...loanFormData, bookId: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Loan Type *</label>
                  <select
                    className="form-select"
                    value={loanFormData.type}
                    onChange={(e) => setLoanFormData({ ...loanFormData, type: e.target.value })}
                  >
                    <option value="OFFLINE">OFFLINE (Physical shelf borrow)</option>
                    <option value="ONLINE">ONLINE (E-book read)</option>
                  </select>
                </div>
                
                {loanFormData.type === 'OFFLINE' && (
                  <div className="form-group">
                    <label className="form-label">Number of Copies *</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      required
                      value={loanFormData.numCopies}
                      onChange={(e) => setLoanFormData({ ...loanFormData, numCopies: Math.max(1, Number(e.target.value)) })}
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="catalog-btn-primary" disabled={isSubmitLoading}>
                  Create Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminLoans
