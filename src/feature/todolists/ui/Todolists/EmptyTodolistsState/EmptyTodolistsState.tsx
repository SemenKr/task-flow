import {Button} from '@/common/components/ui/button';
import {AddTodolistDialog} from '@/feature/todolists/ui/Todolists/Todolist/AddTodolistDialog';
import {ArrowRight, LayoutDashboard, Sparkles, Wand2} from 'lucide-react';

type EmptyTodolistsStateProps = {
    onAddTodolist: (title: string) => Promise<unknown> | unknown
    onCreateDemoWorkspace: () => Promise<unknown> | unknown
    isCreatingDemoWorkspace?: boolean
    showOnboarding?: boolean
    onDismissOnboarding?: () => void
}

export const EmptyTodolistsState = ({
    onAddTodolist,
    onCreateDemoWorkspace,
    isCreatingDemoWorkspace = false,
    showOnboarding = false,
    onDismissOnboarding,
}: EmptyTodolistsStateProps) => {
    const quickStartTitle = showOnboarding ? 'Start with a real board in under a minute' : 'No lists yet'
    const quickStartDescription = showOnboarding
        ? 'Create a list from scratch or spin up a demo workspace with ready-made tasks and try the product flow immediately.'
        : 'Create your first list or load a demo workspace to explore filtering, editing, and task stats right away.'

    return (
        <div className="col-span-full overflow-hidden rounded-[28px] border border-dashed border-border/70 bg-card/70 p-8 text-center shadow-[0_20px_70px_-70px_rgba(15,23,42,0.9)] backdrop-blur sm:p-10">
            <div className="mx-auto max-w-3xl">
                <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[28px] bg-primary/10 text-primary">
                    <LayoutDashboard className="h-8 w-8" />
                </div>
                {showOnboarding ? (
                    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        First-run quick start
                    </div>
                ) : null}
                <h2 className="font-display mt-4 text-3xl sm:text-4xl">{quickStartTitle}</h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                    {quickStartDescription}
                </p>

                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <AddTodolistDialog
                        onAddTodolist={onAddTodolist}
                        showFloatingButton={false}
                        trigger={(
                            <Button size="lg" className="min-w-[14rem] rounded-2xl">
                                Create your first list
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}
                    />
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => void onCreateDemoWorkspace()}
                        disabled={isCreatingDemoWorkspace}
                        className="min-w-[14rem] rounded-2xl"
                    >
                        <Wand2 className="h-4 w-4" />
                        {isCreatingDemoWorkspace ? 'Building demo...' : 'Try demo workspace'}
                    </Button>
                </div>

                <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
                    <div className="rounded-3xl border border-border/60 bg-background/75 p-4">
                        <p className="text-sm font-medium text-foreground">Start clean</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Create a focused list and add your own tasks from scratch.
                        </p>
                    </div>
                    <div className="rounded-3xl border border-border/60 bg-background/75 p-4">
                        <p className="text-sm font-medium text-foreground">Load demo data</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            We will create one board with four demo tasks so the UI is immediately interactive.
                        </p>
                    </div>
                    <div className="rounded-3xl border border-border/60 bg-background/75 p-4">
                        <p className="text-sm font-medium text-foreground">Try the flow</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Search, filter, reorder, edit titles, and see task stats update in context.
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
                    <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5">Remote API sync</span>
                    <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5">Fast filtering</span>
                    <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5">Inline editing</span>
                    <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5">Demo seed</span>
                </div>

                {showOnboarding && onDismissOnboarding ? (
                    <div className="mt-6">
                        <Button variant="ghost" size="sm" onClick={onDismissOnboarding} className="rounded-full px-4">
                            Skip intro
                        </Button>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
