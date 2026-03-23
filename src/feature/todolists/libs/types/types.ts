import type { RequestStatus } from "@/common/types"
import type {Todolist} from '@/feature/todolists/api/todolistsApi.types';
import {TaskPriority, TaskStatus} from '@/common/enums';

export type DomainTodolist = Todolist & {
    filter: FilterValues
    entityStatus: RequestStatus
}

export type FilterValues = "all" | "active" | "completed"

export type GlobalTaskStatusFilter = 'all' | `${TaskStatus}`
export type GlobalTaskPriorityFilter = 'all' | `${TaskPriority}`
export type GlobalTaskDueFilter = 'all' | 'overdue' | 'today' | 'upcoming' | 'no-deadline'

export type GlobalTaskFilters = {
    query: string
    status: GlobalTaskStatusFilter
    priority: GlobalTaskPriorityFilter
    due: GlobalTaskDueFilter
}
