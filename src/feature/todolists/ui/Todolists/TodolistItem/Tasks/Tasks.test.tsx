import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {TaskPriority, TaskStatus} from '@/common/enums'
import type {DomainTask} from '@/feature/todolists/api/tasksApi.types'
import type {DomainTodolist, GlobalTaskFilters} from '@/feature/todolists/libs/types'
import {Tasks} from './Tasks'

const {
    getTasksQueryMock,
    reorderTaskMock,
    updateTaskMock,
    removeTaskMock,
} = vi.hoisted(() => ({
    getTasksQueryMock: vi.fn(),
    reorderTaskMock: vi.fn(),
    updateTaskMock: vi.fn(),
    removeTaskMock: vi.fn(),
}))

vi.mock('@/feature/todolists/api/tasksApi', () => ({
    useGetTasksQuery: getTasksQueryMock,
    useReorderTaskMutation: () => [reorderTaskMock],
    useUpdateTaskMutation: () => [updateTaskMock, {isLoading: false}],
    useRemoveTaskMutation: () => [removeTaskMock, {isLoading: false}],
}))

const createTask = (id: string, title: string): DomainTask => ({
    id,
    todoListId: 'list-1',
    title,
    description: null,
    status: TaskStatus.New,
    priority: TaskPriority.Middle,
    startDate: null,
    deadline: null,
    addedDate: '2026-04-01T09:00:00',
    order: 0,
})

const todolist: DomainTodolist = {
    id: 'list-1',
    title: 'Work',
    filter: 'all',
    addedDate: '2026-04-01T09:00:00',
    order: 0,
    entityStatus: 'idle',
}

const activeGlobalFilters: GlobalTaskFilters = {
    query: 'task',
    status: 'all',
    priority: 'all',
    due: 'all',
}

describe('Tasks reorder regression', () => {
    beforeEach(() => {
        getTasksQueryMock.mockReset()
        reorderTaskMock.mockReset()
        updateTaskMock.mockReset()
        removeTaskMock.mockReset()

        getTasksQueryMock.mockReturnValue({
            data: {
                items: [
                    createTask('task-1', 'Task Alpha'),
                    createTask('task-2', 'Task Beta'),
                ],
                totalCount: 2,
            },
            isLoading: false,
        })

        reorderTaskMock.mockReturnValue({
            unwrap: async () => ({}),
        })
    })

    it('disables task reorder affordance and drag behavior when global filters are active', () => {
        const {container} = render(
            <Tasks
                todolist={todolist}
                globalTaskFilters={activeGlobalFilters}
                allowTaskReorder
            />,
        )

        expect(screen.queryByText('Drag tasks to reorder')).not.toBeInTheDocument()
        expect(container.querySelector('[draggable="true"]')).not.toBeInTheDocument()

        const firstTaskCard = screen.getByText('Task Alpha').closest('.rounded-2xl')
        expect(firstTaskCard).toBeInTheDocument()

        if (firstTaskCard) {
            fireEvent.dragStart(firstTaskCard)
            fireEvent.dragEnter(firstTaskCard)
            fireEvent.drop(firstTaskCard)
        }

        expect(container.querySelector('[class*="ring-primary/20"]')).not.toBeInTheDocument()
    })
})

