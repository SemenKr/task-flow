import {Badge} from '@/common/components/ui/badge';
import type {TaskStats} from '../model/types';

type TodolistsSidebarStatsProps = {
    stats: TaskStats
    hiddenOnMobile?: boolean
}

export const TodolistsSidebarStats = ({stats, hiddenOnMobile = false}: TodolistsSidebarStatsProps) => (
    <div className={hiddenOnMobile ? 'hidden lg:flex flex-wrap gap-2' : 'flex flex-wrap gap-2'}>
        <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-xs font-normal">
            {stats.matched}/{stats.total} shown
        </Badge>
        <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-xs font-normal text-muted-foreground">
            {stats.completed} done
        </Badge>
        <Badge variant="outline" className="rounded-full border-destructive/30 px-2.5 py-1 text-xs text-destructive">
            {stats.overdue} overdue
        </Badge>
    </div>
)
