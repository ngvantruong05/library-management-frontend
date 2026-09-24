import React from 'react'
import StarRating from './StarRating'
import BookCover from './BookCover'

const BookCard = ({ book, onClick, showRating = false }) => {
  const rating = book.averageRating !== undefined && book.averageRating !== null 
    ? book.averageRating 
    : (book.rating !== undefined ? book.rating : 0)
  const ratingCount = book.ratingCount !== undefined ? book.ratingCount : 0

  return (
    <div className="fx-book-card" onClick={() => onClick && onClick(book)}>
      <div className="fx-book-card-thumbnail">
        <BookCover book={book} size="card" />
      </div>

      <div className="fx-book-card-info">
        <div>
          <h4 className="fx-book-title" title={book.title}>{book.title}</h4>
          
          <p className="fx-book-author">
            by {book.authors && book.authors.length > 0 ? book.authors.map(a => a.name).join(', ') : 'Unknown Author'}
          </p>
        </div>

        {showRating && (
          <div className="fx-rating-container" style={{ marginTop: '0.35rem' }}>
            <StarRating value={rating} readOnly={true} size="sm" />
            <span className="fx-rating-text">
              {rating > 0 ? `${rating.toFixed(1)} (${ratingCount})` : 'No reviews'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookCard
