import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import BorrowBookModal from './BorrowBookModal'
import StarRating from './StarRating'

const BookDetailsModal = ({ show, book, onClose, onBorrow, onToggleFavorite }) => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [isFavorite, setIsFavorite] = useState(false)
  const [availableCopies, setAvailableCopies] = useState(book?.availableCopies ?? 5)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [borrowModalType, setBorrowModalType] = useState('OFFLINE')
  
  // Rating states
  const [ratingSummary, setRatingSummary] = useState({
    averageRating: 0,
    totalRatings: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    currentUserRating: null
  })
  const [ratingsList, setRatingsList] = useState([])
  const [newScore, setNewScore] = useState(5)
  const [newReview, setNewReview] = useState('')
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)

  // Inline edit state for reviews in the list
  const [editingRatingId, setEditingRatingId] = useState(null)
  const [editingScore, setEditingScore] = useState(5)
  const [editingReviewContent, setEditingReviewContent] = useState('')

  // Comments states
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingContent, setEditingContent] = useState('')

  const fetchExtraDetails = async () => {
    if (!book?.id) return
    
    // 1. Check favorite status if authenticated
    if (isAuthenticated) {
      try {
        const response = await api.get(`/api/favorites/check/${book.id}`)
        setIsFavorite(response.data?.isFavorite || false)
      } catch (error) {
        console.error('Failed to check favorite status:', error)
      }
    }

    // 2. Fetch actual book copy stock from backend
    try {
      const copyRes = await api.get(`/api/book-copies/book/${book.id}`)
      if (copyRes.data && copyRes.data.availableCopies !== undefined) {
        setAvailableCopies(copyRes.data.availableCopies)
      }
    } catch {
      if (book.availableCopies !== undefined) {
        setAvailableCopies(book.availableCopies)
      }
    }

    // 3. Fetch Rating Summary
    try {
      const ratingRes = await api.get(`/api/ratings/book/${book.id}/summary`)
      if (ratingRes.data) {
        setRatingSummary(ratingRes.data)
      }
    } catch (error) {
      console.error('Failed to fetch rating summary:', error)
    }

    // 4. Fetch Ratings List
    try {
      const ratingsPageRes = await api.get(`/api/ratings/book/${book.id}`, { params: { size: 20 } })
      setRatingsList(ratingsPageRes.data?.content || [])
    } catch (error) {
      console.error('Failed to fetch ratings list:', error)
    }

    // 5. Fetch comments
    try {
      const commentRes = await api.get(`/api/comments/book/${book.id}`)
      setComments(commentRes.data || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  useEffect(() => {
    if (show && book?.id) {
      setNewComment('')
      setEditingCommentId(null)
      setEditingContent('')
      setEditingRatingId(null)
      setNewReview('')
      setNewScore(5)
      fetchExtraDetails()
    }
  }, [show, book, isAuthenticated])

  const requireLogin = () => {
    alert("Please login first to perform this action!")
    navigate('/login')
  }

  // --- Rating handlers ---
  const handleRatingSubmit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      requireLogin()
      return
    }
    setIsSubmittingRating(true)
    try {
      await api.post('/api/ratings', {
        bookId: book.id,
        score: newScore,
        review: newReview
      })
      // Refresh rating details
      const [summaryRes, listRes] = await Promise.all([
        api.get(`/api/ratings/book/${book.id}/summary`),
        api.get(`/api/ratings/book/${book.id}`, { params: { size: 20 } })
      ])
      setRatingSummary(summaryRes.data)
      setRatingsList(listRes.data?.content || [])
      setNewReview('')
      setNewScore(5)
    } catch (error) {
      console.error('Failed to submit rating:', error)
      alert(error.response?.data?.message || 'Failed to submit rating')
    } finally {
      setIsSubmittingRating(false)
    }
  }

  const startEditRating = (ratingItem) => {
    setEditingRatingId(ratingItem.id)
    setEditingScore(ratingItem.score)
    setEditingReviewContent(ratingItem.review || '')
  }

  const handleSaveEditRating = async (id) => {
    try {
      await api.post('/api/ratings', {
        bookId: book.id,
        score: editingScore,
        review: editingReviewContent
      })
      const [summaryRes, listRes] = await Promise.all([
        api.get(`/api/ratings/book/${book.id}/summary`),
        api.get(`/api/ratings/book/${book.id}`, { params: { size: 20 } })
      ])
      setRatingSummary(summaryRes.data)
      setRatingsList(listRes.data?.content || [])
      setEditingRatingId(null)
    } catch (error) {
      console.error('Failed to update rating:', error)
      alert(error.response?.data?.message || 'Failed to update rating')
    }
  }

  const handleDeleteRatingById = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rating?')) return
    try {
      await api.delete(`/api/ratings/${id}`)
      const [summaryRes, listRes] = await Promise.all([
        api.get(`/api/ratings/book/${book.id}/summary`),
        api.get(`/api/ratings/book/${book.id}`, { params: { size: 20 } })
      ])
      setRatingSummary(summaryRes.data)
      setRatingsList(listRes.data?.content || [])
    } catch (error) {
      console.error('Failed to delete rating:', error)
      alert(error.response?.data?.message || 'Failed to delete rating')
    }
  }

  // --- Comments handlers ---
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

  // Fallback calculations if no ratings exist in DB yet
  const hasRealRatings = ratingSummary.totalRatings > 0
  const fallbackScore = book.rating !== undefined ? book.rating : (book.id % 2 === 0 ? 4.5 : 4.0)
  const avgRating = hasRealRatings ? ratingSummary.averageRating : fallbackScore
  const totalReviews = hasRealRatings ? ratingSummary.totalRatings : 8
  const dist = hasRealRatings ? ratingSummary.distribution : { 5: 5, 4: 2, 3: 1, 2: 0, 1: 0 }

  const hasUserRated = !!ratingSummary.currentUserRating

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

                {/* Rating Header */}
                <div className="fx-detail-rating-row">
                  <StarRating value={avgRating} readOnly={true} size="md" />
                  <span className="fx-detail-rating-num">
                    ({avgRating.toFixed(1)})
                  </span>
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

            {/* RATINGS & REVIEWS SECTION */}
            <div className="fx-ratings-reviews-section">
              <h3 className="fx-section-header-title">Customer Ratings & Reviews</h3>

              {/* Rating Summary Card (Big score + breakdown bars) */}
              <div className="fx-rating-summary-card">
                {/* Score block */}
                <div className="fx-rating-score-block">
                  <div className="fx-big-score">{avgRating.toFixed(1)}</div>
                  <StarRating value={avgRating} readOnly={true} size="lg" />
                  <div className="fx-score-total-text">{totalReviews} {totalReviews === 1 ? 'rating' : 'ratings'}</div>
                </div>

                {/* Distribution bars */}
                <div className="fx-rating-dist-block">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = dist[stars] || 0
                    const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
                    return (
                      <div key={stars} className="fx-dist-row">
                        <span className="fx-dist-star-label">{stars} ★</span>
                        <div className="fx-dist-bar-track">
                          <div className="fx-dist-bar-fill" style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className="fx-dist-count-label">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Form to rate (if user hasn't rated yet) */}
              {isAuthenticated && !hasUserRated && (
                <form onSubmit={handleRatingSubmit} className="fx-rating-form fx-user-rating-box">
                  <h4 className="fx-rating-form-title">Rate & Review This Book</h4>
                  
                  <div className="fx-star-picker-row">
                    <span className="fx-picker-label">Select Stars:</span>
                    <StarRating
                      value={newScore}
                      onChange={setNewScore}
                      readOnly={false}
                      size="lg"
                      showLabel={true}
                    />
                  </div>

                  <textarea
                    className="fx-rating-textarea"
                    placeholder="Write a review (optional)... What did you think of this book?"
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    rows="3"
                  />

                  <div className="fx-rating-form-actions">
                    <button
                      type="submit"
                      className="fx-rating-submit-btn"
                      disabled={isSubmittingRating}
                    >
                      {isSubmittingRating ? 'Posting...' : 'Post Review'}
                    </button>
                  </div>
                </form>
              )}

              {/* All Reviews List */}
              <div className="fx-reviews-list-container">
                <h4 className="fx-reviews-subheading">All Reviews ({ratingsList.length})</h4>
                {ratingsList.length === 0 ? (
                  <div className="fx-comments-list-empty">
                    No reviews yet. Be the first to share your rating!
                  </div>
                ) : (
                  <div className="fx-reviews-list">
                    {ratingsList.map((r) => {
                      const isOwner = user && user.email === r.userEmail
                      const isAdmin = user && user.role === 'ADMIN'
                      const canDelete = isOwner || isAdmin
                      const canEdit = isOwner

                      return (
                        <div key={r.id} className="fx-review-item">
                          <div className="fx-comment-item-avatar">
                            {r.userPhotoUrl ? (
                              <img src={r.userPhotoUrl} alt={r.userDisplayName} className="fx-comment-avatar-img" />
                            ) : (
                              <div className="fx-comment-avatar-placeholder">
                                {r.userDisplayName ? r.userDisplayName.charAt(0).toUpperCase() : '?'}
                              </div>
                            )}
                          </div>

                          <div className="fx-review-body">
                            {/* Header: Author on left, Date + Edit/Delete on right like Comments */}
                            <div className="fx-comment-header">
                              <span className="fx-comment-author">{r.userDisplayName}</span>
                              <div className="fx-comment-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="fx-comment-time">
                                  {new Date(r.createdAt).toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                                {editingRatingId !== r.id && (
                                  <>
                                    {canEdit && (
                                      <button className="fx-comment-action-btn edit" onClick={() => startEditRating(r)}>
                                        Edit
                                      </button>
                                    )}
                                    {canDelete && (
                                      <button className="fx-comment-action-btn delete" onClick={() => handleDeleteRatingById(r.id)}>
                                        Delete
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Stars row - just clean stars, no text */}
                            <div className="fx-review-stars-row">
                              <StarRating value={editingRatingId === r.id ? editingScore : r.score} readOnly={editingRatingId !== r.id} onChange={setEditingScore} size="sm" />
                            </div>

                            {/* Content or Inline Edit Box */}
                            {editingRatingId === r.id ? (
                              <div className="fx-comment-edit-box">
                                <textarea
                                  className="fx-comment-textarea editing"
                                  value={editingReviewContent}
                                  onChange={(e) => setEditingReviewContent(e.target.value)}
                                  rows="2"
                                  placeholder="Write your review..."
                                />
                                <div className="fx-comment-edit-actions">
                                  <button className="fx-comment-save-btn" onClick={() => handleSaveEditRating(r.id)}>Save</button>
                                  <button className="fx-comment-cancel-btn" onClick={() => setEditingRatingId(null)}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              r.review && <div className="fx-comment-content">{r.review}</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="fx-comments-section">
              <h3 className="fx-comments-title">Discussion & Questions ({comments.length})</h3>
              
              {/* Form to add a new comment */}
              {isAuthenticated ? (
                <form onSubmit={handleAddComment} className="fx-comment-form">
                  <textarea
                    className="fx-comment-textarea"
                    placeholder="Ask a question or leave a comment..."
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
                  Please <span className="fx-link" onClick={requireLogin}>login</span> to participate in discussions.
                </div>
              )}

              {/* List of comments */}
              <div className="fx-comments-list">
                {comments.length === 0 ? (
                  <div className="fx-comments-list-empty">
                    No discussion comments yet.
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
                            <div className="fx-comment-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className="fx-comment-time">
                                {new Date(c.createdAt).toLocaleString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {!editingCommentId && (
                                <>
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
                                </>
                              )}
                            </div>
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
