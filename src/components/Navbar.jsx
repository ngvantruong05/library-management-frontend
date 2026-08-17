import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const Navbar = ({ onSearch }) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [localQuery, setLocalQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClose = () => setShowDropdown(false)
    window.addEventListener('click', handleClose)
    return () => {
      window.removeEventListener('click', handleClose)
    }
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(localQuery)
    } else {
      navigate(`/books?q=${encodeURIComponent(localQuery)}`)
    }
  }

  // Get initials for user avatar
  const getInitials = () => {
    if (!user?.displayName) return 'AN'
    const parts = user.displayName.split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const toggleDropdown = (e) => {
    e.stopPropagation()
    setShowDropdown(!showDropdown)
  }

  return (
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
            value={localQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value)
              if (onSearch && location.pathname === '/books') {
                onSearch(e.target.value)
              }
            }}
          />
        </form>
      </div>

      <div className="fx-navbar-right">
        <nav className="fx-nav-links">
          <Link to="/dashboard" className={`fx-nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Home</Link>
          <Link to="/books" className={`fx-nav-link ${location.pathname === '/books' ? 'active' : ''}`}>All Books</Link>
          <Link to="/categories" className={`fx-nav-link ${location.pathname.startsWith('/categories') ? 'active' : ''}`}>Categories</Link>
          <Link to="/loans" className={`fx-nav-link ${location.pathname === '/loans' ? 'active' : ''}`}>My Loans</Link>
          <Link to="/fines" className={`fx-nav-link ${location.pathname === '/fines' ? 'active' : ''}`}>My Fines</Link>
          <Link to="/favorites" className={`fx-nav-link ${location.pathname === '/favorites' ? 'active' : ''}`}>My Favorites</Link>
          {user?.role === 'ADMIN' && (
            <Link to="/admin/dashboard" className={`fx-nav-link ${location.pathname === '/admin/dashboard' ? 'active' : ''}`} style={{ color: 'var(--color-secondary)', fontWeight: '600' }}>Admin Console</Link>
          )}
        </nav>
        
        {user ? (
          <div className="fx-user-menu-container">
            <div 
              className="fx-user-avatar" 
              title={user.displayName || 'User Profile'}
              onClick={toggleDropdown}
            >
              {getInitials()}
            </div>
            
            {showDropdown && (
              <div className="fx-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                <div className="fx-dropdown-header">
                  <span className="fx-dropdown-name">{user.displayName || 'Người dùng'}</span>
                  <span className="fx-dropdown-email">{user.email || ''}</span>
                </div>
                
                {user?.role === 'ADMIN' && (
                  <Link to="/admin/dashboard" className="fx-dropdown-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                    🔑 Admin Console
                  </Link>
                )}

                <div className="fx-dropdown-item" style={{ cursor: 'default' }}>
                  <span>Giao diện:</span>
                  <button className="fx-theme-switch-btn" onClick={toggleTheme}>
                    {theme === 'light' ? '☀️ Sáng' : '🌙 Tối'}
                  </button>
                </div>
                
                <button className="fx-dropdown-item logout-item" onClick={logout}>
                  Đăng xuất ➔
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="fx-login-btn-nav" style={{
            padding: '0.4rem 1.1rem',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            borderRadius: '6px',
            fontFamily: 'Poppins',
            fontWeight: '500',
            textDecoration: 'none',
            fontSize: '0.85rem',
            transition: 'background-color 0.2s',
            border: 'none',
            cursor: 'pointer'
          }}>
            Login
          </Link>
        )}
      </div>
    </header>
  )
}

export default Navbar
