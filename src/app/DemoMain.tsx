import {CreateItemForm} from '@/CreateItemForm'
import {Badge} from '@/common/components/ui/badge'
import {Button} from '@/common/components/ui/button'
import {Card, CardContent, CardHeader} from '@/common/components/ui/card'
import {Checkbox} from '@/common/components/ui/checkbox'
import {Title} from '@/common/components/ui/title'
import {TaskPriority, TaskStatus} from '@/common/enums'
import {cn} from '@/common/lib/utils'
import type {DomainTask} from '@/feature/todolists/api/tasksApi.types'
import {EmptyTodolistsState} from '@/feature/todolists/ui/Todolists/EmptyTodolistsState/EmptyTodolistsState'
import type {DomainTodolist, FilterValues} from '@/feature/todolists/libs/types'
import {FolderKanban, Sparkles, Trash2} from 'lucide-react'
import {useMemo, useState} from 'react'

type DemoWorkspace = {
    lists: DomainTodolist[]
    tasksByListId: Record<string, DomainTask[]>
}

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`

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

const createDemoTask = (todoListId: string, title: string, status = TaskStatus.New, priority = TaskPriority.Middle): DomainTask => ({
    description: null,
    deadline: null,
    startDate: null,
    title,
    status,
    priority,
    id: createId('task'),
    todoListId,
    order: 0,
    addedDate: createLocalDate(),
})

const createInitialWorkspace = (): DemoWorkspace => {
    const launch = createDemoList('Launch week', 0)
    const polish = createDemoList('UX polish', 1)

    return {
        lists: [launch, polish],
        tasksByListId: {
            [launch.id]: [
                createDemoTask(launch.id, 'Prepare release checklist', TaskStatus.InProgress, TaskPriority.Hi),
                createDemoTask(launch.id, 'Verify responsive header'),
                createDemoTask(launch.id, 'Update README visuals', TaskStatus.Completed, TaskPriority.Low),
            ],
            [polish.id]: [
                createDemoTask(polish.id, 'Tighten sidebar spacing', TaskStatus.InProgress),
                createDemoTask(polish.id, 'Refine task empty state copy', TaskStatus.New, TaskPriority.Low),
            ],
        },
    }
}

const getFilteredTasks = (tasks: DomainTask[], filter: FilterValues) => {
    if (filter === 'active') return tasks.filter((task) => task.status === TaskStatus.New)
    if (filter === 'completed') return tasks.filter((task) => task.status === TaskStatus.Completed)
    return tasks
}

export const DemoMain = () => {
    const [workspace, setWorkspace] = useState<DemoWorkspace>(() => createInitialWorkspace())

    const hasLists = workspace.lists.length > 0
    const totals = useMemo(() => {
        const tasks = Object.values(workspace.tasksByListId).flat()
        return {
            total: tasks.length,
            completed: tasks.filter((task) => task.status === TaskStatus.Completed).length,
        }
    }, [workspace.tasksByListId])

    const addList = (title: string) => {
        const nextList = createDemoList(title, workspace.lists.length)
        setWorkspace((prev) => ({
            lists: [nextList, ...prev.lists],
            tasksByListId: {...prev.tasksByListId, [nextList.id]: []},
        }))
    }

    const restoreWorkspace = () => {
        setWorkspace(createInitialWorkspace())
    }

    return (
        <main className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 -z-10 h-48 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_46%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_30%)]" />
            <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
                <section className="rounded-[28px] border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-primary">
                    <div className="flex items-start gap-3">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                        <div className="space-y-2">
                            <p>Demo mode is fully local and does not depend on SamuraiJS credentials.</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <Badge variant="outline" className="rounded-full">Lists: {workspace.lists.length}</Badge>
                                <Badge variant="outline" className="rounded-full">Tasks: {totals.total}</Badge>
                                <Badge variant="outline" className="rounded-full">Completed: {totals.completed}</Badge>
                            </div>
                        </div>
                    </div>
                </section>

                {hasLists ? (
                    <>
                        <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_24px_70px_-64px_rgba(15,23,42,0.85)]">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div className="space-y-2">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Local review workspace</div>
                                    <Title level={2} noMargin className="font-display text-3xl">Try the full UI without API risk</Title>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={restoreWorkspace} className="rounded-2xl">Restore workspace</Button>
                                </div>
                            </div>
                            <div className="mt-4 max-w-xl">
                                <CreateItemForm onAdd={addList} placeholder="Add a demo list" />
                            </div>
                        </section>

                        <section className="dashboard-grid">
                            {workspace.lists.map((list) => {
                                const tasks = workspace.tasksByListId[list.id] ?? []
                                const visibleTasks = getFilteredTasks(tasks, list.filter)

                                return (
                                    <Card key={list.id} className="flex h-full flex-col overflow-hidden border-border/60 bg-card/92 shadow-[0_26px_70px_-62px_rgba(15,23,42,0.95)]">
                                        <CardHeader className="gap-3 border-b border-border/60 pb-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                            <FolderKanban className="h-4.5 w-4.5" />
                                                        </span>
                                                        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Demo board</div>
                                                    </div>
                                                    <Title level={3} noMargin className="font-display text-xl leading-tight">{list.title}</Title>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="rounded-full text-muted-foreground hover:text-destructive"
                                                    onClick={() => {
                                                        setWorkspace((prev) => {
                                                            const nextTasks = {...prev.tasksByListId}
                                                            delete nextTasks[list.id]
                                                            return {
                                                                lists: prev.lists.filter((item) => item.id !== list.id),
                                                                tasksByListId: nextTasks,
                                                            }
                                                        })
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">Local only</Badge>
                                                <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">{visibleTasks.length}/{tasks.length} shown</Badge>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 rounded-2xl bg-muted/55 p-1">
                                                {(['all', 'active', 'completed'] as FilterValues[]).map((filter) => (
                                                    <Button
                                                        key={filter}
                                                        size="sm"
                                                        variant={list.filter === filter ? 'outline' : 'ghost'}
                                                        className="rounded-xl px-3"
                                                        onClick={() => {
                                                            setWorkspace((prev) => ({
                                                                ...prev,
                                                                lists: prev.lists.map((item) => item.id === list.id ? {...item, filter} : item),
                                                            }))
                                                        }}
                                                    >
                                                        {filter}
                                                    </Button>
                                                ))}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="flex flex-1 flex-col gap-4 pt-5">
                                            <section className="rounded-[1.35rem] border border-border/60 bg-background/70 p-3">
                                                <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">New task</p>
                                                <CreateItemForm
                                                    onAdd={(title) => {
                                                        const nextTask = createDemoTask(list.id, title)
                                                        setWorkspace((prev) => ({
                                                            ...prev,
                                                            tasksByListId: {...prev.tasksByListId, [list.id]: [nextTask, ...(prev.tasksByListId[list.id] ?? [])]},
                                                        }))
                                                    }}
                                                    placeholder="Add a task and press Enter"
                                                />
                                            </section>

                                            <section className="flex flex-1 flex-col rounded-[1.5rem] border border-border/60 bg-muted/[0.22] p-2">
                                                <div className="px-2 pb-2 pt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Tasks</div>
                                                {visibleTasks.length ? (
                                                    <div className="space-y-2">
                                                        {visibleTasks.map((task) => (
                                                            <div key={task.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/70 px-3 py-2.5">
                                                                <Checkbox
                                                                    checked={task.status === TaskStatus.Completed}
                                                                    onCheckedChange={(checked) => {
                                                                        setWorkspace((prev) => ({
                                                                            ...prev,
                                                                            tasksByListId: {
                                                                                ...prev.tasksByListId,
                                                                                [list.id]: (prev.tasksByListId[list.id] ?? []).map((item) =>
                                                                                    item.id === task.id
                                                                                        ? {...item, status: checked === true ? TaskStatus.Completed : TaskStatus.New}
                                                                                        : item
                                                                                ),
                                                                            },
                                                                        }))
                                                                    }}
                                                                />
                                                                <div className={cn('min-w-0 flex-1 text-sm font-medium', task.status === TaskStatus.Completed && 'line-through text-muted-foreground/70')}>
                                                                    {task.title}
                                                                </div>
                                                                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
                                                                    {TaskPriority[task.priority]}
                                                                </Badge>
                                                                <Button
                                                                    size="icon-sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        setWorkspace((prev) => ({
                                                                            ...prev,
                                                                            tasksByListId: {
                                                                                ...prev.tasksByListId,
                                                                                [list.id]: (prev.tasksByListId[list.id] ?? []).filter((item) => item.id !== task.id),
                                                                            },
                                                                        }))
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="rounded-2xl border border-dashed border-border/60 bg-background/70 px-4 py-6 text-center text-sm text-muted-foreground">
                                                        No tasks match the current filter.
                                                    </div>
                                                )}
                                            </section>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </section>
                    </>
                ) : (
                    <EmptyTodolistsState onAddTodolist={addList} onCreateDemoWorkspace={restoreWorkspace} showOnboarding />
                )}
            </div>
        </main>
    )
}
