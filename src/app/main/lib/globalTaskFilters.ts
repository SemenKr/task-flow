import type {GlobalTaskFilters} from '@/feature/todolists/libs/types';
import {
    DEFAULT_GLOBAL_TASK_FILTERS,
    GLOBAL_DUE_OPTIONS,
    GLOBAL_PRIORITY_OPTIONS,
    GLOBAL_STATUS_OPTIONS,
} from '../model/constants';

const GLOBAL_STATUS_VALUES = new Set(GLOBAL_STATUS_OPTIONS.map(({ value }) => value))
const GLOBAL_PRIORITY_VALUES = new Set(GLOBAL_PRIORITY_OPTIONS.map(({ value }) => value))
const GLOBAL_DUE_VALUES = new Set(GLOBAL_DUE_OPTIONS.map(({ value }) => value))

function normalizeFilterValue<T extends string>(value: string | null, allowedValues: Set<T>, fallbackValue: T): T {
    if (value && allowedValues.has(value as T)) {
        return value as T
    }

    return fallbackValue
}

export const getGlobalTaskFilters = (searchParams: URLSearchParams): GlobalTaskFilters => ({
    query: searchParams.get('q') ?? DEFAULT_GLOBAL_TASK_FILTERS.query,
    status: normalizeFilterValue(searchParams.get('taskStatus'), GLOBAL_STATUS_VALUES, DEFAULT_GLOBAL_TASK_FILTERS.status),
    priority: normalizeFilterValue(searchParams.get('priority'), GLOBAL_PRIORITY_VALUES, DEFAULT_GLOBAL_TASK_FILTERS.priority),
    due: normalizeFilterValue(searchParams.get('due'), GLOBAL_DUE_VALUES, DEFAULT_GLOBAL_TASK_FILTERS.due),
})

export const hasActiveGlobalTaskFilters = (filters: GlobalTaskFilters) => (
    Boolean(filters.query.trim()) ||
    filters.status !== DEFAULT_GLOBAL_TASK_FILTERS.status ||
    filters.priority !== DEFAULT_GLOBAL_TASK_FILTERS.priority ||
    filters.due !== DEFAULT_GLOBAL_TASK_FILTERS.due
)

export const getActiveGlobalTaskFiltersCount = (filters: GlobalTaskFilters) => (
    Number(Boolean(filters.query.trim())) +
    Number(filters.status !== DEFAULT_GLOBAL_TASK_FILTERS.status) +
    Number(filters.priority !== DEFAULT_GLOBAL_TASK_FILTERS.priority) +
    Number(filters.due !== DEFAULT_GLOBAL_TASK_FILTERS.due)
)

export const createGlobalTaskSearchParams = (
    searchParams: URLSearchParams,
    nextFilters: Partial<GlobalTaskFilters>,
) => {
    const mergedFilters = { ...getGlobalTaskFilters(searchParams), ...nextFilters }
    const nextParams = new URLSearchParams(searchParams)

    if (mergedFilters.query.trim()) {
        nextParams.set('q', mergedFilters.query.trim())
    } else {
        nextParams.delete('q')
    }

    if (mergedFilters.status !== DEFAULT_GLOBAL_TASK_FILTERS.status) {
        nextParams.set('taskStatus', mergedFilters.status)
    } else {
        nextParams.delete('taskStatus')
    }

    if (mergedFilters.priority !== DEFAULT_GLOBAL_TASK_FILTERS.priority) {
        nextParams.set('priority', mergedFilters.priority)
    } else {
        nextParams.delete('priority')
    }

    if (mergedFilters.due !== DEFAULT_GLOBAL_TASK_FILTERS.due) {
        nextParams.set('due', mergedFilters.due)
    } else {
        nextParams.delete('due')
    }

    return nextParams
}
