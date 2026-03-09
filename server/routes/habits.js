const express = require('express')
const supabase = require('../supabase')
const router = express.Router()

// GET /api/habits/today — habits + chores + streaks
router.get('/today', async (req, res) => {
  try {
    const uid = '00000000-0000-0000-0000-000000000001'
    const today = new Date().toISOString().split('T')[0]

    const [{ data: habit }, { data: chore }] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', uid).eq('date', today).single(),
      supabase.from('chores').select('*').eq('user_id', uid).eq('date', today).single(),
    ])

    // Simple streak: count consecutive days with workout=true
    const { data: recent } = await supabase
      .from('habits')
      .select('date, workout, study, read')
      .eq('user_id', uid)
      .order('date', { ascending: false })
      .limit(30)

    function calcStreak(key) {
      let streak = 0
      for (const row of (recent || [])) {
        if (row[key]) streak++
        else break
      }
      return streak
    }

    res.json({
      habits: habit || {},
      chores: chore || {},
      streaks: {
        workout: calcStreak('workout'),
        study: calcStreak('study'),
        read: calcStreak('read'),
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/habits/toggle
router.post('/toggle', async (req, res) => {
  try {
    const uid = '00000000-0000-0000-0000-000000000001'
    const { key, value, date, type } = req.body
    const table = type === 'chore' ? 'chores' : 'habits'

    const { data: existing } = await supabase
      .from(table).select('id').eq('user_id', uid).eq('date', date).single()

    if (existing) {
      await supabase.from(table).update({ [key]: value }).eq('id', existing.id)
    } else {
      await supabase.from(table).insert({ user_id: uid, date, [key]: value })
    }

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
