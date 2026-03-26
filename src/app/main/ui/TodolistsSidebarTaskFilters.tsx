import {Button} from '@/common/components/ui/button';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from '@/common/components/ui/dialog';
import {Input} from '@/common/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/common/components/ui/select';
import type {GlobalTaskDueFilter, GlobalTaskPriorityFilter, GlobalTaskStatusFilter} from '@/feature/todolists/libs/types';
import {SlidersHorizontal} from 'lucide-react';
import {useState} from 'react';
import {
    GLOBAL_DUE_OPTIONS,
    GLOBAL_PRIORITY_OPTIONS,
    GLOBAL_STATUS_OPTIONS,
} from '../model/constants';
import type {SidebarFiltersModel} from '../model/types';

const statusValues = new Set<GlobalTaskStatusFilter>(GLOBAL_STATUS_OPTIONS.map(({ value }) => value))
const priorityValues = new Set<GlobalTaskPriorityFilter>(GLOBAL_PRIORITY_OPTIONS.map(({ value }) => value))
const dueValues = new Set<GlobalTaskDueFilter>(GLOBAL_DUE_OPTIONS.map(({ value }) => value))

const normalizeStatusValue = (value: string): GlobalTaskStatusFilter => (
    statusValues.has(value as GlobalTaskStatusFilter) ? value as GlobalTaskStatusFilter : 'all'
)

const normalizePriorityValue = (value: string): GlobalTaskPriorityFilter => (
    priorityValues.has(value as GlobalTaskPriorityFilter) ? value as GlobalTaskPriorityFilter : 'all'
)

const normalizeDueValue = (value: string): GlobalTaskDueFilter => (
    dueValues.has(value as GlobalTaskDueFilter) ? value as GlobalTaskDueFilter : 'all'
)

type TaskFiltersContentProps = {
    filters: SidebarFiltersModel
}

const TaskFiltersContent = ({
    filters: {
        globalTaskFilters,
        onUpdateGlobalTaskFilters,
    },
}: TaskFiltersContentProps) => (
    <div className="space-y-3">
        <div className="relative">
            <Input
                value={globalTaskFilters.query}
                onChange={(event) => onUpdateGlobalTaskFilters({ query: event.target.value })}
                placeholder="Search tasks"
                className="h-10 rounded-2xl text-sm"
                aria-label="Search tasks"
            />
        </div>
        <div className="grid gap-3">
            <Select
                value={globalTaskFilters.status}
                onValueChange={(value) => onUpdateGlobalTaskFilters({ status: normalizeStatusValue(value) })}
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
                onValueChange={(value) => onUpdateGlobalTaskFilters({ priority: normalizePriorityValue(value) })}
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
                onValueChange={(value) => onUpdateGlobalTaskFilters({ due: normalizeDueValue(value) })}
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

type DesktopTodolistsSidebarTaskFiltersProps = {
    filters: SidebarFiltersModel
}

export const DesktopTodolistsSidebarTaskFilters = ({
    filters,
}: DesktopTodolistsSidebarTaskFiltersProps) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <section className="space-y-3 rounded-3xl border border-border/50 bg-card/80 p-4">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Task filters</p>
                    <p className="text-xs text-muted-foreground">
                        {filters.activeFiltersCount ? `${filters.activeFiltersCount} active` : 'Optional'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {filters.hasActiveGlobalTaskFilters ? (
                        <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={filters.onResetGlobalTaskFilters}>
                            Reset
                        </Button>
                    ) : null}
                    <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={() => setIsOpen((prev) => !prev)}>
                        {isOpen ? 'Hide' : 'Show'}
                    </Button>
                </div>
            </div>

            {isOpen ? <TaskFiltersContent filters={filters} /> : null}
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
            <Button variant="outline" className="w-full rounded-2xl sm:w-auto" aria-label="Open task filters">
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
                        {filters.activeFiltersCount ? `${filters.activeFiltersCount} active` : 'No active filters'}
                    </span>
                    {filters.hasActiveGlobalTaskFilters ? (
                        <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={filters.onResetGlobalTaskFilters}>
                            Reset
                        </Button>
                    ) : null}
                </div>
                <TaskFiltersContent filters={filters} />
            </div>
        </DialogContent>
    </Dialog>
)
