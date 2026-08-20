import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import '../styles/dashboard.css'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  // State for dashboard stats
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClose = () => setShowDropdown(false)
    window.addEventListener('click', handleClose)
    return () => {
      window.removeEventListener('click', handleClose)
    }
  }, [])

  // Fetch dashboard stats on component mount
  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('/api/admin/dashboard')
      setStats(response.data)
    } catch (err) {
      console.error('Failed to load admin dashboard stats:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  };

  const handleCancelLoading = () => {
    setIsLoading(false)
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/books?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  // Get initials for user avatar
  const getInitials = () => {
    if (!user?.displayName) return 'AD'
    const parts = user.displayName.split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Date formatter helper (matches JavaFX DateUtil)
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

  return (
    <div className="db-container">
      {/* Top Navigation Bar (matching layout.fxml top toolbar) */}
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
          <form onSubmit={handleSearchSubmit} className="fx-search-form">
            <input
              type="text"
              className="fx-search-input"
              placeholder="Search book..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Main Admin Sidebar & Content Layout (matching layout.fxml left toolbar) */}
      <div className="db-admin-layout">
        {/* Left Toolbar/Sidebar */}
        <aside className="db-sidebar">
          <button className="db-sidebar-btn active" onClick={() => navigate('/admin/dashboard')}>
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

        {/* Dashboard Content Area */}
        <main className="db-content" style={{ margin: 0, padding: '2rem' }}>
          <div className="db-overview-section">
            <h1 className="db-section-title">Dashboard</h1>
            <h2 className="db-section-subtitle">Overview</h2>
            
            <div className="db-stats-grid">
              {/* Total Books */}
              <div className="db-stat-card">
                <div className="db-stat-info">
                  <span className="db-stat-label">Total Books</span>
                  <span className="db-stat-value">{stats ? stats.totalBooks : '-'}</span>
                </div>
                <div className="db-stat-icon-wrapper">
                  <div className="db-stat-icon-bg"></div>
                  <svg className="db-stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
              </div>

              {/* Active Books */}
              <div className="db-stat-card">
                <div className="db-stat-info">
                  <span className="db-stat-label">Active Books</span>
                  <span className="db-stat-value">{stats ? stats.activeBooks : '-'}</span>
                </div>
                <div className="db-stat-icon-wrapper">
                  <div className="db-stat-icon-bg"></div>
                  <svg className="db-stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </div>

              {/* Total Users */}
              <div className="db-stat-card">
                <div className="db-stat-info">
                  <span className="db-stat-label">Total Users</span>
                  <span className="db-stat-value">{stats ? stats.totalUsers : '-'}</span>
                </div>
                <div className="db-stat-icon-wrapper">
                  <div className="db-stat-icon-bg"></div>
                  <svg className="db-stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>

              {/* Total Categories */}
              <div className="db-stat-card">
                <div className="db-stat-info">
                  <span className="db-stat-label">Total Categories</span>
                  <span className="db-stat-value">{stats ? stats.totalCategories : '-'}</span>
                </div>
                <div className="db-stat-icon-wrapper">
                  <div className="db-stat-icon-bg"></div>
                  <svg className="db-stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message if API fails */}
          {error && <div style={{ color: 'var(--color-danger)', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

          {/* Split lists: Top Lent Books and Recent Loans (matching JavaFX GridPane layout) */}
          <div className="db-split-grid">
            {/* Top Lent Books Panel */}
            <div className="db-list-panel">
              <h2 className="db-section-subtitle">Top Lent Books</h2>
              <div className="db-list-container">
                {stats && stats.topLentBooks && stats.topLentBooks.length > 0 ? (
                  stats.topLentBooks.map((item) => (
                    <div key={`top-${item.bookId}`} className="db-list-item">
                      <img
                        className="db-list-img"
                        src={item.bookThumbnail || 'https://books.google.com/books/content?id=&printsec=frontcover&img=1&zoom=0&edge=curl&source=gbs_api'}
                        alt={item.bookTitle}
                        onError={(e) => { e.target.src = 'https://books.google.com/books/content?id=&printsec=frontcover&img=1&zoom=0&edge=curl&source=gbs_api' }}
                      />
                      <div className="db-list-info">
                        <span className="db-list-title" onClick={() => navigate(`/books?q=${encodeURIComponent(item.bookTitle)}`)}>
                          {item.bookTitle}
                        </span>
                        <span className="db-list-meta">
                          Total Copies Count: {item.loanCount}
                        </span>
                        <span className="db-chip db-chip-info">OFFLINE</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center', margin: 0 }}>No records found.</p>
                )}
              </div>
            </div>

            {/* Recent Loans Panel */}
            <div className="db-list-panel">
              <h2 className="db-section-subtitle">Recent Loans</h2>
              <div className="db-list-container">
                {stats && stats.recentLoans && stats.recentLoans.length > 0 ? (
                  stats.recentLoans.map((item) => (
                    <div key={`recent-${item.id}`} className="db-list-item">
                      <img
                        className="db-list-img"
                        src={item.bookThumbnail || 'https://books.google.com/books/content?id=&printsec=frontcover&img=1&zoom=0&edge=curl&source=gbs_api'}
                        alt={item.bookTitle}
                        onError={(e) => { e.target.src = 'https://books.google.com/books/content?id=&printsec=frontcover&img=1&zoom=0&edge=curl&source=gbs_api' }}
                      />
                      <div className="db-list-info">
                        <span className="db-list-title" onClick={() => navigate(`/books?q=${encodeURIComponent(item.bookTitle)}`)}>
                          {item.bookTitle}
                        </span>
                        <span className="db-list-meta">
                          Total Copies Count: {item.numCopies || 1}
                        </span>
                        <span className="db-chip db-chip-info" style={{ backgroundColor: item.type === 'ONLINE' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)', color: item.type === 'ONLINE' ? 'var(--color-success)' : 'var(--color-primary)' }}>
                          {item.type}
                        </span>
                        <span className="db-list-meta" style={{ marginTop: '0.2rem', fontSize: '0.8rem' }}>
                          Borrowed on: {formatDate(item.borrowDate)}
                        </span>
                        <span className="db-list-meta" style={{ fontSize: '0.8rem' }}>
                          Due Date: {formatDate(item.dueDate)}
                        </span>
                        <span className="db-list-meta" style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                          Borrowed by: {item.userDisplayName || item.userEmail}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center', margin: 0 }}>No active loans found.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Loading Overlay (matching layout.fxml loading wrapper) */}
      {isLoading && (
        <div className="db-loading-overlay">
          <div className="db-loading-card">
            <div className="db-spinner"></div>
            <span className="db-loading-text">Loading dashboard...</span>
            <button
              className="btn btn-default"
              style={{ padding: '0.25rem 1rem', fontSize: '0.85rem' }}
              onClick={handleCancelLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
