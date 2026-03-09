import { cn } from '../../lib/utils'

export default function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn('rounded-2xl p-4', onClick && 'cursor-pointer hover:brightness-110', className)}
      style={{ backgroundColor: '#161b22' }}
    >
      {children}
    </div>
  )
}
