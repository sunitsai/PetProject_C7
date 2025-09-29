import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { getDb } from '../db/sqlite.js'

const router = express.Router()

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = signupSchema.parse(req.body)
    const db = getDb()
    const existing = await db.get('SELECT id FROM users WHERE email = ?', email)
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const hash = await bcrypt.hash(password, 10)
    const result = await db.run('INSERT INTO users(name, email, password_hash) VALUES(?,?,?)', name, email, hash)
    const user = { id: result.lastID, name, email }
    const token = jwt.sign(user, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
    res.status(201).json({ user, token })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const db = getDb()
    const userRow = await db.get('SELECT * FROM users WHERE email = ?', email)
    if (!userRow) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = await bcrypt.compare(password, userRow.password_hash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const user = { id: userRow.id, name: userRow.name, email: userRow.email }
    const token = jwt.sign(user, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
    res.json({ user, token })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
