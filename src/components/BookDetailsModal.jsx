import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import BorrowBookModal from './BorrowBookModal'

const BookDetailsModal = ({ show, book, onClose, onBorrow, onToggleFavorite }) => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [isFavorite, setIsFavorite] = useState(false)
  const [availableCopies, setAvailableCopies] = useState(book?.availableCopies ?? 5)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [borrowModalType, setBorrowModalType] = useState('OFFLINE')
  
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingContent, setEditingContent] = useState('')

  useEffect(() => {
    const fetchExtraDetails = async () => {
      if (!book?.id) return
      
      // Check favorite status if authenticated
      if (isAuthenticated) {
        try {
          const response = await api.get(`/api/favorites/check/${book.id}`)
          setIsFavorite(response.data?.isFavorite || false)
        } catch (error) {
          console.error('Failed to check favorite status:', error)
        }
      }

      // Fetch actual book copy stock from backend
      try {
        const copyRes = await api.get(`/api/book-copies/book/${book.id}`)
        if (copyRes.data && copyRes.data.availableCopies !== undefined) {
          setAvailableCopies(copyRes.data.availableCopies)
        }
      } catch {
        // If not found, use default book property or fallback
        if (book.availableCopies !== undefined) {
          setAvailableCopies(book.availableCopies)
        }
      }

      // Fetch comments
      try {
        const commentRes = await api.get(`/api/comments/book/${book.id}`)
        setComments(commentRes.data || [])
      } catch (error) {
        console.error('Failed to fetch comments:', error)
      }
    }

    if (show && book?.id) {
      setNewComment('')
      setEditingCommentId(null)
      setEditingContent('')
      fetchExtraDetails()
    }
  }, [show, book, isAuthenticated])

  const requireLogin = () => {
    alert("Please login first to perform this action!")
    navigate('/login')
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    try {
      const response = await api.post('/api/comments', {
        bookId: book.id,
        content: newComment
      })
      setComments(prev => [...prev, response.data])
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
      alert(error.response?.data?.message || 'Failed to add comment')
    }
  }

  const startEditComment = (comment) => {
    setEditingCommentId(comment.id)
    setEditingContent(comment.content)
  }

  const handleSaveEdit = async (id) => {
    if (!editingContent.trim()) return
    try {
      const response = await api.put(`/api/comments/${id}`, {
        bookId: book.id,
        content: editingContent
      })
      setComments(prev => prev.map(c => c.id === id ? response.data : c))
      setEditingCommentId(null)
      setEditingContent('')
    } catch (error) {
      console.error('Failed to update comment:', error)
      alert(error.response?.data?.message || 'Failed to update comment')
    }
  }

  const handleDeleteComment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return
    try {
      await api.delete(`/api/comments/${id}`)
      setComments(prev => prev.filter(c => c.id !== id))
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert(error.response?.data?.message || 'Failed to delete comment')
    }
  }

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      requireLogin()
      return
    }
    try {
      if (isFavorite) {
        await api.delete(`/api/favorites/${book.id}`)
        setIsFavorite(false)
        if (onToggleFavorite) onToggleFavorite(book.id, false)
      } else {
        await api.post(`/api/favorites/${book.id}`)
        setIsFavorite(true)
        if (onToggleFavorite) onToggleFavorite(book.id, true)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  if (!show || !book) return null

  const rating = book.rating !== undefined ? book.rating : (book.id % 2 === 0 ? 4.5 : 3.5)
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  const handleBorrowOnline = () => {
    if (!isAuthenticated) {
      requireLogin()
      return
    }
    setBorrowModalType('ONLINE')
    setShowBorrowModal(true)
  }

  const handleBorrowOffline = () => {
    if (!isAuthenticated) {
      requireLogin()
      return
    }
    if (availableCopies <= 0) {
      alert("This book is currently out of physical stock.")
      return
    }
    setBorrowModalType('OFFLINE')
    setShowBorrowModal(true)
  }

  const handleConfirmBorrow = async (payload) => {
    await api.post('/api/book-loans', payload)
    if (payload.type === 'OFFLINE') {
      setAvailableCopies(prev => Math.max(0, prev - payload.numCopies))
    }
    setShowBorrowModal(false)
    if (onBorrow) {
      onBorrow(book, payload.type, payload.numCopies)
    }
  }

  return (
    <>
      <div className="fx-modal-overlay" onClick={onClose}>
        <div className="fx-modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="fx-modal-body">
            {/* Back button */}
            <button className="fx-back-arrow-btn" onClick={onClose}>
              <span className="fx-arrow-icon">←</span> Back
            </button>

            <div className="fx-detail-columns">
              {/* Left Column: Cover */}
              <div className="fx-detail-left">
                {book.thumbnail ? (
                  <img src={book.thumbnail} alt={book.title} className="fx-detail-img" />
                ) : (
                  <div className="fx-detail-placeholder">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    <span>No Cover Image</span>
                  </div>
                )}
              </div>

              {/* Right Column: Details */}
              <div className="fx-detail-right">
                {/* Title & Lang Badge */}
                <div className="fx-detail-title-row">
                  <span className="fx-lang-badge">{book.language === 'Vietnamese' ? 'vi' : 'en'}</span>
                  <h1 className="fx-detail-title">{book.title}</h1>
                </div>

                {/* Rating */}
                <div className="fx-detail-rating-row">
                  <div className="fx-stars">
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i} 
                        className={`fx-star ${i < fullStars ? 'full' : (i === fullStars && hasHalfStar ? 'half' : 'empty')}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="fx-detail-rating-num">({rating})</span>
                </div>

                {/* Author */}
                <p className="fx-detail-author">
                  by {book.authors && book.authors.map(a => a.name).join(', ') || 'Unknown Author'}
                </p>

                {/* Publication */}
                <p className="fx-detail-pub">
                  Published by {book.publisher?.name || 'Unknown'} on {book.publishedDate || 'N/A'}
                </p>

                <p className="fx-detail-copies">
                  Available copies: <strong>{availableCopies}</strong>
                </p>

                {/* Categories */}
                <div className="fx-detail-categories">
                  <span className="fx-detail-cat-label">Categories:</span>
                  <div className="fx-detail-cat-tags">
                    {book.categories && book.categories.map((c) => (
                      <span
                        className="fx-detail-cat-tag fx-clickable-cat-tag"
                        key={c.id}
                        onClick={() => {
                          onClose()
                          navigate(`/categories?id=${c.id}`)
                        }}
                        title={`Explore ${c.name} category`}
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="fx-detail-description-container">
                  <span className="fx-detail-desc-label">Description:</span>
                  <div className="fx-detail-desc-box">
                    {book.description || 'No description available for this book.'}
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="fx-detail-footer">
                  <div className="fx-detail-price-box">
                    {book.price > 0 ? (
                      <>
                        {book.discountPrice > 0 ? (
                          <>
                            <span className="fx-price-original">{book.price.toLocaleString()}</span>
                            <span className="fx-price-current">{book.discountPrice.toLocaleString()} VND</span>
                          </>
                        ) : (
                          <span className="fx-price-current">{book.price.toLocaleString()} VND</span>
                        )}
                      </>
                    ) : (
                      <span className="fx-price-current">Free / E-Book</span>
                    )}
                  </div>

                  <div className="fx-detail-actions">
                    <button className="fx-btn-ebook" onClick={handleBorrowOnline}>
                      Borrow E-Book
                    </button>
                    <button 
                      className={`fx-btn-borrow-off ${availableCopies === 0 ? 'disabled' : ''}`}
                      onClick={handleBorrowOffline}
                      disabled={availableCopies === 0}
                    >
                      Borrow
                    </button>
                    <button 
                      className={`fx-btn-favorite ${isFavorite ? 'active' : ''}`}
                      onClick={handleToggleFavorite}
                      title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    >
                      ♥
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments section */}
            <div className="fx-comments-section">
              <h3 className="fx-comments-title">Comments ({comments.length})</h3>
              
              {/* Form to add a new comment */}
              {isAuthenticated ? (
                <form onSubmit={handleAddComment} className="fx-comment-form">
                  <textarea
                    className="fx-comment-textarea"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows="3"
                    required
                  />
                  <div className="fx-comment-form-actions">
                    <button type="submit" className="fx-comment-submit-btn">
                      Post Comment
                    </button>
                  </div>
                </form>
              ) : (
                <div className="fx-comment-login-prompt">
                  Please <span className="fx-link" onClick={requireLogin}>login</span> to write a comment.
                </div>
              )}

              {/* List of comments */}
              <div className="fx-comments-list">
                {comments.length === 0 ? (
                  <div className="fx-comments-list-empty">
                    No comments yet. Be the first to share your thoughts!
                  </div>
                ) : (
                  comments.map(c => {
                    const isOwner = user && user.email === c.userEmail;
                    const isAdmin = user && user.role === 'ADMIN';
                    const canDelete = isOwner || isAdmin;
                    const canEdit = isOwner;

                    return (
                      <div key={c.id} className="fx-comment-item">
                        {/* Avatar */}
                        <div className="fx-comment-item-avatar">
                          {c.userPhotoUrl ? (
                            <img src={c.userPhotoUrl} alt={c.userDisplayName} className="fx-comment-avatar-img" />
                          ) : (
                            <div className="fx-comment-avatar-placeholder">
                              {c.userDisplayName ? c.userDisplayName.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                        </div>

                        {/* Content & Header */}
                        <div className="fx-comment-body">
                          <div className="fx-comment-header">
                            <span className="fx-comment-author">{c.userDisplayName}</span>
                            <span className="fx-comment-time">
                              {new Date(c.createdAt).toLocaleString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {editingCommentId === c.id ? (
                            <div className="fx-comment-edit-box">
                              <textarea
                                className="fx-comment-textarea editing"
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                rows="2"
                                required
                              />
                              <div className="fx-comment-edit-actions">
                                <button className="fx-comment-save-btn" onClick={() => handleSaveEdit(c.id)}>Save</button>
                                <button className="fx-comment-cancel-btn" onClick={() => setEditingCommentId(null)}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="fx-comment-content">{c.content}</div>
                          )}
                        </div>

                        {/* Actions (Edit / Delete) */}
                        {!editingCommentId && (canEdit || canDelete) && (
                          <div className="fx-comment-actions">
                            {canEdit && (
                              <button className="fx-comment-action-btn edit" onClick={() => startEditComment(c)}>
                                Edit
                              </button>
                            )}
                            {canDelete && (
                              <button className="fx-comment-action-btn delete" onClick={() => handleDeleteComment(c.id)}>
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Borrow Popup Dialog */}
      <BorrowBookModal
        show={showBorrowModal}
        selectedBook={book}
        initialType={borrowModalType}
        availableCopies={availableCopies}
        onClose={() => setShowBorrowModal(false)}
        onConfirm={handleConfirmBorrow}
      />
    </>
  )
}

export default BookDetailsModal
