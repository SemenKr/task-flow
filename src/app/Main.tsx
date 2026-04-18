import {EmptyTodolistsState} from '@/feature/todolists/ui/Todolists/EmptyTodolistsState/EmptyTodolistsState';
import {useAddTodolistMutation, useGetTodolistsQuery, useReorderTodolistMutation} from '@/feature/todolists/api/todolistsApi';
import {useAddTaskMutation} from '@/feature/todolists/api/tasksApi';
import {AddTodolistDialog} from '@/feature/todolists/ui/Todolists/Todolist/AddTodolistDialog';
import {TodolistItem} from '@/feature/todolists/ui/Todolists/TodolistItem/TodolistItem'
import type {GlobalTaskFilters} from '@/feature/todolists/libs/types';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useSearchParams} from 'react-router';
import {toast} from 'sonner';
import {
    createGlobalTaskSearchParams,
    getActiveGlobalTaskFiltersCount,
    getGlobalTaskFilters,
    hasActiveGlobalTaskFilters,
} from '@/app/main/lib/globalTaskFilters';
import {aggregateTaskStats, syncTaskStatsByListId, upsertTaskStats} from '@/app/main/lib/taskStats';
import {
    canReorderTodolists,
    filterAndSortTodolists,
    hasPendingOptimisticTodolists,
    normalizeListSearchValue,
} from '@/app/main/lib/todolists';
import {useTodolistsOnboarding} from '@/app/main/lib/useTodolistsOnboarding';
import {useSyncedSelectedList} from '@/app/main/lib/useSyncedSelectedList';
import {useTodolistsReorder} from '@/app/main/lib/useTodolistsReorder';
import {DEFAULT_GLOBAL_TASK_FILTERS} from '@/app/main/model/constants';
import {DEMO_WORKSPACE} from '@/app/main/model/demo';
import type {
    ListSortValue,
    SidebarFiltersModel,
    SidebarListNavigationModel,
    SidebarStatsModel,
    TaskStats,
    TaskStatsByListId,
} from '@/app/main/model/types';
import {TodolistsPageHeader} from '@/app/main/ui/TodolistsPageHeader';
import {TodolistsPageSkeleton} from '@/app/main/ui/TodolistsPageSkeleton';
import {TodolistsSidebar} from '@/app/main/ui/TodolistsSidebar';

export const TodolistsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [addTodolist] = useAddTodolistMutation()
    const [addTask] = useAddTaskMutation()
    const [reorderTodolist, { isLoading: isReorderingLists }] = useReorderTodolistMutation()
    const { data: todolists, isLoading: isTodolistsLoading } = useGetTodolistsQuery()
    const [selectedListId, setSelectedListId] = useState<string | null>(null)
    const [searchValue, setSearchValue] = useState('')
    const [sortValue, setSortValue] = useState<ListSortValue>('custom')
    const [tasksStatsByListId, setTasksStatsByListId] = useState<TaskStatsByListId>({})
    const [pendingFocusListId, setPendingFocusListId] = useState<string | null>(null)
    const [isCreatingDemoWorkspace, setIsCreatingDemoWorkspace] = useState(false)
    const [isTouchDevice, setIsTouchDevice] = useState(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return false
        }

        return window.matchMedia('(pointer: coarse)').matches
    })

    const hasTodolists = (todolists?.length ?? 0) > 0
    const {isOnboardingVisible, completeOnboarding, dismissOnboarding} = useTodolistsOnboarding(hasTodolists)
    const globalTaskFilters = useMemo(
        () => getGlobalTaskFilters(searchParams),
        [searchParams],
    )
    const hasActiveTaskFilters = useMemo(
        () => hasActiveGlobalTaskFilters(globalTaskFilters),
        [globalTaskFilters],
    )
    const aggregatedTaskStats = useMemo(
        () => aggregateTaskStats(tasksStatsByListId),
        [tasksStatsByListId],
    )
    const normalizedSearchValue = useMemo(
        () => normalizeListSearchValue(searchValue),
        [searchValue],
    )
    const visibleTodolists = useMemo(
        () => filterAndSortTodolists(todolists, normalizedSearchValue, sortValue),
        [normalizedSearchValue, sortValue, todolists],
    )
    const hasPendingOptimisticTodolist = useMemo(
        () => hasPendingOptimisticTodolists(visibleTodolists),
        [visibleTodolists],
    )
    const dragListsEnabled = useMemo(
        () => !isTouchDevice && canReorderTodolists(
            sortValue,
            normalizedSearchValue,
            isReorderingLists,
            hasPendingOptimisticTodolist,
        ),
        [hasPendingOptimisticTodolist, isReorderingLists, isTouchDevice, normalizedSearchValue, sortValue],
    )
    const {
        displayTodolists,
        draggedListId,
        dragOverListId,
        handleListDragStart,
        handleListDragEnter,
        handleListDrop,
        handleListDragEnd,
    } = useTodolistsReorder({
        enabled: dragListsEnabled,
        todolists: visibleTodolists,
        reorderTodolist,
    })

    useSyncedSelectedList({
        todolists: displayTodolists,
        selectedListId,
        setSelectedListId,
    })

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
        setTasksStatsByListId((prev) => syncTaskStatsByListId(prev, todolists))
    }, [todolists])

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
            document.getElementById(`list-card-${nextListId}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            })
        })

        setPendingFocusListId(null)

        return () => window.cancelAnimationFrame(frameId)
    }, [displayTodolists, pendingFocusListId])

    const handleAddTodolist = useCallback(
        async (title: string) => {
            const response = await addTodolist(title).unwrap()
            setPendingFocusListId(response.data.item.id)
            completeOnboarding()

            return response
        },
        [addTodolist, completeOnboarding],
    )

    const setActiveList = useCallback((listId: string) => {
        setSelectedListId(listId)
    }, [])

    const focusList = useCallback((listId: string) => {
        setActiveList(listId)
        const element = document.getElementById(`list-card-${listId}`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, [setActiveList])

    const updateGlobalTaskFilters = useCallback((nextFilters: Partial<GlobalTaskFilters>) => {
        setSearchParams(createGlobalTaskSearchParams(searchParams, nextFilters), { replace: true })
    }, [searchParams, setSearchParams])

    const resetGlobalTaskFilters = useCallback(() => {
        updateGlobalTaskFilters(DEFAULT_GLOBAL_TASK_FILTERS)
    }, [updateGlobalTaskFilters])

    const handleTasksStatsChange = useCallback((listId: string, stats: TaskStats) => {
        setTasksStatsByListId((prev) => upsertTaskStats(prev, listId, stats))
    }, [])

    const handleCreateDemoWorkspace = useCallback(async () => {
        if (isCreatingDemoWorkspace) {
            return
        }

        setIsCreatingDemoWorkspace(true)

        try {
            const createdTodolist = await addTodolist(DEMO_WORKSPACE.title).unwrap()
            const todolistId = createdTodolist.data.item.id

            for (const taskTitle of DEMO_WORKSPACE.tasks) {
                await addTask({todolistId, title: taskTitle}).unwrap()
            }

            setPendingFocusListId(todolistId)
            completeOnboarding()
            toast.success('Demo workspace is ready')
        } catch (error) {
            toast.error('Failed to create demo workspace')
            console.error('Error creating demo workspace:', error)
        } finally {
            setIsCreatingDemoWorkspace(false)
        }
    }, [addTask, addTodolist, completeOnboarding, isCreatingDemoWorkspace])

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
        isReorderingLists,
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
        isReorderingLists,
        searchValue,
        selectedListId,
        sortValue,
        tasksStatsByListId,
    ])

    const sidebarStats = useMemo<SidebarStatsModel>(() => ({
        aggregatedTaskStats,
    }), [aggregatedTaskStats])

    if (isTodolistsLoading) {
        return <TodolistsPageSkeleton />
    }

    return (
        <main className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 -z-10 h-48 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_46%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_30%)]" />
            <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 [&>*]:min-w-0 sm:px-6 lg:grid-cols-[288px_minmax(0,1fr)] lg:px-8 lg:py-6">
                <TodolistsSidebar
                    onAddTodolist={handleAddTodolist}
                    filters={sidebarFilters}
                    listNavigation={sidebarListNavigation}
                    stats={sidebarStats}
                />

                <section className="space-y-4">
                    <TodolistsPageHeader hasActiveTaskFilters={hasActiveTaskFilters} />

                    {hasTodolists ? (
                        <div className="dashboard-grid">
                            {displayTodolists.map((list) => (
                                <div key={list.id} id={`list-card-${list.id}`} className="min-w-0">
                                    <TodolistItem
                                        todolist={list}
                                        globalTaskFilters={globalTaskFilters}
                                        allowTaskReorder={!isTouchDevice}
                                        matchedTasksCount={tasksStatsByListId[list.id]?.matched}
                                        totalTasksCount={tasksStatsByListId[list.id]?.total}
                                        selected={selectedListId === list.id}
                                        onSelect={() => setActiveList(list.id)}
                                        onTasksStatsChange={(stats) => handleTasksStatsChange(list.id, stats)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyTodolistsState
                            onAddTodolist={handleAddTodolist}
                            onCreateDemoWorkspace={handleCreateDemoWorkspace}
                            isCreatingDemoWorkspace={isCreatingDemoWorkspace}
                            showOnboarding={isOnboardingVisible}
                            onDismissOnboarding={dismissOnboarding}
                        />
                    )}
                </section>
            </div>

            {hasTodolists ? (
                <AddTodolistDialog
                    onAddTodolist={handleAddTodolist}
                    showFloatingButton
                    floatingButtonClassName="lg:hidden"
                />
            ) : null}
        </main>
    )
}

export const Main = TodolistsPage
