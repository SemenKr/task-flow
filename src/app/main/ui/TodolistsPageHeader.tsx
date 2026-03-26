type TodolistsPageHeaderProps = {
    hasActiveTaskFilters: boolean
}

export const TodolistsPageHeader = ({hasActiveTaskFilters}: TodolistsPageHeaderProps) => (
    <div className="rounded-[28px] border border-border/60 bg-card/75 px-5 py-5 shadow-[0_24px_70px_-64px_rgba(15,23,42,0.85)] backdrop-blur sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Lists</p>
                <h1 className="font-display text-2xl leading-tight sm:text-3xl [overflow-wrap:anywhere]">
                    Your task boards
                </h1>
            </div>
            <p className="max-w-lg min-w-0 text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                {hasActiveTaskFilters
                    ? 'Task filters are active and synced with the URL.'
                    : 'Create a list, pick a board, and work inside it.'}
            </p>
        </div>
    </div>
)
