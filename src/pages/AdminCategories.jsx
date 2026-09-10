import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import '../styles/dashboard.css'

const AdminCategories = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Data states
  const [categories, setCategories] = useState([])
  const [books, setBooks] = useState([])
  const [filteredCategories, setFilteredCategories] = useState([])

  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)

  // UI States
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchNavbarQuery, setSearchNavbarQuery] = useState('')
  const [notification, setNotification] = useState(null)

  // Modal States
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null) // null = Create, categoryObj = Edit
  const [formData, setFormData] = useState({ name: '' })
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)

  // Ref for search debounce
  const searchTimeoutRef = useRef(null)

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    const handleClose = () => setShowDropdown(false)
    window.addEventListener('click', handleClose)
    return () => {
      window.removeEventListener('click', handleClose)
    }
  }, [])

  // Fetch categories and books on mount
  useEffect(() => {
    fetchData()
  }, [])

  // Re-apply filter and pagination when categories list, search query, or page parameters change
  useEffect(() => {
    applyFiltersAndPagination()
  }, [categories, books, searchQuery, page, pageSize])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [catRes, bookRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/books') // To count books per category
      ])
      setCategories(catRes.data || [])
      
      const fetchedBooks = Array.isArray(bookRes.data?.content) 
        ? bookRes.data.content 
        : (bookRes.data || [])
      setBooks(fetchedBooks)
    } catch (err) {
      console.error('Failed to load category dashboard data:', err)
      setError('Failed to fetch categories list. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate book count map
  const getBookCountForCategory = (catId) => {
    return books.filter(b => b.categories?.some(c => c.id === catId)).length
  }

  const applyFiltersAndPagination = () => {
    let temp = [...categories]
    const search = searchQuery.toLowerCase().trim()

    // 1. Client-side search
    if (search) {
      temp = temp.filter(cat => 
        cat.name && cat.name.toLowerCase().includes(search) || 
        String(cat.id).includes(search)
      )
    }

    setTotalElements(temp.length)

    // 2. Client-side pagination slice
    const startIndex = page * pageSize
    const paginated = temp.slice(startIndex, startIndex + pageSize)
    setFilteredCategories(paginated)
  }

  const handleSearchChange = (e) => {
    const val = e.target.value
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(val)
      setPage(0) // Reset to page 1
    }, 500)
  }

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

  const handleNavbarSearchSubmit = (e) => {
    e.preventDefault()
    if (searchNavbarQuery.trim()) {
      setSearchQuery(searchNavbarQuery)
      setPage(0)
    }
  }

  const getInitials = () => {
    if (!user?.displayName) return 'AD'
    const parts = user.displayName.split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // --- CRUD ACTIONS ---

  const handleCreateClick = () => {
    setEditingCategory(null)
    setFormData({ name: '' })
    setShowModal(true)
  }

  const handleEditClick = (category) => {
    setEditingCategory(category)
    setFormData({ name: category.name || '' })
    setShowModal(true)
  }

  const handleModalSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSubmitLoading(true)
    try {
      if (editingCategory) {
        // Edit Category
        const confirmUpdate = window.confirm(`Are you sure you want to update category "${editingCategory.name}" to "${formData.name}"?`)
        if (!confirmUpdate) {
          setIsSubmitLoading(false)
          return
        }

        await api.put(`/api/categories/${editingCategory.id}`, {
          id: editingCategory.id,
          name: formData.name.trim()
        })
        showToast(`Successfully updated category to "${formData.name}"`)
      } else {
        // Create Category
        const confirmCreate = window.confirm(`Are you sure you want to create category "${formData.name}"?`)
        if (!confirmCreate) {
          setIsSubmitLoading(false)
          return
        }

        await api.post('/api/categories', {
          name: formData.name.trim()
        })
        showToast(`Successfully created category "${formData.name}"`)
      }

      setShowModal(false)
      fetchData()
    } catch (err) {
      console.error('Failed to save category:', err)
      const msg = err.response?.data?.message || 'Failed to save category. Please check inputs.'
      alert(`Error: ${msg}`)
    } finally {
      setIsSubmitLoading(false)
    }
  }

  const handleDeleteClick = async (category) => {
    const bookCount = getBookCountForCategory(category.id)
    let confirmMsg = `Are you sure you want to delete category "${category.name}"?`
    if (bookCount > 0) {
      confirmMsg += `\nWarning: There are ${bookCount} book(s) associated with this category.`
    }

    const confirmDelete = window.confirm(confirmMsg)
    if (!confirmDelete) return

    try {
      await api.delete(`/api/categories/${category.id}`)
      showToast(`Successfully deleted category "${category.name}"`)
      fetchData()
    } catch (err) {
      console.error('Failed to delete category:', err)
      alert('Failed to delete category. It might be linked to existing books in the system.')
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
              placeholder="Search category..."
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
                style={{
                  border: '2px solid var(--color-primary)',
                  backgroundImage: user.photoUrl ? `url(${user.photoUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  cursor: 'pointer'
                }}
                title={user.displayName || 'Admin'}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDropdown(!showDropdown)
                }}
              >
                {!user.photoUrl && getInitials()}
              </div>

              {showDropdown && (
                <div className="fx-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  <div className="fx-dropdown-header">
                    <span className="fx-dropdown-name">{user.displayName || 'Administrator'}</span>
                    <span className="fx-dropdown-email">{user.email || ''}</span>
                    <span className="db-badge db-badge-admin" style={{ marginTop: '0.25rem', display: 'inline-block' }}>Admin</span>
                  </div>

                  <Link to="/profile" className="fx-dropdown-item" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setShowDropdown(false)}>
                    👤 Hồ sơ cá nhân & Avatar
                  </Link>

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

          <button className="db-sidebar-btn" onClick={() => navigate('/admin/fines')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Fines
          </button>

          <button className="db-sidebar-btn active" onClick={() => navigate('/admin/categories')}>
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
            <h1 className="admin-books-title">Manage Categories</h1>
          </div>

          {/* Action Row - Search, New Button, Pagination Controls */}
          <div className="admin-controls-row">
            <div className="admin-control-group">
              <span className="admin-control-label">Search:</span>
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search category by ID or name..."
                defaultValue={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <button className="admin-btn-primary" onClick={handleCreateClick}>
              New Category
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
            <div style={{ color: 'var(--color-danger)', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {/* Main Datatable */}
          <div className="admin-table-container">
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
                <div className="db-spinner"></div>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading categories datatable...</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No categories found.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category Name</th>
                    <th>Associated Books</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => {
                    const bookCount = getBookCountForCategory(category.id)
                    return (
                      <tr key={category.id}>
                        <td style={{ fontWeight: '600', width: '80px' }}>{category.id}</td>
                        <td style={{ fontWeight: '500' }}>{category.name}</td>
                        <td>
                          <span className="admin-table-chip" style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: 'var(--color-primary)', fontWeight: '600' }}>
                            {bookCount} books
                          </span>
                        </td>
                        <td style={{ width: '180px' }}>
                          <div className="admin-table-actions">
                            <button
                              className="admin-btn-action admin-btn-action-edit"
                              onClick={() => handleEditClick(category)}
                            >
                              Edit
                            </button>
                            <button
                              className="admin-btn-action admin-btn-action-delete"
                              onClick={() => handleDeleteClick(category)}
                            >
                              Delete
                            </button>
                          </div>
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

      {/* Add / Edit Category Dialog/Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'Create New Category'}</h2>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleModalSubmit}>
              <div className="modal-body">
                <div className="form-group form-group-full">
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Artificial Intelligence"
                    required
                    autoFocus
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    disabled={isSubmitLoading}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="catalog-btn-primary"
                  disabled={isSubmitLoading}
                >
                  {isSubmitLoading ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCategories
