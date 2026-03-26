import {TaskPriority, TaskStatus} from '@/common/enums';
import type {
    GlobalTaskDueFilter,
    GlobalTaskFilters,
    GlobalTaskPriorityFilter,
    GlobalTaskStatusFilter,
} from '@/feature/todolists/libs/types';
import type {FilterOption, ListSortValue, TaskStats} from './types';

export const DEFAULT_GLOBAL_TASK_FILTERS: GlobalTaskFilters = {
    query: '',
    status: 'all',
    priority: 'all',
    due: 'all',
}

export const EMPTY_TASK_STATS: TaskStats = {
    matched: 0,
    total: 0,
    completed: 0,
    overdue: 0,
}

export const GLOBAL_STATUS_OPTIONS: FilterOption<GlobalTaskStatusFilter>[] = [
    { label: 'All statuses', value: 'all' },
    { label: 'New', value: `${TaskStatus.New}` },
    { label: 'In progress', value: `${TaskStatus.InProgress}` },
    { label: 'Completed', value: `${TaskStatus.Completed}` },
    { label: 'Draft', value: `${TaskStatus.Draft}` },
]

export const GLOBAL_PRIORITY_OPTIONS: FilterOption<GlobalTaskPriorityFilter>[] = [
    { label: 'All priorities', value: 'all' },
    { label: 'Low', value: `${TaskPriority.Low}` },
    { label: 'Medium', value: `${TaskPriority.Middle}` },
    { label: 'High', value: `${TaskPriority.Hi}` },
    { label: 'Urgent', value: `${TaskPriority.Urgently}` },
    { label: 'Later', value: `${TaskPriority.Later}` },
]

export const GLOBAL_DUE_OPTIONS: FilterOption<GlobalTaskDueFilter>[] = [
    { label: 'Any date', value: 'all' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Today', value: 'today' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'No deadline', value: 'no-deadline' },
]

export const LIST_SORT_OPTIONS: FilterOption<ListSortValue>[] = [
    { label: 'Custom order', value: 'custom' },
    { label: 'Newest first', value: 'recent' },
    { label: 'Oldest first', value: 'oldest' },
    { label: 'A to Z', value: 'alphabetical' },
]
