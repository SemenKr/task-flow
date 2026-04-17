import {TaskPriority, TaskStatus} from '@/common/enums';
import {Badge} from '@/common/components/ui/badge.tsx';
import {Button} from '@/common/components/ui/button.tsx';
import {Checkbox} from '@/common/components/ui/checkbox.tsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/common/components/ui/dialog.tsx';
import {Input} from '@/common/components/ui/input.tsx';
import {Label} from '@/common/components/ui/label.tsx';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/common/components/ui/select.tsx';
import {cn} from '@/common/lib/utils.ts';
import {useRemoveTaskMutation, useUpdateTaskMutation} from '@/feature/todolists/api/tasksApi';
import type {DomainTask} from '@/feature/todolists/api/tasksApi.types';
import {createTaskModel} from '@/feature/todolists/libs/utils';
import {getTaskActionErrorMessage} from '../taskActionErrorMessage';

import {CalendarDays, ChevronDown, ChevronUp, Edit2, Flag, GripVertical, Timer, Trash2} from 'lucide-react';
import {useEffect, useState} from 'react';
import {toast} from 'sonner';

type TaskItemPropsType = {
    todolistId: string
    task: DomainTask
    reorderEnabled?: boolean
    dragging?: boolean
    dragOver?: boolean
    onDragStart?: () => void
    onDragEnd?: () => void
}

type TaskFormValues = {
    title: string
    description: string
    status: string
    priority: string
    startDate: string
    deadline: string
}

const toDateTimeInputValue = (value: string | null) => value ? value.slice(0, 16) : ''

const toApiDateTimeValue = (value: string) => value ? `${value}:00` : null

const createFormValues = (task: DomainTask): TaskFormValues => ({
    title: task.title,
    description: task.description ?? '',
    status: String(task.status),
    priority: String(task.priority),
    startDate: toDateTimeInputValue(task.startDate),
    deadline: toDateTimeInputValue(task.deadline),
})

export const TaskItem = ({
    todolistId,
    task,
    reorderEnabled = false,
    dragging = false,
    dragOver = false,
    onDragStart,
    onDragEnd,
}: TaskItemPropsType) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [formValues, setFormValues] = useState<TaskFormValues>(() => createFormValues(task))

    const [updateTask] = useUpdateTaskMutation()
    const [removeTask] = useRemoveTaskMutation()

    const changeTaskStatus = (checked: boolean) => {
        const status = checked ? TaskStatus.Completed : TaskStatus.New
        const model = createTaskModel(task, { status })
        void updateTask({ taskId: task.id, todolistId, model })
            .unwrap()
            .catch((error) => {
                toast.error(getTaskActionErrorMessage('update', error))
                console.error('Error updating task status:', error)
            })
    }

    const isTaskCompleted = task.status === TaskStatus.Completed
    const isTaskInProgress = task.status === TaskStatus.InProgress

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

    const formatDate = (value: string | null) => {
        if (!value) return null
        return new Intl.DateTimeFormat('en', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }).format(new Date(value))
    }

    const createdAt = formatDate(task.addedDate)
    const startDate = formatDate(task.startDate)
    const deadline = formatDate(task.deadline)
    const hasDetails = Boolean(task.description || createdAt || startDate || deadline)

    useEffect(() => {
        setFormValues(createFormValues(task))
    }, [task])

    const handleDelete = async () => {
        try {
            await removeTask({ taskId: task.id, todolistId }).unwrap()
            toast.success('Task deleted')
        } catch (error) {
            toast.error(getTaskActionErrorMessage('delete', error))
            console.error('Error deleting task:', error)
        }
    }

    const handleFieldChange = (field: keyof TaskFormValues, value: string) => {
        setFormValues((prev) => ({ ...prev, [field]: value }))
    }

    const toggleTaskDetails = () => {
        if (!hasDetails) return
        setIsDetailsOpen((prev) => !prev)
    }

    const handleSave = async () => {
        const trimmedTitle = formValues.title.trim()
        if (!trimmedTitle) {
            toast.error('Task title cannot be empty')
            return
        }

        const model = createTaskModel(task, {
            title: trimmedTitle,
            description: formValues.description.trim() || null,
            status: Number(formValues.status) as TaskStatus,
            priority: Number(formValues.priority) as TaskPriority,
            startDate: toApiDateTimeValue(formValues.startDate),
            deadline: toApiDateTimeValue(formValues.deadline),
        })

        try {
            await updateTask({ taskId: task.id, todolistId, model }).unwrap()
            toast.success('Task updated')
            setIsDialogOpen(false)
        } catch (error) {
            toast.error(getTaskActionErrorMessage('update', error))
            console.error('Error updating task:', error)
        }
    }

    return (
        <>
            <div
                className={cn(
                    'group flex min-w-0 gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-all duration-200 hover:border-border/60 hover:bg-muted/20',
                    dragging && 'opacity-55',
                    dragOver && 'bg-primary/6 ring-1 ring-primary/20'
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
                    onCheckedChange={(checked) => changeTaskStatus(checked === true)}
                    id={task.id}
                    aria-label={`Toggle completion for task ${task.title}`}
                    className="mt-1 shrink-0"
                />

                <div
                    className={cn(
                        'min-w-0 flex-1 transition-all duration-200',
                        hasDetails && 'cursor-pointer group-hover:translate-x-0.5 active:scale-[0.995]'
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
                                className={`min-w-0 flex-1 select-none break-words text-sm font-medium leading-6 transition-all ${
                                isTaskCompleted
                                    ? 'line-through text-muted-foreground/70'
                                    : 'text-foreground'
                            }`}
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
                                    void handleDelete()
                                }}
                                className="h-8 w-8 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                aria-label="Delete task"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:flex-nowrap sm:overflow-hidden sm:whitespace-nowrap sm:[mask-image:linear-gradient(to_right,black_0%,black_84%,transparent_100%)]">
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
                        {deadline && (
                            <Badge variant="secondary" className="shrink-0 rounded-full px-2 py-0.5 text-[11px]">
                                <Timer className="h-3 w-3" />
                                {deadline}
                            </Badge>
                        )}
                    </div>

                    {hasDetails ? (
                        <div
                            className={cn(
                                'grid transition-all duration-200 ease-out',
                                isDetailsOpen ? 'mt-2.5 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
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
                            <Label htmlFor={`task-title-${task.id}`}>Title</Label>
                            <Input
                                id={`task-title-${task.id}`}
                                value={formValues.title}
                                onChange={(e) => handleFieldChange('title', e.target.value)}
                                className="h-10 rounded-2xl"
                            />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor={`task-description-${task.id}`}>Description</Label>
                            <textarea
                                id={`task-description-${task.id}`}
                                value={formValues.description}
                                onChange={(e) => handleFieldChange('description', e.target.value)}
                                rows={4}
                                className={cn(
                                    'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 w-full rounded-2xl border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]'
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
                            <Label htmlFor={`task-start-date-${task.id}`}>Start date</Label>
                            <Input
                                id={`task-start-date-${task.id}`}
                                type="datetime-local"
                                value={formValues.startDate}
                                onChange={(e) => handleFieldChange('startDate', e.target.value)}
                                className="h-10 rounded-2xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`task-deadline-${task.id}`}>Deadline</Label>
                            <Input
                                id={`task-deadline-${task.id}`}
                                type="datetime-local"
                                value={formValues.deadline}
                                onChange={(e) => handleFieldChange('deadline', e.target.value)}
                                className="h-10 rounded-2xl"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => void handleSave()}>
                            Save changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
