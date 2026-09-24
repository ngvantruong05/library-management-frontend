import React, { useState } from 'react'

// 12 Curated Elegant Gradient Themes
const COVER_THEMES = [
  { from: '#1e1b4b', mid: '#312e81', to: '#4338ca', accent: '#a5b4fc', pattern: 'grid' },
  { from: '#064e3b', mid: '#047857', to: '#059669', accent: '#6ee7b7', pattern: 'circuit' },
  { from: '#1e3a8a', mid: '#1d4ed8', to: '#2563eb', accent: '#93c5fd', pattern: 'nodes' },
  { from: '#881337', mid: '#be123c', to: '#e11d48', accent: '#fecdd3', pattern: 'rings' },
  { from: '#7c2d12', mid: '#c2410c', to: '#ea580c', accent: '#fed7aa', pattern: 'grid' },
  { from: '#3b0764', mid: '#6b21a8', to: '#9333ea', accent: '#e9d5ff', pattern: 'nodes' },
  { from: '#0f172a', mid: '#1e293b', to: '#334155', accent: '#94a3b8', pattern: 'circuit' },
  { from: '#134e4a', mid: '#0f766e', to: '#0d9488', accent: '#99f6e4', pattern: 'rings' },
  { from: '#701a75', mid: '#a21caf', to: '#c026d3', accent: '#f5d0fe', pattern: 'grid' },
  { from: '#451a03', mid: '#78350f', to: '#b45309', accent: '#fde68a', pattern: 'nodes' },
  { from: '#022c22', mid: '#065f46', to: '#047857', accent: '#a7f3d0', pattern: 'circuit' },
  { from: '#172554', mid: '#1e40af', to: '#3b82f6', accent: '#bfdbfe', pattern: 'rings' }
]

// Deterministic theme picker from string
export const getThemeForBook = (identifier = '') => {
  let hash = 0
  const str = String(identifier || 'book')
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % COVER_THEMES.length
  return COVER_THEMES[index]
}



/**
 * High-performance, gorgeous Book Cover component with realistic styling and fallback.
 */
const BookCover = ({ book, size = 'card', className = '', style = {}, onCoverClick }) => {
  const [imgFailed, setImgFailed] = useState(false)
  const hasCustomThumbnail = book?.thumbnail && !imgFailed && !book.thumbnail.includes('example.com')

  if (hasCustomThumbnail) {
    return (
      <img
        src={book.thumbnail}
        alt={book.title || 'Book cover'}
        className={`book-cover-img ${className}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          ...style
        }}
        onError={() => setImgFailed(true)}
        onClick={onCoverClick}
      />
    )
  }

  // Generate stylized vector cover
  const title = book?.title || 'Untitled Book'
  const theme = getThemeForBook(title || book?.id)
  const category = (book?.categories && book.categories.length > 0
    ? (typeof book.categories[0] === 'string' ? book.categories[0] : book.categories[0]?.name)
    : 'UET LIBRARY'
  ).toUpperCase()

  const authorsText = book?.authors && book.authors.length > 0
    ? (typeof book.authors[0] === 'string' ? book.authors.join(', ') : book.authors.map(a => a.name).join(', '))
    : 'Academic Author'

  const isThumb = size === 'thumb'
  const isDetails = size === 'details'

  return (
    <div
      className={`auto-book-cover ${className}`}
      onClick={onCoverClick}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.mid} 50%, ${theme.to} 100%)`,
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isThumb ? '0.4rem' : isDetails ? '1.5rem' : '1rem',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
        borderRadius: isThumb ? '4px' : '6px',
        boxShadow: isThumb ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.25)',
        ...style
      }}
    >
      {/* 3D Realistic Spine Crease */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: isThumb ? '6px' : '14px',
          background: 'linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(255,255,255,0.18) 35%, rgba(0,0,0,0.15) 60%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 3
        }}
      />

      {/* Decorative Geometric Overlay */}
      <svg
        style={{
          position: 'absolute',
          right: '-20%',
          top: '-10%',
          width: isThumb ? '100%' : '80%',
          height: '80%',
          pointerEvents: 'none',
          opacity: 0.18
        }}
        viewBox="0 0 100 100"
      >
        <circle cx="50" cy="50" r="45" fill="none" stroke={theme.accent} strokeWidth="2" />
        <circle cx="50" cy="50" r="30" fill="none" stroke={theme.accent} strokeWidth="1.5" />
        <circle cx="50" cy="50" r="15" fill="none" stroke={theme.accent} strokeWidth="1" />
        <line x1="0" y1="50" x2="100" y2="50" stroke={theme.accent} strokeWidth="1" strokeDasharray="3 3" />
        <line x1="50" y1="0" x2="50" y2="100" stroke={theme.accent} strokeWidth="1" strokeDasharray="3 3" />
      </svg>

      {/* Top Header Tag */}
      <div style={{ position: 'relative', zIndex: 2, paddingLeft: isThumb ? '4px' : '6px' }}>
        {!isThumb && (
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
              padding: isDetails ? '3px 10px' : '2px 8px',
              borderRadius: '4px',
              fontSize: isDetails ? '0.75rem' : '0.62rem',
              fontWeight: '700',
              color: theme.accent,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
              maxWidth: '90%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {category}
          </div>
        )}
      </div>

      {/* Middle: Prominent Book Title */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          paddingLeft: isThumb ? '4px' : '6px',
          margin: isThumb ? 'auto 0' : '0'
        }}
      >
        <div
          style={{
            fontWeight: '800',
            fontSize: isThumb ? '0.65rem' : isDetails ? '1.4rem' : '0.92rem',
            lineHeight: isThumb ? 1.15 : 1.25,
            color: '#ffffff',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            display: '-webkit-box',
            WebkitLineClamp: isThumb ? 3 : isDetails ? 5 : 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
            letterSpacing: '-0.02em'
          }}
          title={title}
        >
          {title}
        </div>
      </div>

      {/* Bottom Footer: Author & Badge */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          paddingLeft: isThumb ? '4px' : '6px',
          borderTop: isThumb ? 'none' : '1px solid rgba(255,255,255,0.15)',
          paddingTop: isThumb ? '0' : '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}
      >
        {!isThumb && (
          <>
            <div
              style={{
                fontSize: isDetails ? '0.85rem' : '0.72rem',
                color: theme.accent,
                fontWeight: '600',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                opacity: 0.95
              }}
            >
              {authorsText}
            </div>
            <div
              style={{
                fontSize: isDetails ? '0.68rem' : '0.58rem',
                color: 'rgba(255,255,255,0.5)',
                fontWeight: '600',
                letterSpacing: '0.05em'
              }}
            >
              UET LIBRARY EDITION
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default BookCover
