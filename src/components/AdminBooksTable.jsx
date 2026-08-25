import React from 'react'

const AdminBooksTable = ({
  isLoading,
  filteredBooks,
  copiesStock,
  formatDate,
  onEdit,
  onManageCopies,
  onDelete
}) => {
  return (
    <div className="admin-table-container">
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
          <div className="db-spinner"></div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading books datatable...</p>
        </div>
      ) : !filteredBooks || filteredBooks.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No books found matching criteria.
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ISBN</th>
              <th>Thumbnail</th>
              <th>Title</th>
              <th>Description</th>
              <th>Publisher</th>
              <th>Authors</th>
              <th>Categories</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Currency</th>
              <th>Pages</th>
              <th>Language</th>
              <th>Active</th>
              <th>Copies</th>
              <th>Published At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.map((book) => {
              const stock = (copiesStock && copiesStock[book.id]) || { available: 0, total: 0 }
              return (
                <tr key={book.id}>
                  <td style={{ fontWeight: '600' }}>{book.id}</td>
                  <td>{book.isbn}</td>
                  <td>
                    {book.thumbnail ? (
                      <img
                        src={book.thumbnail}
                        alt={book.title}
                        className="admin-table-thumb"
                        onError={(e) => { 
                          e.target.onerror = null; // Prevent infinite loop if fallback image also fails
                          e.target.src = 'https://books.google.com/books/content?id=&printsec=frontcover&img=1&zoom=0&edge=curl&source=gbs_api'; 
                        }}
                      />
                    ) : (
                      <div className="admin-table-placeholder-thumb">
                        <span style={{ fontSize: '0.6rem' }}>No Img</span>
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: '500', minWidth: '150px' }}>{book.title}</td>
                  <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={book.description}>
                    {book.description || '-'}
                  </td>
                  <td>{book.publisher?.name || '-'}</td>
                  <td>
                    <div className="admin-chip-container">
                      {book.authors && book.authors.length > 0 ? (
                        book.authors.map((a) => (
                          <span key={a.id} className="admin-table-chip" title={a.name}>
                            {a.name}
                          </span>
                        ))
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="admin-chip-container">
                      {book.categories && book.categories.length > 0 ? (
                        book.categories.map((c) => (
                          <span key={c.id} className="admin-table-chip" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: 'var(--color-success)' }} title={c.name}>
                            {c.name}
                          </span>
                        ))
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </td>
                  <td>{book.price !== undefined && book.price !== null ? book.price.toFixed(2) : '0.00'}</td>
                  <td>{book.discountPrice !== undefined && book.discountPrice !== null ? book.discountPrice.toFixed(2) : '0.00'}</td>
                  <td>{book.currencyCode || 'VND'}</td>
                  <td>{book.pageCount || '-'}</td>
                  <td>{book.language || 'English'}</td>
                  <td>
                    <span className={`admin-badge-${book.activated ? 'active' : 'inactive'}`}>
                      {book.activated ? 'True' : 'False'}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                    {stock.available} / {stock.total}
                  </td>
                  <td>{formatDate(book.publishedDate)}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        className="admin-btn-action admin-btn-action-edit"
                        onClick={() => onEdit(book)}
                      >
                        Edit
                      </button>
                      <button
                        className="admin-btn-action admin-btn-action-copies"
                        onClick={() => onManageCopies(book)}
                      >
                        Copies
                      </button>
                      <button
                        className="admin-btn-action admin-btn-action-delete"
                        onClick={() => onDelete(book)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default AdminBooksTable
