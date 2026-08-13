import React, { useState, useEffect, useRef, useCallback } from 'react'
import api from '../services/api'
import Navbar from '../components/Navbar'
import BookCard from '../components/BookCard'
import BookDetailsModal from '../components/BookDetailsModal'
import '../styles/catalog.css'

const PAGE_SIZE = 12

const BookCatalog = () => {
  // Lists & Pagination
  const [books, setBooks] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalElements, setTotalElements] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  // Loading States
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [notification, setNotification] = useState(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)

  // Ref guards for infinite scroll
  const isFetchingRef = useRef(false)
  const hasMoreRef = useRef(true)
  const pageRef = useRef(0)
  const queryRef = useRef('')

  isFetchingRef.current = isFetchingMore || isLoading
  hasMoreRef.current = hasMore
  pageRef.current = page
  queryRef.current = searchQuery

  // Show Toast notification
  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

  // Fetch a page of books
  const fetchPage = async (pageToFetch, query = '', isInitial = false) => {
    if (isInitial) {
      setIsLoading(true)
    } else {
      setIsFetchingMore(true)
    }

    try {
      const params = {
        page: pageToFetch,
        size: PAGE_SIZE,
        sortBy: 'id',
        sortDir: 'desc'
      }
      if (query && query.trim()) {
        params.q = query.trim()
      }

      const response = await api.get('/api/books', { params })
      const data = response.data

      let newItems = []
      let isLast = true
      let total = 0

      if (data && Array.isArray(data.content)) {
        newItems = data.content
        isLast = data.last ?? (newItems.length < PAGE_SIZE)
        total = data.totalElements ?? newItems.length
      } else if (Array.isArray(data)) {
        newItems = data.slice(pageToFetch * PAGE_SIZE, (pageToFetch + 1) * PAGE_SIZE)
        isLast = (pageToFetch + 1) * PAGE_SIZE >= data.length
        total = data.length
      }

      if (pageToFetch === 0) {
        setBooks(newItems)
      } else {
        setBooks(prev => {
          // Avoid duplicate book IDs if any
          const existingIds = new Set(prev.map(b => b.id))
          const filteredNew = newItems.filter(b => !existingIds.has(b.id))
          return [...prev, ...filteredNew]
        })
      }

      setPage(pageToFetch)
      setHasMore(!isLast && newItems.length > 0)
      setTotalElements(total)
    } catch (error) {
      console.error('Failed to fetch books:', error)
      if (pageToFetch === 0) {
        // Fallback mock items for offline development
        setBooks([
          {
            id: 1,
            title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
            isbn: '978-0132350884',
            description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
            publishedDate: '2008-08-11',
            pageCount: 464,
            price: 178500,
            discountPrice: 178500,
            thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/41xShCOK5mL._SX379_BO1,204,203,200_.jpg',
            language: 'English',
            currencyCode: 'VND',
            publisher: { id: 1, name: 'Prentice Hall' },
            authors: [{ id: 1, name: 'Robert C. Martin' }],
            categories: [{ id: 1, name: 'Software Engineering' }, { id: 2, name: 'Programming' }],
            availableCopies: 5,
            rating: 4.5
          },
          {
            id: 2,
            title: 'The Pragmatic Programmer: Your Journey To Mastery',
            isbn: '978-0135957059',
            description: 'The Pragmatic Programmer is one of those rare tech books you\'ll read, re-read, and read again over the years.',
            publishedDate: '2019-09-13',
            pageCount: 352,
            price: 180531,
            discountPrice: 0,
            thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/51wI75O1rHL._SX386_BO1,204,203,200_.jpg',
            language: 'English',
            currencyCode: 'VND',
            publisher: { id: 2, name: 'Addison-Wesley' },
            authors: [{ id: 2, name: 'Andrew Hunt' }, { id: 3, name: 'David Thomas' }],
            categories: [{ id: 2, name: 'Programming' }],
            availableCopies: 0,
            rating: 3.5
          }
        ])
        setTotalElements(2)
        setHasMore(false)
      }
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchPage(0, '', true)
  }, [])

  // Handle Search from Navbar
  const handleSearch = (query = '') => {
    setSearchQuery(query)
    setPage(0)
    setHasMore(true)
    fetchPage(0, query, true)
  }

  // Load next page
  const loadNextPage = useCallback(() => {
    if (isFetchingRef.current || !hasMoreRef.current) return
    const nextPage = pageRef.current + 1
    fetchPage(nextPage, queryRef.current, false)
  }, [])

  // Vertical scroll event listener with 85% - 90% prefetch threshold
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight

      // Show/Hide back-to-top button
      setShowScrollTop(scrollTop > 400)

      // Prefetch threshold trigger at 85% scroll height
      if (scrollTop + clientHeight >= scrollHeight * 0.85) {
        loadNextPage()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadNextPage])

  // Scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Open book detailed view
  const handleOpenDetail = (book) => {
    setSelectedBook(book)
    setShowDetailModal(true)
  }

  // Handle borrow success notification
  const handleBorrowSubmit = (book, type, numCopies) => {
    showToast(`Successfully borrowed "${book.title}" (${type}${type === 'OFFLINE' ? ` - ${numCopies || 1} copies` : ''})!`)
    setShowDetailModal(false)
  }

  return (
    <div className="fx-catalog-page">
      {/* Toast Notification */}
      {notification && (
        <div className={`notification-banner ${notification.type === 'error' ? 'notification-error' : 'notification-success'}`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Shared Header Navigation */}
      <Navbar onSearch={handleSearch} />

      {/* Main Content Area */}
      <main className="fx-content-container">
        <div className="fx-catalog-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="fx-results-count">
            {totalElements} results found
          </h2>
          {searchQuery && (
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Filtering by: <strong style={{ color: 'var(--color-primary)' }}>"{searchQuery}"</strong>
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="catalog-loader-container">
            <div className="catalog-spinner"></div>
            <p>Loading catalog items...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="catalog-empty-container">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: '#86868c', marginBottom: '1.5rem' }}
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <h3>No Books Found</h3>
            <p>We couldn't find any books matching your criteria. Try another query.</p>
          </div>
        ) : (
          <>
            {/* Book Grid */}
            <div className="fx-book-grid">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onClick={handleOpenDetail}
                  showRating={false}
                />
              ))}

              {/* Skeleton placeholders when fetching next 12 books */}
              {isFetchingMore && Array.from({ length: 4 }).map((_, idx) => (
                <div key={`skeleton-${idx}`} className="fx-skeleton-card">
                  <div className="fx-skeleton-thumb"></div>
                  <div className="fx-skeleton-line fx-skeleton-line-title"></div>
                  <div className="fx-skeleton-line fx-skeleton-line-author"></div>
                  <div className="fx-skeleton-line fx-skeleton-line-tag"></div>
                  <div className="fx-skeleton-shimmer"></div>
                </div>
              ))}
            </div>

            {/* Bottom Status / Infinite Scroll Indicator */}
            {isFetchingMore && (
              <div className="fx-infinite-scroll-container">
                <div className="fx-infinite-loading-row">
                  <div className="fx-mini-spinner"></div>
                  <span>Loading more books...</span>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          className="fx-scroll-top-btn"
          onClick={scrollToTop}
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}

      {/* Book Detailed View Dialog */}
      <BookDetailsModal
        show={showDetailModal}
        book={selectedBook}
        onClose={() => setShowDetailModal(false)}
        onBorrow={handleBorrowSubmit}
      />
    </div>
  )
}

export default BookCatalog
