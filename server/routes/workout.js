const express = require('express')
const supabase = require('../supabase')
const router = express.Router()

// GET /api/workout/week — sessions this week
router.get('/week', async (req, res) => {
  try {
    const uid = '00000000-0000-0000-0000-000000000001'
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    const from = monday.toISOString().split('T')[0]

    const { data } = await supabase
      .from('workout_sessions')
      .select('date')
      .eq('user_id', uid)
      .gte('date', from)
      .order('date')

    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/workout/latest — today's session
router.get('/latest', async (req, res) => {
  try {
    const uid = '00000000-0000-0000-0000-000000000001'
    const today = new Date().toISOString().split('T')[0]

    const { data: session } = await supabase
      .from('workout_sessions')
      .select('*, workout_exercises(*)')
      .eq('user_id', uid)
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!session) return res.json({ session: null })

    const total = session.workout_exercises?.length || 0
    res.json({ session, total, done: total })
  } catch (err) {
    res.json({ session: null })
  }
})

// GET /api/workout/recent
router.get('/recent', async (req, res) => {
  try {
    const uid = '00000000-0000-0000-0000-000000000001'
    const { data } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false })
      .limit(5)

    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/workout/session
router.post('/session', async (req, res) => {
  try {
    const uid = '00000000-0000-0000-0000-000000000001'
    const { name, type, date, exercises, note } = req.body

    const { data: session, error } = await supabase
      .from('workout_sessions')
      .insert({ user_id: uid, name, type, date, note })
      .select()
      .single()

    if (error) throw error

    if (exercises?.length) {
      const rows = exercises.map(ex => ({
        session_id: session.id,
        name: ex.name,
        sets: ex.sets || null,
        reps: ex.reps || null,
        weight: ex.weight || null,
      }))
      await supabase.from('workout_exercises').insert(rows)
    }

    res.json(session)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
