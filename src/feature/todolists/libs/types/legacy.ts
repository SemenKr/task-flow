import type {DomainTask} from '@/feature/todolists/api/tasksApi.types';
import type {DomainTodolist} from '@/feature/todolists/libs/types';

export type ToDoListType = {
    id: string
    title: string
    filter: FilterValueType
}


export type TaskItemType = {
    todolistId: ToDoListType['id']
    task: TaskType
    removeTask: (id: TaskType['id'], todolistId: ToDoListType['id']) => void
    toggleTask: (id: TaskType['id'], isDone: TaskType['isDone'], todolistId: ToDoListType['id']) => void
    onEditTask?: (id: TaskType['id'], newTitle: TaskType['title'], todolistId: ToDoListType['id']) => void
}
export type TaskType = {
    id: string
    title: string
    isDone: boolean
}

export type TasksListType = {
    [todolistId: string]: DomainTask[]
}

export type FilterValueType = 'all' | 'completed' | 'active'

export type FilterButtonsProps = {
    todolist: DomainTodolist
}
