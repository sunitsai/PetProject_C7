// src/App.jsx
import { useState, useEffect } from 'react'
import Auth from './components/Auth'
import PetDashboard from './components/PetDashboard'

function App() {
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const user = localStorage.getItem('currentUser')
    if (user) {
      setCurrentUser(JSON.parse(user))
    }
  }, [])

  const handleLogin = (user) => {
    localStorage.setItem('currentUser', JSON.stringify(user))
    setCurrentUser(user)
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    setCurrentUser(null)
  }

  return (
    <div className="app">
      {!currentUser ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <PetDashboard user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App