import React from 'react'

const BookCard = ({ book, onClick, showRating = false }) => {
  // Mock rating generation if not present
  const rating = book.rating !== undefined ? book.rating : (book.id % 2 === 0 ? 4.5 : 3.5)
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

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
            <span className="fx-rating-text">({rating})</span>
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
