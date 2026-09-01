import React from 'react'
import StarRating from './StarRating'

const BookCard = ({ book, onClick, showRating = false }) => {
  const rating = book.averageRating !== undefined && book.averageRating !== null 
    ? book.averageRating 
    : (book.rating !== undefined ? book.rating : 0)
  const ratingCount = book.ratingCount !== undefined ? book.ratingCount : 0

  return (
    <div className="fx-book-card" onClick={() => onClick && onClick(book)}>
      <div className="fx-book-card-thumbnail">
        {book.thumbnail ? (
          <img src={book.thumbnail} alt={book.title} className="fx-book-img" />
        ) : (
          <div className="fx-book-placeholder">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span className="fx-placeholder-title">{book.title}</span>
          </div>
        )}
      </div>

      <div className="fx-book-card-info">
        <h4 className="fx-book-title" title={book.title}>{book.title}</h4>
        
        {showRating ? (
          <div className="fx-rating-container">
            <StarRating value={rating} readOnly={true} size="sm" />
            <span className="fx-rating-text">
              {rating > 0 ? `${rating.toFixed(1)} (${ratingCount})` : 'No reviews'}
            </span>
          </div>
        ) : (
          <p className="fx-book-author">
            by {book.authors && book.authors.map(a => a.name).join(', ') || 'Unknown Author'}
          </p>
        )}
      </div>
    </div>
  )
}

export default BookCard
