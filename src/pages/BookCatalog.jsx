import React, { useState, useEffect } from 'react'
import api from '../services/api'
import Navbar from '../components/Navbar'
import BookCard from '../components/BookCard'
import '../styles/catalog.css'

const BookCatalog = () => {
  
  // Lists
  const [books, setBooks] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Load books on mount
  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async (query = '') => {
    setIsLoading(true)
    try {
      let response
      if (query) {
        response = await api.get(`/api/books/search?q=${encodeURIComponent(query)}`)
      } else {
        response = await api.get('/api/books')
      }
      setBooks(response.data || [])
    } catch (error) {
      console.error('Failed to fetch books, loading mock data for UI testing:', error)
      setBooks([
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
          categories: [{ id: 1, name: 'Software Engineering' }, { id: 2, name: 'Programming' }],
          availableCopies: 5,
          rating: 4.5
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
          categories: [{ id: 2, name: 'Programming' }, { id: 3, name: 'Quantum Physics' }],
          availableCopies: 3,
          rating: 4.75
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fx-catalog-page">
      {/* Shared Header Navigation */}
      <Navbar onSearch={fetchBooks} />

      {/* Main Content Area */}
      <main className="fx-content-container">
        <h2 className="fx-results-count">{books.length} results found</h2>

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
            <p>We couldn't find any books. Try another query.</p>
          </div>
        ) : (
          /* Book Grid */
          <div className="fx-book-grid">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                showRating={false}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default BookCatalog
