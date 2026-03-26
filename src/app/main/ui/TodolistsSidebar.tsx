import type {SidebarFiltersModel, SidebarListNavigationModel, SidebarStatsModel} from '../model/types';
import {DesktopTodolistsSidebar} from './DesktopTodolistsSidebar';
import {MobileTodolistsSidebar} from './MobileTodolistsSidebar';

type TodolistsSidebarProps = {
    onAddTodolist: (title: string) => Promise<unknown> | unknown
    filters: SidebarFiltersModel
    listNavigation: SidebarListNavigationModel
    stats: SidebarStatsModel
}

export const TodolistsSidebar = (props: TodolistsSidebarProps) => (
    <>
        <MobileTodolistsSidebar
            onAddTodolist={props.onAddTodolist}
            filters={props.filters}
            listNavigation={props.listNavigation}
            stats={props.stats}
        />
        <DesktopTodolistsSidebar
            onAddTodolist={props.onAddTodolist}
            filters={props.filters}
            listNavigation={props.listNavigation}
            stats={props.stats}
        />
    </>
)
