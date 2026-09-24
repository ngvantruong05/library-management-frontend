import React, { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import Navbar from '../components/Navbar'
import BookCard from '../components/BookCard'
import BookDetailsModal from '../components/BookDetailsModal'
import SearchInput from '../components/SearchInput'
import '../styles/catalog.css'

const MyFavorites = () => {
  const [books, setBooks] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
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

  const filteredBooks = useMemo(() => {
    if (!searchTerm.trim()) return books
    const q = searchTerm.toLowerCase().trim()
    return books.filter(b => {
      const title = (b.title || '').toLowerCase()
      const author = (b.authors || []).map(a => a.name || '').join(' ').toLowerCase()
      const cat = (b.categories || []).map(c => c.name || '').join(' ').toLowerCase()
      return title.includes(q) || author.includes(q) || cat.includes(q)
    })
  }, [books, searchTerm])

  const handleOpenDetail = (book) => {
    setSelectedBook(book)
    setShowDetailModal(true)
  }

  const handleToggleFavoriteInModal = (bookId, isFav) => {
    if (!isFav) {
      setBooks((prev) => prev.filter((b) => b.id !== bookId))
    }
  }

  const handleBorrowSubmit = () => {
    setShowDetailModal(false)
  }

  return (
    <div className="fx-catalog-page" style={{ minHeight: '100vh' }}>
      <Navbar onSearch={(q) => setSearchTerm(q)} />

      <main className="fx-content-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', margin: '2rem 0 1.5rem 0' }}>
          <div>
            <h1 className="fx-welcome-title" style={{ margin: 0 }}>My Favorites</h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'} in your collection
            </p>
          </div>

          <div style={{ width: '300px', maxWidth: '100%' }}>
            <SearchInput
              size="default"
              placeholder="Search favorites by title, author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
          </div>
        </div>



        {isLoading ? (
          <div className="catalog-loader-container">
            <div className="catalog-spinner"></div>
            <p>Loading favorites...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
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
            <h3 style={{ fontFamily: 'Poppins', fontWeight: 600, color: 'var(--text-primary)' }}>
              {searchTerm ? 'No Matching Favorites Found' : 'No Favorite Books Yet'}
            </h3>
            <p style={{ fontFamily: 'Poppins', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
              {searchTerm
                ? `No books matching "${searchTerm}" found in your favorites.`
                : 'Add books to your favorites to see them here!'}
            </p>
          </div>
        ) : (
          /* Book Grid */
          <div className="fx-book-grid">
            {filteredBooks.map((book) => (
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
