import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import BookCard from '../components/BookCard'
import BookDetailsModal from '../components/BookDetailsModal'
import '../styles/catalog.css'

const PAGE_SIZE = 12

// Helper icon picker based on category name
const getCategoryIcon = (name = '') => {
  const lower = name.toLowerCase()
  if (lower.includes('computer') || lower.includes('software') || lower.includes('programming') || lower.includes('code')) return '💻'
  if (lower.includes('business') || lower.includes('economic') || lower.includes('finance') || lower.includes('money')) return '📈'
  if (lower.includes('ai') || lower.includes('intelligence') || lower.includes('machine learning') || lower.includes('data')) return '🤖'
  if (lower.includes('science') || lower.includes('physic') || lower.includes('quantum')) return '🔬'
  if (lower.includes('fiction') || lower.includes('novel') || lower.includes('story') || lower.includes('adventure')) return '✨'
  if (lower.includes('database') || lower.includes('sql') || lower.includes('storage')) return '🗄️'
  if (lower.includes('web') || lower.includes('internet') || lower.includes('cloud')) return '🌐'
  if (lower.includes('design') || lower.includes('art') || lower.includes('architecture')) return '🎨'
  if (lower.includes('language') || lower.includes('study') || lower.includes('english')) return '🗣️'
  if (lower.includes('exam') || lower.includes('education') || lower.includes('school')) return '🎓'
  return '📚'
}

const Categories = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCategoryId = searchParams.get('id')
  const initialCategoryName = searchParams.get('name')

  // Data states
  const [categories, setCategories] = useState([])
  const [books, setBooks] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId ? Number(initialCategoryId) : null)

  // Pagination & Loading states
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingBooks, setIsLoadingBooks] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  // Search & Filter states
  const [categorySearch, setCategorySearch] = useState('')
  const [bookSearch, setBookSearch] = useState('')
  const [notification, setNotification] = useState(null)

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)

  // Ref guards for infinite scroll & request race conditions
  const isFetchingRef = useRef(false)
  const hasMoreRef = useRef(true)
  const pageRef = useRef(0)
  const selectedCatRef = useRef(null)
  const queryRef = useRef('')
  const requestIdRef = useRef(0)

  isFetchingRef.current = isFetchingMore || isLoadingBooks
  hasMoreRef.current = hasMore
  pageRef.current = page
  selectedCatRef.current = selectedCategoryId
  queryRef.current = bookSearch

  // Toast notification
  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  // 1. Fetch Categories list on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true)
      try {
        const catRes = await api.get('/api/categories')
        const fetchedCategories = catRes.data || []
        setCategories(fetchedCategories)

        if (initialCategoryId) {
          setSelectedCategoryId(Number(initialCategoryId))
        } else if (initialCategoryName) {
          const found = fetchedCategories.find((c) => c.name.toLowerCase() === initialCategoryName.toLowerCase())
          if (found) setSelectedCategoryId(found.id)
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setIsLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  // 2. Fetch Books for current category & search query with pagination
  const fetchBooksPage = useCallback(async (pageToFetch, catId, query = '', isInitial = false) => {
    const currentRequestId = ++requestIdRef.current

    if (pageToFetch === 0) {
      setIsLoadingBooks(true)
      setBooks([]) // Clear previous category's books instantly so skeleton cards show up immediately
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
      if (catId !== null && catId !== undefined) {
        params.categoryId = catId
      }
      if (query && query.trim()) {
        params.q = query.trim()
      }

      const response = await api.get('/api/books', { params })

      // Ignore stale request if a newer category request was launched
      if (currentRequestId !== requestIdRef.current) return

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
          const existingIds = new Set(prev.map(b => b.id))
          const filteredNew = newItems.filter(b => !existingIds.has(b.id))
          return [...prev, ...filteredNew]
        })
      }

      setPage(pageToFetch)
      setHasMore(!isLast && newItems.length > 0)
      setTotalElements(total)
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) return
      console.error('Failed to fetch books:', error)
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoadingBooks(false)
        setIsFetchingMore(false)
      }
    }
  }, [])

  // Fetch books whenever selectedCategoryId or bookSearch changes
  useEffect(() => {
    fetchBooksPage(0, selectedCategoryId, bookSearch, true)
  }, [selectedCategoryId, bookSearch, fetchBooksPage])

  // Sync state if URL changes
  useEffect(() => {
    const paramId = searchParams.get('id')
    const paramName = searchParams.get('name')

    if (paramId) {
      const numId = Number(paramId)
      if (numId !== selectedCategoryId) {
        setSelectedCategoryId(numId)
      }
    } else if (paramName && categories.length > 0) {
      const found = categories.find((c) => c.name.toLowerCase() === paramName.toLowerCase())
      if (found && found.id !== selectedCategoryId) {
        setSelectedCategoryId(found.id)
      }
    }
  }, [searchParams, categories])

  // Total count across all categories
  const totalAllBooksCount = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.bookCount || 0), 0)
  }, [categories])

  // Filtered categories in left sidebar search input
  const filteredCategories = useMemo(() => {
    const q = categorySearch.toLowerCase().trim()
    if (!q) return categories
    return categories.filter((cat) => cat.name.toLowerCase().includes(q))
  }, [categories, categorySearch])

  // Handle Category Selection
  const handleSelectCategory = (catId) => {
    if (selectedCategoryId === catId) return
    setSelectedCategoryId(catId)
    setBookSearch('')
    if (catId === null) {
      setSearchParams({})
    } else {
      setSearchParams({ id: catId.toString() })
    }
  }

  // Load next batch when scrolling
  const loadNextPage = useCallback(() => {
    if (isFetchingRef.current || !hasMoreRef.current) return
    const nextPage = pageRef.current + 1
    fetchBooksPage(nextPage, selectedCatRef.current, queryRef.current, false)
  }, [fetchBooksPage])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight

      if (scrollTop + clientHeight >= scrollHeight * 0.85) {
        loadNextPage()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadNextPage])

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
    <div className="fx-catalog-page fx-premium-categories-page">
      {/* Toast Notification */}
      {notification && (
        <div className={`notification-banner ${notification.type === 'error' ? 'notification-error' : 'notification-success'}`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Shared Header Navigation */}
      <Navbar onSearch={(query) => setBookSearch(query)} />

      {/* Main Content Explorer */}
      <main className="fx-content-container">
        {isLoadingCategories ? (
          <div className="catalog-loader-container">
            <div className="catalog-spinner"></div>
            <p>Loading library categories...</p>
          </div>
        ) : (
          /* Dual-Column Studio Explorer Layout */
          <div className="fx-cat-layout-wrapper">
            {/* ====================================================================
               LEFT SIDEBAR: CATEGORY LIST
               ==================================================================== */}
            <aside className="fx-cat-sidebar">
              <div className="fx-cat-sidebar-header">
                <h3 className="fx-cat-sidebar-title">Categories</h3>
                <span className="fx-cat-sidebar-badge">{categories.length}</span>
              </div>

              {/* Category Search inside Sidebar */}
              <div className="fx-cat-sidebar-search">
                <svg
                  className="fx-cat-search-icon"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="fx-cat-sidebar-input"
                  placeholder="Filter category..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />
                {categorySearch && (
                  <button
                    type="button"
                    className="fx-cat-sidebar-clear"
                    onClick={() => setCategorySearch('')}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Categories Scrollable List */}
              <nav className="fx-cat-list-nav">
                {/* All Categories Option */}
                <button
                  type="button"
                  className={`fx-cat-list-item ${selectedCategoryId === null ? 'active' : ''}`}
                  onClick={() => handleSelectCategory(null)}
                >
                  <span className="fx-cat-item-icon">🌟</span>
                  <span className="fx-cat-item-name">All Categories</span>
                  <span className="fx-cat-item-count">{totalAllBooksCount}</span>
                </button>

                {filteredCategories.length === 0 ? (
                  <div className="fx-cat-no-match">No category found</div>
                ) : (
                  filteredCategories.map((cat) => {
                    const count = cat.bookCount || 0
                    const isSelected = selectedCategoryId === cat.id
                    const icon = getCategoryIcon(cat.name)

                    return (
                      <button
                        type="button"
                        key={cat.id}
                        className={`fx-cat-list-item ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectCategory(cat.id)}
                        title={cat.name}
                      >
                        <span className="fx-cat-item-icon">{icon}</span>
                        <span className="fx-cat-item-name">{cat.name}</span>
                        <span className="fx-cat-item-count">{count}</span>
                      </button>
                    )
                  })
                )}
              </nav>
            </aside>

            {/* ====================================================================
               RIGHT CONTENT: BOOKS GRID
               ==================================================================== */}
            <section className="fx-cat-main-content">
              {isLoadingBooks ? (
                /* Instant Skeleton Shimmer Grid Feedback when switching categories */
                <div className="fx-book-grid fx-cat-books-grid">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={`category-switch-skeleton-${idx}`} className="fx-skeleton-card">
                      <div className="fx-skeleton-thumb"></div>
                      <div className="fx-skeleton-line fx-skeleton-line-title"></div>
                      <div className="fx-skeleton-line fx-skeleton-line-author"></div>
                      <div className="fx-skeleton-line fx-skeleton-line-tag"></div>
                      <div className="fx-skeleton-shimmer"></div>
                    </div>
                  ))}
                </div>
              ) : books.length === 0 ? (
                <div className="catalog-empty-container fx-empty-category-box">
                  <svg
                    width="60"
                    height="60"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <h3>No Books Found</h3>
                  <p>
                    {bookSearch
                      ? `We couldn't find any books matching "${bookSearch}" in this collection.`
                      : 'There are currently no books available in this category.'}
                  </p>
                  {(bookSearch || selectedCategoryId !== null) && (
                    <button
                      type="button"
                      className="fx-btn-reset-filter"
                      onClick={() => {
                        setSelectedCategoryId(null)
                        setBookSearch('')
                        setSearchParams({})
                      }}
                    >
                      View All Collections
                    </button>
                  )}
                </div>
              ) : (
                <div className="fx-book-grid fx-cat-books-grid">
                  {books.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onClick={handleOpenDetail}
                      showRating={true}
                    />
                  ))}

                  {/* Skeleton placeholder cards ("mờ mờ") when scrolling to load next batch */}
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
              )}
            </section>
          </div>
        )}
      </main>

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

export default Categories
