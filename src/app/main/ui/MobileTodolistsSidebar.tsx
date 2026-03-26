import {memo, useState} from 'react';
import {Button} from '@/common/components/ui/button';
import type {SidebarFiltersModel, SidebarListNavigationModel} from '../model/types';
import {MobileTodolistsSidebarTaskFilters} from './TodolistsSidebarTaskFilters';
import {TodolistsSidebarCreateAction} from './TodolistsSidebarCreateAction';
import {
    TodolistsSidebarListNavigationContent,
    TodolistsSidebarListNavigationSummary,
} from './TodolistsSidebarListNavigation';
import {TodolistsSidebarSortControls} from './TodolistsSidebarSortControls';
import {ChevronDown} from 'lucide-react';
import {cn} from '@/common/lib/utils';

type MobileTodolistsSidebarProps = {
    onAddTodolist: (title: string) => Promise<unknown> | unknown
    filters: SidebarFiltersModel
    listNavigation: SidebarListNavigationModel
}

export const MobileTodolistsSidebar = memo(({
    onAddTodolist,
    filters,
    listNavigation,
}: MobileTodolistsSidebarProps) => {
    const [isNavigationOpen, setIsNavigationOpen] = useState(false)

    return (
        <section className="space-y-4 lg:hidden">
            <div className="space-y-3 rounded-[1.6rem] border border-border/30 bg-card/90 p-3 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.8)]">
                <div className="space-y-2">
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

            <div className="rounded-[1.6rem] border border-border/30 bg-card/90 p-3 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.8)]">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsNavigationOpen((prev) => !prev)}
                    className="flex h-auto w-full items-center justify-between rounded-2xl px-3 py-3 text-left"
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
                    <div id="mobile-todolists-navigation" className="pt-3">
                        <TodolistsSidebarListNavigationContent navigation={listNavigation} />
                    </div>
                ) : null}
            </div>
        </section>
    )
})
