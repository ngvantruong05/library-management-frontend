import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Dashboard from '../pages/Dashboard'
import AdminDashboard from '../pages/AdminDashboard'
import AdminBooks from '../pages/AdminBooks'
import AdminLoans from '../pages/AdminLoans'
import BookCatalog from '../pages/BookCatalog'
import Categories from '../pages/Categories'
import MyFavorites from '../pages/MyFavorites'
import MyLoans from '../pages/MyLoans'
import MyFines from '../pages/MyFines'

// Guards against logged-out users accessing private pages
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading system...</p>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Guards against non-admin users accessing admin pages
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading system...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return user?.role === 'ADMIN' ? children : <Navigate to="/dashboard" replace />
}

// Guards against logged-in users accessing public pages (login/register)
const PublicRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading system...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return user?.role === 'ADMIN' ? (
      <Navigate to="/admin/dashboard" replace />
    ) : (
      <Navigate to="/dashboard" replace />
    )
  }

  return children
}

const AppRoutes = () => {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={<Dashboard />}
      />
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/books"
        element={
          <AdminRoute>
            <AdminBooks />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/loans"
        element={
          <AdminRoute>
            <AdminLoans />
          </AdminRoute>
        }
      />
      <Route
        path="/books"
        element={<BookCatalog />}
      />
      <Route
        path="/categories"
        element={<Categories />}
      />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <MyFavorites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/loans"
        element={
          <ProtectedRoute>
            <MyLoans />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fines"
        element={
          <ProtectedRoute>
            <MyFines />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          user?.role === 'ADMIN' ? (
            <Navigate to="/admin/dashboard" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
    </Routes>
  )
}

// Inline styles for simple loader
const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  backgroundColor: '#f3f4f6',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const spinnerStyle = {
  width: '40px',
  height: '40px',
  border: '4px solid #e5e7eb',
  borderTop: '4px solid #3b82f6',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
}

// Add CSS spin animation
const styleSheet = document.styleSheets[0]
if (styleSheet) {
  try {
    styleSheet.insertRule(`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `, styleSheet.cssRules.length)
  } catch {
    // Ignore if stylesheet is not accessible
  }
}

export default AppRoutes
