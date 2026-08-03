import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

const Register = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    birthday: '',
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [formErrors, setFormErrors] = useState({})
  
  const { register, isLoading } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.displayName.trim()) {
      errors.displayName = 'Display name is required'
    }

    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email address is invalid'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (formData.phoneNumber && !/^[0-9+()#.\s-]{8,20}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Phone number is invalid'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    
    if (!validateForm()) return

    const { confirmPassword: _, ...registerData } = formData

    const result = await register(registerData)
    if (result.success) {
      if (result.role === 'ADMIN') {
        navigate('/admin/dashboard')
      } else {
        navigate('/dashboard')
      }
    } else {
      setErrorMsg(result.error)
    }
  }

  return (
    <div className="auth-body">
      {/* Background blobs for aesthetics */}
      <div className="auth-bg-blob auth-bg-blob-1"></div>
      <div className="auth-bg-blob auth-bg-blob-2"></div>

      <div className="auth-card" style={{ maxWidth: '500px', padding: '2.5rem 2rem' }}>
        <div className="auth-header">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join the Library Management System</p>
        </div>

        {errorMsg && (
          <div className="auth-alert">
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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="displayName">
              FULL NAME *
            </label>
            <input
              id="displayName"
              type="text"
              className="auth-input"
              placeholder="John Doe"
              value={formData.displayName}
              onChange={handleChange}
              disabled={isLoading}
            />
            {formErrors.displayName && (
              <span className="auth-error-text">{formErrors.displayName}</span>
            )}
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="email">
              EMAIL ADDRESS *
            </label>
            <input
              id="email"
              type="email"
              className="auth-input"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
            {formErrors.email && (
              <span className="auth-error-text">{formErrors.email}</span>
            )}
          </div>

          <div className="auth-form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="auth-label" htmlFor="phoneNumber">
                PHONE NUMBER
              </label>
              <input
                id="phoneNumber"
                type="tel"
                className="auth-input"
                placeholder="0912345678"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={isLoading}
              />
              {formErrors.phoneNumber && (
                <span className="auth-error-text">{formErrors.phoneNumber}</span>
              )}
            </div>
            <div>
              <label className="auth-label" htmlFor="birthday">
                BIRTHDAY
              </label>
              <input
                id="birthday"
                type="date"
                className="auth-input"
                value={formData.birthday}
                onChange={handleChange}
                disabled={isLoading}
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div className="auth-form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="auth-label" htmlFor="password">
                PASSWORD *
              </label>
              <div className="auth-input-container">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="At least 6 chars"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  className="auth-toggle-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.password && (
                <span className="auth-error-text">{formErrors.password}</span>
              )}
            </div>
            <div>
              <label className="auth-label" htmlFor="confirmPassword">
                CONFIRM *
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
              {formErrors.confirmPassword && (
                <span className="auth-error-text">{formErrors.confirmPassword}</span>
              )}
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading} style={{ marginTop: '1rem' }}>
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '1.25rem' }}>
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
