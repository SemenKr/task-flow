import {useAddTodolistMutation, useGetTodolistsQuery, useReorderTodolistMutation} from '@/feature/todolists/api/todolistsApi';
import {Card, CardContent, CardHeader, CardTitle} from '@/common/components/ui/card';
import {Input} from '@/common/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/common/components/ui/select';
import {cn} from '@/common/lib/utils';
import {EmptyTodolistsState} from '@/feature/todolists/ui/Todolists/EmptyTodolistsState/EmptyTodolistsState';
import {AddTodolistDialog} from '@/feature/todolists/ui/Todolists/Todolist/AddTodolistDialog'
import {TodolistItem} from '@/feature/todolists/ui/Todolists/TodolistItem/TodolistItem'
import type {GlobalTaskDueFilter, GlobalTaskFilters, GlobalTaskPriorityFilter, GlobalTaskStatusFilter} from '@/feature/todolists/libs/types';
import {Badge} from '@/common/components/ui/badge';
import {Button} from '@/common/components/ui/button';
import {TaskPriority, TaskStatus} from '@/common/enums';
import {ArrowRight, ChevronRight, GripVertical, Layers3, ListTodo, RefreshCw, Search} from 'lucide-react';
import {useEffect, useState} from 'react';
import {toast} from 'sonner';
import {useSearchParams} from 'react-router';

const globalStatusOptions: Array<{ label: string; value: GlobalTaskStatusFilter }> = [
    { label: 'All statuses', value: 'all' },
    { label: 'New', value: `${TaskStatus.New}` },
    { label: 'In progress', value: `${TaskStatus.InProgress}` },
    { label: 'Completed', value: `${TaskStatus.Completed}` },
    { label: 'Draft', value: `${TaskStatus.Draft}` },
]

const globalPriorityOptions: Array<{ label: string; value: GlobalTaskPriorityFilter }> = [
    { label: 'All priorities', value: 'all' },
    { label: 'Low', value: `${TaskPriority.Low}` },
    { label: 'Medium', value: `${TaskPriority.Middle}` },
    { label: 'High', value: `${TaskPriority.Hi}` },
    { label: 'Urgent', value: `${TaskPriority.Urgently}` },
    { label: 'Later', value: `${TaskPriority.Later}` },
]

const globalDueOptions: Array<{ label: string; value: GlobalTaskDueFilter }> = [
    { label: 'Any date', value: 'all' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Today', value: 'today' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'No deadline', value: 'no-deadline' },
]

export const Main = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [addTodolist] = useAddTodolistMutation()
    const [reorderTodolist, { isLoading: isReorderingLists }] = useReorderTodolistMutation()
    const { data: todolists } = useGetTodolistsQuery()
    const [selectedListId, setSelectedListId] = useState<string | null>(null)
    const [searchValue, setSearchValue] = useState('')
    const [sortValue, setSortValue] = useState<'custom' | 'recent' | 'oldest' | 'alphabetical'>('custom')
    const [draggedListId, setDraggedListId] = useState<string | null>(null)
    const [dragOverListId, setDragOverListId] = useState<string | null>(null)
    const [orderedListIds, setOrderedListIds] = useState<string[] | null>(null)
    const [tasksStatsByListId, setTasksStatsByListId] = useState<Record<string, { matched: number; total: number; completed: number; overdue: number }>>({})

    const totalLists = todolists?.length ?? 0
    const hasTodolists = totalLists > 0
    const globalTaskFilters: GlobalTaskFilters = {
        query: searchParams.get('q') ?? '',
        status: (searchParams.get('taskStatus') as GlobalTaskStatusFilter) ?? 'all',
        priority: (searchParams.get('priority') as GlobalTaskPriorityFilter) ?? 'all',
        due: (searchParams.get('due') as GlobalTaskDueFilter) ?? 'all',
    }
    const hasActiveGlobalTaskFilters = Boolean(
        globalTaskFilters.query.trim() ||
        globalTaskFilters.status !== 'all' ||
        globalTaskFilters.priority !== 'all' ||
        globalTaskFilters.due !== 'all',
    )
    const aggregatedTaskStats = Object.values(tasksStatsByListId).reduce(
        (acc, stats) => ({
            matched: acc.matched + stats.matched,
            total: acc.total + stats.total,
            completed: acc.completed + stats.completed,
            overdue: acc.overdue + stats.overdue,
        }),
        { matched: 0, total: 0, completed: 0, overdue: 0 },
    )

    const overviewItems = [
        {
            label: 'Lists',
            value: totalLists.toString().padStart(2, '0'),
            note: hasTodolists ? 'active' : 'empty',
            icon: Layers3,
        },
        {
            label: 'Experience',
            value: 'RTK Query',
            note: 'remote sync',
            icon: RefreshCw,
        },
        {
            label: 'UI',
            value: 'Responsive',
            note: 'light & dark',
            icon: ListTodo,
        },
    ]

    const normalizedSearchValue = searchValue.trim().toLowerCase()
    const dragListsEnabled = sortValue === 'custom' && normalizedSearchValue.length === 0 && !isReorderingLists
    const baseSortedTodolists = [...(todolists ?? [])]
        .sort((a, b) => {
            if (sortValue === 'custom') {
                return 0
            }
            if (sortValue === 'alphabetical') {
                return a.title.localeCompare(b.title)
            }
            if (sortValue === 'oldest') {
                return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime()
            }
            return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
        })
    const filteredAndSortedTodolists = baseSortedTodolists
        .filter((list) => list.title.toLowerCase().includes(normalizedSearchValue))
    const displayTodolists = orderedListIds
        ? [...filteredAndSortedTodolists].sort(
            (firstList, secondList) => orderedListIds.indexOf(firstList.id) - orderedListIds.indexOf(secondList.id),
        )
        : filteredAndSortedTodolists

    useEffect(() => {
        if (!displayTodolists.length) {
            setSelectedListId(null)
            return
        }

        const hasSelected = displayTodolists.some((list) => list.id === selectedListId)
        if (!hasSelected) {
            setSelectedListId(displayTodolists[0].id)
        }
    }, [displayTodolists, selectedListId])

    useEffect(() => {
        setOrderedListIds(null)
        setDraggedListId(null)
        setDragOverListId(null)
    }, [todolists, sortValue, normalizedSearchValue])

    useEffect(() => {
        if (!todolists?.length) {
            setTasksStatsByListId({})
            return
        }

        setTasksStatsByListId((prev) => {
            const next: Record<string, { matched: number; total: number; completed: number; overdue: number }> = {}
            todolists.forEach((list) => {
                if (prev[list.id]) {
                    next[list.id] = prev[list.id]
                }
            })
            return next
        })
    }, [todolists])

    const selectList = (listId: string) => {
        setSelectedListId(listId)

        const element = document.getElementById(`list-card-${listId}`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const updateGlobalTaskFilters = (nextFilters: Partial<GlobalTaskFilters>) => {
        const mergedFilters = { ...globalTaskFilters, ...nextFilters }
        const nextParams = new URLSearchParams(searchParams)

        if (mergedFilters.query.trim()) {
            nextParams.set('q', mergedFilters.query.trim())
        } else {
            nextParams.delete('q')
        }

        if (mergedFilters.status !== 'all') {
            nextParams.set('taskStatus', mergedFilters.status)
        } else {
            nextParams.delete('taskStatus')
        }

        if (mergedFilters.priority !== 'all') {
            nextParams.set('priority', mergedFilters.priority)
        } else {
            nextParams.delete('priority')
        }

        if (mergedFilters.due !== 'all') {
            nextParams.set('due', mergedFilters.due)
        } else {
            nextParams.delete('due')
        }

        setSearchParams(nextParams, { replace: true })
    }

    const resetGlobalTaskFilters = () => {
        updateGlobalTaskFilters({
            query: '',
            status: 'all',
            priority: 'all',
            due: 'all',
        })
    }

    const handleListDragStart = (listId: string) => {
        if (!dragListsEnabled) return
        setDraggedListId(listId)
        setDragOverListId(listId)
        setOrderedListIds((prev) => prev ?? displayTodolists.map((list) => list.id))
    }

    const handleListDragEnter = (listId: string) => {
        if (!dragListsEnabled || !draggedListId || draggedListId === listId) return

        setOrderedListIds((prev) => {
            const source = prev ?? displayTodolists.map((list) => list.id)
            const next = [...source]
            const draggedIndex = next.indexOf(draggedListId)
            const targetIndex = next.indexOf(listId)

            if (draggedIndex === -1 || targetIndex === -1) {
                return source
            }

            next.splice(draggedIndex, 1)
            next.splice(targetIndex, 0, draggedListId)
            return next
        })

        setDragOverListId(listId)
    }

    const handleListDrop = async () => {
        if (!dragListsEnabled || !draggedListId || !orderedListIds || !filteredAndSortedTodolists.length) {
            setDraggedListId(null)
            setDragOverListId(null)
            return
        }

        const originalIds = filteredAndSortedTodolists.map((list) => list.id)
        if (originalIds.join('|') === orderedListIds.join('|')) {
            setDraggedListId(null)
            setDragOverListId(null)
            return
        }

        const targetIndex = orderedListIds.indexOf(draggedListId)
        if (targetIndex === -1) {
            setDraggedListId(null)
            setDragOverListId(null)
            setOrderedListIds(null)
            return
        }

        const putAfterItemId = targetIndex > 0 ? orderedListIds[targetIndex - 1] : null

        try {
            await reorderTodolist({ todolistId: draggedListId, putAfterItemId }).unwrap()
            toast.success('List order saved')
        } catch (error) {
            toast.error('Failed to save list order')
            console.error('Error reordering lists:', error)
            setOrderedListIds(null)
        } finally {
            setDraggedListId(null)
            setDragOverListId(null)
        }
    }

    const handleListDragEnd = () => {
        setDraggedListId(null)
        setDragOverListId(null)
    }

    const handleTasksStatsChange = (listId: string, stats: { matched: number; total: number; completed: number; overdue: number }) => {
        setTasksStatsByListId((prev) => {
            const current = prev[listId]
            if (
                current &&
                current.matched === stats.matched &&
                current.total === stats.total &&
                current.completed === stats.completed &&
                current.overdue === stats.overdue
            ) {
                return prev
            }

            return {
                ...prev,
                [listId]: stats,
            }
        })
    }

    return (
        <main className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 -z-10 h-48 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_46%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_30%)]" />
            <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[288px_minmax(0,1fr)] lg:px-8 lg:py-6">
                <aside className="animate-fade-up lg:sticky lg:top-22 lg:self-start">
                    <Card className="overflow-hidden border-border/60 bg-[linear-gradient(180deg,rgba(59,130,246,0.06),transparent_28%),var(--color-card)] shadow-[0_24px_70px_-64px_rgba(15,23,42,0.8)]">
                        <CardHeader className="min-w-0 gap-3 border-b border-border/60 pb-4">
                            <Badge variant="outline" className="w-fit rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-primary">
                                Lists
                            </Badge>
                            <CardTitle className="min-w-0 font-display text-[1.75rem] leading-tight [overflow-wrap:anywhere]">
                                Create and navigate
                            </CardTitle>
                            <p className="min-w-0 text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                                One clear place for new lists. Tasks stay inside each board.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-5">
                            <AddTodolistDialog
                                onAddTodolist={addTodolist}
                                showFloatingButton={false}
                                trigger={
                                    <Button size="lg" className="w-full rounded-2xl">
                                        New list
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                }
                            />

                            <div className="space-y-3 rounded-2xl border border-border/60 bg-background/65 p-3">
                                <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Task filters</span>
                                        {hasActiveGlobalTaskFilters ? (
                                            <Button variant="ghost" size="sm" className="h-7 rounded-full px-2.5 text-xs" onClick={resetGlobalTaskFilters}>
                                                Reset
                                            </Button>
                                        ) : null}
                                    </div>
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={globalTaskFilters.query}
                                            onChange={(e) => updateGlobalTaskFilters({ query: e.target.value })}
                                            placeholder="Search tasks across lists"
                                            className="h-10 rounded-2xl pl-9 text-sm"
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <div className="space-y-1.5">
                                            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Status</span>
                                            <Select value={globalTaskFilters.status} onValueChange={(value: GlobalTaskStatusFilter) => updateGlobalTaskFilters({ status: value })}>
                                                <SelectTrigger className="w-full rounded-2xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {globalStatusOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Priority</span>
                                            <Select value={globalTaskFilters.priority} onValueChange={(value: GlobalTaskPriorityFilter) => updateGlobalTaskFilters({ priority: value })}>
                                                <SelectTrigger className="w-full rounded-2xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {globalPriorityOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Due date</span>
                                            <Select value={globalTaskFilters.due} onValueChange={(value: GlobalTaskDueFilter) => updateGlobalTaskFilters({ due: value })}>
                                                <SelectTrigger className="w-full rounded-2xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {globalDueOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-muted/15 px-3 py-2.5">
                                        <p className="min-w-0 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                                            Matched tasks
                                        </p>
                                        <p className="shrink-0 text-right text-base font-semibold text-foreground">
                                            {aggregatedTaskStats.matched}
                                            <span className="ml-1 text-sm font-normal text-muted-foreground">/ {aggregatedTaskStats.total}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-muted/15 px-3 py-2.5">
                                        <p className="min-w-0 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                                            Completed
                                        </p>
                                        <p className="shrink-0 text-right text-base font-semibold text-foreground">
                                            {aggregatedTaskStats.completed}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-muted/15 px-3 py-2.5">
                                        <p className="min-w-0 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                                            Overdue
                                        </p>
                                        <p className="shrink-0 text-right text-base font-semibold text-destructive">
                                            {aggregatedTaskStats.overdue}
                                        </p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        placeholder="Search lists"
                                        className="h-10 rounded-2xl pl-9 text-sm"
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Sort</span>
                                    <Select value={sortValue} onValueChange={(value: 'custom' | 'recent' | 'oldest' | 'alphabetical') => setSortValue(value)}>
                                        <SelectTrigger size="sm" className="w-36 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="custom">Custom order</SelectItem>
                                            <SelectItem value="recent">Newest first</SelectItem>
                                            <SelectItem value="oldest">Oldest first</SelectItem>
                                            <SelectItem value="alphabetical">A to Z</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {isReorderingLists ? (
                                    <div className="text-[11px] uppercase tracking-[0.16em] text-primary">
                                        Saving order...
                                    </div>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Navigate</p>
                                    <span className="text-xs text-muted-foreground">{displayTodolists.length}</span>
                                </div>
                                {dragListsEnabled ? (
                                    <div className="px-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                        Drag lists by handle to reorder
                                    </div>
                                ) : null}
                                {displayTodolists.length ? (
                                    <div className="space-y-2">
                                        {displayTodolists.map((list) => (
                                            <div
                                                key={list.id}
                                                onDragEnter={dragListsEnabled ? () => handleListDragEnter(list.id) : undefined}
                                                onDragOver={dragListsEnabled ? (event) => event.preventDefault() : undefined}
                                                onDrop={dragListsEnabled ? () => void handleListDrop() : undefined}
                                                className={cn(
                                                    'flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition-colors',
                                                    draggedListId === list.id && 'opacity-60',
                                                    dragOverListId === list.id && draggedListId !== list.id && 'bg-primary/6 ring-1 ring-primary/20',
                                                    selectedListId === list.id
                                                        ? 'border-primary/35 bg-primary/8 text-foreground shadow-[0_14px_30px_-24px_rgba(37,99,235,0.55)]'
                                                        : 'border-border/60 bg-background/65 text-muted-foreground hover:bg-muted/35 hover:text-foreground'
                                                )}
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    {dragListsEnabled ? (
                                                        <div
                                                            draggable
                                                            onDragStart={() => handleListDragStart(list.id)}
                                                            onDragEnd={handleListDragEnd}
                                                            className="cursor-grab text-muted-foreground active:cursor-grabbing"
                                                        >
                                                            <GripVertical className="h-4 w-4" />
                                                        </div>
                                                    ) : null}
                                                    <button
                                                        type="button"
                                                        onClick={() => selectList(list.id)}
                                                        className="min-w-0 text-left"
                                                    >
                                                        <p className="truncate text-sm font-medium">{list.title}</p>
                                                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                                            {typeof tasksStatsByListId[list.id]?.matched === 'number'
                                                                ? `${tasksStatsByListId[list.id].matched}/${tasksStatsByListId[list.id].total} tasks`
                                                                : selectedListId === list.id
                                                                    ? 'Selected'
                                                                    : 'Open board'}
                                                        </p>
                                                    </button>
                                                </div>
                                                <ChevronRight className="h-4 w-4 shrink-0" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-border/60 bg-background/65 px-3 py-4 text-sm text-muted-foreground">
                                        No lists match your search.
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2.5">
                                {overviewItems.map(({ label, value, note, icon: Icon }) => (
                                    <div
                                        key={label}
                                        className="flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/15 px-3 py-2.5"
                                    >
                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/80 text-muted-foreground">
                                            <Icon className="h-3.5 w-3.5" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
                                            <p className="truncate text-sm font-medium text-foreground">{value}</p>
                                            <p className="text-[11px] text-muted-foreground">{note}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl border border-border/50 bg-muted/15 px-3 py-2.5">
                                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Flow</p>
                                <p className="mt-1.5 text-sm font-medium text-foreground">Create list</p>
                                <p className="mt-1 flex items-center gap-1 text-[13px] text-muted-foreground">
                                    Add tasks inside the board
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </aside>

                <section className="space-y-4">
                    <div className="rounded-[28px] border border-border/60 bg-card/75 px-5 py-5 shadow-[0_24px_70px_-64px_rgba(15,23,42,0.85)] backdrop-blur sm:px-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Lists</p>
                                <h1 className="font-display text-2xl leading-tight sm:text-3xl [overflow-wrap:anywhere]">
                                    Your task boards
                                </h1>
                            </div>
                            <p className="max-w-lg min-w-0 text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                                {hasActiveGlobalTaskFilters
                                    ? 'Global task filters are active and synced with the URL.'
                                    : 'Cleaner boards, shorter cards, and one obvious place to create new lists.'}
                            </p>
                        </div>
                    </div>

                    {hasTodolists ? (
                        <div className="dashboard-grid">
                            {displayTodolists.map((list) => (
                                <div key={list.id} id={`list-card-${list.id}`}>
                                    <TodolistItem
                                        todolist={list}
                                        globalTaskFilters={globalTaskFilters}
                                        matchedTasksCount={tasksStatsByListId[list.id]?.matched}
                                        totalTasksCount={tasksStatsByListId[list.id]?.total}
                                        selected={selectedListId === list.id}
                                        onSelect={() => setSelectedListId(list.id)}
                                        onTasksStatsChange={(stats) => handleTasksStatsChange(list.id, stats)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyTodolistsState onAddTodolist={addTodolist} />
                    )}
                </section>
            </div>
        </main>
    )
}
