import React, { useState, useEffect } from 'react'
import api from '../services/api'
import Navbar from '../components/Navbar'
import BookCard from '../components/BookCard'
import BookDetailsModal from '../components/BookDetailsModal'
import '../styles/catalog.css'

const MyFavorites = () => {
  const [books, setBooks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/api/favorites')
      setBooks(response.data || [])
    } catch (error) {
      console.error('Failed to fetch favorite books:', error)
      setBooks([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDetail = (book) => {
    setSelectedBook(book)
    setShowDetailModal(true)
  }

  const handleToggleFavoriteInModal = (bookId, isFav) => {
    if (!isFav) {
      setBooks((prev) => prev.filter((b) => b.id !== bookId))
    }
  }

  const handleBorrowSubmit = async (book, type) => {
    try {
      const payload = {
        bookId: book.id,
        type: type,
        numCopies: type === 'OFFLINE' ? 1 : 0,
      }
      await api.post('/api/book-loans', payload)
      alert(`Requested borrow ${book.title} successfully as ${type}!`)
      setShowDetailModal(false)
    } catch (error) {
      console.error('Failed to request borrow:', error)
      alert(error.response?.data?.message || 'Failed to request book loan')
    }
  }

  return (
    <div className="fx-catalog-page" style={{ minHeight: '100vh' }}>
      <Navbar />

      <main className="fx-content-container">
        <h1 className="fx-welcome-title" style={{ margin: '2rem 0 1rem 0' }}>My Favorites</h1>
        <h2 className="fx-results-count">{books.length} favorite books found</h2>

        {isLoading ? (
          <div className="catalog-loader-container">
            <div className="catalog-spinner"></div>
            <p>Loading favorites...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="catalog-empty-container" style={{ minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e11d48"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginBottom: '1.5rem' }}
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <h3 style={{ fontFamily: 'Poppins', fontWeight: 600, color: '#1e293b' }}>No Favorite Books Yet</h3>
            <p style={{ fontFamily: 'Poppins', color: '#64748b', marginTop: '0.5rem', textAlign: 'center' }}>
              Add books to your favorites to see them here!
            </p>
          </div>
        ) : (
          /* Book Grid */
          <div className="fx-book-grid">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={handleOpenDetail}
                showRating={true}
              />
            ))}
          </div>
        )}
      </main>

      {/* Book Detailed View Dialog */}
      <BookDetailsModal
        show={showDetailModal}
        book={selectedBook}
        onClose={() => setShowDetailModal(false)}
        onBorrow={handleBorrowSubmit}
        onToggleFavorite={handleToggleFavoriteInModal}
      />
    </div>
  )
}

export default MyFavorites
