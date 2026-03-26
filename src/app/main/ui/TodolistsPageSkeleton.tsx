import {Skeleton} from '@/common/components/ui/skeleton';

const SidebarCardSkeleton = () => (
    <div className="space-y-3 rounded-[1.3rem] border border-border/25 bg-card/92 p-2.5 shadow-[0_10px_22px_-24px_rgba(15,23,42,0.75)] lg:rounded-[1.6rem] lg:border-border/50 lg:p-4 lg:shadow-[0_24px_70px_-64px_rgba(15,23,42,0.8)]">
        <Skeleton className="h-10 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
)

const CardSkeleton = () => (
    <div className="rounded-[24px] border border-border/60 bg-card/92 p-5 shadow-[0_26px_70px_-62px_rgba(15,23,42,0.95)]">
        <div className="space-y-4 border-b border-border/60 pb-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 gap-3">
                    <Skeleton className="h-9 w-9 rounded-2xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3 w-20 rounded-full" />
                        <Skeleton className="h-7 w-3/4 rounded-xl" />
                    </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
            </div>
        </div>

        <div className="space-y-4 pt-5">
            <div className="space-y-3 rounded-[1.35rem] border border-border/60 bg-background/70 p-3">
                <Skeleton className="h-3 w-16 rounded-full" />
                <Skeleton className="h-10 w-full rounded-2xl" />
            </div>
            <div className="space-y-3 rounded-[1.35rem] border border-border/60 bg-background/70 p-3">
                <Skeleton className="h-3 w-14 rounded-full" />
                <Skeleton className="h-9 w-full rounded-2xl" />
            </div>
            <div className="space-y-2 rounded-[1.5rem] border border-border/60 bg-muted/[0.22] p-3">
                <Skeleton className="h-3 w-12 rounded-full" />
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-4/5 rounded-2xl" />
            </div>
        </div>
    </div>
)

export const TodolistsPageSkeleton = () => (
    <main className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-48 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_46%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_30%)]" />
        <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[288px_minmax(0,1fr)] lg:px-8 lg:py-6">
            <aside className="space-y-3 lg:sticky lg:top-22 lg:self-start">
                <div className="space-y-3 lg:hidden">
                    <SidebarCardSkeleton />
                    <SidebarCardSkeleton />
                </div>
                <div className="hidden lg:block">
                    <SidebarCardSkeleton />
                </div>
            </aside>

            <section className="space-y-4">
                <div className="rounded-[28px] border border-border/60 bg-card/75 px-5 py-5 shadow-[0_24px_70px_-64px_rgba(15,23,42,0.85)] backdrop-blur sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="min-w-0 space-y-2">
                            <Skeleton className="h-4 w-12 rounded-full" />
                            <Skeleton className="h-8 w-48 rounded-xl" />
                        </div>
                        <Skeleton className="h-5 w-full max-w-lg rounded-xl" />
                    </div>
                </div>

                <div className="dashboard-grid">
                    {Array.from({length: 3}).map((_, index) => (
                        <CardSkeleton key={index} />
                    ))}
                </div>
            </section>
        </div>
    </main>
)
