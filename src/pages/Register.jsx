import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ensureGoogleScriptLoaded, triggerGoogleLogin } from '../utils/googleAuth'
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    ensureGoogleScriptLoaded()
  }, [])

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
    if (errorMsg) setErrorMsg('')
    if (formErrors[id]) {
      setFormErrors((prev) => ({ ...prev, [id]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.displayName.trim()) {
      errors.displayName = 'Vui lòng nhập họ và tên'
    }

    if (!formData.email) {
      errors.email = 'Vui lòng nhập địa chỉ Email'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Địa chỉ Email không hợp lệ'
    }

    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu'
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải chứa ít nhất 6 ký tự'
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    if (formData.phoneNumber && !/^[0-9+()#.\s-]{8,20}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Số điện thoại không hợp lệ'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const { confirmPassword: _, ...registerData } = formData

      const result = await register(registerData)
      if (result.success) {
        if (result.role === 'ADMIN') {
          navigate('/admin/dashboard')
        } else {
          navigate('/dashboard')
        }
      } else {
        setErrorMsg(result.error || 'Đăng ký không thành công')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleClick = () => {
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
            setErrorMsg(result.error || 'Đăng ký bằng Google thất bại')
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

      <div className="auth-card" style={{ maxWidth: '500px', padding: '2.5rem 2rem' }}>
        <div className="auth-header">
          <h2 className="auth-title">Tạo Tài Khoản</h2>
          <p className="auth-subtitle">Đăng ký thành viên Hệ thống Thư viện</p>
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
              HỌ VÀ TÊN *
            </label>
            <input
              id="displayName"
              type="text"
              className={`auth-input ${formErrors.displayName ? 'auth-input-error' : ''}`}
              placeholder="Nguyễn Văn A"
              value={formData.displayName}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {formErrors.displayName && (
              <span className="auth-error-text">{formErrors.displayName}</span>
            )}
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="email">
              ĐỊA CHỈ EMAIL *
            </label>
            <input
              id="email"
              type="email"
              className={`auth-input ${formErrors.email ? 'auth-input-error' : ''}`}
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {formErrors.email && (
              <span className="auth-error-text">{formErrors.email}</span>
            )}
          </div>

          <div className="auth-form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="auth-label" htmlFor="phoneNumber">
                SỐ ĐIỆN THOẠI
              </label>
              <input
                id="phoneNumber"
                type="tel"
                className={`auth-input ${formErrors.phoneNumber ? 'auth-input-error' : ''}`}
                placeholder="0912345678"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {formErrors.phoneNumber && (
                <span className="auth-error-text">{formErrors.phoneNumber}</span>
              )}
            </div>
            <div>
              <label className="auth-label" htmlFor="birthday">
                NGÀY SINH
              </label>
              <input
                id="birthday"
                type="date"
                className="auth-input"
                value={formData.birthday}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div className="auth-form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="auth-label" htmlFor="password">
                MẬT KHẨU *
              </label>
              <div className="auth-input-container">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`auth-input ${formErrors.password ? 'auth-input-error' : ''}`}
                  placeholder="Ít nhất 6 ký tự"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  className="auth-toggle-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
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
                XÁC NHẬN *
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className={`auth-input ${formErrors.confirmPassword ? 'auth-input-error' : ''}`}
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {formErrors.confirmPassword && (
                <span className="auth-error-text">{formErrors.confirmPassword}</span>
              )}
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={isSubmitting} style={{ marginTop: '1rem' }}>
            {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng Ký'}
          </button>
        </form>

        <div className="auth-divider">
          <span>HOẶC</span>
        </div>

        <button
          type="button"
          className="auth-google-btn"
          onClick={handleGoogleClick}
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
          <span>Đăng ký nhanh bằng Google</span>
        </button>

        <div className="auth-footer" style={{ marginTop: '1.25rem' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" className="auth-link">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
