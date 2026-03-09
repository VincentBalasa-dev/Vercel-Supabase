import { useEffect, useState } from 'react'
import { CheckSquare, Dumbbell, BookOpen, Code, Trash2, Home, Cat, Dog, Wind, Waves, ShoppingBag } from 'lucide-react'
import { getHabitsToday, toggleHabitOrChore } from '../lib/db'
import { today, formatDate } from '../lib/utils'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'

const HABITS = [
  { key: 'workout', label: 'Workout', icon: Dumbbell, color: 'text-orange-400' },
  { key: 'study', label: 'Code / Study', icon: Code, color: 'text-blue-400' },
  { key: 'read', label: 'Read', icon: BookOpen, color: 'text-green-400' },
]

const CHORES = [
  { key: 'broom', label: 'Broom / Vacuum', icon: Home },
  { key: 'mop', label: 'Mop', icon: Waves },
  { key: 'dishes', label: 'Dishes', icon: Wind },
  { key: 'garbage', label: 'Garbage', icon: Trash2 },
  { key: 'dog', label: 'Dog', icon: Dog },
  { key: 'cats', label: 'Cats', icon: Cat },
]

export default function Habits() {
  const [habits, setHabits] = useState({})
  const [chores, setChores] = useState({})
  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await getHabitsToday()
        setHabits(data.habits ?? {})
        setChores(data.chores ?? {})
      } catch { /* empty */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  async function toggleHabit(key) {
    const newVal = !habits[key]
    setHabits(prev => ({ ...prev, [key]: newVal }))
    try {
      await toggleHabitOrChore({ key, value: newVal, date: today(), type: 'habit' })
      setSaveError('')
    } catch (err) {
      setHabits(prev => ({ ...prev, [key]: !newVal }))
      setSaveError(err?.message || 'Failed to save — check Supabase RLS settings')
    }
  }

  async function toggleChore(key) {
    const newVal = !chores[key]
    setChores(prev => ({ ...prev, [key]: newVal }))
    try {
      await toggleHabitOrChore({ key, value: newVal, date: today(), type: 'chore' })
      setSaveError('')
    } catch (err) {
      setChores(prev => ({ ...prev, [key]: !newVal }))
      setSaveError(err?.message || 'Failed to save — check Supabase RLS settings')
    }
  }

  const habitsDone = HABITS.filter(h => habits[h.key]).length
  const choresDone = CHORES.filter(c => chores[c.key]).length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Habits & Chores</h1>
        <p className="text-gray-400 text-sm">{formatDate(today())}</p>
      </div>

      {saveError && (
        <div className="px-4 py-3 rounded-xl text-sm text-red-300 bg-red-900/40 border border-red-700">
          {saveError}
        </div>
      )}

      {/* Habits */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-blue-400" />
            <span className="text-sm font-semibold text-white">Daily Habits</span>
          </div>
          <span className="text-sm text-gray-400">{habitsDone}/{HABITS.length}</span>
        </div>
        <ProgressBar value={habitsDone} max={HABITS.length} className="mb-4" />

        <div className="space-y-2">
          {HABITS.map(({ key, label, icon: Icon, color }) => {
            const done = !!habits[key]
            return (
              <button
                key={key}
                onClick={() => toggleHabit(key)}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl"
                style={{ backgroundColor: done ? '#1a3a5c' : '#0d1117' }}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={done ? 'text-blue-400' : color} />
                  <span className={`text-sm font-medium ${done ? 'text-blue-300' : 'text-gray-300'}`}>{label}</span>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${done ? 'bg-blue-500 border-blue-500' : 'border-gray-600'}`}>
                  {done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Chores */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Home size={16} className="text-yellow-400" />
            <span className="text-sm font-semibold text-white">Chores</span>
          </div>
          <span className="text-sm text-gray-400">{choresDone}/{CHORES.length}</span>
        </div>
        <ProgressBar value={choresDone} max={CHORES.length} color="bg-yellow-400" className="mb-4" />

        <div className="grid grid-cols-2 gap-2">
          {CHORES.map(({ key, label, icon: Icon }) => {
            const done = !!chores[key]
            return (
              <button
                key={key}
                onClick={() => toggleChore(key)}
                className="flex items-center gap-2 px-3 py-3 rounded-xl"
                style={{ backgroundColor: done ? '#3b2e06' : '#0d1117' }}
              >
                <Icon size={15} className={done ? 'text-yellow-400' : 'text-gray-500'} />
                <span className={`text-xs font-medium ${done ? 'text-yellow-300' : 'text-gray-400'}`}>{label}</span>
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
