import { useEffect, useState } from 'react'
import { Plus, Utensils, Target, Trash2 } from 'lucide-react'
import { getDietLogs, getDietGoals, saveDietLog, deleteDietLog, saveDietGoals } from '../lib/db'
import { today, formatDate } from '../lib/utils'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import CircularProgress from '../components/ui/CircularProgress'

const MACROS = [
  { key: 'protein', label: 'Protein', color: 'bg-blue-500', ring: '#3b82f6', unit: 'g' },
  { key: 'carbs', label: 'Carbs', color: 'bg-yellow-400', ring: '#facc15', unit: 'g' },
  { key: 'fat', label: 'Fat', color: 'bg-red-400', ring: '#f87171', unit: 'g' },
]

export default function Diet() {
  const [logs, setLogs] = useState([])
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 65 })
  const [showAdd, setShowAdd] = useState(false)
  const [showGoals, setShowGoals] = useState(false)
  const [form, setForm] = useState({ food_name: '', calories: '', protein: '', carbs: '', fat: '' })
  const [goalForm, setGoalForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const [l, g] = await Promise.all([
        getDietLogs(today()),
        getDietGoals(),
      ])
      setLogs(l)
      if (g) { setGoals(g); setGoalForm(g) }
    } catch { /* empty */ }
  }

  const totals = logs.reduce((acc, l) => ({
    calories: acc.calories + (l.calories || 0),
    protein: acc.protein + (l.protein_g || 0),
    carbs: acc.carbs + (l.carbs_g || 0),
    fat: acc.fat + (l.fat_g || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const calPct = Math.min(Math.round((totals.calories / goals.calories) * 100), 100)
  const calLeft = goals.calories - totals.calories

  async function addFood() {
    if (!form.food_name.trim()) return
    setSaving(true)
    try {
      await saveDietLog({ ...form, date: today() })
      setForm({ food_name: '', calories: '', protein: '', carbs: '', fat: '' })
      setShowAdd(false)
      await load()
    } catch { /* empty */ }
    finally { setSaving(false) }
  }

  async function deleteLog(id) {
    try {
      await deleteDietLog(id)
      setLogs(prev => prev.filter(l => l.id !== id))
    } catch { /* empty */ }
  }

  async function saveGoals() {
    setSaving(true)
    try {
      await saveDietGoals(goalForm)
      setGoals(goalForm)
      setShowGoals(false)
    } catch { /* empty */ }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Nutrition</h1>
          <p className="text-gray-400 text-sm">{formatDate(today())}</p>
        </div>
        <button onClick={() => setShowGoals(true)} className="text-blue-400 text-sm">Set Goals</button>
      </div>

      {/* Calorie overview */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Utensils size={16} className="text-green-400 mb-2" />
            <div className="text-4xl font-bold text-white">{calLeft < 0 ? 0 : calLeft}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">Calories Left</div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-sm font-bold text-white">{goals.calories}</div>
                <div className="text-xs text-gray-500">Goal</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-green-400">{totals.calories}</div>
                <div className="text-xs text-gray-500">Eaten</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-red-400">{Math.max(totals.calories - goals.calories, 0)}</div>
                <div className="text-xs text-gray-500">Over</div>
              </div>
            </div>
          </div>
          <div className="relative flex items-center justify-center ml-4">
            <CircularProgress value={calPct} size={96} stroke={8} color="#22c55e" />
            <span className="absolute text-sm font-bold text-white">{calPct}%</span>
          </div>
        </div>
      </Card>

      {/* Macros */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-3">Macros</h3>
        <div className="space-y-3">
          {MACROS.map(({ key, label, color, unit }) => {
            const consumed = totals[key]
            const goal = goals[key]
            const pct = Math.min(Math.round((consumed / goal) * 100), 100)
            return (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">{label}</span>
                  <span className="text-gray-400">{consumed}{unit} / {goal}{unit}</span>
                </div>
                <ProgressBar value={consumed} max={goal} color={color} />
              </div>
            )
          })}
        </div>
      </Card>

      {/* Food log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Today's Food Log</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-sm text-blue-400"
          >
            <Plus size={14} /> Add Food
          </button>
        </div>

        {logs.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 text-sm py-4">No food logged yet today</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <Card key={log.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{log.food_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {log.calories} kcal · {log.protein_g}g P · {log.carbs_g}g C · {log.fat_g}g F
                    </p>
                  </div>
                  <button onClick={() => deleteLog(log.id)} className="text-gray-600 hover:text-red-400 ml-3">
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Food Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-t-3xl p-5" style={{ backgroundColor: '#161b22' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Log Food</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              {[
                { field: 'food_name', label: 'Food Name', placeholder: 'e.g. Chicken Breast' },
                { field: 'calories', label: 'Calories (kcal)', placeholder: '0' },
                { field: 'protein', label: 'Protein (g)', placeholder: '0' },
                { field: 'carbs', label: 'Carbs (g)', placeholder: '0' },
                { field: 'fat', label: 'Fat (g)', placeholder: '0' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                  <input
                    value={form[field]}
                    onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder}
                    type={field === 'food_name' ? 'text' : 'number'}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}
                  />
                </div>
              ))}
            </div>
            <button onClick={addFood} disabled={saving} className="w-full mt-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Food'}
            </button>
          </div>
        </div>
      )}

      {/* Set Goals Modal */}
      {showGoals && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-t-3xl p-5" style={{ backgroundColor: '#161b22' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Daily Goals</h3>
              <button onClick={() => setShowGoals(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              {[
                { field: 'calories', label: 'Calories (kcal)' },
                { field: 'protein', label: 'Protein (g)' },
                { field: 'carbs', label: 'Carbs (g)' },
                { field: 'fat', label: 'Fat (g)' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                  <input
                    value={goalForm[field] || ''}
                    onChange={e => setGoalForm(p => ({ ...p, [field]: Number(e.target.value) }))}
                    type="number"
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}
                  />
                </div>
              ))}
            </div>
            <button onClick={saveGoals} disabled={saving} className="w-full mt-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Goals'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
