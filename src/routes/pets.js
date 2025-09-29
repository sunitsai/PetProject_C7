import express from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { getDb } from '../db/sqlite.js'

const router = express.Router()

function authMiddleware (req, res, next) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

const petCreateSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  age: z.number().int().nonnegative().optional()
})

const petUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().optional(),
  age: z.number().int().nonnegative().optional()
})

router.use(authMiddleware)

router.get('/', async (req, res) => {
  const db = getDb()
  const pets = await db.all('SELECT * FROM pets WHERE user_id = ? ORDER BY created_at DESC', req.user.id)
  res.json(pets)
})

router.post('/', async (req, res) => {
  try {
    const data = petCreateSchema.parse(req.body)
    const db = getDb()
    const result = await db.run(
      'INSERT INTO pets(user_id, name, type, age) VALUES(?,?,?,?)',
      req.user.id, data.name, data.type ?? null, data.age ?? null
    )
    const pet = await db.get('SELECT * FROM pets WHERE id = ? AND user_id = ?', result.lastID, req.user.id)
    res.status(201).json(pet)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  const db = getDb()
  const pet = await db.get('SELECT * FROM pets WHERE id = ? AND user_id = ?', req.params.id, req.user.id)
  if (!pet) return res.status(404).json({ error: 'Not found' })
  res.json(pet)
})

router.put('/:id', async (req, res) => {
  try {
    const data = petUpdateSchema.parse(req.body)
    const db = getDb()
    const existing = await db.get('SELECT * FROM pets WHERE id = ? AND user_id = ?', req.params.id, req.user.id)
    if (!existing) return res.status(404).json({ error: 'Not found' })

    const name = data.name ?? existing.name
    const type = data.type ?? existing.type
    const age = data.age ?? existing.age
    await db.run('UPDATE pets SET name = ?, type = ?, age = ?, updated_at = datetime("now") WHERE id = ? AND user_id = ?', name, type, age, req.params.id, req.user.id)
    const updated = await db.get('SELECT * FROM pets WHERE id = ? AND user_id = ?', req.params.id, req.user.id)
    res.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req, res) => {
  const db = getDb()
  const existing = await db.get('SELECT * FROM pets WHERE id = ? AND user_id = ?', req.params.id, req.user.id)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  await db.run('DELETE FROM pets WHERE id = ? AND user_id = ?', req.params.id, req.user.id)
  res.status(204).end()
})

export default router
