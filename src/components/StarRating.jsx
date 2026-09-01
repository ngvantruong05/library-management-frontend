import React, { useState } from 'react'

const StarRating = ({
  value = 0,
  maxStars = 5,
  readOnly = false,
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  onChange,
  showLabel = false
}) => {
  const [hoverValue, setHoverValue] = useState(0)

  const labels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  }

  const effectiveValue = hoverValue > 0 ? hoverValue : value
  const fullStars = Math.floor(effectiveValue)
  const hasHalfStar = readOnly && (effectiveValue % 1 >= 0.25 && effectiveValue % 1 <= 0.75)

  const handleClick = (starIndex) => {
    if (!readOnly && onChange) {
      onChange(starIndex)
    }
  }

  const handleMouseEnter = (starIndex) => {
    if (!readOnly) {
      setHoverValue(starIndex)
    }
  }

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(0)
    }
  }

  return (
    <div className={`star-rating-wrapper size-${size} ${readOnly ? 'readonly' : 'interactive'}`}>
      <div className="star-rating-stars" onMouseLeave={handleMouseLeave}>
        {[...Array(maxStars)].map((_, i) => {
          const starIndex = i + 1
          const isFilled = starIndex <= fullStars || (!readOnly && starIndex <= effectiveValue)
          const isHalf = hasHalfStar && starIndex === fullStars + 1

          return (
            <span
              key={starIndex}
              className={`star-icon-item ${isFilled ? 'filled' : ''} ${isHalf ? 'half' : ''} ${!readOnly ? 'clickable' : ''}`}
              onClick={() => handleClick(starIndex)}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              role={readOnly ? 'presentation' : 'button'}
              tabIndex={readOnly ? -1 : 0}
              aria-label={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
            >
              ★
            </span>
          )
        })}
      </div>

      {showLabel && !readOnly && (
        <span className="star-rating-label">
          {labels[effectiveValue] || (effectiveValue > 0 ? `${effectiveValue} Stars` : 'Select rating')}
        </span>
      )}
    </div>
  )
}

export default StarRating
