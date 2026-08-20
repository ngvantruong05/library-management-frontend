import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import '../styles/dashboard.css'

const AdminUsers = () => {
  const { user: currentUser, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // State for raw data from API
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])

  // State for filters, search, and pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')      // All, ADMIN, USER
  const [statusFilter, setStatusFilter] = useState('All')  // All, Active, Blocked
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchNavbarQuery, setSearchNavbarQuery] = useState('')
  const [notification, setNotification] = useState(null)

  // Modal States for Add/Edit User
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null) // null = Create, userObj = Edit
  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    birthday: '',
    phoneNumber: '',
    photoUrl: '',
    role: 'USER',
    disabled: false
  })
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)

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

  // Fetch users on mount
  useEffect(() => {
    fetchUsers()
  }, [])

  // Apply filters on client side
  useEffect(() => {
    applyFilters()
  }, [users, searchQuery, roleFilter, statusFilter, page, pageSize])

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('/api/users')
      setUsers(response.data || [])
    } catch (err) {
      console.error('Failed to load users:', err)
      setError('Failed to fetch users list. Make sure you are logged in as an Admin.')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let temp = [...users]
    const search = searchQuery.toLowerCase().trim()
    
    // 1. Search (DisplayName, Email, Phone, ID)
    if (search) {
      temp = temp.filter(u => 
        (u.displayName && u.displayName.toLowerCase().includes(search)) ||
        (u.email && u.email.toLowerCase().includes(search)) ||
        (u.phoneNumber && u.phoneNumber.toLowerCase().includes(search)) ||
        String(u.id).includes(search)
      )
    }

    // 2. Role Filter (ADMIN / USER)
    if (roleFilter !== 'All') {
      temp = temp.filter(u => u.role === roleFilter)
    }

    // 3. Status Filter (Active / Blocked)
    if (statusFilter === 'Active') {
      temp = temp.filter(u => u.disabled === false)
    } else if (statusFilter === 'Blocked') {
      temp = temp.filter(u => u.disabled === true)
    }

    setTotalElements(temp.length)

    // 4. Slice for client-side pagination
    const startIndex = page * pageSize
    const paginated = temp.slice(startIndex, startIndex + pageSize)
    setFilteredUsers(paginated)
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

  // Open modal for Creating User
  const handleCreateClick = () => {
    setEditingUser(null)
    setUserFormData({
      email: '',
      password: '',
      displayName: '',
      birthday: '',
      phoneNumber: '',
      photoUrl: '',
      role: 'USER',
      disabled: false
    })
    setShowModal(true)
  }

  // Open modal for Editing User
  const handleEditClick = (userObj) => {
    setEditingUser(userObj)
    setUserFormData({
      email: userObj.email,
      password: '', // Leave blank for edit unless resetting
      displayName: userObj.displayName || '',
      birthday: userObj.birthday || '',
      phoneNumber: userObj.phoneNumber || '',
      photoUrl: userObj.photoUrl || '',
      role: userObj.role || 'USER',
      disabled: userObj.disabled || false
    })
    setShowModal(true)
  }

  // Submit form data to create or update User
  const handleFormSubmit = async (e) => {
    e.preventDefault()

    if (!editingUser && (!userFormData.email || !userFormData.password)) {
      alert('Email and Password are required to create a new user.')
      return
    }

    const payload = { ...userFormData }
    if (editingUser) {
      // For editing, if password is blank, we can omit or send empty
      if (!payload.password.trim()) {
        delete payload.password
      }
    }

    const actionText = editingUser ? 'update' : 'create'
    const confirmSubmit = window.confirm(`Are you sure you want to ${actionText} this user account?`)
    if (!confirmSubmit) return

    setIsSubmitLoading(true)
    try {
      if (editingUser) {
        // Update user
        await api.put(`/api/users/${editingUser.id}`, payload)
        showToast(`Successfully updated user "${payload.displayName || payload.email}"!`)
      } else {
        // Create user
        await api.post('/api/users', payload)
        showToast(`Successfully created new user account!`)
      }
      setShowModal(false)
      fetchUsers() // Reload data
    } catch (err) {
      console.error('Failed to submit user form:', err)
      const errorMsg = err.response?.data?.message || `Failed to ${actionText} user account. Please check inputs.`
      alert(`Error: ${errorMsg}`)
    } finally {
      setIsSubmitLoading(false)
    }
  }

  // Delete User Action Handler
  const handleDeleteUser = async (userObj) => {
    if (userObj.id === currentUser.id) {
      alert('You cannot delete your own Administrator account!')
      return
    }

    const confirmDelete = window.confirm(`WARNING: Are you sure you want to permanently delete user "${userObj.displayName || userObj.email}"? All their data will be lost.`)
    if (!confirmDelete) return

    try {
      await api.delete(`/api/users/${userObj.id}`)
      showToast(`Successfully deleted user "${userObj.displayName || userObj.email}"!`)
      fetchUsers() // Reload
    } catch (err) {
      console.error('Failed to delete user:', err)
      const errorMsg = err.response?.data?.message || 'Failed to delete user. Make sure they do not have active book loans.'
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
              placeholder="Search user..."
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

          {currentUser && (
            <div className="fx-user-menu-container">
              <div
                className="fx-user-avatar"
                style={{ border: '2px solid var(--color-primary)' }}
                title={currentUser.displayName || 'Admin'}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDropdown(!showDropdown)
                }}
              >
                {getInitials(currentUser.displayName)}
              </div>

              {showDropdown && (
                <div className="fx-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  <div className="fx-dropdown-header">
                    <span className="fx-dropdown-name">{currentUser.displayName || 'Administrator'}</span>
                    <span className="fx-dropdown-email">{currentUser.email || ''}</span>
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

          <button className="db-sidebar-btn active" onClick={() => navigate('/admin/users')}>
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

        {/* Content Area */}
        <main className="admin-books-content">
          <div className="admin-books-header">
            <h1 className="admin-books-title">Manage Users</h1>
          </div>

          {/* Action Row - Search, Filters, buttons and pagination */}
          <div className="admin-controls-row">
            <div className="admin-control-group">
              <span className="admin-control-label">Search:</span>
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search name, email, phone..."
                defaultValue={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <div className="admin-control-group">
              <span className="admin-control-label">Role:</span>
              <select
                className="admin-select-filter"
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
              >
                <option value="All">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="USER">USER</option>
              </select>
            </div>

            <div className="admin-control-group">
              <span className="admin-control-label">Status:</span>
              <select
                className="admin-select-filter"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Accounts</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>

            <button className="admin-btn-primary" onClick={handleCreateClick}>
              Create User
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
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading users datatable...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No user accounts found.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Avatar</th>
                    <th>Email</th>
                    <th>Display Name</th>
                    <th>Phone Number</th>
                    <th>Birthday</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const initials = getInitials(u.displayName)
                    
                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: '600' }}>{u.id}</td>
                        <td>
                          {u.photoUrl ? (
                            <img
                              src={u.photoUrl}
                              alt={u.displayName}
                              className="admin-table-thumb"
                              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          ) : (
                            <div className="fx-user-avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem', background: '#3b82f6', color: '#fff', border: 'none' }}>
                              {initials}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: '500' }}>{u.email}</td>
                        <td>{u.displayName || '-'}</td>
                        <td>{u.phoneNumber || '-'}</td>
                        <td>{u.birthday || '-'}</td>
                        <td>
                          <span className={`db-badge ${u.role === 'ADMIN' ? 'db-badge-admin' : 'db-badge-member'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-badge-${u.disabled ? 'inactive' : 'active'}`}>
                            {u.disabled ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td>{formatDate(u.createdAt)}</td>
                        <td>
                          <div className="admin-table-actions">
                            <button
                              className="admin-btn-action admin-btn-action-edit"
                              onClick={() => handleEditClick(u)}
                            >
                              Edit
                            </button>
                            <button
                              className="admin-btn-action admin-btn-action-delete"
                              disabled={u.id === currentUser.id}
                              onClick={() => handleDeleteUser(u)}
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

      {/* Modal Add/Edit User */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User Account' : 'Create New User Account'}</h2>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body" style={{ gap: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter email address"
                    required
                    disabled={!!editingUser} // Email is read-only for editing
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder={editingUser ? 'Enter new password only to reset' : 'Enter password'}
                    required={!editingUser}
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter display name"
                    value={userFormData.displayName}
                    onChange={(e) => setUserFormData({ ...userFormData, displayName: e.target.value })}
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Birthday</label>
                    <input
                      type="date"
                      className="form-input"
                      value={userFormData.birthday}
                      onChange={(e) => setUserFormData({ ...userFormData, birthday: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter phone number"
                      value={userFormData.phoneNumber}
                      onChange={(e) => setUserFormData({ ...userFormData, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Avatar Photo URL</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter image URL"
                    value={userFormData.photoUrl}
                    onChange={(e) => setUserFormData({ ...userFormData, photoUrl: e.target.value })}
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                  <div className="form-group">
                    <label className="form-label">System Role *</label>
                    <select
                      className="form-select"
                      required
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginTop: '1.5rem' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>
                      <input
                        type="checkbox"
                        checked={userFormData.disabled}
                        onChange={(e) => setUserFormData({ ...userFormData, disabled: e.target.checked })}
                        style={{ width: '18px', height: '18px' }}
                      />
                      Block Account (Disabled)
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="catalog-btn-primary" disabled={isSubmitLoading}>
                  {isSubmitLoading ? 'Submitting...' : editingUser ? 'Save & Update' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
