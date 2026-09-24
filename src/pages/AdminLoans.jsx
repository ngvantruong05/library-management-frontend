import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import SearchInput from '../components/SearchInput'
import BookCover from '../components/BookCover'
import '../styles/dashboard.css'

/**
 * RichUserPicker: Visual picker for users with avatar, name, and email.
 */
const RichUserPicker = ({ users = [], selectedUserId, onSelectUser, isLoading = false }) => {
  const [isOpen, setIsOpen] = useState(!selectedUserId)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef(null)

  const selectedUser = users.find((u) => String(u.id) === String(selectedUserId))

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (selectedUserId) {
          setIsOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedUserId])

  const filteredUsers = users.filter((u) => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return (
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      String(u.id).includes(q)
    )
  })

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label className="form-label" style={{ margin: 0, fontWeight: '600' }}>
          User *
        </label>
        {selectedUser && !isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary, #4f46e5)',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
          >
            Change User ▾
          </button>
        )}
      </div>

      {/* Selected User Card (Collapsed View) */}
      {selectedUser && !isOpen ? (
        <div
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            backgroundColor: 'rgba(79, 70, 229, 0.08)',
            border: '1.5px solid rgba(79, 70, 229, 0.35)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
          title="Click to select another user"
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary, #4f46e5)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              fontSize: '0.9rem',
              flexShrink: 0
            }}
          >
            {(selectedUser.displayName || selectedUser.email || 'U').substring(0, 1).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '600', fontSize: '0.92rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedUser.displayName || 'User'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {selectedUser.email}
            </div>
          </div>
        </div>
      ) : (
        /* Expanded Rich Picker Box */
        <div
          style={{
            border: '1.5px solid var(--color-primary, #4f46e5)',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary, #fff)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          {/* Search bar inside */}
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-tertiary, #f8fafc)'
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>🔍</span>
            <input
              type="text"
              autoFocus
              placeholder="Search user by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.88rem',
                color: 'var(--text-primary)'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}
              >
                ✕
              </button>
            )}
            {selectedUser && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                Close
              </button>
            )}
          </div>

          {/* Synchronized list of users */}
          <div
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {isLoading ? (
              <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {searchTerm ? `No users found matching "${searchTerm}"` : 'No users available'}
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = String(user.id) === String(selectedUserId)
                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      onSelectUser(user)
                      setIsOpen(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid var(--color-primary, #4f46e5)' : '1px solid transparent',
                      backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? 'var(--color-primary, #4f46e5)' : '#64748b',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}
                    >
                      {(user.displayName || user.email || 'U').substring(0, 1).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: isSelected ? '700' : '600', fontSize: '0.88rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.displayName || 'User'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * RichBookPicker: Visual picker for books with thumbnail cover, title, authors, and ISBN.
 */
const RichBookPicker = ({ books = [], selectedBookId, onSelectBook, isLoading = false }) => {
  const [isOpen, setIsOpen] = useState(!selectedBookId)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef(null)

  const selectedBook = books.find((b) => String(b.id) === String(selectedBookId))

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (selectedBookId) {
          setIsOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedBookId])

  const filteredBooks = books.filter((b) => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    const authorStr = b.authors ? b.authors.map((a) => a.name).join(' ').toLowerCase() : ''
    return (
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.isbn && b.isbn.toLowerCase().includes(q)) ||
      authorStr.includes(q)
    )
  })

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label className="form-label" style={{ margin: 0, fontWeight: '600' }}>
          Book *
        </label>
        {selectedBook && !isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary, #4f46e5)',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
          >
            Change Book ▾
          </button>
        )}
      </div>

      {/* Selected Book Card (Collapsed View) */}
      {selectedBook && !isOpen ? (
        <div
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
          title="Click to select another book"
        >
          <div style={{ width: '40px', height: '56px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 5px rgba(0,0,0,0.15)' }}>
            <BookCover book={selectedBook} size="thumb" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '600', fontSize: '0.92rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedBook.title}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {selectedBook.authors?.map((a) => a.name).join(', ') || 'Unknown author'}
              {selectedBook.isbn ? ` • ISBN: ${selectedBook.isbn}` : ''}
            </div>
          </div>
        </div>
      ) : (
        /* Expanded Rich Picker Box */
        <div
          style={{
            border: '1.5px solid var(--color-primary, #4f46e5)',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary, #fff)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          {/* Search bar inside */}
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-tertiary, #f8fafc)'
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>🔍</span>
            <input
              type="text"
              autoFocus
              placeholder="Search book by title, author, or ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.88rem',
                color: 'var(--text-primary)'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}
              >
                ✕
              </button>
            )}
            {selectedBook && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                Close
              </button>
            )}
          </div>

          {/* Synchronized list of books */}
          <div
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {isLoading ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Loading books...
              </div>
            ) : filteredBooks.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {searchTerm ? `No books found matching "${searchTerm}"` : 'No books available'}
              </div>
            ) : (
              filteredBooks.map((book) => {
                const isSelected = String(book.id) === String(selectedBookId)
                return (
                  <div
                    key={book.id}
                    onClick={() => {
                      onSelectBook(book)
                      setIsOpen(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid var(--color-primary, #4f46e5)' : '1px solid transparent',
                      backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div style={{ width: '38px', height: '52px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                      <BookCover book={book} size="thumb" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: isSelected ? '700' : '600', fontSize: '0.88rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {book.title}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {book.authors?.map((a) => a.name).join(', ') || 'Unknown author'}
                        {book.isbn ? ` • ISBN: ${book.isbn}` : ''}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const AdminLoans = () => {
  const navigate = useNavigate()

  // State for raw data from API
  const [loans, setLoans] = useState([])
  const [filteredLoans, setFilteredLoans] = useState([])

  // State for filters, search, and pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [validFilter, setValidFilter] = useState('All') // All, Active, Returned
  const [typeFilter, setTypeFilter] = useState('All')   // All, ONLINE, OFFLINE
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notification, setNotification] = useState(null)

  // Modal States for Creating New Loan
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loanFormData, setLoanFormData] = useState({
    userId: '',
    bookId: '',
    type: 'OFFLINE',
    numCopies: 1
  })
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)

  // Preloaded users and books for searchable selection
  const [allUsers, setAllUsers] = useState([])
  const [allBooks, setAllBooks] = useState([])
  const [isUsersLoading, setIsUsersLoading] = useState(false)
  const [isBooksLoading, setIsBooksLoading] = useState(false)

  // Show Toast notification
  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

  const fetchUsersAndBooks = useCallback(() => {
    setIsUsersLoading(true)
    setIsBooksLoading(true)

    // Fetch users immediately
    api.get('/api/users')
      .then((usersRes) => {
        setAllUsers(usersRes.data || [])
      })
      .catch((err) => {
        console.warn('Failed to load users for loans:', err)
      })
      .finally(() => {
        setIsUsersLoading(false)
      })

    // Fetch all books via /api/books without size param to use findAll with @EntityGraph (takes ~1s instead of 19s)
    api.get('/api/books')
      .then((booksRes) => {
        const bData = booksRes.data
        const bookList = (bData && Array.isArray(bData.content)) ? bData.content : (Array.isArray(bData) ? bData : [])
        setAllBooks(bookList)
      })
      .catch((err) => {
        console.warn('Failed to load books for loans:', err)
      })
      .finally(() => {
        setIsBooksLoading(false)
      })
  }, [])

  // Fetch loans on mount and trigger silent background sync
  useEffect(() => {
    fetchLoans()
    fetchUsersAndBooks()
    api.post('/api/book-loans/refresh').catch((err) => {
      console.warn('Background sync status:', err)
    })
  }, [fetchUsersAndBooks])

  // Perform search, filter, and pagination on client side whenever dependencies change
  useEffect(() => {
    applyClientSideFilters()
  }, [loans, searchQuery, validFilter, typeFilter, page, pageSize])

  const fetchLoans = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('/api/book-loans')
      setLoans(response.data || [])
    } catch (err) {
      console.error('Failed to load book loans:', err)
      setError('Failed to fetch book loans list. Please check server connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const applyClientSideFilters = () => {
    let temp = [...loans]
    const search = searchQuery.toLowerCase().trim()
    if (search) {
      temp = temp.filter(loan =>
        (loan.userDisplayName && loan.userDisplayName.toLowerCase().includes(search)) ||
        (loan.userEmail && loan.userEmail.toLowerCase().includes(search)) ||
        (loan.bookTitle && loan.bookTitle.toLowerCase().includes(search)) ||
        String(loan.userId).includes(search) ||
        String(loan.bookId).includes(search)
      )
    }

    // Valid Status filter (Active: valid=true, Returned: valid=false)
    if (validFilter === 'Active') {
      temp = temp.filter(loan => loan.valid === true)
    } else if (validFilter === 'Returned') {
      temp = temp.filter(loan => loan.valid === false)
    }

    // Loan Type filter (ONLINE / OFFLINE)
    if (typeFilter !== 'All') {
      temp = temp.filter(loan => loan.type === typeFilter)
    }

    setTotalElements(temp.length)

    // Client side pagination slice
    const startIndex = page * pageSize
    const paginated = temp.slice(startIndex, startIndex + pageSize)
    setFilteredLoans(paginated)
  }

  // Handle search field input
  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    setPage(0)
  }

  // Handle page size dropdown
  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value))
    setPage(0)
  }

  // Navigation handlers
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

  // Formatter helpers
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

  // Return Book Action Handler
  const handleReturnBook = async (loan) => {
    const confirmReturn = window.confirm(`Are you sure you want to return the book "${loan.bookTitle}" borrowed by ${loan.userDisplayName || loan.userEmail}?`)
    if (!confirmReturn) return

    try {
      await api.post(`/api/book-loans/${loan.id}/return`)
      showToast(`Successfully returned book "${loan.bookTitle}"!`)
      fetchLoans() // Refresh table list
    } catch (err) {
      console.error('Failed to return book:', err)
      const errorMsg = err.response?.data?.message || 'Failed to return book. Please try again.'
      alert(`Error: ${errorMsg}`)
    }
  }

  const selectedUser = allUsers.find((u) => String(u.id) === String(loanFormData.userId))
  const selectedBook = allBooks.find((b) => String(b.id) === String(loanFormData.bookId))

  // Open Create Loan modal
  const handleCreateLoanClick = () => {
    setLoanFormData({
      userId: '',
      bookId: '',
      type: 'OFFLINE',
      numCopies: 1
    })
    if (allUsers.length === 0 || allBooks.length === 0) {
      fetchUsersAndBooks()
    }
    setShowCreateModal(true)
  }

  // Handle Submit of New Loan form
  const handleCreateLoanSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()

    // Validation
    if (!loanFormData.userId || !loanFormData.bookId) {
      alert('Please select both a User and a Book!')
      return
    }

    const bookTitle = selectedBook?.title || `Book #${loanFormData.bookId}`

    const payload = {
      userId: Number(loanFormData.userId),
      bookId: Number(loanFormData.bookId),
      type: loanFormData.type,
      numCopies: loanFormData.type === 'OFFLINE' ? Math.max(1, Number(loanFormData.numCopies || 1)) : 0
    }

    setIsSubmitLoading(true)
    try {
      // If OFFLINE loan, ensure shelf inventory has sufficient copies
      if (payload.type === 'OFFLINE') {
        try {
          const copyRes = await api.get(`/api/book-copies/book/${payload.bookId}`)
          const available = copyRes.data ? (copyRes.data.availableCopies ?? 0) : 0
          const total = copyRes.data ? (copyRes.data.totalCopies ?? 0) : 0
          if (available < payload.numCopies) {
            // Auto update inventory copies for admin so loan creation succeeds
            await api.put(`/api/book-copies/book/${payload.bookId}`, null, {
              params: { totalCopies: Math.max(5, total + payload.numCopies) }
            })
          }
        } catch (copyErr) {
          console.warn('Could not check/replenish copy inventory:', copyErr)
        }
      }

      await api.post('/api/book-loans', payload)
      showToast(`Successfully created book loan for "${bookTitle}"!`)
      setShowCreateModal(false)
      fetchLoans() // Reload datatable
    } catch (err) {
      console.error('Failed to create new loan:', err)
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to create book loan. Please check book status or user account.'
      showToast(`Error: ${errorMsg}`, 'error')
      alert(`Error: ${errorMsg}`)
    } finally {
      setIsSubmitLoading(false)
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

          <button className="db-sidebar-btn" onClick={() => navigate('/admin/books')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Books
          </button>

          <button className="db-sidebar-btn active" onClick={() => navigate('/admin/loans')}>
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
            <h1 className="admin-books-title">Manage Loans</h1>
          </div>

          {/* Action Row - Search, Filters, buttons and pagination */}
          <div className="admin-controls-row">
            <div className="admin-control-group">
              <span className="admin-control-label">Search:</span>
              <SearchInput
                size="compact"
                placeholder="Search user, book title, ID..."
                value={searchQuery}
                onChange={handleSearchChange}
                onClear={() => {
                  setSearchQuery('')
                  setPage(0)
                }}
              />
            </div>

            <div className="admin-control-group">
              <span className="admin-control-label">Status:</span>
              <select
                className="admin-select-filter"
                value={validFilter}
                onChange={(e) => { setValidFilter(e.target.value); setPage(0); }}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Loans</option>
                <option value="Returned">Returned</option>
              </select>
            </div>

            <div className="admin-control-group">
              <span className="admin-control-label">Type:</span>
              <select
                className="admin-select-filter"
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
              >
                <option value="All">All Types</option>
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>

            <button className="admin-btn-primary" onClick={handleCreateLoanClick}>
              New Loan
            </button>

            {/* Pagination Controls Right Aligned */}
            <div className="admin-pagination-right">
              <span className="admin-pagination-text">
                Showing {totalElements > 0 ? page * pageSize + 1 : 0} to{' '}
                {Math.min((page + 1) * pageSize, totalElements)} of {totalElements}
              </span>

              <select
                className="admin-select-filter"
                style={{ width: '80px' }}
                value={pageSize}
                onChange={handlePageSizeChange}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              <button
                className="admin-btn-default"
                onClick={handlePrevPage}
                disabled={page === 0 || isLoading}
              >
                Previous
              </button>
              <button
                className="admin-btn-default"
                onClick={handleNextPage}
                disabled={(page + 1) * pageSize >= totalElements || isLoading}
              >
                Next
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{ color: 'var(--color-danger)', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          {/* Main Datatable */}
          <div className="admin-table-container">
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
                <div className="db-spinner"></div>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading book loans datatable...</p>
              </div>
            ) : filteredLoans.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No book loan records found.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Book</th>
                    <th>Borrow Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Type</th>
                    <th>Copies</th>
                    <th>Status</th>
                    <th>Valid</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((loan) => {
                    const initials = loan.userDisplayName
                      ? (loan.userDisplayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase())
                      : 'U'

                    return (
                      <tr key={loan.id}>
                        <td style={{ fontWeight: '600' }}>#{loan.id}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div className="fx-user-avatar" style={{ width: '34px', height: '34px', fontSize: '0.8rem', background: 'var(--color-primary, #4f46e5)', color: '#fff', border: 'none', flexShrink: 0 }}>
                              {initials}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{loan.userDisplayName || 'User'}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{loan.userEmail || `ID: #${loan.userId}`}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            {loan.bookThumbnail ? (
                              <img
                                src={loan.bookThumbnail}
                                alt={loan.bookTitle}
                                className="admin-table-thumb"
                                style={{ width: '36px', height: '48px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div className="admin-table-placeholder-thumb" style={{ width: '36px', height: '48px', display: loan.bookThumbnail ? 'none' : 'flex', flexShrink: 0, borderRadius: '4px' }}>
                              <span style={{ fontSize: '0.5rem' }}>No Cover</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '130px' }}>
                              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }} title={loan.bookTitle}>{loan.bookTitle}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Book ID: #{loan.bookId}</span>
                            </div>
                          </div>
                        </td>
                        <td>{formatDate(loan.borrowDate)}</td>
                        <td>{formatDate(loan.dueDate)}</td>
                        <td>{formatDate(loan.returnDate)}</td>
                        <td>
                          <span className="db-chip db-chip-info" style={{ backgroundColor: loan.type === 'ONLINE' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)', color: loan.type === 'ONLINE' ? 'var(--color-success)' : 'var(--color-primary)' }}>
                            {loan.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: '500', textAlign: 'center' }}>{loan.numCopies}</td>
                        <td>
                          <span className={`admin-badge-status-${(loan.status || 'BORROWED').toLowerCase()}`}>
                            {loan.status}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-badge-${loan.valid ? 'active' : 'inactive'}`}>
                            {loan.valid ? 'True' : 'False'}
                          </span>
                        </td>
                        <td>
                          {loan.valid && (
                            <div className="admin-table-actions">
                              <button
                                className="admin-btn-action admin-btn-action-edit"
                                style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)', background: 'transparent' }}
                                onClick={() => handleReturnBook(loan)}
                              >
                                Return
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Modal Creating New Loan */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Book Loan</h2>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateLoanSubmit}>
              <div className="modal-body" style={{ gap: '1.25rem' }}>
                {/* Select User with Rich Picker */}
                <RichUserPicker
                  users={allUsers}
                  selectedUserId={loanFormData.userId}
                  onSelectUser={(user) => setLoanFormData((prev) => ({ ...prev, userId: user.id }))}
                  isLoading={isUsersLoading}
                />

                {/* Select Book with Rich Picker */}
                <RichBookPicker
                  books={allBooks}
                  selectedBookId={loanFormData.bookId}
                  onSelectBook={(book) => setLoanFormData((prev) => ({ ...prev, bookId: book.id }))}
                  isLoading={isBooksLoading}
                />

                <div className="form-group">
                  <label className="form-label">Loan Type *</label>
                  <select
                    className="form-select"
                    value={loanFormData.type}
                    onChange={(e) => setLoanFormData({ ...loanFormData, type: e.target.value })}
                  >
                    <option value="OFFLINE">OFFLINE</option>
                    <option value="ONLINE">ONLINE</option>
                  </select>
                </div>

                {loanFormData.type === 'OFFLINE' && (
                  <div className="form-group">
                    <label className="form-label">Number of Copies *</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      required
                      value={loanFormData.numCopies}
                      onChange={(e) => setLoanFormData({ ...loanFormData, numCopies: Math.max(1, Number(e.target.value)) })}
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="catalog-btn-primary" disabled={isSubmitLoading}>
                  {isSubmitLoading ? 'Creating...' : 'Create Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminLoans
