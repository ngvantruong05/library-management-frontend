import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import '../styles/profile.css'

const ProfileModal = ({ show, onClose }) => {
  const { user, setUser } = useAuth()
  
  // Tab control: 'personal' or 'security'
  const [activeTab, setActiveTab] = useState('personal')
  
  // Personal Info Form States
  const [displayName, setDisplayName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [birthday, setBirthday] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  
  // Security Form States
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  
  // Loading states (emulates FX StackPane overlay)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('Loading...')
  
  // Toast Alerts
  const [toast, setToast] = useState(null)
  
  const fileInputRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Load user data when modal opens
  useEffect(() => {
    if (user && show) {
      setDisplayName(user.displayName || '')
      setPhoneNumber(user.phoneNumber || '')
      setBirthday(user.birthday || '')
      setPhotoUrl(user.photoUrl || '')
      setActiveTab('personal')
      setOldPassword('')
      setNewPassword('')
    }
  }, [user, show])

  // Track modifications to enable/disable Save button (JavaFX checkForChanges)
  useEffect(() => {
    if (!user) return
    
    const initialName = user.displayName || ''
    const initialPhone = user.phoneNumber || ''
    const initialBirthday = user.birthday || ''
    const initialPhoto = user.photoUrl || ''
    
    const changed = 
      displayName.trim() !== initialName.trim() ||
      phoneNumber.trim() !== initialPhone.trim() ||
      birthday !== initialBirthday ||
      photoUrl !== initialPhoto
      
    setHasChanges(changed)
  }, [displayName, phoneNumber, birthday, photoUrl, user])

  if (!show) return null

  // Show a status toast banner
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Trigger click on hidden file input
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Crop image to 120x120 pixels JPEG compressed Base64 string for photoUrl
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn một tệp hình ảnh (.png, .jpg, .jpeg)', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
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
        setPhotoUrl(base64Image)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)

    if (e.target) {
      e.target.value = ''
    }
  }

  // Generate initials for avatar placeholder
  const getInitials = () => {
    if (!displayName) return 'AN'
    const parts = displayName.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Save changes handler (JavaFX handleSaveChanges)
  const handleSaveChanges = async (e) => {
    e.preventDefault()
    if (!hasChanges) return

    if (!displayName.trim()) {
      showToast('Tên hiển thị không được để trống.', 'error')
      return
    }

    if (phoneNumber && !/^[0-9+()#.\s-]{8,20}$/.test(phoneNumber)) {
      showToast('Số điện thoại không hợp lệ.', 'error')
      return
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setLoadingText('Updating profile...')

    try {
      const response = await api.put('/api/auth/me', {
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        birthday,
        photoUrl
      }, {
        signal: abortControllerRef.current.signal
      })
      
      setUser(response.data)
      showToast('Cập nhật thông tin thành công!', 'success')
    } catch (err) {
      if (axios.isCancel(err)) {
        showToast('Đã hủy cập nhật thông tin.', 'error')
      } else {
        const errorMsg = err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật thông tin.'
        showToast(errorMsg, 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Update password handler (JavaFX handleUpdatePassword)
  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!oldPassword || !newPassword) return

    if (newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự.', 'error')
      return
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setLoadingText('Updating password...')

    try {
      await api.put('/api/auth/me/password', {
        oldPassword,
        newPassword
      }, {
        signal: abortControllerRef.current.signal
      })
      
      setOldPassword('')
      setNewPassword('')
      showToast('Cập nhật mật khẩu thành công!', 'success')
    } catch (err) {
      if (axios.isCancel(err)) {
        showToast('Đã hủy cập nhật mật khẩu.', 'error')
      } else {
        const errorMsg = err.response?.data?.message || 'Mật khẩu cũ không chính xác.'
        showToast(errorMsg, 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Cancel running API request (JavaFX cancelButton onAction)
  const handleCancelLoading = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsLoading(false)
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Loading Overlay (StackPane emulation) */}
        {isLoading && (
          <div className="fx-loading-overlay">
            <div className="fx-loading-inner">
              <div className="fx-loading-spinner"></div>
              <h3 className="fx-loading-text">{loadingText}</h3>
              <button type="button" className="fx-btn-text" onClick={handleCancelLoading}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="profile-modal-header">
          <h2 className="profile-modal-title">Hồ sơ cá nhân</h2>
          <button className="profile-modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* TabPane Emulation */}
        <div className="fx-tab-pane">
          <div className="fx-tab-header">
            <button
              className={`fx-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              Thông tin cá nhân
            </button>
            <button
              className={`fx-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Cài đặt bảo mật
            </button>
          </div>

          <div className="fx-tab-content">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="profile-personal-info">
                {/* Left Column - Avatar, Email */}
                <div className="profile-left-panel">
                  <div className="avatar-container">
                    <div className="image-stack-pane" onClick={handleAvatarClick}>
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="Avatar"
                          className="profile-image-upload"
                        />
                      ) : (
                        <div 
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#bae6fd',
                            color: '#0369a1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {getInitials()}
                        </div>
                      )}
                      <span className="change-avatar-label">Thay đổi</span>
                    </div>
                    
                    {/* Hidden File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </div>

                  <div className="profile-grid-info">
                    <span className="profile-grid-label">Email:</span>
                    <span className="profile-grid-value">{user?.email || ''}</span>
                  </div>
                </div>

                {/* Vertical Separator */}
                <div className="v-separator"></div>

                {/* Right Column - Inputs for name, phone, bday */}
                <form className="profile-right-panel" onSubmit={handleSaveChanges}>
                  <div className="profile-form-group">
                    <label className="profile-label">Tên hiển thị:</label>
                    <input
                      type="text"
                      className="profile-input"
                      placeholder="John Doe"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-label">Số điện thoại:</label>
                    <input
                      type="tel"
                      className="profile-input"
                      placeholder="+84123456789"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-label">Ngày sinh:</label>
                    <input
                      type="date"
                      className="profile-input"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="profile-btn profile-btn-primary"
                    disabled={!hasChanges}
                  >
                    Lưu thay đổi
                  </button>
                </form>
              </div>
            )}

            {/* Security Setting Tab */}
            {activeTab === 'security' && (
              <div className="profile-security-container">
                <form className="profile-security-box" onSubmit={handleUpdatePassword}>
                  <div className="profile-form-group">
                    <label className="profile-label">Mật khẩu cũ:</label>
                    <input
                      type="password"
                      className="profile-input"
                      placeholder="Nhập mật khẩu cũ"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-label">Mật khẩu mới:</label>
                    <input
                      type="password"
                      className="profile-input"
                      placeholder="Nhập mật khẩu mới"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="profile-btn profile-btn-primary"
                    disabled={!oldPassword || !newPassword}
                  >
                    Cập nhật mật khẩu
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Alert popup */}
      {toast && (
        <div className={`profile-toast profile-toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}

export default ProfileModal
