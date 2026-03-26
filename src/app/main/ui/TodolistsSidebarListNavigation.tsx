import {DragEvent, memo} from 'react';
import {cn} from '@/common/lib/utils';
import {ChevronRight, GripVertical} from 'lucide-react';
import type {SidebarListNavigationModel} from '../model/types';

type TodolistsSidebarListNavigationSummaryProps = {
    listCount: number
}

export const TodolistsSidebarListNavigationSummary = memo(({
    listCount,
}: TodolistsSidebarListNavigationSummaryProps) => (
    <div>
        <p className="text-sm font-medium text-foreground">Navigate</p>
        <p className="text-xs text-muted-foreground">{listCount} lists</p>
    </div>
))

type TodolistsSidebarListNavigationContentProps = {
    navigation: SidebarListNavigationModel
}

export const TodolistsSidebarListNavigationContent = memo(({
    navigation: {
        dragListsEnabled,
        displayTodolists,
        selectedListId,
        tasksStatsByListId,
        draggedListId,
        dragOverListId,
        onSelectList,
        onListDragStart,
        onListDragEnter,
        onListDrop,
        onListDragEnd,
        showDragHandle,
    },
}: TodolistsSidebarListNavigationContentProps) => (
    displayTodolists.length ? (
        <div className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
            {displayTodolists.map((list) => {
                const listStats = tasksStatsByListId[list.id]
                const isDraggable = dragListsEnabled && showDragHandle
                const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
                    if (!isDraggable) return

                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', list.id)
                    onListDragStart(list.id)
                }

                return (
                    <div
                        key={list.id}
                        draggable={isDraggable}
                        onDragStart={isDraggable ? handleDragStart : undefined}
                        onDragEnter={dragListsEnabled ? () => onListDragEnter(list.id) : undefined}
                        onDragOver={dragListsEnabled ? (event) => event.preventDefault() : undefined}
                        onDrop={dragListsEnabled ? () => void onListDrop(list.id) : undefined}
                        onDragEnd={isDraggable ? onListDragEnd : undefined}
                        className={cn(
                            'flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors',
                            isDraggable && 'cursor-grab active:cursor-grabbing',
                            selectedListId === list.id
                                ? 'border-primary/35 bg-primary/8 shadow-[0_14px_30px_-24px_rgba(37,99,235,0.55)]'
                                : 'border-border/40 bg-card/70 hover:bg-muted/30',
                            draggedListId === list.id && 'opacity-60',
                            dragOverListId === list.id && draggedListId !== list.id && 'ring-1 ring-primary/20',
                        )}
                    >
                        {isDraggable ? (
                            <span
                                className="shrink-0 rounded-full p-1 text-muted-foreground"
                                aria-hidden="true"
                            >
                                <GripVertical className="h-4 w-4" />
                            </span>
                        ) : null}

                        <button
                            type="button"
                            onClick={() => onSelectList(list.id)}
                            className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            aria-label={`Open list ${list.title}`}
                            aria-current={selectedListId === list.id ? 'true' : undefined}
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{list.title}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {typeof listStats?.matched === 'number'
                                        ? `${listStats.matched}/${listStats.total} tasks`
                                        : selectedListId === list.id
                                            ? 'Active'
                                            : 'Open'}
                                </p>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </button>
                    </div>
                )
            })}
        </div>
    ) : (
        <div className="rounded-2xl border border-dashed border-border/40 bg-card/60 px-3 py-4 text-sm text-muted-foreground">
            No lists match your search.
        </div>
    )
))

type TodolistsSidebarListNavigationProps = {
    navigation: SidebarListNavigationModel
}

export const TodolistsSidebarListNavigation = memo(({
    navigation,
}: TodolistsSidebarListNavigationProps) => (
    <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
            <TodolistsSidebarListNavigationSummary listCount={navigation.displayTodolists.length} />
            {navigation.reorderHelperText ? (
                <p className="max-w-[12rem] text-right text-[11px] text-muted-foreground">
                    {navigation.reorderHelperText}
                </p>
            ) : null}
        </div>

        <TodolistsSidebarListNavigationContent navigation={navigation} />
    </section>
))
