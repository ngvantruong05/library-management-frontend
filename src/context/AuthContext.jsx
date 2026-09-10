import React, { createContext, useState, useEffect, useContext } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me')
      setUser(response.data)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Failed to load current user:', error)
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      loadCurrentUser()
    } else {
      setIsLoading(false)
    }

    const handleExternalLogout = () => {
      setUser(null)
      setIsAuthenticated(false)
    }

    window.addEventListener('auth-logout', handleExternalLogout)
    return () => {
      window.removeEventListener('auth-logout', handleExternalLogout)
    }
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const { accessToken, refreshToken, displayName, role } = response.data
      
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      
      setUser({ email, displayName, role })
      setIsAuthenticated(true)
      return { success: true, role }
    } catch (error) {
      console.error('Login failed:', error)
      const message = error.response?.data?.message || 'Tài khoản hoặc mật khẩu không đúng'
      return { success: false, error: message }
    }
  }

  const register = async (formData) => {
    try {
      const response = await api.post('/api/auth/register', formData)
      const { accessToken, refreshToken, email, displayName, role } = response.data
      
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      
      setUser({ email, displayName, role })
      setIsAuthenticated(true)
      return { success: true, role }
    } catch (error) {
      console.error('Registration failed:', error)
      const message = error.response?.data?.message || 'Đăng ký không thành công'
      return { success: false, error: message }
    }
  }

  const loginWithGoogle = async (googlePayload) => {
    try {
      const response = await api.post('/api/auth/google', googlePayload)
      const { accessToken, refreshToken, email, displayName, role } = response.data
      
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      
      setUser({ email, displayName, role })
      setIsAuthenticated(true)
      return { success: true, role }
    } catch (error) {
      console.error('Google Login failed:', error)
      const message = error.response?.data?.message || 'Đăng nhập bằng Google thất bại'
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
