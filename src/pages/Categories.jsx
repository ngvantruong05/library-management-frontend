import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import BookCard from '../components/BookCard'
import BookDetailsModal from '../components/BookDetailsModal'
import '../styles/catalog.css'

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
  const [isLoading, setIsLoading] = useState(true)

  // Search & Filter states
  const [categorySearch, setCategorySearch] = useState('')
  const [bookSearch, setBookSearch] = useState('')
  const [notification, setNotification] = useState(null)

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)

  // Toast notification
  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [catRes, bookRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/books')
      ])

      const fetchedCategories = catRes.data || []
      const fetchedBooks = Array.isArray(bookRes.data?.content) ? bookRes.data.content : (bookRes.data || [])

      setCategories(fetchedCategories)
      setBooks(fetchedBooks)

      // Match category from initial query
      if (initialCategoryId) {
        setSelectedCategoryId(Number(initialCategoryId))
      } else if (initialCategoryName) {
        const found = fetchedCategories.find((c) => c.name.toLowerCase() === initialCategoryName.toLowerCase())
        if (found) setSelectedCategoryId(found.id)
      }
    } catch (error) {
      console.error('Failed to fetch categories/books, loading fallback mock data:', error)
      
      const mockCategories = [
        { id: 1, name: 'Software Engineering' },
        { id: 2, name: 'Programming' },
        { id: 3, name: 'Quantum Physics' },
        { id: 4, name: 'Data Science & AI' },
        { id: 5, name: 'Web Development' },
        { id: 6, name: 'Design & Architecture' },
        { id: 7, name: 'Database Management' },
        { id: 8, name: 'Business & Economics' },
      ]

      const mockBooks = [
        {
          id: 1,
          title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
          isbn: '978-0132350884',
          description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code.",
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
          rating: 4.8
        },
        {
          id: 2,
          title: 'The Pragmatic Programmer: Your Journey To Mastery',
          isbn: '978-0135957059',
          description: "The Pragmatic Programmer is one of those rare tech books you'll read, re-read, and read again over the years. Whether you're new to the field or an experienced practitioner, you'll come away with fresh insights.",
          publishedDate: '2019-09-13',
          pageCount: 352,
          price: 180531,
          discountPrice: 0,
          thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/51wI75O1rHL._SX386_BO1,204,203,200_.jpg',
          language: 'English',
          currencyCode: 'VND',
          publisher: { id: 2, name: 'Addison-Wesley' },
          authors: [{ id: 2, name: 'Andrew Hunt' }, { id: 3, name: 'David Thomas' }],
          categories: [{ id: 2, name: 'Programming' }, { id: 6, name: 'Design & Architecture' }],
          availableCopies: 0,
          rating: 4.7
        },
        {
          id: 3,
          title: 'Dancing with Python: Learn to code with Python and Quantum Computing',
          isbn: '978-1801077859',
          description: 'Dancing with Python helps you learn Python programming from scratch. From variables and loops to functions and classes, we guide you step-by-step through standard Python concepts before introducing quantum computing theory.',
          publishedDate: '2021-09-24',
          pageCount: 420,
          price: 245000,
          discountPrice: 195000,
          thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/41x94N1mY6L._SX404_BO1,204,203,200_.jpg',
          language: 'English',
          currencyCode: 'VND',
          publisher: { id: 3, name: 'Packt Publishing' },
          authors: [{ id: 4, name: 'Robert S. Sutor' }],
          categories: [{ id: 2, name: 'Programming' }, { id: 3, name: 'Quantum Physics' }, { id: 4, name: 'Data Science & AI' }],
          availableCopies: 3,
          rating: 4.5
        },
        {
          id: 4,
          title: 'Designing Data-Intensive Applications',
          isbn: '978-1449373320',
          description: 'Data is at the center of many challenges in system design today. Difficult issues need to be figured out, such as scalability, consistency, reliability, efficiency, and maintainability.',
          publishedDate: '2017-03-16',
          pageCount: 616,
          price: 320000,
          discountPrice: 280000,
          thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/51ZSpMl1-2L._SX379_BO1,204,203,200_.jpg',
          language: 'English',
          currencyCode: 'VND',
          publisher: { id: 4, name: "O'Reilly Media" },
          authors: [{ id: 5, name: 'Martin Kleppmann' }],
          categories: [{ id: 1, name: 'Software Engineering' }, { id: 4, name: 'Data Science & AI' }, { id: 7, name: 'Database Management' }],
          availableCopies: 4,
          rating: 4.9
        }
      ]

      setCategories(mockCategories)
      setBooks(mockBooks)

      if (initialCategoryId) {
        setSelectedCategoryId(Number(initialCategoryId))
      } else if (initialCategoryName) {
        const found = mockCategories.find((c) => c.name.toLowerCase() === initialCategoryName.toLowerCase())
        if (found) setSelectedCategoryId(found.id)
      }
    } finally {
      setIsLoading(false)
    }
  }, [initialCategoryId, initialCategoryName])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  // Sync state if URL changes
  useEffect(() => {
    const paramId = searchParams.get('id')
    const paramName = searchParams.get('name')

    if (paramId) {
      setSelectedCategoryId(Number(paramId))
    } else if (paramName && categories.length > 0) {
      const found = categories.find((c) => c.name.toLowerCase() === paramName.toLowerCase())
      if (found) setSelectedCategoryId(found.id)
    } else {
      setSelectedCategoryId(null)
    }
  }, [searchParams, categories])

  // Category book counts map
  const categoryBookCounts = useMemo(() => {
    const counts = {}
    books.forEach((book) => {
      book.categories?.forEach((cat) => {
        counts[cat.id] = (counts[cat.id] || 0) + 1
      })
    })
    return counts
  }, [books])

  // Filtered categories in left sidebar
  const filteredCategories = useMemo(() => {
    const q = categorySearch.toLowerCase().trim()
    if (!q) return categories
    return categories.filter((cat) => cat.name.toLowerCase().includes(q))
  }, [categories, categorySearch])

  // Handle Category Selection
  const handleSelectCategory = (catId) => {
    setSelectedCategoryId(catId)
    setBookSearch('')
    if (catId === null) {
      setSearchParams({})
    } else {
      setSearchParams({ id: catId.toString() })
    }
  }

  // Filtered Books
  const displayedBooks = useMemo(() => {
    let result = books

    // Filter by Category
    if (selectedCategoryId !== null) {
      result = result.filter((b) => b.categories?.some((c) => c.id === selectedCategoryId))
    }

    // Filter by Book Search keyword
    const q = bookSearch.toLowerCase().trim()
    if (q) {
      result = result.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.isbn?.toLowerCase().includes(q) ||
          b.authors?.some((a) => a.name?.toLowerCase().includes(q)) ||
          b.categories?.some((c) => c.name?.toLowerCase().includes(q))
      )
    }

    return result
  }, [books, selectedCategoryId, bookSearch])

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
        {isLoading ? (
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
                  <span className="fx-cat-item-count">{books.length}</span>
                </button>

                {filteredCategories.length === 0 ? (
                  <div className="fx-cat-no-match">No category found</div>
                ) : (
                  filteredCategories.map((cat) => {
                    const count = categoryBookCounts[cat.id] || 0
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
              {/* Books Grid Display */}
              {displayedBooks.length === 0 ? (
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
                  {displayedBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onClick={handleOpenDetail}
                      showRating={true}
                    />
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
