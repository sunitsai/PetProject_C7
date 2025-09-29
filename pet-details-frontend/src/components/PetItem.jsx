// src/components/PetItem.jsx
import '../styles/PetDashboard.css'

function PetItem({ pet, onEdit, onDelete }) {
  return (
    <div className="pet-card">
      <div className="pet-header">
        <h3>{pet.name}</h3>
        <span className="pet-type">{pet.type}</span>
      </div>
      <div className="pet-details">
        <p><strong>Age:</strong> {pet.age} years</p>
        <p><strong>Owner:</strong> {pet.owner}</p>
      </div>
      <div className="pet-actions">
        <button onClick={() => onEdit(pet)} className="btn-edit">
          Edit
        </button>
        <button onClick={() => onDelete(pet.id)} className="btn-delete">
          Delete
        </button>
      </div>
    </div>
  )
}

export default PetItem