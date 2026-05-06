import {Badge} from '@/common/components/ui/badge';
import {Button} from '@/common/components/ui/button.tsx';
import {Card, CardContent, CardHeader} from '@/common/components/ui/card.tsx';
import {Input} from '@/common/components/ui/input.tsx';
import {cn} from '@/common/lib/utils.ts';
import {Title} from '@/common/components/ui/title.tsx';
import {CreateItemForm} from '@/common/components/CreateItemForm/CreateItemForm.tsx';
import {useAddTaskMutation} from '@/feature/todolists/api/tasksApi';
import type {DomainTask} from '@/feature/todolists/api/tasksApi.types';
import {useRemoveTodolistMutation, useUpdateTodolistTitleMutation} from '@/feature/todolists/api/todolistsApi';
import type {DomainTodolist, FilterValues, GlobalTaskFilters} from '@/feature/todolists/libs/types';
import {FilterButtons} from '@/feature/todolists/ui/Todolists/Todolist/FilterButtons.tsx';
import {Tasks} from '@/feature/todolists/ui/Todolists/TodolistItem/Tasks/Tasks.tsx';
import {getTaskActionErrorMessage} from '@/feature/todolists/ui/Todolists/TodolistItem/Tasks/taskActionErrorMessage';
import {Check, Edit2, FolderKanban, Trash2, X} from 'lucide-react';
import {KeyboardEvent, useEffect, useState} from 'react';
import {toast} from 'sonner';
import type {TaskStats} from '@/feature/todolists/model/types';

type TodolistItemPropsType = {
    todolist: DomainTodolist
    globalTaskFilters: GlobalTaskFilters
    tasks?: DomainTask[]
    allowTaskReorder?: boolean
    onRenameTodolist?: (title: string) => Promise<void> | void
    onDeleteTodolist?: () => Promise<void> | void
    onAddTask?: (title: string) => Promise<void> | void
    onSetFilter?: (filter: FilterValues) => Promise<void> | void
    onUpdateTask?: (taskId: string, changes: Partial<DomainTask>) => Promise<void> | void
    onDeleteTask?: (taskId: string) => Promise<void> | void
    onReorderTasks?: (orderedTaskIds: string[]) => Promise<void> | void
    matchedTasksCount?: number
    totalTasksCount?: number
    selected?: boolean
    onSelect?: () => void
    onTasksStatsChange?: (stats: TaskStats) => void
}

export const TodolistItem = ({
    todolist,
    globalTaskFilters,
    tasks,
    allowTaskReorder = true,
    onRenameTodolist,
    onDeleteTodolist,
    onAddTask,
    onSetFilter,
    onUpdateTask,
    onDeleteTask,
    onReorderTasks,
    matchedTasksCount,
    totalTasksCount,
    selected = false,
    onSelect,
    onTasksStatsChange,
}: TodolistItemPropsType) => {
    const { id, title, filter } = todolist
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [titleValue, setTitleValue] = useState(title)
    const [addTask, { isLoading: isAddingTask }] = useAddTaskMutation()
    const [removeTodolist, { isLoading: isRemovingTodolist }] = useRemoveTodolistMutation()
    const [updateTodolistTitle, { isLoading: isUpdatingTitle }] = useUpdateTodolistTitleMutation()
    const isAddingTaskWithFallback = !onAddTask && isAddingTask
    const isRemovingTodolistWithFallback = !onDeleteTodolist && isRemovingTodolist
    const isUpdatingTitleWithFallback = !onRenameTodolist && isUpdatingTitle
    const isBusy = isAddingTaskWithFallback || isRemovingTodolistWithFallback || isUpdatingTitleWithFallback

    const filterLabel = {
        all: 'All tasks',
        active: 'Active only',
        completed: 'Completed only',
    }[filter]

    useEffect(() => {
        setTitleValue(title)
    }, [title])

    const deleteTodolist = () => {
        if (isRemovingTodolistWithFallback) return

        if (onDeleteTodolist) {
            void Promise.resolve(onDeleteTodolist()).catch((error) => {
                toast.error('Failed to delete list')
                console.error('Error deleting todolist:', error)
            })
            return
        }

        removeTodolist(id)
    }

    const createTask = (title: string) => {
        if (isAddingTaskWithFallback) return

        if (onAddTask) {
            void Promise.resolve(onAddTask(title)).catch((error) => {
                toast.error(getTaskActionErrorMessage('create', error))
                console.error('Error creating task:', error)
            })
            return
        }

        void addTask({ todolistId: todolist.id, title })
            .unwrap()
            .catch((error) => {
                toast.error(getTaskActionErrorMessage('create', error))
                console.error('Error creating task:', error)
            })
    }

    const startEditingTitle = () => {
        if (isBusy) return
        setTitleValue(title)
        setIsEditingTitle(true)
    }

    const cancelEditingTitle = () => {
        setTitleValue(title)
        setIsEditingTitle(false)
    }

    const saveTitle = async () => {
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

        if (trimmedTitle === title) {
            setIsEditingTitle(false)
            return
        }

        try {
            if (onRenameTodolist) {
                await onRenameTodolist(trimmedTitle)
            } else {
                await updateTodolistTitle({ id, title: trimmedTitle }).unwrap()
            }
            toast.success('List title updated')
            setIsEditingTitle(false)
        } catch (error) {
            toast.error('Failed to update list title')
            console.error('Error updating todolist title:', error)
        }
    }

    const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            void saveTitle()
        }

        if (e.key === 'Escape') {
            e.preventDefault()
            cancelEditingTitle()
        }
    }

    return (
        <Card
            className={cn(
                'group flex h-full w-full flex-col overflow-hidden border-border/60 bg-card/92 shadow-[0_26px_70px_-62px_rgba(15,23,42,0.95)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_-64px_rgba(15,23,42,1)]',
                selected && 'border-primary/35 shadow-[0_28px_90px_-62px_rgba(37,99,235,0.42)]'
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
                                Task list
                            </div>
                        </div>
                        <div className="min-h-[3.5rem]">
                            {isEditingTitle ? (
                                <div className="space-y-2.5">
                                    <Input
                                        value={titleValue}
                                        onChange={(e) => setTitleValue(e.target.value)}
                                        onKeyDown={handleTitleKeyDown}
                                        className="h-10 rounded-2xl text-sm"
                                        maxLength={50}
                                        disabled={isUpdatingTitleWithFallback}
                                        autoFocus
                                    />
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => void saveTitle()}
                                            disabled={isUpdatingTitleWithFallback}
                                            className="rounded-full"
                                        >
                                            <Check className="h-4 w-4" />
                                            Save
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={cancelEditingTitle}
                                            disabled={isUpdatingTitleWithFallback}
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
                                        {title}
                                    </Title>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={startEditingTitle}
                                        disabled={isBusy}
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
                        onClick={deleteTodolist}
                        disabled={isRemovingTodolistWithFallback}
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
                        Synced
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
                    <CreateItemForm onAdd={createTask} placeholder="Add a task and press Enter" disabled={isBusy} />
                </section>

                <section className="rounded-[1.35rem] border border-border/60 bg-background/70 p-2.5">
                    <p className="mb-2 px-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Filter
                    </p>
                    <FilterButtons
                        todolist={todolist}
                        onSetFilter={onSetFilter}
                    />
                </section>

                <section className="flex flex-1 flex-col rounded-[1.5rem] border border-border/60 bg-muted/[0.22] p-2">
                    <div className="px-2 pb-2 pt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Tasks
                    </div>
                    <Tasks
                        todolist={todolist}
                        globalTaskFilters={globalTaskFilters}
                        tasks={tasks}
                        allowTaskReorder={allowTaskReorder}
                        onUpdateTask={onUpdateTask}
                        onDeleteTask={onDeleteTask}
                        onReorderTasks={onReorderTasks}
                        onStatsChange={onTasksStatsChange}
                    />
                </section>
            </CardContent>
        </Card>
    )
}
