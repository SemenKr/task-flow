import {Inbox} from 'lucide-react';

type EmptyStateProps = {
    title?: string
    description?: string
    hint?: string
}

export const EmptyState = ({
    title = 'This list is empty',
    description = 'Start adding tasks to see them here and keep the workflow moving.',
    hint = 'Add your first task above.',
}: EmptyStateProps) => {
    return (
        <div className="rounded-[26px] border border-dashed border-border/70 bg-muted/25 px-6 py-10 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Inbox className="h-7 w-7" />
            </div>
            <h3 className="font-display text-2xl">{title}</h3>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                {description}
            </p>
            <div className="mt-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {hint}
            </div>
        </div>
    )
}
