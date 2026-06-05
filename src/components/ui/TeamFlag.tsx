import { getFlagCode } from '@/lib/flag-codes'

interface Props {
  teamName: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-5 h-4',
  md: 'w-6 h-5',
  lg: 'w-8 h-6',
}

export default function TeamFlag({ teamName, size = 'md' }: Props) {
  const code = getFlagCode(teamName)
  if (!code) return null
  return (
    <span
      className={`fi fi-${code} inline-block shrink-0 rounded-sm ${sizeClasses[size]}`}
      title={teamName}
      aria-label={teamName}
    />
  )
}
