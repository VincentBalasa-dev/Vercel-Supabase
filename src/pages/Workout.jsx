import { useEffect, useState } from 'react'
import { Plus, ChevronRight, Dumbbell, Zap, Wind, Target, Activity } from 'lucide-react'
import { getWorkoutWeek, getWorkoutRecent, saveWorkoutSession } from '../lib/db'
import { getWeekDays, today } from '../lib/utils'
import Card from '../components/ui/Card'

const CATEGORIES = [
  { type: 'Push', desc: 'Chest, Shoulders', icon: Zap, color: '#f97316', bg: '#431407' },
  { type: 'Pull', desc: 'Back, Biceps', icon: Dumbbell, color: '#3b82f6', bg: '#1e3a5f' },
  { type: 'Cardio', desc: 'HIIT, Running', icon: Wind, color: '#22c55e', bg: '#14532d' },
  { type: 'Legs', desc: 'Quads, Glutes', icon: Target, color: '#a855f7', bg: '#3b1a6e' },
  { type: 'Core', desc: 'Abs & Stability', icon: Activity, color: '#3b82f6', bg: '#1e3a5f' },
]

export default function Workout() {
  const [weekDays, setWeekDays] = useState([])
  const [sessions, setSessions] = useState([])
  const [recent, setRecent] = useState([])
  const [showLog, setShowLog] = useState(false)
  const [selected, setSelected] = useState(null)
  const [sessionName, setSessionName] = useState('')
  const [exercises, setExercises] = useState([{ name: '', sets: '', reps: '', weight: '' }])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setWeekDays(getWeekDays())
    async function load() {
      try {
        const [s, r] = await Promise.all([
          getWorkoutWeek(),
          getWorkoutRecent(),
        ])
        setSessions(s)
        setRecent(r)
      } catch { /* empty */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  function openLog(category) {
    setSelected(category)
    setSessionName(`${category.type} Day`)
    setExercises([{ name: '', sets: '', reps: '', weight: '' }])
    setShowLog(true)
  }

  function addExercise() {
    setExercises(prev => [...prev, { name: '', sets: '', reps: '', weight: '' }])
  }

  function updateExercise(i, field, val) {
    setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: val } : ex))
  }

  async function saveSession() {
    if (!sessionName.trim()) return
    setSaving(true)
    try {
      await saveWorkoutSession({
        name: sessionName,
        type: selected.type,
        date: today(),
        exercises: exercises.filter(e => e.name.trim()),
      })
      const [s, r] = await Promise.all([getWorkoutWeek(), getWorkoutRecent()])
      setSessions(s)
      setRecent(r)
      setShowLog(false)
    } catch { /* empty */ }
    finally { setSaving(false) }
  }

  const workedDays = sessions.map(s => s.date)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Workout Hub</h1>
      </div>

      {/* Weekly progress */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white">Weekly Progress</span>
          <span className="text-xs text-blue-400 font-semibold">{workedDays.length}/7 Days</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(({ label, date, isToday }) => {
            const done = workedDays.includes(date)
            return (
              <div key={date} className="flex flex-col items-center gap-1.5">
                <span className={`text-[10px] ${isToday ? 'text-blue-400 font-semibold' : 'text-gray-500'}`}>{label}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  done ? 'bg-blue-500 border-blue-500' :
                  isToday ? 'border-blue-500 border-dashed' : 'border-gray-700'
                }`}>
                  {done && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Start Workout */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Start Workout</h2>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.slice(0, 4).map(cat => (
            <button
              key={cat.type}
              onClick={() => openLog(cat)}
              className="flex flex-col gap-1 p-4 rounded-2xl text-left"
              style={{ backgroundColor: '#161b22' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1" style={{ backgroundColor: cat.bg }}>
                <cat.icon size={18} style={{ color: cat.color }} />
              </div>
              <span className="text-sm font-semibold text-white">{cat.type}</span>
              <span className="text-xs text-gray-400">{cat.desc}</span>
            </button>
          ))}
        </div>
        {/* Core — full width */}
        <button
          onClick={() => openLog(CATEGORIES[4])}
          className="flex items-center justify-between w-full mt-3 px-4 py-4 rounded-2xl"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Activity size={18} className="text-blue-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-white">Core Focus</div>
              <div className="text-xs text-gray-400">Abs & Stability</div>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Recent Activity */}
      {recent.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {recent.map(session => {
              const cat = CATEGORIES.find(c => c.type === session.type) || CATEGORIES[0]
              return (
                <Card key={session.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cat.color }}>{session.type} Day</span>
                    <span className="text-xs text-gray-500">{session.date}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{session.name}</p>
                  {session.note && <p className="text-xs text-gray-400 mt-1 italic">"{session.note}"</p>}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Log Workout Modal */}
      {showLog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto" style={{ backgroundColor: '#161b22' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Log {selected?.type} Workout</h3>
              <button onClick={() => setShowLog(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            <input
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              placeholder="Session name (e.g. Push Day A)"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none mb-4"
              style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}
            />

            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Exercises</p>
            {exercises.map((ex, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                <input value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)} placeholder="Exercise" className="col-span-4 sm:col-span-2 px-3 py-2 rounded-lg text-white text-xs outline-none" style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }} />
                <input value={ex.sets} onChange={e => updateExercise(i, 'sets', e.target.value)} placeholder="Sets" className="px-3 py-2 rounded-lg text-white text-xs outline-none" style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }} />
                <input value={ex.reps} onChange={e => updateExercise(i, 'reps', e.target.value)} placeholder="Reps" className="px-3 py-2 rounded-lg text-white text-xs outline-none" style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }} />
              </div>
            ))}
            <button onClick={addExercise} className="flex items-center gap-1 text-blue-400 text-sm mt-1 mb-5">
              <Plus size={14} /> Add Exercise
            </button>

            <button
              onClick={saveSession}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Workout'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
