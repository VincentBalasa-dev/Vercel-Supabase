const express = require('express')
const supabase = require('../supabase')
const router = express.Router()

// GET /api/diet/logs?date=YYYY-MM-DD
router.get('/logs', async (req, res) => {
  try {
    const uid = '00000000-0000-0000-0000-000000000001'
    const date = req.query.date || new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('diet_logs')
      .select('*')
      .eq('user_id', uid)
      .eq('date', date)
      .order('created_at')

    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/diet/summary?date=YYYY-MM-DD
router.get('/summary', async (req, res) => {
  try {
    const uid = '00000000-0000-0000-0000-000000000001'
    const date = req.query.date || new Date().toISOString().split('T')[0]

    const [{ data: logs }, { data: goals }] = await Promise.all([
      supabase.from('diet_logs').select('calories, protein_g, carbs_g, fat_g').eq('user_id', uid).eq('date', date),
      supabase.from('diet_goals').select('*').eq('user_id', uid).single(),
    ])

    const totals = (logs || []).reduce((acc, l) => ({
      calories_consumed: acc.calories_consumed + (l.calories || 0),
      protein_consumed: acc.protein_consumed + (l.protein_g || 0),
      carbs_consumed: acc.carbs_consumed + (l.carbs_g || 0),
      fat_consumed: acc.fat_consumed + (l.fat_g || 0),
    }), { calories_consumed: 0, protein_consumed: 0, carbs_consumed: 0, fat_consumed: 0 })

    res.json({
      ...totals,
      calories_goal: goals?.calories || 2000,
      protein_goal: goals?.protein || 150,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/diet/goals
router.get('/goals', async (req, res) => {
  try {
    const uid = '00000000-0000-0000-0000-000000000001'
    const { data } = await supabase.from('diet_goals').select('*').eq('user_id', uid).single()
    res.json(data || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/diet/goals
router.put('/goals', async (req, res) => {
  try {
    const uid = '00000000-0000-0000-0000-000000000001'
    const { calories, protein, carbs, fat } = req.body

    const { data: existing } = await supabase.from('diet_goals').select('id').eq('user_id', uid).single()

    if (existing) {
      await supabase.from('diet_goals').update({ calories, protein, carbs, fat }).eq('id', existing.id)
    } else {
      await supabase.from('diet_goals').insert({ user_id: uid, calories, protein, carbs, fat })
    }

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/diet/log
router.post('/log', async (req, res) => {
  try {
    const uid = '00000000-0000-0000-0000-000000000001'
    const { food_name, calories, protein, carbs, fat, date } = req.body

    const { data, error } = await supabase
      .from('diet_logs')
      .insert({
        user_id: uid,
        food_name,
        calories: Number(calories) || 0,
        protein_g: Number(protein) || 0,
        carbs_g: Number(carbs) || 0,
        fat_g: Number(fat) || 0,
        date,
      })
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/diet/log/:id
router.delete('/log/:id', async (req, res) => {
  try {
    const uid = '00000000-0000-0000-0000-000000000001'
    await supabase.from('diet_logs').delete().eq('id', req.params.id).eq('user_id', uid)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
