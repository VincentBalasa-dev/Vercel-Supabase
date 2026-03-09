import { supabase } from './supabase'

const UID = '00000000-0000-0000-0000-000000000001'

// ── Habits ────────────────────────────────────────────────
export async function getHabitsToday() {
  const today = new Date().toISOString().split('T')[0]

  const [{ data: habit }, { data: chore }, { data: recent }] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', UID).eq('date', today).maybeSingle(),
    supabase.from('chores').select('*').eq('user_id', UID).eq('date', today).maybeSingle(),
    supabase.from('habits').select('date, workout, study, read').eq('user_id', UID).order('date', { ascending: false }).limit(30),
  ])

  function calcStreak(key) {
    let streak = 0
    for (const row of (recent || [])) {
      if (row[key]) streak++
      else break
    }
    return streak
  }

  return {
    habits: habit || {},
    chores: chore || {},
    streaks: {
      workout: calcStreak('workout'),
      study: calcStreak('study'),
      read: calcStreak('read'),
    },
  }
}

export async function toggleHabitOrChore({ key, value, date, type }) {
  const table = type === 'chore' ? 'chores' : 'habits'
  const { data: existing } = await supabase.from(table).select('id').eq('user_id', UID).eq('date', date).maybeSingle()

  if (existing) {
    const { error } = await supabase.from(table).update({ [key]: value }).eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from(table).insert({ user_id: UID, date, [key]: value })
    if (error) throw error
  }
}

// ── Workout ───────────────────────────────────────────────
export async function getWorkoutWeek() {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const from = monday.toISOString().split('T')[0]

  const { data } = await supabase
    .from('workout_sessions')
    .select('date')
    .eq('user_id', UID)
    .gte('date', from)
    .order('date')
  return data || []
}

export async function getWorkoutLatest() {
  const today = new Date().toISOString().split('T')[0]
  const { data: session } = await supabase
    .from('workout_sessions')
    .select('*, workout_exercises(*)')
    .eq('user_id', UID)
    .eq('date', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!session) return { session: null }
  const total = session.workout_exercises?.length || 0
  return { session, total, done: total }
}

export async function getWorkoutRecent() {
  const { data } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', UID)
    .order('date', { ascending: false })
    .limit(5)
  return data || []
}

export async function saveWorkoutSession({ name, type, date, exercises, note }) {
  const { data: session, error } = await supabase
    .from('workout_sessions')
    .insert({ user_id: UID, name, type, date, note })
    .select()
    .maybeSingle()

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

  return session
}

// ── Diet ──────────────────────────────────────────────────
export async function getDietLogs(date) {
  const { data } = await supabase
    .from('diet_logs')
    .select('*')
    .eq('user_id', UID)
    .eq('date', date)
    .order('created_at')
  return data || []
}

export async function getDietGoals() {
  const { data } = await supabase.from('diet_goals').select('*').eq('user_id', UID).maybeSingle()
  return data || null
}

export async function saveDietLog({ food_name, calories, protein, carbs, fat, date }) {
  const { data, error } = await supabase
    .from('diet_logs')
    .insert({
      user_id: UID,
      food_name,
      calories: Number(calories) || 0,
      protein_g: Number(protein) || 0,
      carbs_g: Number(carbs) || 0,
      fat_g: Number(fat) || 0,
      date,
    })
    .select()
    .maybeSingle()
  if (error) throw error
  return data
}

export async function deleteDietLog(id) {
  await supabase.from('diet_logs').delete().eq('id', id).eq('user_id', UID)
}

export async function saveDietGoals({ calories, protein, carbs, fat }) {
  const { data: existing } = await supabase.from('diet_goals').select('id').eq('user_id', UID).maybeSingle()
  if (existing) {
    await supabase.from('diet_goals').update({ calories, protein, carbs, fat }).eq('id', existing.id)
  } else {
    await supabase.from('diet_goals').insert({ user_id: UID, calories, protein, carbs, fat })
  }
}

export async function getDietSummary(date) {
  const [{ data: logs }, { data: goals }] = await Promise.all([
    supabase.from('diet_logs').select('calories, protein_g, carbs_g, fat_g').eq('user_id', UID).eq('date', date),
    supabase.from('diet_goals').select('*').eq('user_id', UID).maybeSingle(),
  ])

  const totals = (logs || []).reduce(
    (acc, l) => ({
      calories_consumed: acc.calories_consumed + (l.calories || 0),
      protein_consumed: acc.protein_consumed + (l.protein_g || 0),
      carbs_consumed: acc.carbs_consumed + (l.carbs_g || 0),
      fat_consumed: acc.fat_consumed + (l.fat_g || 0),
    }),
    { calories_consumed: 0, protein_consumed: 0, carbs_consumed: 0, fat_consumed: 0 }
  )

  return {
    ...totals,
    calories_goal: goals?.calories || 2000,
    protein_goal: goals?.protein || 150,
  }
}

// ── Finance ───────────────────────────────────────────────
export async function getFinanceEntries() {
  const { data } = await supabase
    .from('finance_entries')
    .select('*')
    .eq('user_id', UID)
    .order('date', { ascending: false })
    .limit(50)
  return data || []
}

export async function getFinanceSummary() {
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'

  const { data } = await supabase
    .from('finance_entries')
    .select('type, amount, date')
    .eq('user_id', UID)
    .gte('date', monthStart)

  const summary = (data || []).reduce(
    (acc, e) => {
      const amt = Number(e.amount) || 0
      if (e.type === 'income') acc.total_income += amt
      if (e.type === 'expense') acc.total_expenses += amt
      if (e.type === 'savings') acc.total_savings += amt
      if (e.type === 'loan') acc.total_loan += amt
      if (e.date === today && e.type === 'expense') acc.today_expenses += amt
      return acc
    },
    { total_income: 0, total_expenses: 0, total_savings: 0, total_loan: 0, today_expenses: 0 }
  )

  summary.balance = summary.total_income - summary.total_expenses
  summary.budget_used =
    summary.total_income > 0
      ? Math.min(Math.round((summary.total_expenses / summary.total_income) * 100), 100)
      : 0

  return summary
}

export async function saveFinanceEntry({ type, amount, note, date }) {
  const { data, error } = await supabase
    .from('finance_entries')
    .insert({ user_id: UID, type, amount: Number(amount), note, date })
    .select()
    .maybeSingle()
  if (error) throw error
  return data
}

export async function deleteFinanceEntry(id) {
  await supabase.from('finance_entries').delete().eq('id', id).eq('user_id', UID)
}
