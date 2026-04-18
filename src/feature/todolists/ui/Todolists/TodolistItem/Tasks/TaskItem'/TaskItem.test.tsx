import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {TaskPriority, TaskStatus} from '@/common/enums';
import type {DomainTask} from '@/feature/todolists/api/tasksApi.types';
import {getTaskActionErrorMessage} from '../taskActionErrorMessage';
import {TaskItem} from './TaskItem';

const {
    updateTaskMock,
    removeTaskMock,
    toastSuccessMock,
    toastErrorMock,
} = vi.hoisted(() => ({
    updateTaskMock: vi.fn(),
    removeTaskMock: vi.fn(),
    toastSuccessMock: vi.fn(),
    toastErrorMock: vi.fn(),
}))

vi.mock('sonner', () => ({
    toast: {
        success: toastSuccessMock,
        error: toastErrorMock,
    },
}))

vi.mock('@/feature/todolists/api/tasksApi', () => ({
    useUpdateTaskMutation: () => [updateTaskMock, {isLoading: false}],
    useRemoveTaskMutation: () => [removeTaskMock, {isLoading: false}],
}))

const createTask = (): DomainTask => ({
    id: 'task-1',
    todoListId: 'list-1',
    title: 'Task title that should stay readable on narrow mobile layouts',
    description: 'Task details',
    status: TaskStatus.InProgress,
    priority: TaskPriority.Hi,
    startDate: '2026-04-10T10:00:00',
    deadline: '2026-04-20T10:00:00',
    addedDate: '2026-04-01T09:00:00',
    order: 0,
})

describe('TaskItem 320px regression', () => {
    beforeEach(() => {
        updateTaskMock.mockReset()
        removeTaskMock.mockReset()
        toastSuccessMock.mockReset()
        toastErrorMock.mockReset()

        updateTaskMock.mockReturnValue({
            unwrap: async () => ({}),
        })
        removeTaskMock.mockReturnValue({
            unwrap: async () => ({}),
        })
    })

    it('keeps metadata row wrappable on mobile and clamps only from sm breakpoint', () => {
        render(
            <TaskItem
                todolistId="list-1"
                task={createTask()}
            />,
        )

        const statusBadge = screen.getByText('In progress').closest('[data-slot="badge"]')
        const metadataRow = statusBadge?.parentElement

        expect(metadataRow).toBeInTheDocument()
        expect(metadataRow).toHaveClass('flex-wrap')
        expect(metadataRow).toHaveClass('sm:flex-nowrap')
        expect(metadataRow).toHaveClass('sm:overflow-hidden')
        expect(metadataRow).toHaveClass('sm:whitespace-nowrap')
    })

    it('shows success feedback after successful delete confirmation', async () => {
        const user = userEvent.setup()

        render(
            <TaskItem
                todolistId="list-1"
                task={createTask()}
            />,
        )

        await user.click(screen.getByRole('button', {name: 'Delete task'}))
        await user.click(screen.getByRole('button', {name: 'Delete'}))

        await waitFor(() => {
            expect(removeTaskMock).toHaveBeenCalledWith({taskId: 'task-1', todolistId: 'list-1'})
            expect(toastSuccessMock).toHaveBeenCalledWith('Task deleted')
        })
    })

    it('shows error feedback and no false success when delete fails', async () => {
        const user = userEvent.setup()
        const apiError = {status: 500}

        removeTaskMock.mockReturnValueOnce({
            unwrap: async () => {
                throw apiError
            },
        })

        render(
            <TaskItem
                todolistId="list-1"
                task={createTask()}
            />,
        )

        await user.click(screen.getByRole('button', {name: 'Delete task'}))
        await user.click(screen.getByRole('button', {name: 'Delete'}))

        await waitFor(() => {
            expect(toastSuccessMock).not.toHaveBeenCalled()
            expect(toastErrorMock).toHaveBeenCalledWith(getTaskActionErrorMessage('delete', apiError))
        })
    })
})
