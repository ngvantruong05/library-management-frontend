import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import '../styles/dashboard.css'

const AdminBooks = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // State for books table & pagination
  const [books, setBooks] = useState([])
  const [filteredBooks, setFilteredBooks] = useState([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchNavbarQuery, setSearchNavbarQuery] = useState('')

  // Debouncing search query input (PauseTransition 0.5s in JavaFX)
  const searchTimeoutRef = useRef(null)

  // Handle closing avatar dropdown clicking outside
  useEffect(() => {
    const handleClose = () => setShowDropdown(false)
    window.addEventListener('click', handleClose)
    return () => {
      window.removeEventListener('click', handleClose)
    }
  }, [])

  // Fetch books on mount or when page/pageSize/searchQuery changes
  useEffect(() => {
    fetchBooks()
  }, [page, pageSize, searchQuery])

  // Apply active status local filter whenever books or activeFilter changes (matches JavaFX onFilter)
  useEffect(() => {
    if (activeFilter === 'All') {
      setFilteredBooks(books)
    } else {
      const isTrue = activeFilter === 'True'
      const filtered = books.filter(b => b.activated === isTrue)
      setFilteredBooks(filtered)
    }
  }, [books, activeFilter])

  const fetchBooks = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = {
        page: page,
        size: pageSize,
        sortBy: 'id',
        sortDir: 'desc'
      }
      if (searchQuery.trim()) {
        params.q = searchQuery.trim()
      }

      const response = await api.get('/api/books', { params })
      const data = response.data

      if (data && Array.isArray(data.content)) {
        setBooks(data.content)
        setTotalElements(data.totalElements || 0)
      } else if (Array.isArray(data)) {
        // Fallback if API returns list directly without pagination DTO
        setBooks(data)
        setTotalElements(data.length)
      } else {
        setBooks([])
        setTotalElements(0)
      }
    } catch (err) {
      console.error('Failed to load books for admin:', err)
      setError('Failed to load book data. Please check connection.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle typing search with 500ms delay
  const handleSearchChange = (e) => {
    const val = e.target.value
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(val)
      setPage(0) // Reset to first page on search
    }, 500)
  }

  // Handle page size change
  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value))
    setPage(0) // Reset to first page
  }

  // Next page action
  const handleNextPage = () => {
    if ((page + 1) * pageSize < totalElements) {
      setPage(prev => prev + 1)
    }
  }

  // Previous page action
  const handlePrevPage = () => {
    if (page > 0) {
      setPage(prev => prev - 1)
    }
  }

  // Search from top navbar
  const handleNavbarSearchSubmit = (e) => {
    e.preventDefault()
    if (searchNavbarQuery.trim()) {
      setSearchQuery(searchNavbarQuery)
      setPage(0)
    }
  }

  // Date formatter (ymdToDmy helper)
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

  const handleCreateBook = () => {}

  const handleEditBook = (book) => {}

  const handleDeleteBook = (book) => {}

  const handleManageCopies = (book) => {}

  return (
    <div className="db-container">
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
        {/* Left Toolbar/Sidebar */}
        <aside className="db-sidebar">
          <button className="db-sidebar-btn" onClick={() => navigate('/admin/dashboard')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Dashboard
          </button>
          
          <button className="db-sidebar-btn active" onClick={() => navigate('/admin/books')}>
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
            <h1 className="admin-books-title">Manage Books</h1>
          </div>

          {/* Action Row - Search, Filters, New Button, Pagination Controls */}
          <div className="admin-controls-row">
            <div className="admin-control-group">
              <span className="admin-control-label">Search:</span>
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search by title, isbn, author..."
                defaultValue={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <div className="admin-control-group">
              <span className="admin-control-label">Active:</span>
              <select
                className="admin-select-filter"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="True">True</option>
                <option value="False">False</option>
              </select>
            </div>

            <button className="admin-btn-primary" onClick={handleCreateBook}>
              New Book
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
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading books datatable...</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No books found matching criteria.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>ISBN</th>
                    <th>Thumbnail</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Publisher</th>
                    <th>Authors</th>
                    <th>Categories</th>
                    <th>Price</th>
                    <th>Discount</th>
                    <th>Currency</th>
                    <th>Pages</th>
                    <th>Language</th>
                    <th>Active</th>
                    <th>Published At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => (
                    <tr key={book.id}>
                      <td style={{ fontWeight: '600' }}>{book.id}</td>
                      <td>{book.isbn}</td>
                      <td>
                        {book.thumbnail ? (
                          <img
                            src={book.thumbnail}
                            alt={book.title}
                            className="admin-table-thumb"
                            onError={(e) => { e.target.src = 'https://books.google.com/books/content?id=&printsec=frontcover&img=1&zoom=0&edge=curl&source=gbs_api' }}
                          />
                        ) : (
                          <div className="admin-table-placeholder-thumb">
                            <span style={{ fontSize: '0.6rem' }}>No Img</span>
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: '500', minWidth: '150px' }}>{book.title}</td>
                      <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={book.description}>
                        {book.description || '-'}
                      </td>
                      <td>{book.publisher?.name || '-'}</td>
                      <td>
                        <div className="admin-chip-container">
                          {book.authors && book.authors.length > 0 ? (
                            book.authors.map((a) => (
                              <span key={a.id} className="admin-table-chip" title={a.name}>
                                {a.name}
                              </span>
                            ))
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-chip-container">
                          {book.categories && book.categories.length > 0 ? (
                            book.categories.map((c) => (
                              <span key={c.id} className="admin-table-chip" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: 'var(--color-success)' }} title={c.name}>
                                {c.name}
                              </span>
                            ))
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                      </td>
                      <td>{book.price !== undefined ? book.price.toFixed(2) : '0.00'}</td>
                      <td>{book.discountPrice !== undefined ? book.discountPrice.toFixed(2) : '0.00'}</td>
                      <td>{book.currencyCode || 'VND'}</td>
                      <td>{book.pageCount || '-'}</td>
                      <td>{book.language || 'English'}</td>
                      <td>
                        <span className={`admin-badge-${book.activated ? 'active' : 'inactive'}`}>
                          {book.activated ? 'True' : 'False'}
                        </span>
                      </td>
                      <td>{formatDate(book.publishedDate)}</td>
                      <td>
                        <div className="admin-table-actions">
                          <button
                            className="admin-btn-action admin-btn-action-edit"
                            onClick={() => handleEditBook(book)}
                          >
                            Edit
                          </button>
                          <button
                            className="admin-btn-action admin-btn-action-copies"
                            onClick={() => handleManageCopies(book)}
                          >
                            Copies
                          </button>
                          <button
                            className="admin-btn-action admin-btn-action-delete"
                            onClick={() => handleDeleteBook(book)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminBooks
