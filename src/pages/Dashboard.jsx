import React from 'react'
import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'

const Dashboard = () => {
  const { user, logout } = useAuth()

  return (
    <div className="db-container">
      <header className="db-navbar">
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
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span>Library Portal</span>
        </div>
        <div className="db-user-nav">
          <span className="db-badge db-badge-user">Member</span>
          <button className="db-btn-logout" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="db-content">
        <div className="db-welcome-card">
          <div className="db-welcome-text">
            <h1>Hello, {user?.displayName || 'Reader'}!</h1>
            <p>Welcome back to your library space. Explore and borrow books.</p>
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
              My Profile
            </h3>
            <ul className="db-profile-list">
              <li className="db-profile-item">
                <span className="db-profile-label">Full Name</span>
                <span className="db-profile-value">{user?.displayName || 'Not provided'}</span>
              </li>
              <li className="db-profile-item">
                <span className="db-profile-label">Email Address</span>
                <span className="db-profile-value">{user?.email || 'N/A'}</span>
              </li>
              <li className="db-profile-item">
                <span className="db-profile-label">Role</span>
                <span className="db-profile-value">{user?.role || 'USER'}</span>
              </li>
              <li className="db-profile-item">
                <span className="db-profile-label">Phone Number</span>
                <span className="db-profile-value">{user?.phoneNumber || 'Not provided'}</span>
              </li>
              <li className="db-profile-item">
                <span className="db-profile-label">Birthday</span>
                <span className="db-profile-value">{user?.birthday || 'Not provided'}</span>
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
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Quick Search
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Search for books by title, author, or categories. Browse our catalog to borrow.
            </p>
            <button className="db-action-btn">
              Browse Books Catalog
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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              My Borrowed Books
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: '1.5' }}>
              You currently have 0 active book borrows. Stay on top of your due dates!
            </p>
            <button className="db-action-btn">
              View Borrow History
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
