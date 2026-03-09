require('dotenv').config({ path: '../.env' })

const express = require('express')
const cors = require('cors')

const habitsRouter = require('./routes/habits')
const workoutRouter = require('./routes/workout')
const dietRouter = require('./routes/diet')
const financeRouter = require('./routes/finance')

const app = express()

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api/habits', habitsRouter)
app.use('/api/workout', workoutRouter)
app.use('/api/diet', dietRouter)
app.use('/api/finance', financeRouter)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
