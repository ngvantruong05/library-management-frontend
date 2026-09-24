import React, { useRef } from 'react'

/**
 * Unified Modern Search Input Component
 * Features:
 * - Magnifying glass search icon
 * - One-click clear (✕) button
 * - Esc key to clear, Enter to submit
 * - Flexible sizing: 'default', 'compact', 'large'
 * - Fully theme-responsive (Light / Dark mode)
 */
const SearchInput = ({
  value = '',
  onChange,
  onClear,
  onSubmit,
  onFocus,
  onBlur,
  placeholder = 'Search...',
  className = '',
  size = 'default', // 'compact', 'default', 'large'
  disabled = false,
  autoFocus = false,
  showClear = true,
  id,
  name,
  'aria-label': ariaLabel = 'Search'
}) => {
  const inputRef = useRef(null)

  const handleInputChange = (e) => {
    if (onChange) {
      onChange(e)
    }
  }

  const handleClear = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onClear) {
      onClear()
    } else if (onChange) {
      // Simulate synthetic event if only onChange is supplied
      const syntheticEvent = {
        target: { value: '', name: name || 'search' },
        currentTarget: { value: '', name: name || 'search' }
      }
      onChange(syntheticEvent)
    }
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClear(e)
    } else if (e.key === 'Enter' && onSubmit) {
      onSubmit(e)
    }
  }

  const hasValue = Boolean(value && String(value).length > 0)

  return (
    <div className={`app-search-wrapper app-search-${size} ${hasValue ? 'has-value' : ''} ${className}`}>
      <span className="app-search-icon" aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>

      <input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        className="app-search-input"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck="false"
      />

      {showClear && hasValue && !disabled && (
        <button
          type="button"
          className="app-search-clear-btn"
          onClick={handleClear}
          title="Clear search"
          aria-label="Clear search input"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default SearchInput
