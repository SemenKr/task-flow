import {memo, useState} from 'react';
import {Button} from '@/common/components/ui/button';
import type {SidebarFiltersModel, SidebarListNavigationModel, SidebarStatsModel} from '../model/types';
import {MobileTodolistsSidebarTaskFilters} from './TodolistsSidebarTaskFilters';
import {TodolistsSidebarCreateAction} from './TodolistsSidebarCreateAction';
import {
    TodolistsSidebarListNavigationContent,
    TodolistsSidebarListNavigationSummary,
} from './TodolistsSidebarListNavigation';
import {TodolistsSidebarSortControls} from './TodolistsSidebarSortControls';
import {TodolistsSidebarStats} from './TodolistsSidebarStats';
import {ChevronDown} from 'lucide-react';
import {cn} from '@/common/lib/utils';

type MobileTodolistsSidebarProps = {
    onAddTodolist: (title: string) => Promise<unknown> | unknown
    filters: SidebarFiltersModel
    listNavigation: SidebarListNavigationModel
    stats: SidebarStatsModel
}

export const MobileTodolistsSidebar = memo(({
    onAddTodolist,
    filters,
    listNavigation,
    stats,
}: MobileTodolistsSidebarProps) => {
    const [isNavigationOpen, setIsNavigationOpen] = useState(false)
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)

    return (
        <section className="space-y-3 lg:hidden">
            <div className="space-y-2 rounded-[1.3rem] border border-border/25 bg-card/92 p-2.5 shadow-[0_10px_22px_-24px_rgba(15,23,42,0.75)]">
                <div className="space-y-1.5">
                    <TodolistsSidebarCreateAction onAddTodolist={onAddTodolist} />
                    <MobileTodolistsSidebarTaskFilters filters={filters} />
                </div>
                <TodolistsSidebarSortControls
                    searchValue={listNavigation.searchValue}
                    onSearchValueChange={listNavigation.onSearchValueChange}
                    sortValue={listNavigation.sortValue}
                    onSortValueChange={listNavigation.onSortValueChange}
                />
            </div>

            <div className="rounded-[1.3rem] border border-border/25 bg-card/92 p-2.5 shadow-[0_10px_22px_-24px_rgba(15,23,42,0.75)]">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAnalyticsOpen((prev) => !prev)}
                    className="flex h-auto w-full items-center justify-between rounded-xl px-2.5 py-2 text-left"
                    aria-expanded={isAnalyticsOpen}
                    aria-controls="mobile-todolists-analytics"
                >
                    <div>
                        <p className="text-sm font-medium text-foreground">Analytics</p>
                        <p className="text-[11px] text-muted-foreground">
                            {stats.aggregatedTaskStats.matched}/{stats.aggregatedTaskStats.total} shown
                        </p>
                    </div>
                    <ChevronDown
                        className={cn(
                            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                            isAnalyticsOpen && 'rotate-180',
                        )}
                    />
                </Button>

                {isAnalyticsOpen ? (
                    <div id="mobile-todolists-analytics" className="pt-2">
                        <TodolistsSidebarStats stats={stats.aggregatedTaskStats} compact />
                    </div>
                ) : null}
            </div>

            <div className="rounded-[1.3rem] border border-border/25 bg-card/92 p-2.5 shadow-[0_10px_22px_-24px_rgba(15,23,42,0.75)]">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsNavigationOpen((prev) => !prev)}
                    className="flex h-auto w-full items-center justify-between rounded-xl px-2.5 py-2 text-left"
                    aria-expanded={isNavigationOpen}
                    aria-controls="mobile-todolists-navigation"
                >
                    <TodolistsSidebarListNavigationSummary listCount={listNavigation.displayTodolists.length} />
                    <ChevronDown
                        className={cn(
                            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                            isNavigationOpen && 'rotate-180',
                        )}
                    />
                </Button>

                {isNavigationOpen ? (
                    <div id="mobile-todolists-navigation" className="pt-2">
                        <TodolistsSidebarListNavigationContent navigation={listNavigation} />
                    </div>
                ) : null}
            </div>
        </section>
    )
})
