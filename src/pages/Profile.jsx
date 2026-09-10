import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import '../styles/dashboard.css'
import '../styles/catalog.css'

const Profile = () => {
  const { user, setUser, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Profile fields state
  const [displayName, setDisplayName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [birthday, setBirthday] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSavingInfo, setIsSavingInfo] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Password change state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Loan history state
  const [loans, setLoans] = useState([])
  const [isLoadingLoans, setIsLoadingLoans] = useState(true)

  // Topbar dropdown & search
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClose = () => setShowDropdown(false)
    window.addEventListener('click', handleClose)
    return () => window.removeEventListener('click', handleClose)
  }, [])

  // Sync user data to local form states
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      setPhoneNumber(user.phoneNumber || '')
      setBirthday(user.birthday || '')
      setPhotoUrl(user.photoUrl || '')
    }
  }, [user])

  // Fetch loans for personal loan history table
  useEffect(() => {
    const fetchUserLoans = async () => {
      try {
        setIsLoadingLoans(true)
        const response = await api.get('/api/book-loans/my-loans')
        setLoans(Array.isArray(response.data) ? response.data : [])
      } catch (err) {
        console.error('Failed to fetch user loans:', err)
      } finally {
        setIsLoadingLoans(false)
      }
    }
    fetchUserLoans()
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/books?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  // Handle Avatar file selection with 120x120 JPEG Canvas compression -> Save directly to DB via PUT /api/auth/me
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn một tệp hình ảnh (.png, .jpg, .jpeg, .webp)', 'error')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas')
          const size = 80
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext('2d')

          const minSide = Math.min(img.width, img.height)
          const sx = (img.width - minSide) / 2
          const sy = (img.height - minSide) / 2
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size)

          const base64Image = canvas.toDataURL('image/jpeg', 0.65)

          setIsUploadingAvatar(true)
          const response = await api.put('/api/auth/me/avatar', { photoUrl: base64Image })
          setUser(response.data)
          setPhotoUrl(response.data.photoUrl || '')
          showToast('Cập nhật ảnh đại diện thành công!', 'success')
        } catch (err) {
          console.error('Error processing or saving avatar:', err.response?.data || err)
          const errorMsg = err.response?.data?.message || err.message || 'Không thể lưu ảnh đại diện vào cơ sở dữ liệu.'
          showToast(errorMsg, 'error')
        } finally {
          setIsUploadingAvatar(false)
        }
      }
      img.onerror = () => {
        showToast('Không thể giải mã tệp ảnh này.', 'error')
      }
      img.src = event.target.result
    }
    reader.onerror = () => {
      showToast('Không thể đọc tệp đã chọn.', 'error')
    }
    reader.readAsDataURL(file)

    if (e.target) {
      e.target.value = ''
    }
  }

  // Remove avatar
  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true)
    try {
      const response = await api.put('/api/auth/me/avatar', { photoUrl: '' })
      setUser(response.data)
      setPhotoUrl('')
      showToast('Đã xóa ảnh đại diện thành công!', 'success')
    } catch (err) {
      console.error('Failed to remove avatar from backend:', err.response?.data || err)
      const errorMsg = err.response?.data?.message || err.message || 'Lỗi khi xóa ảnh đại diện.'
      showToast(errorMsg, 'error')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Save personal info
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) {
      showToast('Họ và tên không được để trống.', 'error')
      return
    }

    setIsSavingInfo(true)
    try {
      const response = await api.put('/api/auth/me', {
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        birthday,
        photoUrl
      })
      setUser(response.data)
      setIsEditing(false)
      showToast('Cập nhật thông tin thành công!', 'success')
    } catch (err) {
      console.error('Failed to update profile:', err)
      const msg = err.response?.data?.message || 'Cập nhật thông tin thất bại.'
      showToast(msg, 'error')
    } finally {
      setIsSavingInfo(false)
    }
  }

  // Update password
  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!oldPassword) {
      showToast('Vui lòng nhập mật khẩu hiện tại.', 'error')
      return
    }
    if (newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự.', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp.', 'error')
      return
    }

    setIsUpdatingPassword(true)
    try {
      await api.put('/api/auth/me/password', {
        oldPassword,
        newPassword
      })
      showToast('Cập nhật mật khẩu thành công!', 'success')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error('Failed to update password:', err)
      const msg = err.response?.data?.message || 'Mật khẩu cũ không chính xác.'
      showToast(msg, 'error')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    } catch {
      return dateStr
    }
  }

  const getInitials = () => {
    if (!user?.displayName) return 'US'
    const parts = user.displayName.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="db-container">
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 2000,
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-hover)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: '600',
            backgroundColor: toast.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
            color: '#ffffff'
          }}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
      />

      {/* Top Navigation Bar - 100% Synchronized */}
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
            {isAdmin && (
              <Link to="/admin/dashboard" className="fx-nav-link" style={{ color: 'var(--color-secondary)', fontWeight: '600' }}>
                Admin Console
              </Link>
            )}
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
                title={user.displayName || 'Profile'}
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
                    <span className="fx-dropdown-name">{user.displayName || 'Người dùng'}</span>
                    <span className="fx-dropdown-email">{user.email || ''}</span>
                    <span className={`db-badge ${isAdmin ? 'db-badge-admin' : 'db-badge-user'}`} style={{ marginTop: '0.25rem', display: 'inline-block' }}>
                      {isAdmin ? 'Admin' : 'Member'}
                    </span>
                  </div>

                  <Link to="/profile" className="fx-dropdown-item" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setShowDropdown(false)}>
                    👤 Hồ sơ cá nhân
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

      {/* Main Body Layout */}
      <div className={isAdmin ? 'db-admin-layout' : 'db-container'} style={!isAdmin ? { flex: 1 } : {}}>
        {/* If Admin, render the consistent db-sidebar */}
        {isAdmin && (
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
              <button className="db-sidebar-btn active" onClick={() => navigate('/profile')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Hồ sơ cá nhân
              </button>
            </div>
          </aside>
        )}

        {/* Profile Content Area */}
        <main className="db-content" style={{ margin: isAdmin ? 0 : '0 auto', padding: '2rem', flex: 1, maxWidth: '1100px', boxSizing: 'border-box' }}>
          {/* Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 className="db-section-title">Hồ sơ cá nhân</h1>
          </div>

          {/* 2-Column Responsive Layout */}
          <div className="profile-page-grid">
            {/* Left Column: Avatar & Security */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Avatar Card */}
              <div className="profile-card" style={{ alignItems: 'center', textAlign: 'center' }}>
                <div
                  className="profile-avatar-wrapper"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  title="Nhấp để đổi ảnh đại diện"
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt="Avatar" className="profile-avatar-img" />
                  ) : (
                    <span>{getInitials()}</span>
                  )}
                  <div className="profile-avatar-overlay">
                    <span>📷 Đổi ảnh</span>
                  </div>
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                  {displayName || 'Người dùng'}
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  {isAdmin ? 'Quản trị viên Thư viện (Administrator)' : 'Độc giả thành viên (Library Member)'}
                </span>

                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                  <button
                    type="button"
                    className="admin-btn-default"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    style={{ flex: 1, fontSize: '0.85rem' }}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? '⏳ Đang xử lý...' : '📁 Tải ảnh từ máy'}
                  </button>
                  {photoUrl && (
                    <button
                      type="button"
                      className="profile-avatar-delete-btn"
                      onClick={handleRemoveAvatar}
                      title="Xóa ảnh đại diện"
                      aria-label="Xóa ảnh đại diện"
                      disabled={isUploadingAvatar}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Password Card */}
              <div className="profile-card">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🔒 Đổi mật khẩu
                </h3>
                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      className="form-input"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mật khẩu mới</label>
                    <input
                      type="password"
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                  <button
                    type="submit"
                    className="catalog-btn-primary"
                    disabled={isUpdatingPassword}
                    style={{ marginTop: '0.5rem', width: '100%', fontSize: '0.85rem' }}
                  >
                    {isUpdatingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Personal Information & Loan History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Personal Info Card */}
              <div className="profile-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🪪 Thông tin tài khoản
                  </h3>
                  {!isEditing ? (
                    <button
                      className="admin-btn-default"
                      onClick={() => setIsEditing(true)}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                    >
                      ✏️ Chỉnh sửa
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="admin-btn-default"
                        onClick={() => {
                          setIsEditing(false)
                          if (user) {
                            setDisplayName(user.displayName || '')
                            setPhoneNumber(user.phoneNumber || '')
                            setBirthday(user.birthday || '')
                          }
                        }}
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                      >
                        Hủy
                      </button>
                      <button
                        className="catalog-btn-primary"
                        onClick={handleSaveProfile}
                        disabled={isSavingInfo}
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                      >
                        {isSavingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Họ và tên</label>
                    <input
                      type="text"
                      className="form-input"
                      disabled={!isEditing}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Địa chỉ Email</label>
                    <input
                      type="email"
                      className="form-input"
                      disabled
                      value={user?.email || ''}
                      style={{ opacity: 0.7, cursor: 'not-allowed' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      type="tel"
                      className="form-input"
                      disabled={!isEditing}
                      value={phoneNumber}
                      placeholder="Chưa cập nhật"
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vai trò hệ thống</label>
                    <div
                      className="form-input"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.8, cursor: 'default' }}
                    >
                      <span>{isAdmin ? 'Quản trị viên (ADMIN)' : 'Thành viên (USER)'}</span>
                      <span className="db-badge db-badge-user" style={{ fontSize: '0.7rem' }}>Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan History Card */}
              <div className="profile-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📜 Lịch sử mượn sách gần đây
                  </h3>
                  <button
                    className="admin-btn-default"
                    onClick={() => navigate(isAdmin ? '/admin/loans' : '/loans')}
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                  >
                    Xem tất cả ➔
                  </button>
                </div>

                <div className="admin-table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none', maxHeight: '350px' }}>
                  {isLoadingLoans ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Đang tải danh sách mượn sách...
                    </div>
                  ) : loans && loans.length > 0 ? (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Tác phẩm</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Ngày mượn</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Hạn trả</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Định dạng</th>
                          <th style={{ whiteSpace: 'nowrap' }}>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loans.slice(0, 5).map((loan) => (
                          <tr key={loan.id}>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{loan.bookTitle}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mã phiếu: #{loan.id}</div>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(loan.borrowDate)}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(loan.dueDate)}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span style={{ fontSize: '0.85rem' }}>
                                {loan.type === 'ONLINE' ? '💻 E-Book' : '📖 Sách giấy'}
                              </span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span className={
                                loan.status === 'RETURNED'
                                  ? 'admin-badge-status-returned'
                                  : loan.status === 'OVERDUE'
                                  ? 'admin-badge-status-overdue'
                                  : 'admin-badge-status-borrowed'
                              }>
                                {loan.status === 'RETURNED' ? 'Đã trả' : loan.status === 'OVERDUE' ? 'Quá hạn' : 'Đang mượn'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Chưa có phiếu mượn sách nào được ghi nhận.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Profile
