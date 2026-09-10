import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ensureGoogleScriptLoaded, triggerGoogleLogin } from '../utils/googleAuth'
import '../styles/auth.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    ensureGoogleScriptLoaded()
  }, [])

  const validateForm = () => {
    const errors = {}
    if (!email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ Email'
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      errors.email = 'Địa chỉ Email không hợp lệ'
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu'
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu phải chứa ít nhất 6 ký tự'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (setter, field) => (e) => {
    setter(e.target.value)
    if (errorMsg) setErrorMsg('')
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const result = await login(email.trim(), password)
      if (result.success) {
        if (result.role === 'ADMIN') {
          navigate('/admin/dashboard')
        } else {
          navigate('/dashboard')
        }
      } else {
        setErrorMsg(result.error || 'Tài khoản hoặc mật khẩu không đúng')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = () => {
    setErrorMsg('')
    setIsSubmitting(true)
    triggerGoogleLogin({
      onSuccess: async (googleProfile) => {
        try {
          const result = await loginWithGoogle(googleProfile)
          if (result.success) {
            if (result.role === 'ADMIN') {
              navigate('/admin/dashboard')
            } else {
              navigate('/dashboard')
            }
          } else {
            setErrorMsg(result.error || 'Đăng nhập bằng Google thất bại')
          }
        } finally {
          setIsSubmitting(false)
        }
      },
      onError: (errText) => {
        setIsSubmitting(false)
        setErrorMsg(errText)
      },
    })
  }

  return (
    <div className="auth-body">
      {/* Background blobs for aesthetics */}
      <div className="auth-bg-blob auth-bg-blob-1"></div>
      <div className="auth-bg-blob auth-bg-blob-2"></div>

      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Chào mừng trở lại</h2>
          <p className="auth-subtitle">Đăng nhập để quản lý và mượn sách thư viện</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="email">
              ĐỊA CHỈ EMAIL
            </label>
            <div className="auth-input-container">
              <input
                id="email"
                type="email"
                className={`auth-input ${formErrors.email || errorMsg ? 'auth-input-error' : ''}`}
                placeholder="name@example.com"
                value={email}
                onChange={handleInputChange(setEmail, 'email')}
                disabled={isSubmitting}
              />
            </div>
            {formErrors.email && (
              <span className="auth-error-text">{formErrors.email}</span>
            )}
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="password">
              MẬT KHẨU
            </label>
            <div className="auth-input-container">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`auth-input ${formErrors.password || errorMsg ? 'auth-input-error' : ''}`}
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={handleInputChange(setPassword, 'password')}
                disabled={isSubmitting}
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                className="auth-toggle-pwd"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {(formErrors.password || errorMsg) && (
              <span className="auth-error-text">
                {formErrors.password || errorMsg}
              </span>
            )}
          </div>

          <button type="submit" className="auth-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="auth-divider">
          <span>HOẶC</span>
        </div>

        <button
          type="button"
          className="auth-google-btn"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
            />
          </svg>
          <span>Tiếp tục với Google</span>
        </button>

        <div className="auth-footer">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="auth-link">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
