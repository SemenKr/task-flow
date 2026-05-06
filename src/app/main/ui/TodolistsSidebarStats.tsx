import {Badge} from '@/common/components/ui/badge';
import type {TaskStats} from '@/feature/todolists/model/types';

type TodolistsSidebarStatsProps = {
    stats: TaskStats
    hiddenOnMobile?: boolean
    compact?: boolean
}

const formatPercent = (value: number) => `${Math.round(value)}%`

const getCompletionPercent = ({matched, completed}: TaskStats) => (
    matched ? (completed / matched) * 100 : 0
)

const getOverduePercent = ({matched, overdue}: TaskStats) => (
    matched ? (overdue / matched) * 100 : 0
)

export const TodolistsSidebarStats = ({
    stats,
    hiddenOnMobile = false,
    compact = false,
}: TodolistsSidebarStatsProps) => (
    <div className={hiddenOnMobile ? 'hidden lg:flex flex-wrap gap-2' : `flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
        <Badge variant="secondary" className={compact ? 'rounded-full px-2 py-0.5 text-[11px] font-normal' : 'rounded-full px-2.5 py-1 text-xs font-normal'}>
            {stats.matched}/{stats.total} shown
        </Badge>
        <Badge variant="secondary" className={compact ? 'rounded-full px-2 py-0.5 text-[11px] font-normal text-muted-foreground' : 'rounded-full px-2.5 py-1 text-xs font-normal text-muted-foreground'}>
            {stats.completed} done
        </Badge>
        <Badge variant="outline" className={compact ? 'rounded-full border-destructive/30 px-2 py-0.5 text-[11px] text-destructive' : 'rounded-full border-destructive/30 px-2.5 py-1 text-xs text-destructive'}>
            {stats.overdue} overdue
        </Badge>
        <Badge variant="secondary" className={compact ? 'rounded-full px-2 py-0.5 text-[11px] font-normal text-muted-foreground' : 'rounded-full px-2.5 py-1 text-xs font-normal text-muted-foreground'}>
            {formatPercent(getCompletionPercent(stats))} completion
        </Badge>
        <Badge variant="secondary" className={compact ? 'rounded-full px-2 py-0.5 text-[11px] font-normal text-muted-foreground' : 'rounded-full px-2.5 py-1 text-xs font-normal text-muted-foreground'}>
            {stats.today} due today
        </Badge>
        <Badge variant="outline" className={compact ? 'rounded-full border-destructive/20 px-2 py-0.5 text-[11px] text-destructive/90' : 'rounded-full border-destructive/20 px-2.5 py-1 text-xs text-destructive/90'}>
            {formatPercent(getOverduePercent(stats))} overdue
        </Badge>
    </div>
)
