import type {GlobalTaskDueFilter, GlobalTaskPriorityFilter, GlobalTaskStatusFilter} from '@/feature/todolists/libs/types';

export type FilterOption<T extends string> = {
    label: string
    value: T
}

export type ListSortValue = 'custom' | 'recent' | 'oldest' | 'alphabetical'

export type TaskStats = {
    matched: number
    total: number
    completed: number
    overdue: number
}

export type TaskStatsByListId = Record<string, TaskStats>

export type SidebarFiltersModel = {
    globalTaskFilters: {
        query: string
        status: GlobalTaskStatusFilter
        priority: GlobalTaskPriorityFilter
        due: GlobalTaskDueFilter
    }
    hasActiveGlobalTaskFilters: boolean
    activeFiltersCount: number
    onUpdateGlobalTaskFilters: (nextFilters: Partial<{
        query: string
        status: GlobalTaskStatusFilter
        priority: GlobalTaskPriorityFilter
        due: GlobalTaskDueFilter
    }>) => void
    onResetGlobalTaskFilters: () => void
}

export type SidebarListNavigationModel = {
    searchValue: string
    onSearchValueChange: (value: string) => void
    sortValue: ListSortValue
    onSortValueChange: (value: ListSortValue) => void
    isReorderingLists: boolean
    dragListsEnabled: boolean
    displayTodolists: Array<{ id: string; title: string }>
    selectedListId: string | null
    tasksStatsByListId: TaskStatsByListId
    draggedListId: string | null
    dragOverListId: string | null
    onSelectList: (listId: string) => void
    onListDragStart: (listId: string) => void
    onListDragEnter: (listId: string) => void
    onListDrop: (listId: string) => Promise<void>
    onListDragEnd: () => void
    reorderHelperText: string | null
    showDragHandle: boolean
}

export type SidebarStatsModel = {
    aggregatedTaskStats: TaskStats
}
