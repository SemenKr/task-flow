import {TaskStatus} from '@/common/enums';
import {Button} from '@/common/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/common/components/ui/select';
import {Skeleton} from '@/common/components/ui/skeleton';
import {useGetTasksQuery, useReorderTaskMutation} from '@/feature/todolists/api/tasksApi';
import type {DomainTask} from '@/feature/todolists/api/tasksApi.types';
import type {DomainTodolist, GlobalTaskFilters} from '@/feature/todolists/libs/types';
import {EmptyState} from '@/feature/todolists/ui/Todolists/Todolist/EmptyState.tsx';
import {TaskItem} from '@/feature/todolists/ui/Todolists/TodolistItem/Tasks/TaskItem/TaskItem.tsx';
import {getTaskActionErrorMessage} from '@/feature/todolists/ui/Todolists/TodolistItem/Tasks/taskActionErrorMessage';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {useEffect, useState} from 'react';
import {toast} from 'sonner';
import type {TaskStats} from '@/app/main/model/types';

export type TasksProps = {
    todolist: DomainTodolist
    globalTaskFilters: GlobalTaskFilters
    tasks?: DomainTask[]
    allowTaskReorder?: boolean
    onUpdateTask?: (taskId: string, changes: Partial<DomainTask>) => Promise<void> | void
    onDeleteTask?: (taskId: string) => Promise<void> | void
    onReorderTasks?: (orderedTaskIds: string[]) => Promise<void> | void
    onStatsChange?: (stats: TaskStats) => void
}

type TasksPaginationPropsType = {
    totalCount: number
    page: number
    setPage: (page: number) => void
    pageSize: number
    setPageSize: (pageSize: number) => void
}

const skeletonTitleWidths = [
    'w-3/5',
    'w-2/3',
    'w-1/2',
    'w-4/5',
    'w-2/5',
    'w-3/4',
]

const TasksSkeleton = () => {
    return (
        <div className="overflow-x-hidden">
            <div className="space-y-2">
                {skeletonTitleWidths.map((widthClass, index) => (
                    <div
                        key={index}
                        className="rounded-2xl border border-border/60 bg-background/70"
                    >
                        <div className="flex items-center gap-3 p-3">
                            <Skeleton className="h-4 w-4 rounded-lg" />
                            <Skeleton className={`h-4 ${widthClass}`} />
                            <div className="ml-auto flex gap-1">
                                <Skeleton className="h-8 w-8 rounded-md" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const pageSizeOptions = [4, 6, 8, 12]
const filteredTasksInitialPageSize = 100

const TasksPagination = ({
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
}: TasksPaginationPropsType) => {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
    const canGoBack = page > 1
    const canGoForward = page < totalPages

    const handlePageSizeChange = (value: string) => {
        const nextSize = Number(value)
        if (Number.isNaN(nextSize)) {
            return
        }
        setPageSize(nextSize)
        setPage(1)
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-muted/25 px-3 py-2">
            <div className="min-w-0 text-sm text-muted-foreground">
                {totalCount} tasks · page {page}/{totalPages}
            </div>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage(page - 1)}
                    disabled={!canGoBack}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage(page + 1)}
                    disabled={!canGoForward}
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Show</span>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                    <SelectTrigger size="sm" className="w-18">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {pageSizeOptions.map((size) => (
                            <SelectItem key={size} value={String(size)}>
                                {size}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

const isSameDay = (firstDate: Date, secondDate: Date) =>
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()

const matchesDueFilter = (due: GlobalTaskFilters['due'], deadline: string | null) => {
    if (due === 'all') return true
    if (due === 'no-deadline') return !deadline
    if (!deadline) return false

    const today = new Date()
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const deadlineDateRaw = new Date(deadline)
    const deadlineDate = new Date(
        deadlineDateRaw.getFullYear(),
        deadlineDateRaw.getMonth(),
        deadlineDateRaw.getDate(),
    )

    if (due === 'overdue') {
        return deadlineDate < currentDate
    }
    if (due === 'today') {
        return isSameDay(deadlineDate, currentDate)
    }
    if (due === 'upcoming') {
        return deadlineDate > currentDate
    }

    return true
}

export const Tasks = ({
    todolist,
    globalTaskFilters,
    tasks: localTasks,
    allowTaskReorder = true,
    onUpdateTask,
    onDeleteTask,
    onReorderTasks,
    onStatsChange,
}: TasksProps) => {
    const { id, filter } = todolist
    const isLocalTasksMode = Array.isArray(localTasks)
    const hasActiveGlobalFilters = Boolean(
        globalTaskFilters.query.trim() ||
        globalTaskFilters.status !== 'all' ||
        globalTaskFilters.priority !== 'all' ||
        globalTaskFilters.due !== 'all',
    )

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(6)
    const [filteredRequestPageSize, setFilteredRequestPageSize] = useState(filteredTasksInitialPageSize)
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
    const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
    const [orderedTaskIds, setOrderedTaskIds] = useState<string[] | null>(null)

    const [reorderTask] = useReorderTaskMutation()
    const requestPageSize = hasActiveGlobalFilters ? filteredRequestPageSize : pageSize
    const { data, isLoading } = useGetTasksQuery({
        todolistId: id,
        params: { page: hasActiveGlobalFilters ? 1 : page, count: requestPageSize },
    }, { skip: isLocalTasksMode })
    const sourceTasks = localTasks ?? data?.items ?? []
    const totalTasksCount = isLocalTasksMode ? sourceTasks.length : (data?.totalCount ?? 0)

    useEffect(() => {
        setPage(1)
        setFilteredRequestPageSize(filteredTasksInitialPageSize)
    }, [filter, id, globalTaskFilters.query, globalTaskFilters.status, globalTaskFilters.priority, globalTaskFilters.due])

    useEffect(() => {
        if (isLocalTasksMode || !hasActiveGlobalFilters || !data) {
            return
        }

        if (data.totalCount > filteredRequestPageSize) {
            setFilteredRequestPageSize(data.totalCount)
        }
    }, [data, filteredRequestPageSize, hasActiveGlobalFilters, isLocalTasksMode])

    useEffect(() => {
        setOrderedTaskIds(null)
        setDraggedTaskId(null)
        setDragOverTaskId(null)
    }, [filter, hasActiveGlobalFilters, id, page, sourceTasks])

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(totalTasksCount / pageSize))
        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [page, pageSize, totalTasksCount])

    let filteredTasks = sourceTasks
    if (filter === "active") {
        filteredTasks = filteredTasks.filter((task) => task.status === TaskStatus.New)
    }
    if (filter === "completed") {
        filteredTasks = filteredTasks.filter((task) => task.status === TaskStatus.Completed)
    }

    if (globalTaskFilters.query.trim()) {
        const normalizedQuery = globalTaskFilters.query.trim().toLowerCase()
        filteredTasks = filteredTasks.filter((task) =>
            task.title.toLowerCase().includes(normalizedQuery) ||
            (task.description?.toLowerCase().includes(normalizedQuery) ?? false),
        )
    }

    if (globalTaskFilters.status !== 'all') {
        filteredTasks = filteredTasks.filter((task) => String(task.status) === globalTaskFilters.status)
    }

    if (globalTaskFilters.priority !== 'all') {
        filteredTasks = filteredTasks.filter((task) => String(task.priority) === globalTaskFilters.priority)
    }

    if (globalTaskFilters.due !== 'all') {
        filteredTasks = filteredTasks.filter((task) => matchesDueFilter(globalTaskFilters.due, task.deadline))
    }

    const matchedTasksCount = filteredTasks.length
    const completedTasksCount = filteredTasks.filter((task) => task.status === TaskStatus.Completed).length
    const overdueTasksCount = filteredTasks.filter((task) => matchesDueFilter('overdue', task.deadline)).length
    const todayTasksCount = filteredTasks.filter((task) => matchesDueFilter('today', task.deadline)).length

    useEffect(() => {
        onStatsChange?.({
            matched: matchedTasksCount,
            total: totalTasksCount,
            completed: completedTasksCount,
            overdue: overdueTasksCount,
            today: todayTasksCount,
        })
    }, [completedTasksCount, matchedTasksCount, onStatsChange, overdueTasksCount, todayTasksCount, totalTasksCount])

    const reorderEnabled = allowTaskReorder && filter === 'all' && !hasActiveGlobalFilters

    const tasksToRender = orderedTaskIds
        ? [...filteredTasks].sort(
            (firstTask, secondTask) => orderedTaskIds.indexOf(firstTask.id) - orderedTaskIds.indexOf(secondTask.id),
        )
        : filteredTasks

    const handleDragStart = (taskId: string) => {
        if (!reorderEnabled) return
        setDraggedTaskId(taskId)
        setDragOverTaskId(taskId)
        setOrderedTaskIds((prev) => prev ?? (tasksToRender?.map((task) => task.id) ?? []))
    }

    const handleDragEnter = (taskId: string) => {
        if (!reorderEnabled || !draggedTaskId || draggedTaskId === taskId) return

        setOrderedTaskIds((prev) => {
            const source = prev ?? (tasksToRender?.map((task) => task.id) ?? [])
            const next = [...source]
            const draggedIndex = next.indexOf(draggedTaskId)
            const targetIndex = next.indexOf(taskId)

            if (draggedIndex === -1 || targetIndex === -1) {
                return source
            }

            next.splice(draggedIndex, 1)
            next.splice(targetIndex, 0, draggedTaskId)
            return next
        })

        setDragOverTaskId(taskId)
    }

    const handleDrop = async () => {
        if (!reorderEnabled || !draggedTaskId || !orderedTaskIds || !filteredTasks.length) {
            setDraggedTaskId(null)
            setDragOverTaskId(null)
            return
        }

        const originalTaskIds = filteredTasks.map((task) => task.id)

        if (originalTaskIds.join('|') === orderedTaskIds.join('|')) {
            setDraggedTaskId(null)
            setDragOverTaskId(null)
            return
        }

        const targetIndex = orderedTaskIds.indexOf(draggedTaskId)
        if (targetIndex === -1) {
            setDraggedTaskId(null)
            setDragOverTaskId(null)
            setOrderedTaskIds(null)
            return
        }

        const putAfterItemId = targetIndex > 0 ? orderedTaskIds[targetIndex - 1] : null

        try {
            if (onReorderTasks) {
                await onReorderTasks(orderedTaskIds)
            } else {
                await reorderTask({ todolistId: id, taskId: draggedTaskId, putAfterItemId }).unwrap()
            }
        } catch (error) {
            toast.error(getTaskActionErrorMessage('reorder', error))
            console.error('Error reordering tasks:', error)
            setOrderedTaskIds(null)
        } finally {
            setDraggedTaskId(null)
            setDragOverTaskId(null)
        }
    }

    const handleDragEnd = () => {
        setDraggedTaskId(null)
        setDragOverTaskId(null)
    }

    if (!isLocalTasksMode && isLoading) {
        return <TasksSkeleton />
    }

    if (!filteredTasks.length) {
        const emptyCopy = hasActiveGlobalFilters ? {
            title: 'No tasks match these filters',
            description: 'Change the global search or filter settings to see matching tasks across your lists.',
            hint: 'Filters are synced with the URL and applied to every board.',
        } : {
            all: {
                title: 'No tasks yet',
                description: 'Create the first task for this list to start building momentum.',
                hint: 'Use the input above to add your first item.',
            },
            active: {
                title: 'Nothing active right now',
                description: 'All current tasks are completed or the list is still empty.',
                hint: 'Switch filters or add a new task to continue.',
            },
            completed: {
                title: 'No completed tasks yet',
                description: 'Once you finish work, completed items will appear in this filtered view.',
                hint: 'Mark tasks as done to build a visible track record.',
            },
        }[filter]

        return <EmptyState {...emptyCopy} />
    }

    return (
        <div className="space-y-2">
            {reorderEnabled ? (
                <div className="px-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Drag tasks to reorder
                </div>
            ) : null}
            <div className="overflow-x-hidden">
                <div className="space-y-2">
                    {tasksToRender.map(task => (
                        <div
                            key={task.id}
                            className="overflow-hidden rounded-2xl border border-border/60 bg-background/70"
                            onDragEnter={reorderEnabled ? () => handleDragEnter(task.id) : undefined}
                            onDragOver={reorderEnabled ? (event) => event.preventDefault() : undefined}
                            onDrop={reorderEnabled ? () => void handleDrop() : undefined}
                        >
                            <TaskItem
                                todolistId={todolist.id}
                                task={task}
                                reorderEnabled={reorderEnabled}
                                dragging={draggedTaskId === task.id}
                                dragOver={dragOverTaskId === task.id && draggedTaskId !== task.id}
                                onDragStart={() => handleDragStart(task.id)}
                                onDragEnd={handleDragEnd}
                                onUpdateTask={onUpdateTask ? (changes) => onUpdateTask(task.id, changes) : undefined}
                                onDeleteTask={onDeleteTask ? () => onDeleteTask(task.id) : undefined}
                            />
                        </div>
                    ))}
                </div>
            </div>
            {!hasActiveGlobalFilters && filter === 'all' && totalTasksCount > pageSize && (
                <TasksPagination
                    totalCount={totalTasksCount}
                    page={page}
                    setPage={setPage}
                    pageSize={pageSize}
                    setPageSize={setPageSize}
                />
            )}
        </div>
    );
}
