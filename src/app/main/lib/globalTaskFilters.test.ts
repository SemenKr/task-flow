import {describe, expect, it} from 'vitest';
import {
    createGlobalTaskSearchParams,
    getActiveGlobalTaskFiltersCount,
    getGlobalTaskFilters,
    hasActiveGlobalTaskFilters,
} from './globalTaskFilters';

describe('globalTaskFilters', () => {
    it('normalizes invalid url params to defaults', () => {
        const filters = getGlobalTaskFilters(new URLSearchParams('q= deploy &taskStatus=wrong&priority=999&due=soon'))

        expect(filters).toEqual({
            query: ' deploy ',
            status: 'all',
            priority: 'all',
            due: 'all',
        })
    })

    it('creates search params and removes default values', () => {
        const nextParams = createGlobalTaskSearchParams(
            new URLSearchParams('page=2&taskStatus=1'),
            {
                query: '  ship  ',
                status: 'all',
                priority: '2',
                due: 'today',
            },
        )

        expect(nextParams.toString()).toBe('page=2&q=ship&priority=2&due=today')
    })

    it('tracks active filter state and count', () => {
        const filters = {
            query: 'release',
            status: '1' as const,
            priority: 'all' as const,
            due: 'today' as const,
        }

        expect(hasActiveGlobalTaskFilters(filters)).toBe(true)
        expect(getActiveGlobalTaskFiltersCount(filters)).toBe(3)
    })
})
