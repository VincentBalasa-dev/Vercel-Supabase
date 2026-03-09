export default function ProgressBar({ value = 0, max = 100, color = 'bg-blue-500', className = '' }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className={`w-full h-2 rounded-full bg-gray-800 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${pct}%`, transition: 'width 0.4s ease' }}
      />
    </div>
  )
}
