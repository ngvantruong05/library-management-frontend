import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Navbar from '../components/Navbar'
import BookCard from '../components/BookCard'
import BookDetailsModal from '../components/BookDetailsModal'
import '../styles/catalog.css'

const SECTION_PAGE_SIZE = 8

// Reusable Horizontal Book Section Component with scroll prefetching & arrow nav
const HorizontalBookSection = ({ title, sortBy, sortDir, onBookClick }) => {
  const [books, setBooks] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const scrollRef = useRef(null)
  const isFetchingRef = useRef(false)
  const hasMoreRef = useRef(true)
  const pageRef = useRef(0)

  isFetchingRef.current = isLoading || isFetchingMore
  hasMoreRef.current = hasMore
  pageRef.current = page

  // Fetch page of books for this section
  const fetchSectionPage = async (pageToFetch, isInitial = false) => {
    if (isInitial) {
      setIsLoading(true)
    } else {
      setIsFetchingMore(true)
    }

    try {
      const response = await api.get('/api/books', {
        params: {
          page: pageToFetch,
          size: SECTION_PAGE_SIZE,
          sortBy: sortBy,
          sortDir: sortDir
        }
      })
      const data = response.data

      let newItems = []
      let isLast = true

      if (data && Array.isArray(data.content)) {
        newItems = data.content
        isLast = data.last ?? (newItems.length < SECTION_PAGE_SIZE)
      } else if (Array.isArray(data)) {
        // Fallback if backend pagination is disabled
        newItems = data.slice(pageToFetch * SECTION_PAGE_SIZE, (pageToFetch + 1) * SECTION_PAGE_SIZE)
        isLast = (pageToFetch + 1) * SECTION_PAGE_SIZE >= data.length
      }

      if (pageToFetch === 0) {
        setBooks(newItems)
      } else {
        setBooks(prev => {
          const existingIds = new Set(prev.map(b => b.id))
          const filteredNew = newItems.filter(b => !existingIds.has(b.id))
          return [...prev, ...filteredNew]
        })
      }

      setPage(pageToFetch)
      setHasMore(!isLast && newItems.length > 0)
    } catch (error) {
      console.error(`Failed to load books for section ${title}:`, error)
      // Fallback fallback mock items on connection failure
      if (pageToFetch === 0) {
        const fallbackList = Array.from({ length: 8 }).map((_, i) => ({
          id: i + 1,
          title: `Book Title ${i + 1} - Section ${title}`,
          isbn: `978-013235088${i}`,
          description: 'Mock description for development purposes.',
          publishedDate: '2020-01-01',
          pageCount: 300 + i * 20,
          price: 150000,
          discountPrice: 150000,
          thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/41xShCOK5mL._SX379_BO1,204,203,200_.jpg',
          language: 'English',
          currencyCode: 'VND',
          publisher: { id: 1, name: 'Prentice Hall' },
          authors: [{ id: 1, name: 'Robert C. Martin' }],
          categories: [{ id: 1, name: 'Software' }],
          availableCopies: 3,
          rating: 4.0
        }))
        setBooks(fallbackList)
        setHasMore(false)
      }
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }

  useEffect(() => {
    fetchSectionPage(0, true)
  }, [sortBy, sortDir])

  // Handle scroll checking (prefetch trigger at 85% horizontal scroll width)
  const handleScroll = (e) => {
    const { scrollLeft, clientWidth, scrollWidth } = e.target

    // Set arrow disabled status based on current scroll position
    setCanScrollLeft(scrollLeft > 5)
    // Can scroll right if we have more pages to load OR we haven't hit the end of the scroll width
    setCanScrollRight(!(!hasMore && scrollLeft + clientWidth >= scrollWidth - 10))

    // Prefetch next page at 85% width
    if (scrollLeft + clientWidth >= scrollWidth * 0.85) {
      if (!isFetchingRef.current && hasMoreRef.current) {
        const nextPage = pageRef.current + 1
        fetchSectionPage(nextPage, false)
      }
    }
  }

  // Scroll left/right when clicking arrow buttons
  const scroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current
      const scrollOffset = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75
      scrollRef.current.scrollBy({
        left: scrollOffset,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="fx-scroll-section-wrapper">
      <div className="fx-scroll-header-row">
        <h2 className="fx-section-title">{title}</h2>
        <Link to={`/books?sortBy=${sortBy}`} className="fx-scroll-view-all-link">
          View All →
        </Link>
      </div>

      <div className="fx-scroll-container-relative">
        {/* Left Nav Button */}
        {canScrollLeft && (
          <button
            className="fx-scroll-arrow fx-scroll-arrow-left"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Horizontal scroll content wrapper */}
        <div className="fx-horizontal-scroll" ref={scrollRef} onScroll={handleScroll}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={`section-skeleton-${idx}`} className="fx-skeleton-card">
                <div className="fx-skeleton-thumb"></div>
                <div className="fx-skeleton-line fx-skeleton-line-title"></div>
                <div className="fx-skeleton-line fx-skeleton-line-author"></div>
                <div className="fx-skeleton-line fx-skeleton-line-tag"></div>
                <div className="fx-skeleton-shimmer"></div>
              </div>
            ))
          ) : books.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No books in this category.</p>
          ) : (
            <>
              {books.map((book) => (
                <BookCard
                  key={`${sortBy}-${book.id}`}
                  book={book}
                  onClick={onBookClick}
                  showRating={true}
                />
              ))}

              {/* Horizontal loader placeholder */}
              {isFetchingMore && (
                <div className="fx-skeleton-card">
                  <div className="fx-skeleton-thumb"></div>
                  <div className="fx-skeleton-line fx-skeleton-line-title"></div>
                  <div className="fx-skeleton-line fx-skeleton-line-author"></div>
                  <div className="fx-skeleton-line fx-skeleton-line-tag"></div>
                  <div className="fx-skeleton-shimmer"></div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Nav Button */}
        {canScrollRight && books.length > 0 && (
          <button
            className="fx-scroll-arrow fx-scroll-arrow-right"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

const Dashboard = () => {
  const { user } = useAuth()
  
  // States
  const [selectedBook, setSelectedBook] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [notification, setNotification] = useState(null)

  // Show Toast
  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

  // Handle open details modal
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
    <div className="fx-home-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {notification && (
        <div className={`notification-banner ${notification.type === 'error' ? 'notification-error' : 'notification-success'}`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Shared Header Navigation */}
      <Navbar />

      <main className="fx-dashboard-container">
        {/* Welcome Header */}
        <h1 className="fx-welcome-title">Welcome, {user?.displayName || 'Guest'}</h1>

        {/* Top Rated Section (using pageCount desc for variation) */}
        <HorizontalBookSection
          title="Top Rated"
          sortBy="pageCount"
          sortDir="desc"
          onBookClick={handleOpenDetail}
        />

        {/* Top Loans Section (using price desc for variation) */}
        <HorizontalBookSection
          title="Top Loans"
          sortBy="price"
          sortDir="desc"
          onBookClick={handleOpenDetail}
        />
      </main>

      {/* View Book Modal details */}
      <BookDetailsModal
        show={showDetailModal}
        book={selectedBook}
        onClose={() => setShowDetailModal(false)}
        onBorrow={handleBorrowSubmit}
      />
    </div>
  )
}

export default Dashboard
