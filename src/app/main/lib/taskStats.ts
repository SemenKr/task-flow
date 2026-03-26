import type {DomainTodolist} from '@/feature/todolists/libs/types';
import {EMPTY_TASK_STATS} from '../model/constants';
import type {TaskStats, TaskStatsByListId} from '../model/types';

const areTaskStatsEqual = (current: TaskStats | undefined, next: TaskStats) => (
    Boolean(
        current &&
        current.matched === next.matched &&
        current.total === next.total &&
        current.completed === next.completed &&
        current.overdue === next.overdue,
    )
)

export const aggregateTaskStats = (statsByListId: TaskStatsByListId): TaskStats => (
    Object.values(statsByListId).reduce(
        (acc, stats) => ({
            matched: acc.matched + stats.matched,
            total: acc.total + stats.total,
            completed: acc.completed + stats.completed,
            overdue: acc.overdue + stats.overdue,
        }),
        { ...EMPTY_TASK_STATS },
    )
)

export const syncTaskStatsByListId = (
    prev: TaskStatsByListId,
    todolists: DomainTodolist[] | undefined,
): TaskStatsByListId => {
    if (!todolists?.length) {
        return {}
    }

    const next: TaskStatsByListId = {}

    todolists.forEach((list) => {
        if (prev[list.id]) {
            next[list.id] = prev[list.id]
        }
    })

    return next
}

export const upsertTaskStats = (
    prev: TaskStatsByListId,
    listId: string,
    stats: TaskStats,
): TaskStatsByListId => {
    if (areTaskStatsEqual(prev[listId], stats)) {
        return prev
    }

    return {
        ...prev,
        [listId]: stats,
    }
}
