import React, { useState, useEffect } from 'react'
import api from '../services/api'

const BookDetailsModal = ({ show, book, onClose, onBorrow, onToggleFavorite }) => {
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const response = await api.get(`/api/favorites/check/${book.id}`)
        setIsFavorite(response.data?.isFavorite || false)
      } catch (error) {
        console.error('Failed to check favorite status:', error)
      }
    }

    if (show && book?.id) {
      checkFavoriteStatus()
    }
  }, [show, book])

  const handleToggleFavorite = async () => {
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

  // Mock available copies and rating
  const availableCopies = book.availableCopies !== undefined ? book.availableCopies : (book.id % 2 === 0 ? 0 : 5)
  const rating = book.rating !== undefined ? book.rating : (book.id % 2 === 0 ? 4.5 : 3.5)
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  const handleBorrowOnline = () => {
    onBorrow(book, 'ONLINE')
  }

  const handleBorrowOffline = () => {
    if (availableCopies === 0) return
    onBorrow(book, 'OFFLINE')
  }

  return (
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
                Available copies: {availableCopies}
              </p>

              {/* Categories */}
              <div className="fx-detail-categories">
                <span className="fx-detail-cat-label">Categories:</span>
                <div className="fx-detail-cat-tags">
                  {book.categories && book.categories.map((c) => (
                    <span className="fx-detail-cat-tag" key={c.id}>{c.name}</span>
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
            <h3 className="fx-comments-title">Comments</h3>
            <div className="fx-comments-list-empty">
              No comments yet. Be the first to share your thoughts!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookDetailsModal
