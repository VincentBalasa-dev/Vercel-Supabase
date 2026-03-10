import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Utensils, Wallet, BookOpen, Code, CheckSquare, Flame, Bell } from 'lucide-react'

import { getHabitsToday, getDietSummary, getFinanceSummary, getWorkoutLatest } from '../lib/db'
import { supabase } from '../lib/supabase'
import { greet, today, formatCurrency } from '../lib/utils'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import CircularProgress from '../components/ui/CircularProgress'

const streakItems = [
  { key: 'workout', label: 'Workout', icon: Dumbbell, color: '#f97316', bg: '#431407' },
  { key: 'study', label: 'Study', icon: Code, color: '#3b82f6', bg: '#1e3a5f' },
  { key: 'read', label: 'Read', icon: BookOpen, color: '#22c55e', bg: '#14532d' },
]

export default function Dashboard() {
  
  const navigate = useNavigate()
  const [habits, setHabits] = useState(null)
  const [dietSummary, setDietSummary] = useState(null)
  const [finance, setFinance] = useState(null)
  const [workout, setWorkout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState('checking')

  const displayName = 'Angelo'

  useEffect(() => {
    supabase.from('habits').select('id').limit(1)
      .then(({ error }) => setDbStatus(error ? 'error' : 'ok'))
      .catch(() => setDbStatus('error'))
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const [h, d, f, w] = await Promise.all([
          getHabitsToday(),
          getDietSummary(today()),
          getFinanceSummary(),
          getWorkoutLatest(),
        ])
        setHabits(h)
        setDietSummary(d)
        setFinance(f)
        setWorkout(w)
      } catch {
        // silently fail — show empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const calPct = dietSummary ? Math.min(Math.round((dietSummary.calories_consumed / dietSummary.calories_goal) * 100), 100) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{greet(displayName)}</p>
          <h1 className="text-xl font-bold text-white capitalize">{displayName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: '#161b22' }}>
            <span className={`w-2 h-2 rounded-full ${dbStatus === 'ok' ? 'bg-green-400' : dbStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`} />
            <span className="text-xs text-gray-400">{dbStatus === 'ok' ? 'Supabase' : dbStatus === 'error' ? 'Offline' : '...'}</span>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center relative" style={{ backgroundColor: '#161b22' }}>
            <Bell size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Daily Streaks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">Daily Streaks</h2>
          <button onClick={() => navigate('/habits')} className="text-blue-400 text-sm">View All</button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {streakItems.map(({ key, label, icon: Icon, color, bg }) => (
            <Card key={key} className="flex flex-col items-center py-4 gap-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon size={22} style={{ color }} />
              </div>
              <span className="text-xs font-medium text-white">{label}</span>
              <div className="flex items-center gap-1">
                <Flame size={12} className="text-orange-400" />
                <span className="text-xs text-gray-400">{habits?.streaks?.[key] ?? 0} Days</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Today's Workout */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Dumbbell size={18} className="text-blue-400" />
            <span className="text-sm font-semibold text-white">Today's Workout</span>
          </div>
          <button onClick={() => navigate('/workout')}>
            <Dumbbell size={18} className="text-gray-600" />
          </button>
        </div>
        {workout?.session ? (
          <>
            <h3 className="text-2xl font-bold text-white mb-0.5">{workout.session.name}</h3>
            <p className="text-gray-400 text-sm mb-4">{workout.session.type}</p>
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span>{workout.done ?? 0} / {workout.total ?? 0} Exercises</span>
            </div>
            <ProgressBar value={workout.done ?? 0} max={workout.total ?? 1} />
            <button
              onClick={() => navigate('/workout')}
              className="mt-4 w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm"
            >
              Resume Session
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm mb-3">No workout logged today</p>
            <button
              onClick={() => navigate('/workout')}
              className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold"
            >
              Start Workout
            </button>
          </div>
        )}
      </Card>

      {/* Nutrition */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Utensils size={18} className="text-green-400" />
              <span className="text-sm font-semibold text-white">Nutrition</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {dietSummary ? dietSummary.calories_goal - dietSummary.calories_consumed : '--'}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">Calories Left</div>
            <div className="mt-3">
              <div className="text-base font-semibold text-white">
                {dietSummary?.protein_consumed ?? 0}g / {dietSummary?.protein_goal ?? 0}g
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Protein Target</div>
            </div>
          </div>
          <div className="relative flex items-center justify-center ml-4">
            <CircularProgress value={calPct} size={88} stroke={7} color="#22c55e" />
            <span className="absolute text-sm font-bold text-white">{calPct}%</span>
          </div>
        </div>
        <button onClick={() => navigate('/diet')} className="mt-4 w-full py-2.5 rounded-xl text-blue-400 text-sm font-medium" style={{ backgroundColor: '#0d1117' }}>
          Log Food
        </button>
      </Card>

      {/* Finance */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-yellow-400" />
            <span className="text-sm font-semibold text-white">Finance</span>
          </div>
          <button onClick={() => navigate('/finance')} className="text-blue-400 text-sm">Monthly Plan</button>
        </div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Current Balance</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(finance?.balance ?? 0)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-0.5">Today's Expenses</div>
            <div className="text-xl font-bold text-red-400">-{formatCurrency(finance?.today_expenses ?? 0)}</div>
          </div>
        </div>
        <ProgressBar value={finance?.budget_used ?? 0} max={100} />
        <p className="text-right text-xs text-gray-400 mt-1">{finance?.budget_used ?? 0}% of Budget Used</p>
      </Card>
    </div>
  )
}
