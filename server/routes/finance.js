const express = require('express')
const supabase = require('../supabase')
const router = express.Router()

// GET /api/finance/entries
router.get('/entries', async (req, res) => {
  try {
    const uid = '00000000-0000-0000-0000-000000000001'
    const { data } = await supabase
      .from('finance_entries')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false })
      .limit(50)

    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/finance/summary
router.get('/summary', async (req, res) => {
  try {
    const uid = '00000000-0000-0000-0000-000000000001'
    const today = new Date().toISOString().split('T')[0]
    const monthStart = today.slice(0, 7) + '-01'

    const { data } = await supabase
      .from('finance_entries')
      .select('type, amount, date')
      .eq('user_id', uid)
      .gte('date', monthStart)

    const summary = (data || []).reduce((acc, e) => {
      const amt = Number(e.amount) || 0
      if (e.type === 'income') acc.total_income += amt
      if (e.type === 'expense') acc.total_expenses += amt
      if (e.type === 'savings') acc.total_savings += amt
      if (e.type === 'loan') acc.total_loan += amt
      if (e.date === today && e.type === 'expense') acc.today_expenses += amt
      return acc
    }, { total_income: 0, total_expenses: 0, total_savings: 0, total_loan: 0, today_expenses: 0 })

    summary.balance = summary.total_income - summary.total_expenses
    summary.budget_used = summary.total_income > 0
      ? Math.min(Math.round((summary.total_expenses / summary.total_income) * 100), 100)
      : 0

    res.json(summary)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/finance/entry
router.post('/entry', async (req, res) => {
  try {
    const uid = '00000000-0000-0000-0000-000000000001'
    const { type, amount, note, date } = req.body

    const { data, error } = await supabase
      .from('finance_entries')
      .insert({ user_id: uid, type, amount: Number(amount), note, date })
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/finance/entry/:id
router.delete('/entry/:id', async (req, res) => {
  try {
    const uid = '00000000-0000-0000-0000-000000000001'
    await supabase.from('finance_entries').delete().eq('id', req.params.id).eq('user_id', uid)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
