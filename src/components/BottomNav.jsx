import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Dumbbell, Utensils, Wallet, Plus } from 'lucide-react'
import { cn } from '../lib/utils'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/workout', icon: Dumbbell, label: 'Workout' },
  null, // FAB placeholder
  { to: '/diet', icon: Utensils, label: 'Diet' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
]

export default function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2"
      style={{ backgroundColor: '#161b22', borderTop: '1px solid #30363d', height: '64px' }}
    >
      {tabs.map((tab, i) => {
        if (!tab) {
          return (
            <button
              key="fab"
              onClick={() => navigate('/habits')}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/30 -mt-6"
            >
              <Plus size={24} />
            </button>
          )
        }

        const Icon = tab.icon
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg',
                isActive ? 'text-blue-500' : 'text-gray-500'
              )
            }
          >
            <Icon size={20} />
            <span className="text-[10px]">{tab.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
