import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, Utensils, Wallet, CheckSquare, Zap } from 'lucide-react'
import { cn } from '../lib/utils'

const links = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/habits', icon: CheckSquare, label: 'Habits' },
  { to: '/workout', icon: Dumbbell, label: 'Workout' },
  { to: '/diet', icon: Utensils, label: 'Diet' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
]

export default function Sidebar() {
  return (
    <aside
      className="w-56 flex flex-col h-screen sticky top-0"
      style={{ backgroundColor: '#161b22', borderRight: '1px solid #30363d' }}
    >
      <div className="flex items-center gap-2 px-5 py-6">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <span className="font-bold text-lg text-white">LevelUp</span>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                isActive
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
