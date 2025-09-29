import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { initDb } from './db/sqlite.js'
import authRouter from './routes/auth.js'
import petsRouter from './routes/pets.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.use('/api/auth', authRouter)
app.use('/api/pets', petsRouter)

const PORT = process.env.PORT || 4000

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('Failed to initialize database', err)
  process.exit(1)
})
