import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Navbar from '../components/Navbar'
import BookCard from '../components/BookCard'
import BookDetailsModal from '../components/BookDetailsModal'
import '../styles/catalog.css'

const Dashboard = () => {
  const { user } = useAuth()
  
  // Lists
  const [topRatedBooks, setTopRatedBooks] = useState([])
  const [topLoansBooks, setTopLoansBooks] = useState([])
  
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

  // Load books
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/api/books')
      const allBooks = response.data || []
      
      // Separate or mock top rated/loans
      setTopRatedBooks(allBooks.slice(0, 5))
      setTopLoansBooks(allBooks.slice(2, 7))
    } catch (error) {
      console.error('Failed to load dashboard books, loading mock data:', error)
      
      const mockList = [
        {
          id: 1,
          title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
          isbn: '978-0132350884',
          description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code.',
          publishedDate: '2008-08-11',
          pageCount: 464,
          price: 178500,
          discountPrice: 178500,
          thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/41xShCOK5mL._SX379_BO1,204,203,200_.jpg',
          language: 'English',
          currencyCode: 'VND',
          publisher: { id: 1, name: 'Prentice Hall' },
          authors: [{ id: 1, name: 'Robert C. Martin' }],
          categories: [{ id: 1, name: 'Software Engineering' }],
          availableCopies: 5,
          rating: 4.75
        },
        {
          id: 2,
          title: 'The Pragmatic Programmer: Your Journey To Mastery',
          isbn: '978-0135957059',
          description: 'The Pragmatic Programmer is one of those rare tech books you\'ll read, re-read, and read again over the years. Whether you\'re new to the field or an experienced practitioner, you\'ll come away with fresh insights.',
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
          categories: [{ id: 2, name: 'Programming' }],
          availableCopies: 3,
          rating: 4.0
        }
      ]
      
      setTopRatedBooks(mockList)
      setTopLoansBooks([...mockList].reverse())
    }
  }

  // Handle open details modal
  const handleOpenDetail = (book) => {
    setSelectedBook(book)
    setShowDetailModal(true)
  }

  // Handle borrow request
  const handleBorrowSubmit = async (book, type) => {
    try {
      const payload = {
        bookId: book.id,
        type: type,
        numCopies: type === 'OFFLINE' ? 1 : 0,
      }
      await api.post('/api/book-loans', payload)
      showToast(`Requested borrow ${book.title} successfully as ${type}!`)
      setShowDetailModal(false)
    } catch (error) {
      console.error('Failed to request borrow:', error)
      const errorMsg = error.response?.data?.message || 'Failed to request book loan'
      showToast(errorMsg, 'error')
    }
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

        {/* Top Rated Section */}
        <section className="fx-section-container">
          <h2 className="fx-section-title">Top Rated</h2>
          <div className="fx-horizontal-scroll">
            {topRatedBooks.map((book) => (
              <BookCard
                key={`rated-${book.id}`}
                book={book}
                onClick={handleOpenDetail}
                showRating={true}
              />
            ))}
          </div>
        </section>

        {/* Top Loans Section */}
        <section className="fx-section-container">
          <h2 className="fx-section-title">Top Loans</h2>
          <div className="fx-horizontal-scroll">
            {topLoansBooks.map((book) => (
              <BookCard
                key={`loaned-${book.id}`}
                book={book}
                onClick={handleOpenDetail}
                showRating={true}
              />
            ))}
          </div>
        </section>
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
