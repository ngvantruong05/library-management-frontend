import React from 'react'

const AdminBooksControls = ({
  searchQuery,
  handleSearchChange,
  activeFilter,
  setActiveFilter,
  handleCreateBook,
  totalElements,
  page,
  pageSize,
  handlePageSizeChange,
  handlePrevPage,
  handleNextPage,
  isLoading
}) => {
  return (
    <div className="admin-controls-row">
      <div className="admin-control-group">
        <span className="admin-control-label">Search:</span>
        <input
          type="text"
          className="admin-search-input"
          placeholder="Search by title, isbn, author..."
          defaultValue={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="admin-control-group">
        <span className="admin-control-label">Active:</span>
        <select
          className="admin-select-filter"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
        >
          <option value="All">All</option>
          <option value="True">True</option>
          <option value="False">False</option>
        </select>
      </div>

      <button className="admin-btn-primary" onClick={handleCreateBook}>
        New Book
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
  )
}

export default AdminBooksControls
