import React from 'react'

const AddEditBookModal = ({
  show,
  selectedBook,
  formData,
  setFormData,
  publishers,
  authors,
  categories,
  onClose,
  onSubmit,
  handleMultipleSelectChange,
}) => {
  if (!show) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{selectedBook ? 'Edit Book Details' : 'Add New Book'}</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Book Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Clean Code"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">ISBN *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 978-0132350884"
                  required
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group form-group-full">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Short description or summary of the book..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Published Date</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 2008-08-11"
                  value={formData.publishedDate}
                  onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Page Count</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={formData.pageCount}
                  onChange={(e) => setFormData({ ...formData, pageCount: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Discount Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  min="0"
                  value={formData.discountPrice}
                  onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Language</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Currency Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.currencyCode}
                  onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Thumbnail URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. https://images.com/cover.jpg"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">PDF Link (E-Book)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. https://domain.com/book.pdf"
                  value={formData.pdfLink}
                  onChange={(e) => setFormData({ ...formData, pdfLink: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Publisher *</label>
              <select
                className="form-select"
                required
                value={formData.publisherId}
                onChange={(e) => setFormData({ ...formData, publisherId: e.target.value })}
              >
                <option value="" disabled>Select Publisher</option>
                {publishers.map((pub) => (
                  <option key={pub.id} value={pub.id}>{pub.name}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Authors (Hold Ctrl/Cmd to select multiple)</label>
                <select
                  className="form-select"
                  multiple
                  value={formData.authorIds}
                  onChange={(e) => handleMultipleSelectChange(e, 'authorIds')}
                >
                  {authors.map((auth) => (
                    <option key={auth.id} value={auth.id}>{auth.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Categories (Hold Ctrl/Cmd to select multiple)</label>
                <select
                  className="form-select"
                  multiple
                  value={formData.categoryIds}
                  onChange={(e) => handleMultipleSelectChange(e, 'categoryIds')}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="catalog-btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEditBookModal
