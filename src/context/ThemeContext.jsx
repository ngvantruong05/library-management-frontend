import React, { createContext, useState, useEffect, useContext } from 'react'

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Default to 'light' to match the JavaFX default Light Gray theme
    const savedTheme = localStorage.getItem('theme')
    return savedTheme === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    // Apply theme class to document root element
    const root = document.documentElement
    root.classList.remove('theme-light', 'theme-dark')
    root.classList.add(`theme-${theme}`)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
