const { pool } = require('../config/database');
const { validationResult } = require('express-validator');

// Get all pets for a user
const getPets = async (req, res) => {
  try {
    const [pets] = await pool.execute(
      `SELECT p.*, pd.medical_history, pd.vaccination_records, pd.dietary_requirements, 
              pd.behavioral_notes, pd.emergency_contact, pd.veterinarian_info
       FROM pets p 
       LEFT JOIN pet_details pd ON p.id = pd.pet_id 
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json({ pets });
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a specific pet
const getPet = async (req, res) => {
  try {
    const { id } = req.params;

    const [pets] = await pool.execute(
      `SELECT p.*, pd.medical_history, pd.vaccination_records, pd.dietary_requirements, 
              pd.behavioral_notes, pd.emergency_contact, pd.veterinarian_info
       FROM pets p 
       LEFT JOIN pet_details pd ON p.id = pd.pet_id 
       WHERE p.id = ? AND p.user_id = ?`,
      [id, req.user.id]
    );

    if (pets.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    res.json({ pet: pets[0] });
  } catch (error) {
    console.error('Get pet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add a new pet
const addPet = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, species, breed, age, color, weight,
      medical_history, vaccination_records, dietary_requirements,
      behavioral_notes, emergency_contact, veterinarian_info
    } = req.body;

    await connection.beginTransaction();

    // Insert pet
    const [petResult] = await connection.execute(
      'INSERT INTO pets (user_id, name, species, breed, age, color, weight) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, name, species, breed, age, color, weight]
    );

    const petId = petResult.insertId;

    // Insert pet details
    await connection.execute(
      `INSERT INTO pet_details (pet_id, medical_history, vaccination_records, dietary_requirements, 
                               behavioral_notes, emergency_contact, veterinarian_info) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [petId, medical_history, vaccination_records, dietary_requirements, behavioral_notes, emergency_contact, veterinarian_info]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Pet added successfully',
      pet: { id: petId, name, species, breed, age, color, weight }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Add pet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Update pet
const updatePet = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      name, species, breed, age, color, weight,
      medical_history, vaccination_records, dietary_requirements,
      behavioral_notes, emergency_contact, veterinarian_info
    } = req.body;

    // Check if pet belongs to user
    const [existingPet] = await connection.execute(
      'SELECT id FROM pets WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existingPet.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    await connection.beginTransaction();

    // Update pet
    await connection.execute(
      'UPDATE pets SET name = ?, species = ?, breed = ?, age = ?, color = ?, weight = ? WHERE id = ?',
      [name, species, breed, age, color, weight, id]
    );

    // Update pet details
    await connection.execute(
      `UPDATE pet_details SET medical_history = ?, vaccination_records = ?, dietary_requirements = ?, 
                             behavioral_notes = ?, emergency_contact = ?, veterinarian_info = ? 
       WHERE pet_id = ?`,
      [medical_history, vaccination_records, dietary_requirements, behavioral_notes, emergency_contact, veterinarian_info, id]
    );

    await connection.commit();

    res.json({ message: 'Pet updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Update pet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Delete pet
const deletePet = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if pet belongs to user
    const [existingPet] = await pool.execute(
      'SELECT id FROM pets WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existingPet.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    // Delete pet (cascade will handle pet_details)
    await pool.execute('DELETE FROM pets WHERE id = ?', [id]);

    res.json({ message: 'Pet deleted successfully' });
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getPets,
  getPet,
  addPet,
  updatePet,
  deletePet
};