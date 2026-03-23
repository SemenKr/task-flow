import {TaskPriority, TaskStatus} from '@/common/enums';
import type {DomainTask} from '@/feature/todolists/api/tasksApi.types';
import {describe, expect, it} from 'vitest';
import {createTaskModel} from './createTaskModel';

const task: DomainTask = {
    id: 'task-1',
    todoListId: 'list-1',
    title: 'Initial task',
    description: 'Original description',
    status: TaskStatus.New,
    priority: TaskPriority.Middle,
    startDate: '2025-01-01T10:00:00',
    deadline: '2025-01-02T10:00:00',
    addedDate: '2025-01-01T09:00:00',
    order: 0,
}

describe('createTaskModel', () => {
    it('keeps untouched fields and overrides provided ones', () => {
        const model = createTaskModel(task, {
            title: 'Updated task',
            status: TaskStatus.Completed,
        })

        expect(model).toEqual({
            title: 'Updated task',
            status: TaskStatus.Completed,
            description: 'Original description',
            priority: TaskPriority.Middle,
            startDate: '2025-01-01T10:00:00',
            deadline: '2025-01-02T10:00:00',
        })
    })
})
