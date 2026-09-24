import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import AddEditBookModal from '../components/AddEditBookModal'
import AdminBooksControls from '../components/AdminBooksControls'
import AdminBooksTable from '../components/AdminBooksTable'
import ManageCopiesModal from '../components/ManageCopiesModal'
import '../styles/dashboard.css'

const AdminBooks = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const urlQuery = searchParams.get('q') || ''

  // State for books table & pagination
  const [books, setBooks] = useState([])
  const [filteredBooks, setFilteredBooks] = useState([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [searchQuery, setSearchQuery] = useState(urlQuery)
  const [activeFilter, setActiveFilter] = useState('All')

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
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

  // Batch fetch copies stock for current page of books
  useEffect(() => {
    if (books.length === 0) return
    let isSubscribed = true

    Promise.allSettled(
      books.map(b => api.get(`/api/book-copies/book/${b.id}`))
    ).then(results => {
      if (!isSubscribed) return
      const updatedMap = {}
      results.forEach((res, index) => {
        const bookId = books[index].id
        if (res.status === 'fulfilled' && res.value?.data) {
          updatedMap[bookId] = {
            available: res.value.data.availableCopies,
            total: res.value.data.totalCopies
          }
        } else {
          updatedMap[bookId] = { available: 0, total: 0 }
        }
      })
      setCopiesStock(prev => ({ ...prev, ...updatedMap }))
    })

    return () => {
      isSubscribed = false
    }
  }, [books])

  // Sync state if URL query changes
  useEffect(() => {
    const qFromUrl = searchParams.get('q') || ''
    setSearchQuery(qFromUrl)
    setPage(0)
  }, [searchParams])

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setPage(0)
      if (val.trim()) {
        setSearchParams({ q: val.trim() })
      } else {
        setSearchParams({})
      }
    }, 400)
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

    if (!formData.title?.trim()) {
      alert('Book Title is required!')
      return
    }
    if (!formData.isbn?.trim()) {
      alert('ISBN is required!')
      return
    }
    if (!formData.publisherId) {
      alert('Please select a Publisher!')
      return
    }

    try {
      const payload = {
        title: formData.title.trim(),
        isbn: formData.isbn.trim(),
        description: formData.description?.trim() || '',
        publishedDate: formData.publishedDate?.trim() || '',
        pageCount: Number(formData.pageCount) || 0,
        price: Number(formData.price) || 0,
        discountPrice: Number(formData.discountPrice) || 0,
        language: formData.language?.trim() || 'English',
        currencyCode: formData.currencyCode || 'VND',
        thumbnail: formData.thumbnail?.trim() || '',
        pdfLink: formData.pdfLink?.trim() || '',
        publisherId: Number(formData.publisherId),
        authorIds: (formData.authorIds || []).map(Number),
        categoryIds: (formData.categoryIds || []).map(Number)
      }

      if (selectedBook) {
        await api.put(`/api/books/${selectedBook.id}`, payload)
        showToast(`Successfully updated book "${payload.title}"`)
      } else {
        const createRes = await api.post('/api/books', payload)
        const newBookId = createRes.data?.id
        if (newBookId) {
          // Initialize 10 copies on shelf so the book is immediately available for loans
          api.put(`/api/book-copies/book/${newBookId}?totalCopies=10`).catch(() => {})
        }
        showToast(`Successfully created new book "${payload.title}"`)
      }

      setShowBookModal(false)
      fetchBooks()
    } catch (err) {
      console.error('Failed to save book:', err)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to save book details. Please check form inputs.'
      alert(`Error: ${errorMsg}`)
    }
  }

  // Delete / Toggle Active Book action
  const handleDeleteBook = async (book) => {
    const isActivating = !book.activated
    const actionText = isActivating ? 'restore' : 'deactivate'
    const confirmAction = window.confirm(`Are you sure you want to ${actionText} book "${book.title}" (ISBN: ${book.isbn})?`)
    if (confirmAction) {
      try {
        if (isActivating) {
          await api.patch(`/api/books/${book.id}/activate`)
          showToast(`Successfully restored book "${book.title}"`)
        } else {
          await api.delete(`/api/books/${book.id}`)
          showToast(`Successfully deactivated book "${book.title}"`)
        }
        fetchBooks()
      } catch (err) {
        console.error('Failed to update book status:', err)
        alert('Failed to update book status. Please try again.')
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
      const res = await api.get(`/api/book-copies/book/${copiesBook.id}`)
      if (res.data) {
        setCopiesStock(prev => ({
          ...prev,
          [copiesBook.id]: {
            available: res.data.availableCopies,
            total: res.data.totalCopies
          }
        }))
      }
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
      <Navbar onSearch={(q) => { setSearchQuery(q); setPage(0); }} />

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

          <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <button className="db-sidebar-btn" onClick={() => navigate('/profile')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              My Profile
            </button>
          </div>
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
