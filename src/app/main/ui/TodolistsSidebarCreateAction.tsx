import {Button} from '@/common/components/ui/button';
import {AddTodolistDialog} from '@/feature/todolists/ui/Todolists/Todolist/AddTodolistDialog';
import {ArrowRight} from 'lucide-react';

type TodolistsSidebarCreateActionProps = {
    onAddTodolist: (title: string) => Promise<unknown> | unknown
}

export const TodolistsSidebarCreateAction = ({onAddTodolist}: TodolistsSidebarCreateActionProps) => (
    <AddTodolistDialog
        onAddTodolist={onAddTodolist}
        showFloatingButton={false}
        trigger={(
            <Button size="lg" className="w-full rounded-2xl">
                New list
                <ArrowRight className="h-4 w-4" />
            </Button>
        )}
    />
)
