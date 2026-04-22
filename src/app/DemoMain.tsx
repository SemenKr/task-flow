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
import {DEMO_WORKSPACE} from '@/app/main/model/demo'
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
import {TaskPriority, TaskStatus} from '@/common/enums'
import type {DomainTask} from '@/feature/todolists/api/tasksApi.types'
import {AddTodolistDialog} from '@/feature/todolists/ui/Todolists/Todolist/AddTodolistDialog'
import {TodolistItem} from '@/feature/todolists/ui/Todolists/TodolistItem/TodolistItem'
import {EmptyTodolistsState} from '@/feature/todolists/ui/Todolists/EmptyTodolistsState/EmptyTodolistsState'
import type {DomainTodolist, FilterValues, GlobalTaskFilters} from '@/feature/todolists/libs/types'
import {
    Sparkles,
} from 'lucide-react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useSearchParams} from 'react-router'
import {toast} from 'sonner'

type DemoWorkspace = {
    lists: DomainTodolist[]
    tasksByListId: Record<string, DomainTask[]>
}

const DEMO_WORKSPACE_STORAGE_KEY = 'demo-workspace'

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

const createSeedWorkspace = (): DemoWorkspace => {
    const list = createDemoList(DEMO_WORKSPACE.title, 0)

    return {
        lists: [list],
        tasksByListId: {
            [list.id]: DEMO_WORKSPACE.tasks.map((title, index) => createDemoTask(list.id, title, {
                status: index === 0 ? TaskStatus.InProgress : index === DEMO_WORKSPACE.tasks.length - 1 ? TaskStatus.Completed : TaskStatus.New,
                priority: index === 0 ? TaskPriority.Hi : index === 2 ? TaskPriority.Middle : TaskPriority.Low,
                deadline: index < 2 ? createLocalDate(index + 1, 16) : null,
                order: index,
            })),
        },
    }
}

const getStoredDemoWorkspace = (): DemoWorkspace | null => {
    try {
        const rawWorkspace = localStorage.getItem(DEMO_WORKSPACE_STORAGE_KEY)

        if (!rawWorkspace) {
            return null
        }

        return JSON.parse(rawWorkspace) as DemoWorkspace
    } catch {
        return null
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

export const DemoMain = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [workspace, setWorkspace] = useState<DemoWorkspace>(() => getStoredDemoWorkspace() ?? createInitialWorkspace())
    const [selectedListId, setSelectedListId] = useState<string | null>(null)
    const [searchValue, setSearchValue] = useState('')
    const [sortValue, setSortValue] = useState<ListSortValue>('custom')
    const [pendingFocusListId, setPendingFocusListId] = useState<string | null>(null)
    const [draggedListId, setDraggedListId] = useState<string | null>(null)
    const [dragOverListId, setDragOverListId] = useState<string | null>(null)
    const [orderedListIds, setOrderedListIds] = useState<string[] | null>(null)
    const [isTouchDevice, setIsTouchDevice] = useState(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return false
        }

        return window.matchMedia('(pointer: coarse)').matches
    })

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
        () => !isTouchDevice && canReorderTodolists(sortValue, normalizedSearchValue, false, false),
        [isTouchDevice, normalizedSearchValue, sortValue],
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

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return
        }

        const mediaQuery = window.matchMedia('(pointer: coarse)')
        const handleChange = () => {
            setIsTouchDevice(mediaQuery.matches)
        }

        handleChange()

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', handleChange)

            return () => mediaQuery.removeEventListener('change', handleChange)
        }

        mediaQuery.addListener(handleChange)

        return () => mediaQuery.removeListener(handleChange)
    }, [])

    useEffect(() => {
        localStorage.setItem(DEMO_WORKSPACE_STORAGE_KEY, JSON.stringify(workspace))
    }, [workspace])

    useEffect(() => {
        if (!pendingFocusListId) {
            return
        }

        if (!displayTodolists.some((list) => list.id === pendingFocusListId)) {
            return
        }

        const nextListId = pendingFocusListId
        setSelectedListId(nextListId)

        const frameId = window.requestAnimationFrame(() => {
            document.getElementById(`demo-list-card-${nextListId}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            })
        })

        setPendingFocusListId(null)

        return () => window.cancelAnimationFrame(frameId)
    }, [displayTodolists, pendingFocusListId])

    const resetDemoViewState = useCallback((nextListId: string | null) => {
        setSearchValue('')
        setSortValue('custom')
        setSearchParams(createGlobalTaskSearchParams(searchParams, DEFAULT_GLOBAL_TASK_FILTERS), {replace: true})
        setPendingFocusListId(nextListId)
    }, [searchParams, setSearchParams])

    const restoreWorkspace = useCallback(() => {
        const nextWorkspace = createInitialWorkspace()
        setWorkspace(nextWorkspace)
        resetDemoViewState(nextWorkspace.lists[0]?.id ?? null)
        toast.success('Demo workspace restored')
    }, [resetDemoViewState])

    const createDemoWorkspace = useCallback(() => {
        const nextWorkspace = createSeedWorkspace()
        setWorkspace(nextWorkspace)
        resetDemoViewState(nextWorkspace.lists[0]?.id ?? null)
        toast.success('Demo workspace is ready')
    }, [resetDemoViewState])

    const addList = useCallback((title: string) => {
        const trimmedTitle = title.trim()
        const nextList = createDemoList(trimmedTitle, workspace.lists.length)

        setWorkspace((prev) => ({
            ...prev,
            lists: [nextList, ...prev.lists].map((list, index) => ({...list, order: index})),
            tasksByListId: {...prev.tasksByListId, [nextList.id]: []},
        }))
        resetDemoViewState(nextList.id)
        toast.success('List created')

        return nextList
    }, [resetDemoViewState, workspace.lists.length])

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
            <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 [&>*]:min-w-0 sm:px-6 lg:grid-cols-[288px_minmax(0,1fr)] lg:px-8 lg:py-6">
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
                            <Button variant="outline" onClick={restoreWorkspace} className="w-full rounded-2xl sm:w-auto">
                                Restore workspace
                            </Button>
                        </div>
                    </section>

                    <TodolistsPageHeader hasActiveTaskFilters={hasActiveTaskFilters} />

                    {hasTodolists ? (
                        <div className="dashboard-grid">
                            {displayTodolists.map((list) => (
                                <div key={list.id} id={`demo-list-card-${list.id}`} className="min-w-0">
                                    <TodolistItem
                                        todolist={list}
                                        globalTaskFilters={globalTaskFilters}
                                        tasks={workspace.tasksByListId[list.id] ?? []}
                                        allowTaskReorder={!isTouchDevice}
                                        matchedTasksCount={tasksStatsByListId[list.id]?.matched}
                                        totalTasksCount={tasksStatsByListId[list.id]?.total}
                                        selected={selectedListId === list.id}
                                        onSelect={() => setActiveList(list.id)}
                                        onRenameTodolist={(title) =>
                                            updateList(list.id, (currentList) => ({...currentList, title}))
                                        }
                                        onDeleteTodolist={() => deleteList(list.id)}
                                        onAddTask={(title) => addTask(list.id, title)}
                                        onSetFilter={(filter) =>
                                            updateList(list.id, (currentList) => ({...currentList, filter}))
                                        }
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
                            onCreateDemoWorkspace={createDemoWorkspace}
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
