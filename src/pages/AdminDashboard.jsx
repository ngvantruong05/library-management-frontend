import React from 'react'
import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'

const AdminDashboard = () => {
  const { user, logout } = useAuth()

  return (
    <div className="db-container">
      <header className="db-navbar" style={{ borderBottom: '1px solid rgba(245, 158, 11, 0.15)' }}>
        <div className="db-logo">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Library Console
          </span>
        </div>
        <div className="db-user-nav">
          <span className="db-badge db-badge-admin">Admin</span>
          <button className="db-btn-logout" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="db-content">
        <div className="db-welcome-card" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(20, 15, 10, 0.4) 100%)', borderColor: 'rgba(245, 158, 11, 0.1)' }}>
          <div className="db-welcome-text">
            <h1 style={{ color: '#fbbf24' }}>System Control, {user?.displayName || 'Administrator'}!</h1>
            <p>Manage inventory, users, and borrowing transactions.</p>
          </div>
        </div>

        <div className="db-grid">
          <div className="db-card">
            <h3 className="db-card-title">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Admin Details
            </h3>
            <ul className="db-profile-list">
              <li className="db-profile-item">
                <span className="db-profile-label">Name</span>
                <span className="db-profile-value">{user?.displayName || 'Admin'}</span>
              </li>
              <li className="db-profile-item">
                <span className="db-profile-label">Email Address</span>
                <span className="db-profile-value">{user?.email || 'N/A'}</span>
              </li>
              <li className="db-profile-item">
                <span className="db-profile-label">System Role</span>
                <span className="db-profile-value" style={{ color: '#fbbf24' }}>{user?.role || 'ADMIN'}</span>
              </li>
              <li className="db-profile-item">
                <span className="db-profile-label">Status</span>
                <span className="db-profile-value" style={{ color: '#10b981' }}>ONLINE</span>
              </li>
            </ul>
          </div>

          <div className="db-card">
            <h3 className="db-card-title">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
              Inventory Management
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Add new books, edit existing catalog items, adjust copies count, and manage genres/categories.
            </p>
            <button className="db-action-btn" style={{ borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fbbf24' }}>
              Manage Books & Categories
            </button>
          </div>

          <div className="db-card">
            <h3 className="db-card-title">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Borrow Transactions
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Approve new loan requests, process returns, handle overdue notices, and view borrowing statistics.
            </p>
            <button className="db-action-btn" style={{ borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fbbf24' }}>
              Review Loan Requests
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
