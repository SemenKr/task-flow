import {memo} from 'react';
import {Card, CardContent} from '@/common/components/ui/card';
import type {SidebarFiltersModel, SidebarListNavigationModel, SidebarStatsModel} from '@/feature/todolists/model/types';
import {DesktopTodolistsSidebarTaskFilters} from './TodolistsSidebarTaskFilters';
import {TodolistsSidebarCreateAction} from './TodolistsSidebarCreateAction';
import {TodolistsSidebarListNavigation} from './TodolistsSidebarListNavigation';
import {TodolistsSidebarSortControls} from './TodolistsSidebarSortControls';
import {TodolistsSidebarStats} from './TodolistsSidebarStats';

type DesktopTodolistsSidebarProps = {
    onAddTodolist: (title: string) => Promise<unknown> | unknown
    filters: SidebarFiltersModel
    listNavigation: SidebarListNavigationModel
    stats: SidebarStatsModel
}

export const DesktopTodolistsSidebar = memo(({
    onAddTodolist,
    filters,
    listNavigation,
    stats,
}: DesktopTodolistsSidebarProps) => (
    <aside className="hidden animate-fade-up lg:sticky lg:top-22 lg:block lg:self-start">
        <Card className="overflow-hidden border-border/50 bg-[linear-gradient(180deg,rgba(59,130,246,0.05),transparent_24%),var(--color-card)] shadow-[0_24px_70px_-64px_rgba(15,23,42,0.8)]">
            <CardContent className="space-y-5 p-4">
                <TodolistsSidebarCreateAction onAddTodolist={onAddTodolist} />
                <TodolistsSidebarSortControls
                    searchValue={listNavigation.searchValue}
                    onSearchValueChange={listNavigation.onSearchValueChange}
                    sortValue={listNavigation.sortValue}
                    onSortValueChange={listNavigation.onSortValueChange}
                />
                <TodolistsSidebarListNavigation navigation={listNavigation} />
                <DesktopTodolistsSidebarTaskFilters filters={filters} />
                <TodolistsSidebarStats stats={stats.aggregatedTaskStats} hiddenOnMobile />
            </CardContent>
        </Card>
    </aside>
))
