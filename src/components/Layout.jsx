import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import { useIsMobile } from '../hooks/useIsMobile'

export default function Layout() {
  const isMobile = useIsMobile()

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0d1117' }}>
      {!isMobile && <Sidebar />}
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: isMobile ? '80px' : '0' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
      {isMobile && <BottomNav />}
    </div>
  )
}
