import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import AddEditBookModal from '../components/AddEditBookModal'
import AdminBooksControls from '../components/AdminBooksControls'
import AdminBooksTable from '../components/AdminBooksTable'
import ManageCopiesModal from '../components/ManageCopiesModal'
import '../styles/dashboard.css'

const AdminBooks = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // State for books table & pagination
  const [books, setBooks] = useState([])
  const [filteredBooks, setFilteredBooks] = useState([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchNavbarQuery, setSearchNavbarQuery] = useState('')
  const [notification, setNotification] = useState(null)

  // Dropdown list data for AddEditBookModal
  const [authors, setAuthors] = useState([])
  const [categories, setCategories] = useState([])
  const [publishers, setPublishers] = useState([])

  // Modal States for Add/Edit Book
  const [showBookModal, setShowBookModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    isbn: '',
    description: '',
    publishedDate: '',
    pageCount: 0,
    price: 0,
    discountPrice: 0,
    language: 'English',
    currencyCode: 'VND',
    thumbnail: '',
    pdfLink: '',
    publisherId: '',
    authorIds: [],
    categoryIds: []
  })

  // Modal States for Book Copies Management
  const [showCopiesModal, setShowCopiesModal] = useState(false)
  const [copiesBook, setCopiesBook] = useState(null)
  const [totalCopiesInput, setTotalCopiesInput] = useState(0)
  const [availableCopiesText, setAvailableCopiesText] = useState(0)
  const [isCopiesLoading, setIsCopiesLoading] = useState(false)

  // Map to store stock copies (key: bookId, value: {available, total})
  const [copiesStock, setCopiesStock] = useState({})

  // Debouncing search query input (PauseTransition 0.5s in JavaFX)
  const searchTimeoutRef = useRef(null)

  // Show Toast notification
  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

  // Handle closing avatar dropdown clicking outside
  useEffect(() => {
    const handleClose = () => setShowDropdown(false)
    window.addEventListener('click', handleClose)
    return () => {
      window.removeEventListener('click', handleClose)
    }
  }, [])

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const fetchDropdownsData = useCallback(async () => {
    try {
      const [authRes, catRes, pubRes] = await Promise.all([
        api.get('/api/authors'),
        api.get('/api/categories'),
        api.get('/api/publishers')
      ])
      setAuthors(authRes.data || [])
      setCategories(catRes.data || [])
      setPublishers(pubRes.data || [])
    } catch (err) {
      console.error('Failed to load dropdown data:', err)
    }
  }, [])

  // Fetch dropdown list data once on mount
  useEffect(() => {
    fetchDropdownsData()
  }, [fetchDropdownsData])

  const fetchBooks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = {
        page: page,
        size: pageSize,
        sortBy: 'id',
        sortDir: 'desc'
      }
      if (searchQuery.trim()) {
        params.q = searchQuery.trim()
      }

      const response = await api.get('/api/books', { params })
      const data = response.data

      if (data && Array.isArray(data.content)) {
        setBooks(data.content)
        setTotalElements(data.totalElements || 0)
      } else if (Array.isArray(data)) {
        setBooks(data)
        setTotalElements(data.length)
      } else {
        setBooks([])
        setTotalElements(0)
      }
    } catch (err) {
      console.error('Failed to load books for admin:', err)
      setError('Failed to load book data. Please check connection.')
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, searchQuery])

  // Fetch books on page/pageSize/searchQuery changes
  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  // Apply active status local filter (matches JavaFX onFilter)
  useEffect(() => {
    if (activeFilter === 'All') {
      setFilteredBooks(books)
    } else {
      const isTrue = activeFilter === 'True'
      const filtered = books.filter(b => b.activated === isTrue)
      setFilteredBooks(filtered)
    }
  }, [books, activeFilter])

  const fetchBookCopiesStock = useCallback(async (bookId) => {
    try {
      const res = await api.get(`/api/book-copies/book/${bookId}`)
      if (res.data) {
        setCopiesStock(prev => ({
          ...prev,
          [bookId]: {
            available: res.data.availableCopies,
            total: res.data.totalCopies
          }
        }))
      }
    } catch {
      // Set to 0 if record not found
      setCopiesStock(prev => ({
        ...prev,
        [bookId]: { available: 0, total: 0 }
      }))
    }
  }, [])

  // Fetch copies stock for each book in the list
  useEffect(() => {
    if (books.length > 0) {
      books.forEach(book => {
        fetchBookCopiesStock(book.id)
      })
    }
  }, [books, fetchBookCopiesStock])

  const handleSearchChange = (e) => {
    const val = e.target.value
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(val)
      setPage(0)
    }, 500)
  }

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value))
    setPage(0)
  }

  const handleNextPage = () => {
    if ((page + 1) * pageSize < totalElements) {
      setPage(prev => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (page > 0) {
      setPage(prev => prev - 1)
    }
  }

  const handleNavbarSearchSubmit = (e) => {
    e.preventDefault()
    if (searchNavbarQuery.trim()) {
      setSearchQuery(searchNavbarQuery)
      setPage(0)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return dateStr
    }
  }

  const getInitials = () => {
    if (!user?.displayName) return 'AD'
    const parts = user.displayName.split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // --- CRUD ACTIONS ---

  // Handle select multiple change for AddEditBookModal
  const handleMultipleSelectChange = (e, name) => {
    const options = e.target.options
    const values = []
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(Number(options[i].value))
      }
    }
    setFormData(prev => ({ ...prev, [name]: values }))
  }

  // Open modal for Creating new book
  const handleCreateBook = () => {
    setSelectedBook(null)
    setFormData({
      title: '',
      isbn: '',
      description: '',
      publishedDate: '',
      pageCount: 0,
      price: 0,
      discountPrice: 0,
      language: 'English',
      currencyCode: 'VND',
      thumbnail: '',
      pdfLink: '',
      publisherId: '',
      authorIds: [],
      categoryIds: []
    })
    setShowBookModal(true)
  }

  // Open modal for Editing existing book
  const handleEditBook = (book) => {
    setSelectedBook(book)
    setFormData({
      title: book.title || '',
      isbn: book.isbn || '',
      description: book.description || '',
      publishedDate: book.publishedDate || '',
      pageCount: book.pageCount || 0,
      price: book.price || 0,
      discountPrice: book.discountPrice || 0,
      language: book.language || 'English',
      currencyCode: book.currencyCode || 'VND',
      thumbnail: book.thumbnail || '',
      pdfLink: book.pdfLink || '',
      publisherId: book.publisher?.id || '',
      authorIds: book.authors ? book.authors.map(a => a.id) : [],
      categoryIds: book.categories ? book.categories.map(c => c.id) : []
    })
    setShowBookModal(true)
  }

  // Handle Submit of Add/Edit form
  const handleBookFormSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        publisherId: Number(formData.publisherId),
        pageCount: Number(formData.pageCount),
        price: Number(formData.price),
        discountPrice: Number(formData.discountPrice),
        authorIds: (formData.authorIds || []).map(Number),
        categoryIds: (formData.categoryIds || []).map(Number)
      }

      if (selectedBook) {
        const confirmUpdate = window.confirm(`Are you sure you want to update the book "${payload.title}"?`)
        if (!confirmUpdate) return

        await api.put(`/api/books/${selectedBook.id}`, payload)
        showToast(`Successfully updated book "${payload.title}"`)
      } else {
        const confirmAdd = window.confirm(`Are you sure you want to add the new book "${payload.title}"?`)
        if (!confirmAdd) return

        await api.post('/api/books', payload)
        showToast(`Successfully created new book "${payload.title}"`)
      }

      setShowBookModal(false)
      fetchBooks()
    } catch (err) {
      console.error('Failed to save book:', err)
      const errorMsg = err.response?.data?.message || 'Failed to save book details. Please check form inputs.'
      alert(`Error: ${errorMsg}`)
    }
  }

  // Delete Book action
  const handleDeleteBook = async (book) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete book "${book.title}" (ISBN: ${book.isbn})?`)
    if (confirmDelete) {
      try {
        await api.delete(`/api/books/${book.id}`)
        showToast(`Successfully deleted book "${book.title}"`)
        fetchBooks()
      } catch (err) {
        console.error('Failed to delete book:', err)
        alert('Failed to delete book. It might be linked to existing loans.')
      }
    }
  }

  // --- COPIES STOCK MANAGEMENT ---

  // Open Copies modal
  const handleManageCopies = async (book) => {
    setCopiesBook(book)
    setIsCopiesLoading(true)
    setTotalCopiesInput(0)
    setAvailableCopiesText(0)
    setShowCopiesModal(true)
    
    try {
      const res = await api.get(`/api/book-copies/book/${book.id}`)
      if (res.data) {
        setTotalCopiesInput(res.data.totalCopies)
        setAvailableCopiesText(res.data.availableCopies)
      }
    } catch {
      // If not found, default to 0
      setTotalCopiesInput(0)
      setAvailableCopiesText(0)
    } finally {
      setIsCopiesLoading(false)
    }
  }

  // Handle Submit copies update
  const handleCopiesFormSubmit = async (e) => {
    e.preventDefault()
    if (!copiesBook) return
    try {
      await api.put(`/api/book-copies/book/${copiesBook.id}`, null, {
        params: { totalCopies: totalCopiesInput }
      })
      showToast(`Successfully updated copies for "${copiesBook.title}"`)
      setShowCopiesModal(false)
      fetchBookCopiesStock(copiesBook.id) // Reload stock for this specific book
    } catch (err) {
      console.error('Failed to update copies:', err)
      alert('Failed to update book copies. Please try again.')
    }
  }

  return (
    <div className="db-container">
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`notification-banner ${notification.type === 'error' ? 'notification-error' : 'notification-success'}`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="fx-navbar">
        <div className="fx-navbar-left">
          <Link to="/dashboard" className="fx-logo-container">
            <div className="fx-logo-icon">
              <div className="fx-logo-bar fx-logo-bar-1"></div>
              <div className="fx-logo-bar fx-logo-bar-2"></div>
              <div className="fx-logo-bar fx-logo-bar-3"></div>
            </div>
            <span className="fx-logo-text">Library Manager</span>
          </Link>
        </div>

        <div className="fx-navbar-middle">
          <form onSubmit={handleNavbarSearchSubmit} className="fx-search-form">
            <input
              type="text"
              className="fx-search-input"
              placeholder="Search book..."
              value={searchNavbarQuery}
              onChange={(e) => setSearchNavbarQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="fx-navbar-right">
          <nav className="fx-nav-links">
            <Link to="/dashboard" className="fx-nav-link">Home</Link>
            <Link to="/books" className="fx-nav-link">All Books</Link>
            <Link to="/categories" className="fx-nav-link">Categories</Link>
            <Link to="/loans" className="fx-nav-link">My Loans</Link>
            <Link to="/favorites" className="fx-nav-link">My Favorites</Link>
          </nav>

          {user && (
            <div className="fx-user-menu-container">
              <div
                className="fx-user-avatar"
                style={{
                  border: '2px solid var(--color-primary)',
                  backgroundImage: user.photoUrl ? `url(${user.photoUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  cursor: 'pointer'
                }}
                title={user.displayName || 'Admin'}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDropdown(!showDropdown)
                }}
              >
                {!user.photoUrl && getInitials()}
              </div>

              {showDropdown && (
                <div className="fx-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  <div className="fx-dropdown-header">
                    <span className="fx-dropdown-name">{user.displayName || 'Administrator'}</span>
                    <span className="fx-dropdown-email">{user.email || ''}</span>
                    <span className="db-badge db-badge-admin" style={{ marginTop: '0.25rem', display: 'inline-block' }}>Admin</span>
                  </div>

                  <Link to="/profile" className="fx-dropdown-item" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setShowDropdown(false)}>
                    👤 Hồ sơ cá nhân & Avatar
                  </Link>

                  <div className="fx-dropdown-item" style={{ cursor: 'default' }}>
                    <span>Theme:</span>
                    <button className="fx-theme-switch-btn" onClick={toggleTheme}>
                      {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
                    </button>
                  </div>

                  <button className="fx-dropdown-item logout-item" onClick={logout}>
                    Log out ➔
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Admin Sidebar & Content Layout */}
      <div className="admin-books-layout">
        {/* Left Sidebar */}
        <aside className="db-sidebar">
          <button className="db-sidebar-btn" onClick={() => navigate('/admin/dashboard')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Dashboard
          </button>
          
          <button className="db-sidebar-btn active" onClick={() => navigate('/admin/books')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Books
          </button>

          <button className="db-sidebar-btn" onClick={() => navigate('/admin/loans')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Loans
          </button>

          <button className="db-sidebar-btn" onClick={() => navigate('/admin/users')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Users
          </button>

          <button className="db-sidebar-btn" onClick={() => navigate('/admin/fines')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Fines
          </button>

          <button className="db-sidebar-btn" onClick={() => navigate('/admin/categories')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Categories
          </button>
        </aside>

        {/* Content Area */}
        <main className="admin-books-content">
          <div className="admin-books-header">
            <h1 className="admin-books-title">Manage Books</h1>
          </div>

          {/* Action Row - Search, Filters, New Button, Pagination Controls */}
          <AdminBooksControls
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            handleCreateBook={handleCreateBook}
            totalElements={totalElements}
            page={page}
            pageSize={pageSize}
            handlePageSizeChange={handlePageSizeChange}
            handlePrevPage={handlePrevPage}
            handleNextPage={handleNextPage}
            isLoading={isLoading}
          />

          {/* Error Banner */}
          {error && (
            <div style={{ color: 'var(--color-danger)', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {/* Main Datatable */}
          <AdminBooksTable
            isLoading={isLoading}
            filteredBooks={filteredBooks}
            copiesStock={copiesStock}
            formatDate={formatDate}
            onEdit={handleEditBook}
            onManageCopies={handleManageCopies}
            onDelete={handleDeleteBook}
          />
        </main>
      </div>

      {/* Add / Edit Book Modal component */}
      <AddEditBookModal
        show={showBookModal}
        selectedBook={selectedBook}
        formData={formData}
        setFormData={setFormData}
        publishers={publishers}
        authors={authors}
        categories={categories}
        onClose={() => setShowBookModal(false)}
        onSubmit={handleBookFormSubmit}
        handleMultipleSelectChange={handleMultipleSelectChange}
      />

      {/* Copies Stock Update Modal */}
      <ManageCopiesModal
        show={showCopiesModal}
        copiesBook={copiesBook}
        isCopiesLoading={isCopiesLoading}
        availableCopiesText={availableCopiesText}
        totalCopiesInput={totalCopiesInput}
        setTotalCopiesInput={setTotalCopiesInput}
        onClose={() => setShowCopiesModal(false)}
        onSubmit={handleCopiesFormSubmit}
      />
    </div>
  )
}

export default AdminBooks
