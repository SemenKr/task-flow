import {CreateItemForm} from '@/CreateItemForm'
import {aggregateTaskStats} from '@/app/main/lib/taskStats'
import {
    createGlobalTaskSearchParams,
    getActiveGlobalTaskFiltersCount,
    getGlobalTaskFilters,
    hasActiveGlobalTaskFilters,
} from '@/app/main/lib/globalTaskFilters'
import {filterAndSortTodolists, normalizeListSearchValue} from '@/app/main/lib/todolists'
import {useSyncedSelectedList} from '@/app/main/lib/useSyncedSelectedList'
import {DEFAULT_GLOBAL_TASK_FILTERS} from '@/app/main/model/constants'
import type {SidebarFiltersModel, SidebarListNavigationModel, SidebarStatsModel, TaskStatsByListId} from '@/app/main/model/types'
import {TodolistsPageHeader} from '@/app/main/ui/TodolistsPageHeader'
import {TodolistsSidebar} from '@/app/main/ui/TodolistsSidebar'
import {Badge} from '@/common/components/ui/badge'
import {Button} from '@/common/components/ui/button'
import {Card, CardContent, CardHeader} from '@/common/components/ui/card'
import {Checkbox} from '@/common/components/ui/checkbox'
import {Input} from '@/common/components/ui/input'
import {Title} from '@/common/components/ui/title'
import {TaskPriority, TaskStatus} from '@/common/enums'
import {cn} from '@/common/lib/utils'
import type {DomainTask} from '@/feature/todolists/api/tasksApi.types'
import {EmptyTodolistsState} from '@/feature/todolists/ui/Todolists/EmptyTodolistsState/EmptyTodolistsState'
import {AddTodolistDialog} from '@/feature/todolists/ui/Todolists/Todolist/AddTodolistDialog'
import type {DomainTodolist, FilterValues, GlobalTaskDueFilter, GlobalTaskFilters} from '@/feature/todolists/libs/types'
import {Edit2, FolderKanban, Sparkles, Trash2, X} from 'lucide-react'
import {KeyboardEvent, useCallback, useMemo, useState} from 'react'
import {useSearchParams} from 'react-router'
import {toast} from 'sonner'

type DemoWorkspaceState = {
    lists: DomainTodolist[]
    tasksByListId: Record<string, DomainTask[]>
}

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const createLocalDate = (daysOffset = 0) => {
    const date = new Date()
    date.setDate(date.getDate() + daysOffset)
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

const createDemoTask = (todoListId: string, title: string, status = TaskStatus.New, priority = TaskPriority.Middle, deadline: string | null = null): DomainTask => ({
    description: null,
    deadline,
    startDate: null,
    title,
    status,
    priority,
    id: createId('task'),
    todoListId,
    order: 0,
    addedDate: createLocalDate(),
})

const createInitialDemoState = (): DemoWorkspaceState => {
    const launch = createDemoList('Launch week', 0)
    const polish = createDemoList('UX polish', 1)
    const review = createDemoList('Review queue', 2)

    return {
        lists: [launch, polish, review],
        tasksByListId: {
            [launch.id]: [
                createDemoTask(launch.id, 'Prepare release checklist', TaskStatus.InProgress, TaskPriority.Hi, createLocalDate(0)),
                createDemoTask(launch.id, 'Verify responsive header', TaskStatus.New, TaskPriority.Middle, createLocalDate(1)),
                createDemoTask(launch.id, 'Update README visuals', TaskStatus.Completed, TaskPriority.Low),
            ],
            [polish.id]: [
                createDemoTask(polish.id, 'Tighten filter sidebar spacing', TaskStatus.InProgress, TaskPriority.Middle, createLocalDate(2)),
                createDemoTask(polish.id, 'Refine task empty state copy', TaskStatus.New, TaskPriority.Low),
            ],
            [review.id]: [
                createDemoTask(review.id, 'Regression check for demo mode', TaskStatus.New, TaskPriority.Urgently, createLocalDate(0)),
                createDemoTask(review.id, 'Cross-browser smoke test', TaskStatus.Draft, TaskPriority.Middle, createLocalDate(3)),
            ],
        },
    }
}

const isSameDay = (firstDate: Date, secondDate: Date) =>
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()

const matchesDueFilter = (due: GlobalTaskDueFilter, deadline: string | null) => {
    if (due === 'all') return true
    if (due === 'no-deadline') return !deadline
    if (!deadline) return false

    const today = new Date()
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const rawDeadline = new Date(deadline)
    const deadlineDate = new Date(rawDeadline.getFullYear(), rawDeadline.getMonth(), rawDeadline.getDate())

    if (due === 'overdue') return deadlineDate < currentDate
    if (due === 'today') return isSameDay(deadlineDate, currentDate)
    if (due === 'upcoming') return deadlineDate > currentDate

    return true
}

const getFilteredTasks = (tasks: DomainTask[], listFilter: FilterValues, globalTaskFilters: GlobalTaskFilters) => {
    let filteredTasks = tasks

    if (listFilter === 'active') filteredTasks = filteredTasks.filter((task) => task.status === TaskStatus.New)
    if (listFilter === 'completed') filteredTasks = filteredTasks.filter((task) => task.status === TaskStatus.Completed)

    if (globalTaskFilters.query.trim()) {
        const query = globalTaskFilters.query.trim().toLowerCase()
        filteredTasks = filteredTasks.filter((task) => task.title.toLowerCase().includes(query))
    }

    if (globalTaskFilters.status !== 'all') filteredTasks = filteredTasks.filter((task) => String(task.status) === globalTaskFilters.status)
    if (globalTaskFilters.priority !== 'all') filteredTasks = filteredTasks.filter((task) => String(task.priority) === globalTaskFilters.priority)
    if (globalTaskFilters.due !== 'all') filteredTasks = filteredTasks.filter((task) => matchesDueFilter(globalTaskFilters.due, task.deadline))

    return filteredTasks
}

const getTaskStats = (tasks: DomainTask[], listFilter: FilterValues, globalTaskFilters: GlobalTaskFilters) => {
    const filteredTasks = getFilteredTasks(tasks, listFilter, globalTaskFilters)

    return {
        matched: filteredTasks.length,
        total: tasks.length,
        completed: filteredTasks.filter((task) => task.status === TaskStatus.Completed).length,
        overdue: filteredTasks.filter((task) => matchesDueFilter('overdue', task.deadline)).length,
        today: filteredTasks.filter((task) => matchesDueFilter('today', task.deadline)).length,
    }
}

const DemoFilterButtons = ({filter, onChange}: { filter: FilterValues, onChange: (filter: FilterValues) => void }) => (
    <div className="flex flex-wrap gap-1.5 rounded-2xl bg-muted/55 p-1">
        <Button size="sm" variant={filter === 'all' ? 'outline' : 'ghost'} className="rounded-xl px-3" onClick={() => onChange('all')}>All</Button>
        <Button size="sm" variant={filter === 'active' ? 'outline' : 'ghost'} className="rounded-xl px-3" onClick={() => onChange('active')}>Active</Button>
        <Button size="sm" variant={filter === 'completed' ? 'outline' : 'ghost'} className="rounded-xl px-3" onClick={() => onChange('completed')}>Completed</Button>
    </div>
)

export const DemoMain = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [demoState, setDemoState] = useState<DemoWorkspaceState>(() => createInitialDemoState())
    const [selectedListId, setSelectedListId] = useState<string | null>(null)
    const [searchValue, setSearchValue] = useState('')
    const [editingListId, setEditingListId] = useState<string | null>(null)
    const [editingTitle, setEditingTitle] = useState('')

    const globalTaskFilters = useMemo(() => getGlobalTaskFilters(searchParams), [searchParams])
    const hasActiveTaskFilters = useMemo(() => hasActiveGlobalTaskFilters(globalTaskFilters), [globalTaskFilters])
    const normalizedSearchValue = useMemo(() => normalizeListSearchValue(searchValue), [searchValue])
    const displayTodolists = useMemo(() => filterAndSortTodolists(demoState.lists, normalizedSearchValue, 'custom'), [demoState.lists, normalizedSearchValue])

    useSyncedSelectedList({todolists: displayTodolists, selectedListId, setSelectedListId})

    const tasksStatsByListId = useMemo<TaskStatsByListId>(() => (
        demoState.lists.reduce<TaskStatsByListId>((acc, list) => {
            acc[list.id] = getTaskStats(demoState.tasksByListId[list.id] ?? [], list.filter, globalTaskFilters)
            return acc
        }, {})
    ), [demoState.lists, demoState.tasksByListId, globalTaskFilters])

    const aggregatedTaskStats = useMemo(() => aggregateTaskStats(tasksStatsByListId), [tasksStatsByListId])

    const updateGlobalTaskFilters = useCallback((nextFilters: Partial<GlobalTaskFilters>) => {
        setSearchParams(createGlobalTaskSearchParams(searchParams, nextFilters), {replace: true})
    }, [searchParams, setSearchParams])

    const resetGlobalTaskFilters = useCallback(() => {
        updateGlobalTaskFilters(DEFAULT_GLOBAL_TASK_FILTERS)
    }, [updateGlobalTaskFilters])

    const addTodolist = useCallback((title: string) => {
        const nextList = createDemoList(title, demoState.lists.length)
        setDemoState((prev) => ({
            ...prev,
            lists: [nextList, ...prev.lists],
            tasksByListId: {...prev.tasksByListId, [nextList.id]: []},
        }))
        setSelectedListId(nextList.id)
        toast.success('Demo list created')
    }, [demoState.lists.length])

    const restoreWorkspace = useCallback(() => {
        setDemoState(createInitialDemoState())
        setSelectedListId(null)
        setSearchValue('')
        toast.success('Demo workspace restored')
    }, [])

    const sidebarFilters = useMemo<SidebarFiltersModel>(() => ({
        globalTaskFilters,
        hasActiveGlobalTaskFilters: hasActiveTaskFilters,
        activeFiltersCount: getActiveGlobalTaskFiltersCount(globalTaskFilters),
        matchedTasksCount: aggregatedTaskStats.matched,
        totalTasksCount: aggregatedTaskStats.total,
        onUpdateGlobalTaskFilters: updateGlobalTaskFilters,
        onResetGlobalTaskFilters: resetGlobalTaskFilters,
    }), [aggregatedTaskStats.matched, aggregatedTaskStats.total, globalTaskFilters, hasActiveTaskFilters, resetGlobalTaskFilters, updateGlobalTaskFilters])

    const sidebarListNavigation = useMemo<SidebarListNavigationModel>(() => ({
        searchValue,
        onSearchValueChange: setSearchValue,
        sortValue: 'custom',
        onSortValueChange: () => undefined,
        isReorderingLists: false,
        dragListsEnabled: false,
        displayTodolists,
        selectedListId,
        tasksStatsByListId,
        draggedListId: null,
        dragOverListId: null,
        onSelectList: setSelectedListId,
        onListDragStart: () => undefined,
        onListDragEnter: () => undefined,
        onListDrop: async () => undefined,
        onListDragEnd: () => undefined,
        reorderHelperText: 'Demo mode keeps list order fixed.',
        showDragHandle: false,
    }), [displayTodolists, searchValue, selectedListId, tasksStatsByListId])

    const sidebarStats = useMemo<SidebarStatsModel>(() => ({aggregatedTaskStats}), [aggregatedTaskStats])

    const handleTitleSave = (listId: string) => {
        const nextTitle = editingTitle.trim()
        if (!nextTitle) return

        setDemoState((prev) => ({
            ...prev,
            lists: prev.lists.map((list) => list.id === listId ? {...list, title: nextTitle} : list),
        }))
        setEditingListId(null)
        setEditingTitle('')
    }

    const hasTodolists = demoState.lists.length > 0

    return (
        <main className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 -z-10 h-48 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_46%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_30%)]" />
            <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[288px_minmax(0,1fr)] lg:px-8 lg:py-6">
                <TodolistsSidebar onAddTodolist={addTodolist} filters={sidebarFilters} listNavigation={sidebarListNavigation} stats={sidebarStats} />

                <section className="space-y-4">
                    <div className="rounded-[28px] border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                        <div className="flex items-start gap-3">
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>Demo mode is fully local. No Samurai API requests are made here.</p>
                        </div>
                    </div>

                    <TodolistsPageHeader hasActiveTaskFilters={hasActiveTaskFilters} />

                    {hasTodolists ? (
                        <div className="dashboard-grid">
                            {displayTodolists.map((list) => {
                                const tasks = getFilteredTasks(demoState.tasksByListId[list.id] ?? [], list.filter, globalTaskFilters)

                                return (
                                    <Card key={list.id} id={`demo-list-${list.id}`} className={cn('group flex h-full w-full flex-col overflow-hidden border-border/60 bg-card/92 shadow-[0_26px_70px_-62px_rgba(15,23,42,0.95)]', selectedListId === list.id && 'border-primary/35')}>
                                        <CardHeader className="min-h-[10.5rem] gap-3 border-b border-border/60 pb-4" onClick={() => setSelectedListId(list.id)}>
                                            <div className="flex min-w-0 items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1 space-y-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                            <FolderKanban className="h-4.5 w-4.5" />
                                                        </span>
                                                        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Demo board</div>
                                                    </div>
                                                    {editingListId === list.id ? (
                                                        <div className="space-y-2">
                                                            <Input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                                                if (event.key === 'Enter') handleTitleSave(list.id)
                                                                if (event.key === 'Escape') setEditingListId(null)
                                                            }} className="h-10 rounded-2xl text-sm" autoFocus />
                                                            <div className="flex gap-2">
                                                                <Button size="sm" onClick={() => handleTitleSave(list.id)}>Save</Button>
                                                                <Button size="sm" variant="outline" onClick={() => setEditingListId(null)}><X className="h-4 w-4" /></Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex min-w-0 items-start gap-2">
                                                            <Title level={3} noMargin className="min-w-0 flex-1 font-display text-xl leading-tight [overflow-wrap:anywhere]">{list.title}</Title>
                                                            <Button variant="ghost" size="icon-sm" onClick={() => {
                                                                setEditingListId(list.id)
                                                                setEditingTitle(list.title)
                                                            }} className="mt-0.5 shrink-0 rounded-full text-muted-foreground hover:text-foreground">
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>

                                                <Button variant="ghost" size="icon-sm" onClick={() => {
                                                    setDemoState((prev) => {
                                                        const nextTasksByListId = {...prev.tasksByListId}
                                                        delete nextTasksByListId[list.id]
                                                        return {lists: prev.lists.filter((item) => item.id !== list.id), tasksByListId: nextTasksByListId}
                                                    })
                                                }} className="mt-1 shrink-0 rounded-full text-muted-foreground hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">{list.filter}</Badge>
                                                <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">Local only</Badge>
                                                <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">
                                                    {tasksStatsByListId[list.id]?.matched ?? 0}/{tasksStatsByListId[list.id]?.total ?? 0} shown
                                                </Badge>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="flex flex-1 flex-col gap-4 pt-5">
                                            <section className="rounded-[1.35rem] border border-border/60 bg-background/70 p-3">
                                                <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">New task</p>
                                                <CreateItemForm onAdd={(title) => {
                                                    const nextTask = createDemoTask(list.id, title)
                                                    setDemoState((prev) => ({
                                                        ...prev,
                                                        tasksByListId: {...prev.tasksByListId, [list.id]: [nextTask, ...(prev.tasksByListId[list.id] ?? [])]},
                                                    }))
                                                }} placeholder="Add a task and press Enter" />
                                            </section>

                                            <section className="rounded-[1.35rem] border border-border/60 bg-background/70 p-2.5">
                                                <p className="mb-2 px-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Filter</p>
                                                <DemoFilterButtons filter={list.filter} onChange={(filter) => {
                                                    setDemoState((prev) => ({
                                                        ...prev,
                                                        lists: prev.lists.map((item) => item.id === list.id ? {...item, filter} : item),
                                                    }))
                                                }} />
                                            </section>

                                            <section className="flex flex-1 flex-col rounded-[1.5rem] border border-border/60 bg-muted/[0.22] p-2">
                                                <div className="px-2 pb-2 pt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Tasks</div>
                                                {tasks.length ? (
                                                    <div className="space-y-2">
                                                        {tasks.map((task) => (
                                                            <div key={task.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/70 px-3 py-2.5">
                                                                <Checkbox checked={task.status === TaskStatus.Completed} onCheckedChange={(checked) => {
                                                                    setDemoState((prev) => ({
                                                                        ...prev,
                                                                        tasksByListId: {
                                                                            ...prev.tasksByListId,
                                                                            [list.id]: (prev.tasksByListId[list.id] ?? []).map((item) => item.id === task.id ? {...item, status: checked === true ? TaskStatus.Completed : TaskStatus.New} : item),
                                                                        },
                                                                    }))
                                                                }} />
                                                                <div className={cn('min-w-0 flex-1 text-sm font-medium', task.status === TaskStatus.Completed && 'line-through text-muted-foreground/70')}>
                                                                    {task.title}
                                                                </div>
                                                                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
                                                                    {TaskPriority[task.priority]}
                                                                </Badge>
                                                                <Button size="icon-sm" variant="ghost" onClick={() => {
                                                                    setDemoState((prev) => ({
                                                                        ...prev,
                                                                        tasksByListId: {
                                                                            ...prev.tasksByListId,
                                                                            [list.id]: (prev.tasksByListId[list.id] ?? []).filter((item) => item.id !== task.id),
                                                                        },
                                                                    }))
                                                                }}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="rounded-2xl border border-dashed border-border/60 bg-background/70 px-4 py-6 text-center text-sm text-muted-foreground">
                                                        No tasks match the current filters.
                                                    </div>
                                                )}
                                            </section>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    ) : (
                        <EmptyTodolistsState onAddTodolist={addTodolist} onCreateDemoWorkspace={restoreWorkspace} showOnboarding />
                    )}
                </section>
            </div>

            {hasTodolists ? <AddTodolistDialog onAddTodolist={addTodolist} showFloatingButton floatingButtonClassName="lg:hidden" /> : null}
        </main>
    )
}
