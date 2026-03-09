import { useEffect, useState } from 'react'
import { Plus, TrendingUp, TrendingDown, PiggyBank, CreditCard, Trash2, Wallet } from 'lucide-react'
import { getFinanceEntries, getFinanceSummary, saveFinanceEntry, deleteFinanceEntry } from '../lib/db'
import { today, formatDate, formatCurrency } from '../lib/utils'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'

const TYPES = [
  { value: 'income', label: 'Income', icon: TrendingUp, color: 'text-green-400', bg: '#14532d' },
  { value: 'expense', label: 'Expense', icon: TrendingDown, color: 'text-red-400', bg: '#4c0519' },
  { value: 'savings', label: 'Savings', icon: PiggyBank, color: 'text-blue-400', bg: '#1e3a5f' },
  { value: 'loan', label: 'Loan', icon: CreditCard, color: 'text-yellow-400', bg: '#3b2e06' },
]

export default function Finance() {
  const [entries, setEntries] = useState([])
  const [summary, setSummary] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ type: 'expense', amount: '', note: '', date: today() })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [e, s] = await Promise.all([
        getFinanceEntries(),
        getFinanceSummary(),
      ])
      setEntries(e)
      setSummary(s)
    } catch { /* empty */ }
  }

  async function addEntry() {
    if (!form.amount) return
    setSaving(true)
    try {
      await saveFinanceEntry(form)
      setForm({ type: 'expense', amount: '', note: '', date: today() })
      setShowAdd(false)
      await load()
    } catch { /* empty */ }
    finally { setSaving(false) }
  }

  async function deleteEntry(id) {
    try {
      await deleteFinanceEntry(id)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch { /* empty */ }
  }

  const balance = (summary.total_income || 0) - (summary.total_expenses || 0)
  const budgetUsed = summary.total_income > 0
    ? Math.min(Math.round((summary.total_expenses / summary.total_income) * 100), 100)
    : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Finance</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-sm text-blue-400">
          <Plus size={14} /> Add Entry
        </button>
      </div>

      {/* Balance overview */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={16} className="text-yellow-400" />
          <span className="text-sm font-semibold text-white">Monthly Overview</span>
        </div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Current Balance</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-0.5">Total Expenses</p>
            <p className="text-xl font-bold text-red-400">-{formatCurrency(summary.total_expenses || 0)}</p>
          </div>
        </div>
        <ProgressBar value={budgetUsed} max={100} color="bg-blue-500" />
        <p className="text-right text-xs text-gray-400 mt-1">{budgetUsed}% of Income Spent</p>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {TYPES.map(({ value, label, icon: Icon, color, bg }) => {
          const key = `total_${value}${value === 'income' ? '' : 's'}`
          const amount = summary[`total_${value}`] || summary[`total_${value}s`] || 0
          return (
            <Card key={value} className="flex flex-col gap-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-1" style={{ backgroundColor: bg }}>
                <Icon size={16} className={color} />
              </div>
              <span className="text-xs text-gray-400">{label}</span>
              <span className={`text-base font-bold ${color}`}>{formatCurrency(amount)}</span>
            </Card>
          )
        })}
      </div>

      {/* Entries list */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Recent Entries</h2>
        {entries.length === 0 ? (
          <Card><p className="text-center text-gray-500 text-sm py-4">No entries yet</p></Card>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, 20).map(entry => {
              const t = TYPES.find(t => t.value === entry.type) || TYPES[1]
              const Icon = t.icon
              return (
                <Card key={entry.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.bg }}>
                        <Icon size={15} className={t.color} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{entry.note || t.label}</p>
                        <p className="text-xs text-gray-500">{formatDate(entry.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${entry.type === 'income' ? 'text-green-400' : entry.type === 'expense' ? 'text-red-400' : 'text-blue-400'}`}>
                        {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                      </span>
                      <button onClick={() => deleteEntry(entry.id)} className="text-gray-600 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Entry Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-t-3xl p-5" style={{ backgroundColor: '#161b22' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Add Entry</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 text-xl">✕</button>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {TYPES.map(({ value, label, icon: Icon, color, bg }) => (
                <button
                  key={value}
                  onClick={() => setForm(p => ({ ...p, type: value }))}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 ${form.type === value ? 'border-blue-500' : 'border-transparent'}`}
                  style={{ backgroundColor: form.type === value ? bg : '#0d1117' }}
                >
                  <Icon size={16} className={color} />
                  <span className="text-[10px] text-gray-300">{label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Amount (PHP)</label>
                <input
                  value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Note</label>
                <input
                  value={form.note}
                  onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                  placeholder="e.g. Salary, Groceries..."
                  className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Date</label>
                <input
                  value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}
                />
              </div>
            </div>

            <button onClick={addEntry} disabled={saving} className="w-full mt-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Entry'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
