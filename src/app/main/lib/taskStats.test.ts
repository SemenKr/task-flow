import {describe, expect, it} from 'vitest';
import {aggregateTaskStats, syncTaskStatsByListId, upsertTaskStats} from './taskStats';
import type {DomainTodolist} from '@/feature/todolists/libs/types';
import type {TaskStatsByListId} from '../model/types';

const createTodolist = (id: string, title: string): DomainTodolist => ({
    id,
    title,
    order: 0,
    addedDate: '2025-01-01T00:00:00.000Z',
    filter: 'all',
    entityStatus: 'idle',
})

describe('taskStats', () => {
    it('aggregates matched, completed, overdue and today counts', () => {
        const aggregated = aggregateTaskStats({
            first: {matched: 4, total: 6, completed: 2, overdue: 1, today: 1},
            second: {matched: 3, total: 5, completed: 1, overdue: 2, today: 0},
        })

        expect(aggregated).toEqual({
            matched: 7,
            total: 11,
            completed: 3,
            overdue: 3,
            today: 1,
        })
    })

    it('keeps stats only for existing lists', () => {
        const statsByListId: TaskStatsByListId = {
            first: {matched: 2, total: 4, completed: 1, overdue: 0, today: 0},
            second: {matched: 1, total: 3, completed: 0, overdue: 1, today: 1},
        }

        const synced = syncTaskStatsByListId(statsByListId, [createTodolist('second', 'Second')])

        expect(synced).toEqual({
            second: {matched: 1, total: 3, completed: 0, overdue: 1, today: 1},
        })
    })

    it('returns the same reference when stats did not change', () => {
        const statsByListId: TaskStatsByListId = {
            first: {matched: 2, total: 4, completed: 1, overdue: 0, today: 1},
        }

        const nextState = upsertTaskStats(statsByListId, 'first', {
            matched: 2,
            total: 4,
            completed: 1,
            overdue: 0,
            today: 1,
        })

        expect(nextState).toBe(statsByListId)
    })
})
