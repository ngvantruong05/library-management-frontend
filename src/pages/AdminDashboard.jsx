import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import '../styles/dashboard.css'
import '../styles/catalog.css'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // State for dashboard stats
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loansList, setLoansList] = useState([])

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClose = () => setShowDropdown(false)
    window.addEventListener('click', handleClose)
    return () => {
      window.removeEventListener('click', handleClose)
    }
  }, [])

  // Robust date parser for String ISO, timestamp, and Spring Boot Jackson Array formats
  const parseDate = (val) => {
    if (!val) return null
    if (Array.isArray(val)) {
      return new Date(val[0], val[1] - 1, val[2], val[3] || 0, val[4] || 0)
    }
    if (typeof val === 'string' || typeof val === 'number') {
      const d = new Date(val)
      if (!isNaN(d.getTime())) return d
    }
    return null
  }

  // Calculate real borrowing trends from loans data
  const calculateTrends = (loansList) => {
    const dayLabels = [
      { key: 1, label: 'T2', full: 'Thứ Hai' },
      { key: 2, label: 'T3', full: 'Thứ Ba' },
      { key: 3, label: 'T4', full: 'Thứ Tư' },
      { key: 4, label: 'T5', full: 'Thứ Năm' },
      { key: 5, label: 'T6', full: 'Thứ Sáu' },
      { key: 6, label: 'T7', full: 'Thứ Bảy' },
      { key: 0, label: 'CN', full: 'Chủ Nhật' }
    ]

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 }
    let total = 0

    if (Array.isArray(loansList) && loansList.length > 0) {
      loansList.forEach(loan => {
        const d = parseDate(loan.borrowDate)
        if (d) {
          const day = d.getDay() // 0 = Sunday, 1 = Monday, ...
          const num = Number(loan.numCopies) > 0 ? Number(loan.numCopies) : 1
          counts[day] = (counts[day] || 0) + num
          total += num
        }
      })
    }

    const maxVal = Math.max(...Object.values(counts))
    let peakDay = '-'
    let peakCount = 0

    const bars = dayLabels.map(({ key, label, full }) => {
      const count = counts[key] || 0
      if (count > peakCount) {
        peakCount = count
        peakDay = `${full} (${count} lượt)`
      }
      // If 0 loans, flat 3px line. If >0 loans, proportionally scaled height
      const height = (count > 0 && maxVal > 0)
        ? `${Math.round((count / maxVal) * 82 + 18)}%`
        : '3px'
      return { label, full, count, height, hasData: count > 0 }
    })

    if (peakCount === 0) peakDay = 'Chưa có'
    const avgPerDay = total > 0 ? (total / 7).toFixed(1) : '0'

    return {
      bars,
      summary: {
        total,
        peakDay,
        avgPerDay
      }
    }
  }

  // Calculate trends dynamically with useMemo so it syncs immediately with data
  const trendData = useMemo(() => {
    const list = loansList.length > 0 ? loansList : (stats?.recentLoans || [])
    return calculateTrends(list)
  }, [loansList, stats])

  // Fetch dashboard stats and all loans on component mount
  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [dashboardRes, allLoansRes] = await Promise.allSettled([
        api.get('/api/admin/dashboard'),
        api.get('/api/book-loans')
      ])

      let dashboardData = null
      if (dashboardRes.status === 'fulfilled' && dashboardRes.value?.data) {
        dashboardData = dashboardRes.value.data
        setStats(dashboardData)
      } else {
        throw new Error('Failed to load dashboard data')
      }

      // Store loans list
      const loansData = (allLoansRes.status === 'fulfilled' && Array.isArray(allLoansRes.value?.data))
        ? allLoansRes.value.data
        : (dashboardData?.recentLoans || [])
      setLoansList(loansData)
    } catch (err) {
      console.error('Failed to load admin dashboard stats:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelLoading = () => {
    setIsLoading(false)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/books?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  // Get initials for user avatar
  const getInitials = () => {
    if (!user?.displayName) return 'AD'
    const parts = user.displayName.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Date formatter helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return dateStr
    }
  }

  return (
    <div className="db-container">
      {/* Top Navigation Bar - 100% Synchronized with App Shell */}
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
              placeholder="Search book, member..."
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

      {/* Main Admin Sidebar & Content Layout - 100% Synchronized */}
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

          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <button className="db-sidebar-btn" onClick={() => navigate('/profile')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Hồ sơ cá nhân
            </button>
          </div>
        </aside>

        {/* Dashboard Content Area */}
        <main className="db-content" style={{ margin: 0, padding: '2rem', flex: 1, overflowX: 'hidden' }}>
          {/* Overview Top Title & Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h1 className="db-section-title">Dashboard Overview</h1>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Chào mừng trở lại, {user?.displayName || 'Administrator'}. Dưới đây là tổng quan thư viện.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="admin-btn-default" onClick={fetchStats} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                🔄 Làm mới
              </button>
              <button className="catalog-btn-primary" onClick={() => navigate('/admin/loans')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ➕ Mượn sách trực tiếp
              </button>
            </div>
          </div>

          {/* Error Message if API fails */}
          {error && (
            <div style={{ color: 'var(--color-danger)', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          {/* 4 KPI Stat Cards */}
          <div className="db-stats-grid">
            {/* Total Books */}
            <div className="db-stat-card">
              <div className="db-stat-info">
                <span className="db-stat-label">Total Books</span>
                <span className="db-stat-value">{stats ? stats.totalBooks?.toLocaleString() : '-'}</span>
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
                <span className="db-stat-value">{stats ? stats.activeBooks?.toLocaleString() : '-'}</span>
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
                <span className="db-stat-value">{stats ? stats.totalUsers?.toLocaleString() : '-'}</span>
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
                <span className="db-stat-label">Categories</span>
                <span className="db-stat-value">{stats ? stats.totalCategories?.toLocaleString() : '-'}</span>
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

          {/* Bento Grid: 30-Day Trends Bar Chart & Recent Activity Feed */}
          <div className="db-bento-grid">
            {/* Borrowing Trends Chart */}
            <div className="db-panel-card">
              <div className="db-chart-header">
                <div>
                  <h2 className="db-chart-title">Xu hướng mượn sách</h2>
                  <div className="db-chart-subtitle">Lưu lượng mượn sách 30 ngày gần đây</div>
                </div>
              </div>

              <div className="db-chart-body">
                <div className="db-chart-grid-lines">
                  <div className="db-chart-grid-line"></div>
                  <div className="db-chart-grid-line"></div>
                  <div className="db-chart-grid-line"></div>
                  <div className="db-chart-grid-line"></div>
                </div>

                {trendData.bars.map((bar) => (
                  <div key={`col-${bar.label}`} className="db-chart-col">
                    <div
                      className={`db-chart-bar ${!bar.hasData ? 'db-chart-bar-empty' : ''}`}
                      style={{
                        height: bar.height,
                        backgroundColor: bar.hasData ? 'var(--color-primary)' : 'var(--border-color)',
                        borderColor: bar.hasData ? 'var(--color-primary)' : 'var(--border-color)',
                        opacity: bar.hasData ? 1 : 0.35
                      }}
                    >
                      <div
                        key={`tip-${bar.label}-${bar.count}`}
                        className="db-chart-tooltip notranslate"
                        translate="no"
                      >
                        <span className="notranslate" translate="no">{bar.count}</span> lượt mượn
                      </div>
                    </div>
                    <span className="db-chart-label notranslate" translate="no">{bar.label}</span>
                  </div>
                ))}
              </div>

              {/* 3-Metric Summary Grid to match height with Recent Activity */}
              <div className="db-chart-summary-grid">
                <div className="db-chart-summary-item">
                  <span className="db-chart-summary-label">Tổng lượt mượn</span>
                  <span className="db-chart-summary-value notranslate" translate="no">{trendData.summary.total} lượt</span>
                </div>
                <div className="db-chart-summary-item">
                  <span className="db-chart-summary-label">Ngày cao điểm</span>
                  <span className="db-chart-summary-value notranslate" translate="no" style={{ fontSize: '0.92rem' }}>{trendData.summary.peakDay}</span>
                </div>
                <div className="db-chart-summary-item">
                  <span className="db-chart-summary-label">Trung bình ngày</span>
                  <span className="db-chart-summary-value notranslate" translate="no">{trendData.summary.avgPerDay} lượt</span>
                </div>
              </div>

              <div className="db-chart-footer-note notranslate" translate="no">
                <span>📊</span>
                <span>
                  Dữ liệu đồng bộ trực tiếp từ hệ thống ({trendData.summary.total} phiếu mượn).
                </span>
              </div>
            </div>

            {/* Recent Activity Feed (Connected to real stats.recentLoans data) */}
            <div className="db-panel-card">
              <div className="db-chart-header" style={{ marginBottom: '1rem' }}>
                <div>
                  <h2 className="db-chart-title">Hoạt động gần đây</h2>
                  <div className="db-chart-subtitle">Hoạt động mượn trả từ hệ thống thực tế</div>
                </div>
              </div>

              <div className="db-activity-list">
                {stats && stats.recentLoans && stats.recentLoans.length > 0 ? (
                  stats.recentLoans.slice(0, 5).map((loan) => (
                    <div key={`act-${loan.id}`} className="db-activity-item">
                      <div className={`db-activity-icon ${
                        loan.status === 'RETURNED' ? 'db-activity-icon-green' :
                        loan.status === 'OVERDUE' ? 'db-activity-icon-red' : 'db-activity-icon-blue'
                      }`}>
                        {loan.status === 'RETURNED' ? '↩️' : loan.status === 'OVERDUE' ? '⚠️' : '📖'}
                      </div>
                      <div>
                        <div className="db-activity-text">
                          Độc giả <strong>{loan.userDisplayName || loan.userEmail}</strong>{' '}
                          {loan.status === 'RETURNED' ? 'đã trả sách' : loan.status === 'OVERDUE' ? 'quá hạn trả sách' : 'đã mượn sách'}{' '}
                          <strong>"{loan.bookTitle}"</strong>.
                        </div>
                        <div className="db-activity-time">
                          {formatDate(loan.borrowDate)} {loan.type === 'ONLINE' ? '• E-Book' : '• Tại quầy'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1.5rem 0', textAlign: 'center' }}>
                    Chưa có hoạt động mượn trả nào được ghi nhận gần đây.
                  </div>
                )}
              </div>

              <button
                className="admin-btn-default"
                onClick={() => navigate('/admin/loans')}
                style={{ width: '100%', marginTop: '1rem', fontSize: '0.85rem' }}
              >
                Xem tất cả phiếu mượn ➔
              </button>
            </div>
          </div>

          {/* Split lists: Top Lent Books and Recent Loans */}
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
                  <p style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center', margin: 0 }}>No records found.</p>
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
                  <p style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center', margin: 0 }}>No active loans found.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="db-loading-overlay">
          <div className="db-loading-card">
            <div className="db-spinner"></div>
            <span className="db-loading-text">Loading dashboard...</span>
            <button
              className="admin-btn-default"
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
