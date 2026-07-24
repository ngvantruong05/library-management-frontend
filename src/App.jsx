import React from 'react'

function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#ffffff',
      color: '#000000',
      margin: 0
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#000000' }}>
        Library Management
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#4b5563' }}>
        Frontend React + Vite project is initialized successfully.
      </p>
    </div>
  )
}

export default App
