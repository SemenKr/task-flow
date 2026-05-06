import {Button} from '@/common/components/ui/button';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from '@/common/components/ui/dialog';
import {Input} from '@/common/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/common/components/ui/select';
import type {GlobalTaskDueFilter, GlobalTaskPriorityFilter, GlobalTaskStatusFilter} from '@/feature/todolists/libs/types';
import {Badge} from '@/common/components/ui/badge';
import {cn} from '@/common/lib/utils';
import {SlidersHorizontal, X} from 'lucide-react';
import {useEffect, useId, useMemo, useState} from 'react';
import {useDebouncedValue} from '@/feature/todolists/libs/useDebouncedValue';
import {
    DEFAULT_GLOBAL_TASK_FILTERS,
    GLOBAL_DUE_OPTIONS,
    GLOBAL_PRIORITY_OPTIONS,
    GLOBAL_STATUS_OPTIONS,
} from '@/feature/todolists/model/constants';
import type {SidebarFiltersModel} from '@/feature/todolists/model/types';

const createOptionValueGuard = <T extends string>(options: ReadonlyArray<{ value: T }>) => {
    const optionValues = new Set(options.map(({ value }) => value))

    return (value: string, fallbackValue: T): T => (
        optionValues.has(value as T) ? value as T : fallbackValue
    )
}

const normalizeStatusValue = createOptionValueGuard<GlobalTaskStatusFilter>(GLOBAL_STATUS_OPTIONS)
const normalizePriorityValue = createOptionValueGuard<GlobalTaskPriorityFilter>(GLOBAL_PRIORITY_OPTIONS)
const normalizeDueValue = createOptionValueGuard<GlobalTaskDueFilter>(GLOBAL_DUE_OPTIONS)

const getOptionLabel = <T extends string>(
    options: ReadonlyArray<{ value: T; label: string }>,
    value: T,
) => options.find((option) => option.value === value)?.label ?? value

const formatTasksFoundLabel = (matchedTasksCount: number, totalTasksCount: number) => {
    if (matchedTasksCount === totalTasksCount) {
        return `${matchedTasksCount} ${matchedTasksCount === 1 ? 'task' : 'tasks'} found`
    }

    return `${matchedTasksCount} of ${totalTasksCount} tasks found`
}

type TaskFiltersContentProps = {
    filters: SidebarFiltersModel
}

const TaskFiltersContent = ({
    filters: {
        globalTaskFilters,
        matchedTasksCount,
        totalTasksCount,
        onUpdateGlobalTaskFilters,
    },
}: TaskFiltersContentProps) => {
    const [queryValue, setQueryValue] = useState(globalTaskFilters.query)
    const debouncedQueryValue = useDebouncedValue(queryValue, 300)

    useEffect(() => {
        setQueryValue(globalTaskFilters.query)
    }, [globalTaskFilters.query])

    useEffect(() => {
        if (debouncedQueryValue === globalTaskFilters.query) {
            return
        }

        onUpdateGlobalTaskFilters({ query: debouncedQueryValue })
    }, [debouncedQueryValue, globalTaskFilters.query, onUpdateGlobalTaskFilters])

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <div className="relative">
                    <Input
                        value={queryValue}
                        onChange={(event) => setQueryValue(event.target.value)}
                        placeholder="Search tasks"
                        className="h-10 rounded-2xl text-sm"
                        aria-label="Search tasks"
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    {formatTasksFoundLabel(matchedTasksCount, totalTasksCount)}
                </p>
            </div>
            <div className="grid gap-3">
                <Select
                    value={globalTaskFilters.status}
                    onValueChange={(value) => onUpdateGlobalTaskFilters({ status: normalizeStatusValue(value, 'all') })}
                >
                    <SelectTrigger className="rounded-2xl">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {GLOBAL_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={globalTaskFilters.priority}
                    onValueChange={(value) => onUpdateGlobalTaskFilters({ priority: normalizePriorityValue(value, 'all') })}
                >
                    <SelectTrigger className="rounded-2xl">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        {GLOBAL_PRIORITY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={globalTaskFilters.due}
                    onValueChange={(value) => onUpdateGlobalTaskFilters({ due: normalizeDueValue(value, 'all') })}
                >
                    <SelectTrigger className="rounded-2xl">
                        <SelectValue placeholder="Due date" />
                    </SelectTrigger>
                    <SelectContent>
                        {GLOBAL_DUE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

type TaskFilterChip = {
    key: keyof typeof DEFAULT_GLOBAL_TASK_FILTERS
    label: string
    value: string
}

const useTaskFilterChips = ({
    globalTaskFilters,
}: Pick<SidebarFiltersModel, 'globalTaskFilters'>): TaskFilterChip[] => useMemo(() => {
    const chips: TaskFilterChip[] = []

    if (globalTaskFilters.query.trim()) {
        chips.push({
            key: 'query',
            label: 'Search',
            value: globalTaskFilters.query.trim(),
        })
    }

    if (globalTaskFilters.status !== DEFAULT_GLOBAL_TASK_FILTERS.status) {
        chips.push({
            key: 'status',
            label: 'Status',
            value: getOptionLabel(GLOBAL_STATUS_OPTIONS, globalTaskFilters.status),
        })
    }

    if (globalTaskFilters.priority !== DEFAULT_GLOBAL_TASK_FILTERS.priority) {
        chips.push({
            key: 'priority',
            label: 'Priority',
            value: getOptionLabel(GLOBAL_PRIORITY_OPTIONS, globalTaskFilters.priority),
        })
    }

    if (globalTaskFilters.due !== DEFAULT_GLOBAL_TASK_FILTERS.due) {
        chips.push({
            key: 'due',
            label: 'Due',
            value: getOptionLabel(GLOBAL_DUE_OPTIONS, globalTaskFilters.due),
        })
    }

    return chips
}, [globalTaskFilters.due, globalTaskFilters.priority, globalTaskFilters.query, globalTaskFilters.status])

type TaskFilterChipsProps = {
    filters: SidebarFiltersModel
}

const TaskFilterChips = ({
    filters,
}: TaskFilterChipsProps) => {
    const chips = useTaskFilterChips(filters)

    if (!chips.length) {
        return null
    }

    return (
        <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
                <Badge
                    key={chip.key}
                    variant="secondary"
                    className="rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-xs font-normal"
                >
                    <span className="text-muted-foreground">{chip.label}:</span>
                    <span>{chip.value}</span>
                    <button
                        type="button"
                        onClick={() => filters.onUpdateGlobalTaskFilters({ [chip.key]: DEFAULT_GLOBAL_TASK_FILTERS[chip.key] })}
                        className="ml-1 rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        aria-label={`Clear ${chip.label.toLowerCase()} filter`}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
        </div>
    )
}

type DesktopTodolistsSidebarTaskFiltersProps = {
    filters: SidebarFiltersModel
}

export const DesktopTodolistsSidebarTaskFilters = ({
    filters,
}: DesktopTodolistsSidebarTaskFiltersProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const filtersPanelId = useId()

    return (
        <section className="space-y-3 rounded-3xl border border-border/50 bg-card/80 p-4">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Task filters</p>
                    <p className="text-xs text-muted-foreground">
                        {filters.activeFiltersCount
                            ? `${filters.activeFiltersCount} active · ${formatTasksFoundLabel(filters.matchedTasksCount, filters.totalTasksCount)}`
                            : formatTasksFoundLabel(filters.matchedTasksCount, filters.totalTasksCount)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {filters.hasActiveGlobalTaskFilters ? (
                        <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={filters.onResetGlobalTaskFilters}>
                            Reset
                        </Button>
                    ) : null}
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full px-3 text-xs"
                        onClick={() => setIsOpen((prev) => !prev)}
                        aria-expanded={isOpen}
                        aria-controls={filtersPanelId}
                    >
                        {isOpen ? 'Hide' : 'Show'}
                    </Button>
                </div>
            </div>

            <TaskFilterChips filters={filters} />

            <div id={filtersPanelId} hidden={!isOpen}>
                {isOpen ? <TaskFiltersContent filters={filters} /> : null}
            </div>
        </section>
    )
}

type MobileTodolistsSidebarTaskFiltersProps = {
    filters: SidebarFiltersModel
}

export const MobileTodolistsSidebarTaskFilters = ({
    filters,
}: MobileTodolistsSidebarTaskFiltersProps) => (
    <Dialog>
        <DialogTrigger asChild>
            <Button
                variant="outline"
                className={cn(
                    'w-full rounded-2xl sm:w-auto',
                    filters.hasActiveGlobalTaskFilters && 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10',
                )}
                aria-label="Open task filters"
            >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {filters.activeFiltersCount ? ` (${filters.activeFiltersCount})` : ''}
            </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[calc(100%-1rem)] rounded-[28px] p-5 sm:max-w-md">
            <DialogHeader className="text-left">
                <DialogTitle>Task filters</DialogTitle>
                <DialogDescription>
                    Narrow tasks across all visible lists.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        {filters.activeFiltersCount
                            ? `${filters.activeFiltersCount} active · ${formatTasksFoundLabel(filters.matchedTasksCount, filters.totalTasksCount)}`
                            : formatTasksFoundLabel(filters.matchedTasksCount, filters.totalTasksCount)}
                    </span>
                    {filters.hasActiveGlobalTaskFilters ? (
                        <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={filters.onResetGlobalTaskFilters}>
                            Reset
                        </Button>
                    ) : null}
                </div>
                <TaskFilterChips filters={filters} />
                <TaskFiltersContent filters={filters} />
            </div>
        </DialogContent>
    </Dialog>
)
