import { cx } from '../utils'
import type { Team } from '../types'
import { Flag } from './Flag'

export function TeamPill({
  team,
  align = 'left',
  strong = false,
  className,
}: {
  team: Team
  align?: 'left' | 'right'
  strong?: boolean
  className?: string
}) {
  return (
    <div
      className={cx(
        'flex min-w-0 items-center gap-2',
        align === 'right' && 'flex-row-reverse text-right',
        className,
      )}
    >
      <Flag emoji={team.flag} name={team.name} size={22} />
      <span
        className={cx(
          'truncate',
          strong ? 'font-bold text-slate-900' : 'font-semibold text-slate-700',
        )}
      >
        {team.name}
      </span>
    </div>
  )
}
