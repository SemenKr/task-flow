import {ToDoListType} from '@/types/types'
import {LayoutDashboard} from 'lucide-react';

type EmptyTodolistsStateProps = {
    onAddTodolist: (title: ToDoListType['title']) => void
}

export const EmptyTodolistsState = ({ onAddTodolist: _onAddTodolist }: EmptyTodolistsStateProps) => {
    return (
        <div className="col-span-full overflow-hidden rounded-[28px] border border-dashed border-border/70 bg-card/65 p-8 text-center shadow-[0_20px_70px_-70px_rgba(15,23,42,0.9)] backdrop-blur sm:p-10">
            <div className="mx-auto max-w-2xl">
                <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[28px] bg-primary/10 text-primary">
                    <LayoutDashboard className="h-8 w-8" />
                </div>
                <h2 className="font-display mt-6 text-3xl sm:text-4xl">No lists yet</h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                    Use the sidebar to create your first list, then add tasks directly inside that list card.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
                    <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5">Remote API sync</span>
                    <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5">Fast filtering</span>
                    <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5">Inline editing</span>
                </div>
            </div>
        </div>
    )
}
