// src/components/PetDashboard.jsx
import { useState, useEffect } from 'react'
import PetItem from './PetItem'
import '../styles/PetDashboard.css'

function PetDashboard({ user, onLogout }) {
  const [pets, setPets] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    type: 'Dog',
    age: '',
    owner: ''
  })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    const storedPets = localStorage.getItem('pets')
    if (storedPets) {
      setPets(JSON.parse(storedPets))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('pets', JSON.stringify(pets))
  }, [pets])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name || !formData.age || !formData.owner) {
      alert('Please fill in all fields')
      return
    }

    if (editingId) {
      setPets(pets.map(pet => 
        pet.id === editingId ? { ...formData, id: editingId } : pet
      ))
      setEditingId(null)
    } else {
      const newPet = {
        ...formData,
        id: Date.now()
      }
      setPets([...pets, newPet])
    }

    setFormData({ name: '', type: 'Dog', age: '', owner: '' })
  }

  const handleEdit = (pet) => {
    setFormData({
      name: pet.name,
      type: pet.type,
      age: pet.age,
      owner: pet.owner
    })
    setEditingId(pet.id)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this pet?')) {
      setPets(pets.filter(pet => pet.id !== id))
    }
  }

  const handleCancel = () => {
    setFormData({ name: '', type: 'Dog', age: '', owner: '' })
    setEditingId(null)
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Pet Details Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user.username}</span>
          <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="form-section">
          <h2>{editingId ? 'Edit Pet' : 'Add New Pet'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Pet Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter pet name"
              />
            </div>

            <div className="form-group">
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter age"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Owner Name</label>
              <input
                type="text"
                name="owner"
                value={formData.owner}
                onChange={handleChange}
                placeholder="Enter owner name"
              />
            </div>

            <div className="form-buttons">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Pet' : 'Add Pet'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} className="btn-secondary">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="pets-section">
          <h2>Pet List ({pets.length})</h2>
          {pets.length === 0 ? (
            <p className="no-pets">No pets added yet. Add your first pet!</p>
          ) : (
            <div className="pets-grid">
              {pets.map(pet => (
                <PetItem
                  key={pet.id}
                  pet={pet}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PetDashboard