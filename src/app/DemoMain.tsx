import {CreateItemForm} from '@/CreateItemForm'
import {
    createGlobalTaskSearchParams,
    getActiveGlobalTaskFiltersCount,
    getGlobalTaskFilters,
    hasActiveGlobalTaskFilters,
} from '@/app/main/lib/globalTaskFilters'
import {aggregateTaskStats} from '@/app/main/lib/taskStats'
import {
    applyPreviewOrder,
    canReorderTodolists,
    filterAndSortTodolists,
    normalizeListSearchValue,
} from '@/app/main/lib/todolists'
import {useSyncedSelectedList} from '@/app/main/lib/useSyncedSelectedList'
import {DEFAULT_GLOBAL_TASK_FILTERS} from '@/app/main/model/constants'
import type {
    ListSortValue,
    SidebarFiltersModel,
    SidebarListNavigationModel,
    SidebarStatsModel,
    TaskStats,
    TaskStatsByListId,
} from '@/app/main/model/types'
import {TodolistsPageHeader} from '@/app/main/ui/TodolistsPageHeader'
import {TodolistsSidebar} from '@/app/main/ui/TodolistsSidebar'
import {Badge} from '@/common/components/ui/badge'
import {Button} from '@/common/components/ui/button'
import {Card, CardContent, CardHeader} from '@/common/components/ui/card'
import {Checkbox} from '@/common/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/common/components/ui/dialog'
import {Input} from '@/common/components/ui/input'
import {Label} from '@/common/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/common/components/ui/select'
import {Title} from '@/common/components/ui/title'
import {TaskPriority, TaskStatus} from '@/common/enums'
import {cn} from '@/common/lib/utils'
import type {DomainTask} from '@/feature/todolists/api/tasksApi.types'
import {AddTodolistDialog} from '@/feature/todolists/ui/Todolists/Todolist/AddTodolistDialog'
import {EmptyState} from '@/feature/todolists/ui/Todolists/Todolist/EmptyState'
import {EmptyTodolistsState} from '@/feature/todolists/ui/Todolists/EmptyTodolistsState/EmptyTodolistsState'
import type {DomainTodolist, FilterValues, GlobalTaskFilters} from '@/feature/todolists/libs/types'
import {
    CalendarDays,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Edit2,
    Flag,
    FolderKanban,
    GripVertical,
    Sparkles,
    Timer,
    Trash2,
    X,
} from 'lucide-react'
import {KeyboardEvent, useCallback, useEffect, useMemo, useState} from 'react'
import {useSearchParams} from 'react-router'
import {toast} from 'sonner'

type DemoWorkspace = {
    lists: DomainTodolist[]
    tasksByListId: Record<string, DomainTask[]>
}

type DemoTaskFormValues = {
    title: string
    description: string
    status: string
    priority: string
    startDate: string
    deadline: string
}

type DemoTaskItemProps = {
    todolistId: string
    task: DomainTask
    reorderEnabled?: boolean
    dragging?: boolean
    dragOver?: boolean
    onDragStart?: () => void
    onDragEnd?: () => void
    onUpdateTask: (taskId: string, changes: Partial<DomainTask>) => void
    onDeleteTask: (taskId: string) => void
}

type DemoTasksProps = {
    todolist: DomainTodolist
    tasks: DomainTask[]
    globalTaskFilters: GlobalTaskFilters
    onUpdateTask: (taskId: string, changes: Partial<DomainTask>) => void
    onDeleteTask: (taskId: string) => void
    onReorderTasks: (taskIds: string[]) => void
}

type DemoTodolistItemProps = {
    todolist: DomainTodolist
    tasks: DomainTask[]
    globalTaskFilters: GlobalTaskFilters
    matchedTasksCount?: number
    totalTasksCount?: number
    selected?: boolean
    onSelect?: () => void
    onUpdateTitle: (title: string) => void
    onDelete: () => void
    onSetFilter: (filter: FilterValues) => void
    onAddTask: (title: string) => void
    onUpdateTask: (taskId: string, changes: Partial<DomainTask>) => void
    onDeleteTask: (taskId: string) => void
    onReorderTasks: (taskIds: string[]) => void
}

const pageSizeOptions = [4, 6, 8, 12]

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`

const createLocalDate = (daysOffset = 0, hoursOffset = 0) => {
    const date = new Date()
    date.setDate(date.getDate() + daysOffset)
    date.setHours(date.getHours() + hoursOffset, 0, 0, 0)
    return date.toISOString()
}

const createDemoList = (title: string, order: number): DomainTodolist => ({
    id: createId('list'),
    title,
    addedDate: createLocalDate(-order),
    order,
    filter: 'all',
    entityStatus: 'idle',
})

const createDemoTask = (
    todoListId: string,
    title: string,
    options: Partial<DomainTask> = {},
): DomainTask => ({
    description: null,
    deadline: null,
    startDate: null,
    title,
    status: TaskStatus.New,
    priority: TaskPriority.Middle,
    id: createId('task'),
    todoListId,
    order: 0,
    addedDate: createLocalDate(),
    ...options,
})

const createInitialWorkspace = (): DemoWorkspace => {
    const launch = createDemoList('Launch week', 0)
    const polish = createDemoList('UX polish', 1)
    const backlog = createDemoList('Content backlog', 2)

    return {
        lists: [launch, polish, backlog],
        tasksByListId: {
            [launch.id]: [
                createDemoTask(launch.id, 'Prepare release checklist', {
                    status: TaskStatus.InProgress,
                    priority: TaskPriority.Hi,
                    description: 'Double-check auth, routing, production envs, and reviewer paths.',
                    startDate: createLocalDate(-1, 9),
                    deadline: createLocalDate(1, 14),
                }),
                createDemoTask(launch.id, 'Verify responsive header', {
                    priority: TaskPriority.Middle,
                    description: 'Focus on tablet breakpoints and long project titles.',
                    deadline: createLocalDate(0, 18),
                }),
                createDemoTask(launch.id, 'Update README visuals', {
                    status: TaskStatus.Completed,
                    priority: TaskPriority.Low,
                    description: 'Replace placeholder copy and keep review instructions explicit.',
                    startDate: createLocalDate(-2, 11),
                }),
            ],
            [polish.id]: [
                createDemoTask(polish.id, 'Tighten sidebar spacing', {
                    status: TaskStatus.InProgress,
                    priority: TaskPriority.Middle,
                    description: 'Balance dense stats and filters on 1280px width.',
                    startDate: createLocalDate(0, 10),
                }),
                createDemoTask(polish.id, 'Refine empty state copy', {
                    priority: TaskPriority.Low,
                    deadline: createLocalDate(3, 12),
                }),
                createDemoTask(polish.id, 'Add priority color pass', {
                    status: TaskStatus.Draft,
                    priority: TaskPriority.Urgently,
                }),
            ],
            [backlog.id]: [
                createDemoTask(backlog.id, 'Record polished product GIF', {
                    priority: TaskPriority.Urgently,
                    deadline: createLocalDate(-1, 16),
                    description: 'Capture drag-and-drop, task editing, and mobile layout.',
                }),
                createDemoTask(backlog.id, 'Write reviewer notes', {
                    status: TaskStatus.Completed,
                    priority: TaskPriority.Later,
                }),
            ],
        },
    }
}

const moveDraggedItem = (itemIds: string[], draggedId: string, targetId: string) => {
    const nextItemIds = [...itemIds]
    const draggedIndex = nextItemIds.indexOf(draggedId)
    const targetIndex = nextItemIds.indexOf(targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
        return itemIds
    }

    nextItemIds.splice(draggedIndex, 1)
    nextItemIds.splice(targetIndex, 0, draggedId)

    return nextItemIds
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

    if (due === 'overdue') return deadlineDate < currentDate
    if (due === 'today') return isSameDay(deadlineDate, currentDate)
    if (due === 'upcoming') return deadlineDate > currentDate

    return true
}

const applyLocalTaskFilter = (tasks: DomainTask[], filter: FilterValues) => {
    if (filter === 'active') return tasks.filter((task) => task.status === TaskStatus.New)
    if (filter === 'completed') return tasks.filter((task) => task.status === TaskStatus.Completed)
    return tasks
}

const applyGlobalTaskFilters = (tasks: DomainTask[], globalTaskFilters: GlobalTaskFilters) => {
    let filteredTasks = tasks

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

    return filteredTasks
}

const getFilteredTasks = (
    tasks: DomainTask[],
    localFilter: FilterValues,
    globalTaskFilters: GlobalTaskFilters,
) => applyGlobalTaskFilters(applyLocalTaskFilter(tasks, localFilter), globalTaskFilters)

const computeTaskStats = (
    tasks: DomainTask[],
    localFilter: FilterValues,
    globalTaskFilters: GlobalTaskFilters,
): TaskStats => {
    const filteredTasks = getFilteredTasks(tasks, localFilter, globalTaskFilters)

    return {
        matched: filteredTasks.length,
        total: tasks.length,
        completed: filteredTasks.filter((task) => task.status === TaskStatus.Completed).length,
        overdue: filteredTasks.filter((task) => matchesDueFilter('overdue', task.deadline)).length,
        today: filteredTasks.filter((task) => matchesDueFilter('today', task.deadline)).length,
    }
}

const toDateTimeInputValue = (value: string | null) => (value ? value.slice(0, 16) : '')

const toApiDateTimeValue = (value: string) => (value ? `${value}:00` : null)

const createFormValues = (task: DomainTask): DemoTaskFormValues => ({
    title: task.title,
    description: task.description ?? '',
    status: String(task.status),
    priority: String(task.priority),
    startDate: toDateTimeInputValue(task.startDate),
    deadline: toDateTimeInputValue(task.deadline),
})

const formatDate = (value: string | null) => {
    if (!value) return null

    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value))
}

const DemoTaskItem = ({
    todolistId,
    task,
    reorderEnabled = false,
    dragging = false,
    dragOver = false,
    onDragStart,
    onDragEnd,
    onUpdateTask,
    onDeleteTask,
}: DemoTaskItemProps) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [formValues, setFormValues] = useState<DemoTaskFormValues>(() => createFormValues(task))

    const isTaskCompleted = task.status === TaskStatus.Completed
    const isTaskInProgress = task.status === TaskStatus.InProgress
    const createdAt = formatDate(task.addedDate)
    const startDate = formatDate(task.startDate)
    const deadline = formatDate(task.deadline)
    const hasDetails = Boolean(task.description || createdAt || startDate || deadline)

    useEffect(() => {
        setFormValues(createFormValues(task))
    }, [task])

    const statusLabel = {
        [TaskStatus.New]: 'New',
        [TaskStatus.InProgress]: 'In progress',
        [TaskStatus.Completed]: 'Done',
        [TaskStatus.Draft]: 'Draft',
    }[task.status]

    const priorityLabel = {
        [TaskPriority.Low]: 'Low',
        [TaskPriority.Middle]: 'Medium',
        [TaskPriority.Hi]: 'High',
        [TaskPriority.Urgently]: 'Urgent',
        [TaskPriority.Later]: 'Later',
    }[task.priority]

    const priorityClassName = {
        [TaskPriority.Low]: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
        [TaskPriority.Middle]: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300',
        [TaskPriority.Hi]: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300',
        [TaskPriority.Urgently]: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300',
        [TaskPriority.Later]: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300',
    }[task.priority]

    const handleFieldChange = (field: keyof DemoTaskFormValues, value: string) => {
        setFormValues((prev) => ({...prev, [field]: value}))
    }

    const handleSave = () => {
        const trimmedTitle = formValues.title.trim()

        if (!trimmedTitle) {
            toast.error('Task title cannot be empty')
            return
        }

        onUpdateTask(task.id, {
            title: trimmedTitle,
            description: formValues.description.trim() || null,
            status: Number(formValues.status) as TaskStatus,
            priority: Number(formValues.priority) as TaskPriority,
            startDate: toApiDateTimeValue(formValues.startDate),
            deadline: toApiDateTimeValue(formValues.deadline),
        })
        toast.success('Task updated')
        setIsDialogOpen(false)
    }

    const toggleTaskDetails = () => {
        if (!hasDetails) return
        setIsDetailsOpen((prev) => !prev)
    }

    return (
        <>
            <div
                className={cn(
                    'group flex min-w-0 gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-all duration-200 hover:border-border/60 hover:bg-muted/20',
                    dragging && 'opacity-55',
                    dragOver && 'bg-primary/6 ring-1 ring-primary/20',
                )}
            >
                {reorderEnabled ? (
                    <div
                        draggable
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        className="mt-1 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
                    >
                        <GripVertical className="h-4 w-4" />
                    </div>
                ) : null}

                <Checkbox
                    checked={isTaskCompleted}
                    onCheckedChange={(checked) => onUpdateTask(task.id, {
                        status: checked === true ? TaskStatus.Completed : TaskStatus.New,
                    })}
                    id={`${todolistId}-${task.id}`}
                    className="mt-1 shrink-0"
                />

                <div
                    className={cn(
                        'min-w-0 flex-1 transition-all duration-200',
                        hasDetails && 'cursor-pointer group-hover:translate-x-0.5 active:scale-[0.995]',
                    )}
                    onClick={toggleTaskDetails}
                    onKeyDown={(event) => {
                        if (!hasDetails) return
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            toggleTaskDetails()
                        }
                    }}
                    role={hasDetails ? 'button' : undefined}
                    tabIndex={hasDetails ? 0 : undefined}
                    aria-expanded={hasDetails ? isDetailsOpen : undefined}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-start gap-2">
                            <div
                                className={cn(
                                    'min-w-0 flex-1 select-none break-words text-sm font-medium leading-6 transition-all',
                                    isTaskCompleted ? 'line-through text-muted-foreground/70' : 'text-foreground',
                                )}
                            >
                                {task.title}
                            </div>
                            {hasDetails ? (
                                <span className="mt-1 shrink-0 text-muted-foreground">
                                    {isDetailsOpen ? (
                                        <ChevronUp className="h-4 w-4 transition-transform duration-200" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                                    )}
                                </span>
                            ) : null}
                        </div>

                        <div className="flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    setIsDialogOpen(true)
                                }}
                                className="h-8 w-8 shrink-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                                aria-label="Edit task"
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    onDeleteTask(task.id)
                                    toast.success('Task deleted')
                                }}
                                className="h-8 w-8 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                aria-label="Delete task"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,black_0%,black_84%,transparent_100%)]">
                        <Badge variant="outline" className="shrink-0 rounded-full px-2 py-0.5 text-[11px]">
                            {statusLabel}
                        </Badge>
                        {isTaskInProgress ? (
                            <Badge variant="outline" className="shrink-0 rounded-full border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300">
                                Active
                            </Badge>
                        ) : null}
                        <Badge variant="outline" className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${priorityClassName}`}>
                            <Flag className="h-3 w-3" />
                            {priorityLabel}
                        </Badge>
                        {deadline ? (
                            <Badge variant="secondary" className="shrink-0 rounded-full px-2 py-0.5 text-[11px]">
                                <Timer className="h-3 w-3" />
                                {deadline}
                            </Badge>
                        ) : null}
                    </div>

                    {hasDetails ? (
                        <div
                            className={cn(
                                'grid transition-all duration-200 ease-out',
                                isDetailsOpen ? 'mt-2.5 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                            )}
                        >
                            <div className="overflow-hidden">
                                <div className="space-y-2 border-t border-border/50 pt-2.5">
                                    {task.description ? (
                                        <p className="break-words text-xs leading-5 text-muted-foreground">
                                            {task.description}
                                        </p>
                                    ) : null}

                                    <div className="flex flex-wrap gap-1.5">
                                        {createdAt ? (
                                            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px]">
                                                <CalendarDays className="h-3 w-3" />
                                                Created {createdAt}
                                            </Badge>
                                        ) : null}
                                        {startDate ? (
                                            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px]">
                                                <CalendarDays className="h-3 w-3" />
                                                Start {startDate}
                                            </Badge>
                                        ) : null}
                                        {deadline ? (
                                            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px]">
                                                <Timer className="h-3 w-3" />
                                                Due {deadline}
                                            </Badge>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="border-border/60 sm:max-w-2xl">
                    <DialogHeader className="text-left">
                        <DialogTitle>Edit task</DialogTitle>
                        <DialogDescription>
                            Update task details, priority, status, and scheduling fields.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor={`demo-task-title-${task.id}`}>Title</Label>
                            <Input
                                id={`demo-task-title-${task.id}`}
                                value={formValues.title}
                                onChange={(event) => handleFieldChange('title', event.target.value)}
                                className="h-10 rounded-2xl"
                            />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor={`demo-task-description-${task.id}`}>Description</Label>
                            <textarea
                                id={`demo-task-description-${task.id}`}
                                value={formValues.description}
                                onChange={(event) => handleFieldChange('description', event.target.value)}
                                rows={4}
                                className={cn(
                                    'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 w-full rounded-2xl border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]',
                                )}
                                placeholder="Add extra context for this task"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={formValues.status} onValueChange={(value) => handleFieldChange('status', value)}>
                                <SelectTrigger className="w-full rounded-2xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={String(TaskStatus.New)}>New</SelectItem>
                                    <SelectItem value={String(TaskStatus.InProgress)}>In progress</SelectItem>
                                    <SelectItem value={String(TaskStatus.Completed)}>Completed</SelectItem>
                                    <SelectItem value={String(TaskStatus.Draft)}>Draft</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select value={formValues.priority} onValueChange={(value) => handleFieldChange('priority', value)}>
                                <SelectTrigger className="w-full rounded-2xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={String(TaskPriority.Low)}>Low</SelectItem>
                                    <SelectItem value={String(TaskPriority.Middle)}>Medium</SelectItem>
                                    <SelectItem value={String(TaskPriority.Hi)}>High</SelectItem>
                                    <SelectItem value={String(TaskPriority.Urgently)}>Urgent</SelectItem>
                                    <SelectItem value={String(TaskPriority.Later)}>Later</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`demo-task-start-date-${task.id}`}>Start date</Label>
                            <Input
                                id={`demo-task-start-date-${task.id}`}
                                type="datetime-local"
                                value={formValues.startDate}
                                onChange={(event) => handleFieldChange('startDate', event.target.value)}
                                className="h-10 rounded-2xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`demo-task-deadline-${task.id}`}>Deadline</Label>
                            <Input
                                id={`demo-task-deadline-${task.id}`}
                                type="datetime-local"
                                value={formValues.deadline}
                                onChange={(event) => handleFieldChange('deadline', event.target.value)}
                                className="h-10 rounded-2xl"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            Save changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

const DemoTasks = ({
    todolist,
    tasks,
    globalTaskFilters,
    onUpdateTask,
    onDeleteTask,
    onReorderTasks,
}: DemoTasksProps) => {
    const hasActiveGlobalFilters = hasActiveGlobalTaskFilters(globalTaskFilters)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(6)
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
    const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
    const [orderedTaskIds, setOrderedTaskIds] = useState<string[] | null>(null)

    useEffect(() => {
        setPage(1)
    }, [globalTaskFilters, todolist.filter, todolist.id])

    useEffect(() => {
        setOrderedTaskIds(null)
        setDraggedTaskId(null)
        setDragOverTaskId(null)
    }, [tasks, todolist.filter, hasActiveGlobalFilters, page])

    const filteredTasks = useMemo(
        () => getFilteredTasks(tasks, todolist.filter, globalTaskFilters),
        [globalTaskFilters, tasks, todolist.filter],
    )

    const reorderEnabled = todolist.filter === 'all' && !hasActiveGlobalFilters
    const orderedTasks = orderedTaskIds
        ? [...filteredTasks].sort(
            (firstTask, secondTask) => orderedTaskIds.indexOf(firstTask.id) - orderedTaskIds.indexOf(secondTask.id),
        )
        : filteredTasks

    const totalPages = Math.max(1, Math.ceil(orderedTasks.length / pageSize))
    const normalizedPage = Math.min(page, totalPages)
    const paginatedTasks = hasActiveGlobalFilters
        ? orderedTasks
        : orderedTasks.slice((normalizedPage - 1) * pageSize, normalizedPage * pageSize)

    useEffect(() => {
        if (page !== normalizedPage) {
            setPage(normalizedPage)
        }
    }, [normalizedPage, page])

    const handleDragStart = (taskId: string) => {
        if (!reorderEnabled) return

        setDraggedTaskId(taskId)
        setDragOverTaskId(taskId)
        setOrderedTaskIds((prev) => prev ?? orderedTasks.map((task) => task.id))
    }

    const handleDragEnter = (taskId: string) => {
        if (!reorderEnabled || !draggedTaskId || draggedTaskId === taskId) return

        setOrderedTaskIds((prev) => moveDraggedItem(prev ?? orderedTasks.map((task) => task.id), draggedTaskId, taskId))
        setDragOverTaskId(taskId)
    }

    const handleDrop = () => {
        if (!reorderEnabled || !draggedTaskId || !orderedTaskIds?.length) {
            setDraggedTaskId(null)
            setDragOverTaskId(null)
            return
        }

        const previewOrderedTaskIds = orderedTaskIds
        const originalIds = orderedTasks.map((task) => task.id)

        if (originalIds.join('|') === previewOrderedTaskIds.join('|')) {
            setDraggedTaskId(null)
            setDragOverTaskId(null)
            setOrderedTaskIds(null)
            return
        }

        onReorderTasks(previewOrderedTaskIds)
        toast.success('Task order updated')
        setDraggedTaskId(null)
        setDragOverTaskId(null)
        setOrderedTaskIds(null)
    }

    const handleDragEnd = () => {
        setDraggedTaskId(null)
        setDragOverTaskId(null)
        setOrderedTaskIds(null)
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
        }[todolist.filter]

        return <EmptyState {...emptyCopy} />
    }

    return (
        <div className="space-y-2">
            {reorderEnabled ? (
                <div className="px-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Drag tasks to reorder
                </div>
            ) : null}

            <div className="space-y-2 overflow-x-hidden">
                {paginatedTasks.map((task) => (
                    <div
                        key={task.id}
                        className="overflow-hidden rounded-2xl border border-border/60 bg-background/70"
                        onDragEnter={reorderEnabled ? () => handleDragEnter(task.id) : undefined}
                        onDragOver={reorderEnabled ? (event) => event.preventDefault() : undefined}
                        onDrop={reorderEnabled ? handleDrop : undefined}
                    >
                        <DemoTaskItem
                            todolistId={todolist.id}
                            task={task}
                            reorderEnabled={reorderEnabled}
                            dragging={draggedTaskId === task.id}
                            dragOver={dragOverTaskId === task.id && draggedTaskId !== task.id}
                            onDragStart={() => handleDragStart(task.id)}
                            onDragEnd={handleDragEnd}
                            onUpdateTask={onUpdateTask}
                            onDeleteTask={onDeleteTask}
                        />
                    </div>
                ))}
            </div>

            {!hasActiveGlobalFilters && orderedTasks.length > pageSize ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-muted/25 px-3 py-2">
                    <div className="min-w-0 text-sm text-muted-foreground">
                        {orderedTasks.length} tasks · page {normalizedPage}/{totalPages}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => setPage((prev) => prev - 1)}
                            disabled={normalizedPage <= 1}
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => setPage((prev) => prev + 1)}
                            disabled={normalizedPage >= totalPages}
                            aria-label="Next page"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Show</span>
                        <Select
                            value={String(pageSize)}
                            onValueChange={(value) => {
                                const nextSize = Number(value)
                                if (Number.isNaN(nextSize)) {
                                    return
                                }
                                setPageSize(nextSize)
                                setPage(1)
                            }}
                        >
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
            ) : null}
        </div>
    )
}

const DemoTodolistItem = ({
    todolist,
    tasks,
    globalTaskFilters,
    matchedTasksCount,
    totalTasksCount,
    selected = false,
    onSelect,
    onUpdateTitle,
    onDelete,
    onSetFilter,
    onAddTask,
    onUpdateTask,
    onDeleteTask,
    onReorderTasks,
}: DemoTodolistItemProps) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [titleValue, setTitleValue] = useState(todolist.title)

    useEffect(() => {
        setTitleValue(todolist.title)
    }, [todolist.title])

    const filterLabel = {
        all: 'All tasks',
        active: 'Active only',
        completed: 'Completed only',
    }[todolist.filter]

    const saveTitle = () => {
        const trimmedTitle = titleValue.trim()

        if (!trimmedTitle) {
            toast.error('List name cannot be empty')
            return
        }

        if (trimmedTitle.length < 2) {
            toast.error('List name must be at least 2 characters long')
            return
        }

        if (trimmedTitle.length > 50) {
            toast.error('List name is too long (max 50 characters)')
            return
        }

        if (trimmedTitle === todolist.title) {
            setIsEditingTitle(false)
            return
        }

        onUpdateTitle(trimmedTitle)
        toast.success('List title updated')
        setIsEditingTitle(false)
    }

    const handleTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            saveTitle()
        }

        if (event.key === 'Escape') {
            event.preventDefault()
            setTitleValue(todolist.title)
            setIsEditingTitle(false)
        }
    }

    return (
        <Card
            className={cn(
                'group flex h-full w-full flex-col overflow-hidden border-border/60 bg-card/92 shadow-[0_26px_70px_-62px_rgba(15,23,42,0.95)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_-64px_rgba(15,23,42,1)]',
                selected && 'border-primary/35 shadow-[0_28px_90px_-62px_rgba(37,99,235,0.42)]',
            )}
            onClick={onSelect}
        >
            <CardHeader className="min-h-[10.5rem] gap-3 border-b border-border/60 pb-4">
                <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <FolderKanban className="h-4.5 w-4.5" />
                            </span>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                Demo board
                            </div>
                        </div>
                        <div className="min-h-[3.5rem]">
                            {isEditingTitle ? (
                                <div className="space-y-2.5">
                                    <Input
                                        value={titleValue}
                                        onChange={(event) => setTitleValue(event.target.value)}
                                        onKeyDown={handleTitleKeyDown}
                                        className="h-10 rounded-2xl text-sm"
                                        maxLength={50}
                                        autoFocus
                                    />
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" onClick={saveTitle} className="rounded-full">
                                            <Check className="h-4 w-4" />
                                            Save
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setTitleValue(todolist.title)
                                                setIsEditingTitle(false)
                                            }}
                                            className="rounded-full"
                                        >
                                            <X className="h-4 w-4" />
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex min-w-0 items-start gap-2">
                                    <Title
                                        level={3}
                                        noMargin
                                        className="min-w-0 flex-1 font-display text-xl leading-tight [overflow-wrap:anywhere]"
                                    >
                                        {todolist.title}
                                    </Title>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            setIsEditingTitle(true)
                                        }}
                                        aria-label="Edit list title"
                                        className="mt-0.5 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(event) => {
                            event.stopPropagation()
                            onDelete()
                        }}
                        aria-label="Delete list"
                        className="mt-1 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">
                        {filterLabel}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">
                        Local only
                    </Badge>
                    {typeof matchedTasksCount === 'number' && typeof totalTasksCount === 'number' ? (
                        <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">
                            {matchedTasksCount}/{totalTasksCount} shown
                        </Badge>
                    ) : null}
                </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-4 pt-5">
                <section className="rounded-[1.35rem] border border-border/60 bg-background/70 p-3">
                    <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        New task
                    </p>
                    <CreateItemForm
                        onAdd={onAddTask}
                        placeholder="Add a task and press Enter"
                    />
                </section>

                <section className="rounded-[1.35rem] border border-border/60 bg-background/70 p-2.5">
                    <p className="mb-2 px-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Filter
                    </p>
                    <div className="flex flex-wrap gap-1.5 rounded-2xl bg-muted/55 p-1">
                        {(['all', 'active', 'completed'] as FilterValues[]).map((filter) => (
                            <Button
                                key={filter}
                                size="sm"
                                variant={todolist.filter === filter ? 'outline' : 'ghost'}
                                className="rounded-xl px-3"
                                onClick={() => onSetFilter(filter)}
                            >
                                {filter === 'all' ? 'All' : filter === 'active' ? 'Active' : 'Completed'}
                            </Button>
                        ))}
                    </div>
                </section>

                <section className="flex flex-1 flex-col rounded-[1.5rem] border border-border/60 bg-muted/[0.22] p-2">
                    <div className="px-2 pb-2 pt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Tasks
                    </div>
                    <DemoTasks
                        todolist={todolist}
                        tasks={tasks}
                        globalTaskFilters={globalTaskFilters}
                        onUpdateTask={onUpdateTask}
                        onDeleteTask={onDeleteTask}
                        onReorderTasks={onReorderTasks}
                    />
                </section>
            </CardContent>
        </Card>
    )
}

export const DemoMain = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [workspace, setWorkspace] = useState<DemoWorkspace>(() => createInitialWorkspace())
    const [selectedListId, setSelectedListId] = useState<string | null>(null)
    const [searchValue, setSearchValue] = useState('')
    const [sortValue, setSortValue] = useState<ListSortValue>('custom')
    const [draggedListId, setDraggedListId] = useState<string | null>(null)
    const [dragOverListId, setDragOverListId] = useState<string | null>(null)
    const [orderedListIds, setOrderedListIds] = useState<string[] | null>(null)

    const hasTodolists = workspace.lists.length > 0
    const globalTaskFilters = useMemo(
        () => getGlobalTaskFilters(searchParams),
        [searchParams],
    )
    const hasActiveTaskFilters = useMemo(
        () => hasActiveGlobalTaskFilters(globalTaskFilters),
        [globalTaskFilters],
    )
    const normalizedSearchValue = useMemo(
        () => normalizeListSearchValue(searchValue),
        [searchValue],
    )
    const visibleTodolists = useMemo(
        () => filterAndSortTodolists(workspace.lists, normalizedSearchValue, sortValue),
        [normalizedSearchValue, sortValue, workspace.lists],
    )
    const dragListsEnabled = useMemo(
        () => canReorderTodolists(sortValue, normalizedSearchValue, false, false),
        [normalizedSearchValue, sortValue],
    )
    const displayTodolists = useMemo(
        () => applyPreviewOrder(visibleTodolists, orderedListIds),
        [orderedListIds, visibleTodolists],
    )
    const tasksStatsByListId = useMemo<TaskStatsByListId>(() => (
        workspace.lists.reduce<TaskStatsByListId>((acc, list) => {
            acc[list.id] = computeTaskStats(workspace.tasksByListId[list.id] ?? [], list.filter, globalTaskFilters)
            return acc
        }, {})
    ), [globalTaskFilters, workspace.lists, workspace.tasksByListId])
    const aggregatedTaskStats = useMemo(
        () => aggregateTaskStats(tasksStatsByListId),
        [tasksStatsByListId],
    )

    useSyncedSelectedList({
        todolists: displayTodolists,
        selectedListId,
        setSelectedListId,
    })

    useEffect(() => {
        setOrderedListIds(null)
        setDraggedListId(null)
        setDragOverListId(null)
    }, [workspace.lists, sortValue, normalizedSearchValue])

    const restoreWorkspace = useCallback(() => {
        setWorkspace(createInitialWorkspace())
        toast.success('Demo workspace restored')
    }, [])

    const addList = useCallback((title: string) => {
        const trimmedTitle = title.trim()
        const nextList = createDemoList(trimmedTitle, workspace.lists.length)

        setWorkspace((prev) => ({
            ...prev,
            lists: [nextList, ...prev.lists].map((list, index) => ({...list, order: index})),
            tasksByListId: {...prev.tasksByListId, [nextList.id]: []},
        }))
        setSelectedListId(nextList.id)
        toast.success('List created')

        return nextList
    }, [workspace.lists.length])

    const updateGlobalTaskFilters = useCallback((nextFilters: Partial<GlobalTaskFilters>) => {
        setSearchParams(createGlobalTaskSearchParams(searchParams, nextFilters), {replace: true})
    }, [searchParams, setSearchParams])

    const resetGlobalTaskFilters = useCallback(() => {
        updateGlobalTaskFilters(DEFAULT_GLOBAL_TASK_FILTERS)
    }, [updateGlobalTaskFilters])

    const setActiveList = useCallback((listId: string) => {
        setSelectedListId(listId)
    }, [])

    const focusList = useCallback((listId: string) => {
        setActiveList(listId)
        document.getElementById(`demo-list-card-${listId}`)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        })
    }, [setActiveList])

    const updateList = useCallback((listId: string, update: (list: DomainTodolist) => DomainTodolist) => {
        setWorkspace((prev) => ({
            ...prev,
            lists: prev.lists.map((list) => list.id === listId ? update(list) : list),
        }))
    }, [])

    const deleteList = useCallback((listId: string) => {
        setWorkspace((prev) => {
            const nextTasksByListId = {...prev.tasksByListId}
            delete nextTasksByListId[listId]

            return {
                lists: prev.lists
                    .filter((list) => list.id !== listId)
                    .map((list, index) => ({...list, order: index})),
                tasksByListId: nextTasksByListId,
            }
        })
        toast.success('List deleted')
    }, [])

    const addTask = useCallback((listId: string, title: string) => {
        const nextTask = createDemoTask(listId, title)

        setWorkspace((prev) => ({
            ...prev,
            tasksByListId: {
                ...prev.tasksByListId,
                [listId]: [nextTask, ...(prev.tasksByListId[listId] ?? [])].map((task, index) => ({
                    ...task,
                    order: index,
                })),
            },
        }))
        toast.success('Task created')
    }, [])

    const updateTask = useCallback((listId: string, taskId: string, changes: Partial<DomainTask>) => {
        setWorkspace((prev) => ({
            ...prev,
            tasksByListId: {
                ...prev.tasksByListId,
                [listId]: (prev.tasksByListId[listId] ?? []).map((task) =>
                    task.id === taskId ? {...task, ...changes} : task,
                ),
            },
        }))
    }, [])

    const deleteTask = useCallback((listId: string, taskId: string) => {
        setWorkspace((prev) => ({
            ...prev,
            tasksByListId: {
                ...prev.tasksByListId,
                [listId]: (prev.tasksByListId[listId] ?? [])
                    .filter((task) => task.id !== taskId)
                    .map((task, index) => ({...task, order: index})),
            },
        }))
    }, [])

    const reorderTasks = useCallback((listId: string, orderedTaskIds: string[]) => {
        setWorkspace((prev) => {
            const currentTasks = prev.tasksByListId[listId] ?? []
            const indexMap = new Map(orderedTaskIds.map((taskId, index) => [taskId, index]))
            const sortedTasks = [...currentTasks]
                .sort((firstTask, secondTask) => {
                    const firstIndex = indexMap.get(firstTask.id)
                    const secondIndex = indexMap.get(secondTask.id)

                    if (typeof firstIndex !== 'number' || typeof secondIndex !== 'number') {
                        return firstTask.order - secondTask.order
                    }

                    return firstIndex - secondIndex
                })
                .map((task, index) => ({...task, order: index}))

            return {
                ...prev,
                tasksByListId: {
                    ...prev.tasksByListId,
                    [listId]: sortedTasks,
                },
            }
        })
    }, [])

    const handleListDragStart = useCallback((listId: string) => {
        if (!dragListsEnabled) return

        setDraggedListId(listId)
        setDragOverListId(listId)
        setOrderedListIds((prev) => prev ?? displayTodolists.map((list) => list.id))
    }, [displayTodolists, dragListsEnabled])

    const handleListDragEnter = useCallback((listId: string) => {
        if (!dragListsEnabled || !draggedListId || draggedListId === listId) return

        setOrderedListIds((prev) => moveDraggedItem(prev ?? displayTodolists.map((list) => list.id), draggedListId, listId))
        setDragOverListId(listId)
    }, [displayTodolists, dragListsEnabled, draggedListId])

    const handleListDrop = useCallback(async (targetListId: string) => {
        if (!dragListsEnabled || !draggedListId || !displayTodolists.length) {
            setDraggedListId(null)
            setDragOverListId(null)
            return
        }

        const originalListIds = displayTodolists.map((list) => list.id)
        const previewOrderedListIds = orderedListIds ?? moveDraggedItem(originalListIds, draggedListId, targetListId)

        if (originalListIds.join('|') === previewOrderedListIds.join('|')) {
            setDraggedListId(null)
            setDragOverListId(null)
            setOrderedListIds(null)
            return
        }

        setWorkspace((prev) => {
            const indexMap = new Map(previewOrderedListIds.map((listId, index) => [listId, index]))
            const sortedLists = [...prev.lists]
                .sort((firstList, secondList) => {
                    const firstIndex = indexMap.get(firstList.id)
                    const secondIndex = indexMap.get(secondList.id)

                    if (typeof firstIndex !== 'number' || typeof secondIndex !== 'number') {
                        return firstList.order - secondList.order
                    }

                    return firstIndex - secondIndex
                })
                .map((list, index) => ({...list, order: index}))

            return {...prev, lists: sortedLists}
        })

        toast.success('List order updated')
        setDraggedListId(null)
        setDragOverListId(null)
        setOrderedListIds(null)
    }, [displayTodolists, dragListsEnabled, draggedListId, orderedListIds])

    const handleListDragEnd = useCallback(() => {
        setDraggedListId(null)
        setDragOverListId(null)
        setOrderedListIds(null)
    }, [])

    const sidebarFilters = useMemo<SidebarFiltersModel>(() => ({
        globalTaskFilters,
        hasActiveGlobalTaskFilters: hasActiveTaskFilters,
        activeFiltersCount: getActiveGlobalTaskFiltersCount(globalTaskFilters),
        matchedTasksCount: aggregatedTaskStats.matched,
        totalTasksCount: aggregatedTaskStats.total,
        onUpdateGlobalTaskFilters: updateGlobalTaskFilters,
        onResetGlobalTaskFilters: resetGlobalTaskFilters,
    }), [
        aggregatedTaskStats.matched,
        aggregatedTaskStats.total,
        globalTaskFilters,
        hasActiveTaskFilters,
        resetGlobalTaskFilters,
        updateGlobalTaskFilters,
    ])

    const sidebarListNavigation = useMemo<SidebarListNavigationModel>(() => ({
        searchValue,
        onSearchValueChange: setSearchValue,
        sortValue,
        onSortValueChange: setSortValue,
        isReorderingLists: false,
        dragListsEnabled,
        displayTodolists,
        selectedListId,
        tasksStatsByListId,
        draggedListId,
        dragOverListId,
        onSelectList: focusList,
        onListDragStart: handleListDragStart,
        onListDragEnter: handleListDragEnter,
        onListDrop: handleListDrop,
        onListDragEnd: handleListDragEnd,
        reorderHelperText: dragListsEnabled ? 'Drag lists to change order.' : null,
        showDragHandle: dragListsEnabled,
    }), [
        displayTodolists,
        dragListsEnabled,
        dragOverListId,
        draggedListId,
        focusList,
        handleListDragEnd,
        handleListDragEnter,
        handleListDragStart,
        handleListDrop,
        searchValue,
        selectedListId,
        sortValue,
        tasksStatsByListId,
    ])

    const sidebarStats = useMemo<SidebarStatsModel>(() => ({
        aggregatedTaskStats,
    }), [aggregatedTaskStats])

    return (
        <main className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 -z-10 h-48 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_46%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_30%)]" />
            <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[288px_minmax(0,1fr)] lg:px-8 lg:py-6">
                <TodolistsSidebar
                    onAddTodolist={addList}
                    filters={sidebarFilters}
                    listNavigation={sidebarListNavigation}
                    stats={sidebarStats}
                />

                <section className="space-y-4">
                    <section className="rounded-[28px] border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-primary">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                                <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                                <div className="space-y-2">
                                    <p>Demo mode mirrors the real workspace locally, including filters, editing, and drag-and-drop.</p>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <Badge variant="outline" className="rounded-full">Lists: {workspace.lists.length}</Badge>
                                        <Badge variant="outline" className="rounded-full">Tasks: {aggregatedTaskStats.total}</Badge>
                                        <Badge variant="outline" className="rounded-full">Completed: {aggregatedTaskStats.completed}</Badge>
                                    </div>
                                </div>
                            </div>
                            <Button variant="outline" onClick={restoreWorkspace} className="rounded-2xl">
                                Restore workspace
                            </Button>
                        </div>
                    </section>

                    <TodolistsPageHeader hasActiveTaskFilters={hasActiveTaskFilters} />

                    {hasTodolists ? (
                        <div className="dashboard-grid">
                            {displayTodolists.map((list) => (
                                <div key={list.id} id={`demo-list-card-${list.id}`}>
                                    <DemoTodolistItem
                                        todolist={list}
                                        tasks={workspace.tasksByListId[list.id] ?? []}
                                        globalTaskFilters={globalTaskFilters}
                                        matchedTasksCount={tasksStatsByListId[list.id]?.matched}
                                        totalTasksCount={tasksStatsByListId[list.id]?.total}
                                        selected={selectedListId === list.id}
                                        onSelect={() => setActiveList(list.id)}
                                        onUpdateTitle={(title) => updateList(list.id, (currentList) => ({...currentList, title}))}
                                        onDelete={() => deleteList(list.id)}
                                        onSetFilter={(filter) => updateList(list.id, (currentList) => ({...currentList, filter}))}
                                        onAddTask={(title) => addTask(list.id, title)}
                                        onUpdateTask={(taskId, changes) => updateTask(list.id, taskId, changes)}
                                        onDeleteTask={(taskId) => deleteTask(list.id, taskId)}
                                        onReorderTasks={(taskIds) => reorderTasks(list.id, taskIds)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyTodolistsState
                            onAddTodolist={addList}
                            onCreateDemoWorkspace={restoreWorkspace}
                            showOnboarding
                        />
                    )}
                </section>
            </div>

            {hasTodolists ? (
                <AddTodolistDialog
                    onAddTodolist={addList}
                    showFloatingButton
                    floatingButtonClassName="lg:hidden"
                />
            ) : null}
        </main>
    )
}
