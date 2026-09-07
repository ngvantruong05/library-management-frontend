import api from './api'

export const getNotifications = async () => {
  const response = await api.get('/api/notifications')
  return response.data
}

export const getUnreadCount = async () => {
  const response = await api.get('/api/notifications/unread-count')
  return response.data.unreadCount
}

export const markAsRead = async (id) => {
  const response = await api.put(`/api/notifications/${id}/read`)
  return response.data
}

export const markAllAsRead = async () => {
  const response = await api.put('/api/notifications/read-all')
  return response.data
}

export const triggerScan = async () => {
  const response = await api.post('/api/notifications/trigger-scan')
  return response.data
}
