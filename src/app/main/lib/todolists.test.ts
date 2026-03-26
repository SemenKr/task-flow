import {describe, expect, it} from 'vitest';
import {
    applyPreviewOrder,
    canReorderTodolists,
    filterAndSortTodolists,
    getTodolistIdsSignature,
    normalizeListSearchValue,
} from './todolists';
import type {DomainTodolist} from '@/feature/todolists/libs/types';

const createTodolist = (id: string, title: string, addedDate: string): DomainTodolist => ({
    id,
    title,
    order: 0,
    addedDate,
    filter: 'all',
    entityStatus: 'idle',
})

const todolists = [
    createTodolist('1', 'Beta board', '2025-01-02T00:00:00.000Z'),
    createTodolist('2', 'Alpha board', '2025-01-01T00:00:00.000Z'),
    createTodolist('3', 'Gamma board', '2025-01-03T00:00:00.000Z'),
]

describe('todolists utils', () => {
    it('normalizes search values', () => {
        expect(normalizeListSearchValue('  Sprint Board  ')).toBe('sprint board')
    })

    it('filters and sorts lists', () => {
        expect(filterAndSortTodolists(todolists, 'board', 'alphabetical').map(({id}) => id)).toEqual(['2', '1', '3'])
        expect(filterAndSortTodolists(todolists, 'gamma', 'recent').map(({id}) => id)).toEqual(['3'])
    })

    it('allows reorder only for custom sort without search or pending request', () => {
        expect(canReorderTodolists('custom', '', false)).toBe(true)
        expect(canReorderTodolists('alphabetical', '', false)).toBe(false)
        expect(canReorderTodolists('custom', 'alpha', false)).toBe(false)
        expect(canReorderTodolists('custom', '', true)).toBe(false)
    })

    it('applies preview order and creates ids signature', () => {
        expect(applyPreviewOrder(todolists, ['3', '1', '2']).map(({id}) => id)).toEqual(['3', '1', '2'])
        expect(getTodolistIdsSignature(todolists)).toBe('1|2|3')
    })
})
