import {useAppDispatch} from '@/common/hooks/useAppDispatch';
import {Button} from '@/common/components/ui';
import {todolistsApi} from '@/feature/todolists/api/todolistsApi';
import type {FilterValues} from '@/feature/todolists/libs/types';
import {FilterButtonsProps} from '@/types/types'

export const FilterButtons = ({ todolist }: FilterButtonsProps) => {
    const { id, filter } = todolist
    const dispatch = useAppDispatch()

    const changeFilter = (filter: FilterValues) => {
        dispatch(
            todolistsApi.util.updateQueryData("getTodolists", undefined, (state) => {
                const todolist = state.find((todolist) => todolist.id === id)
                if (todolist) {
                    todolist.filter = filter
                }
            }),
        )
    }


    return (
        <div className="flex flex-wrap gap-1.5 rounded-2xl bg-muted/55 p-1">
            <Button
                size="sm"
                variant={filter === "all" ? "outline" : "ghost"}
                className="rounded-xl px-3"
                onClick={() => changeFilter("all")}
            >
                All
            </Button>
            <Button
                size="sm"
                variant={filter === "active" ? "outline" : "ghost"}
                className="rounded-xl px-3"
                onClick={() => changeFilter("active")}
            >
                Active
            </Button>
            <Button
                size="sm"
                variant={filter === "completed" ? "outline" : "ghost"}
                className="rounded-xl px-3"
                onClick={() => changeFilter("completed")}
            >
                Completed
            </Button>
        </div>
    )
}
