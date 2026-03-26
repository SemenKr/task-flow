import type {DomainTodolist} from '@/feature/todolists/libs/types';
import {useEffect, useMemo, useState} from 'react';
import {toast} from 'sonner';
import {applyPreviewOrder, getTodolistIdsSignature} from './todolists';

type ReorderArgs = {
    todolistId: string
    putAfterItemId: string | null
}

type ReorderMutationTrigger = (args: ReorderArgs) => {
    unwrap: () => Promise<unknown>
}

type UseTodolistsReorderParams = {
    enabled: boolean
    todolists: DomainTodolist[]
    reorderTodolist: ReorderMutationTrigger
}

const moveDraggedItem = (listIds: string[], draggedListId: string, targetListId: string) => {
    const nextListIds = [...listIds]
    const draggedIndex = nextListIds.indexOf(draggedListId)
    const targetIndex = nextListIds.indexOf(targetListId)

    if (draggedIndex === -1 || targetIndex === -1) {
        return listIds
    }

    nextListIds.splice(draggedIndex, 1)
    nextListIds.splice(targetIndex, 0, draggedListId)

    return nextListIds
}

export const useTodolistsReorder = ({
    enabled,
    todolists,
    reorderTodolist,
}: UseTodolistsReorderParams) => {
    const [draggedListId, setDraggedListId] = useState<string | null>(null)
    const [dragOverListId, setDragOverListId] = useState<string | null>(null)
    const [orderedListIds, setOrderedListIds] = useState<string[] | null>(null)

    const originalListIds = useMemo(
        () => todolists.map((list) => list.id),
        [todolists],
    )
    const displayTodolists = useMemo(
        () => applyPreviewOrder(todolists, orderedListIds),
        [orderedListIds, todolists],
    )
    const originalListIdsSignature = useMemo(
        () => getTodolistIdsSignature(todolists),
        [todolists],
    )

    useEffect(() => {
        setOrderedListIds(null)
        setDraggedListId(null)
        setDragOverListId(null)
    }, [enabled, todolists])

    const handleListDragStart = (listId: string) => {
        if (!enabled) return

        setDraggedListId(listId)
        setDragOverListId(listId)
        setOrderedListIds((prev) => prev ?? originalListIds)
    }

    const handleListDragEnter = (listId: string) => {
        if (!enabled || !draggedListId || draggedListId === listId) return

        setOrderedListIds((prev) => moveDraggedItem(prev ?? originalListIds, draggedListId, listId))
        setDragOverListId(listId)
    }

    const handleListDrop = async (targetListId: string) => {
        if (!enabled || !draggedListId || !todolists.length) {
            setDraggedListId(null)
            setDragOverListId(null)
            return
        }

        const previewOrderedListIds = orderedListIds ?? moveDraggedItem(originalListIds, draggedListId, targetListId)

        if (!previewOrderedListIds.length) {
            setDraggedListId(null)
            setDragOverListId(null)
            setOrderedListIds(null)
            return
        }

        if (originalListIdsSignature === previewOrderedListIds.join('|')) {
            setDraggedListId(null)
            setDragOverListId(null)
            setOrderedListIds(null)
            return
        }

        const targetIndex = previewOrderedListIds.indexOf(draggedListId)

        if (targetIndex === -1) {
            setDraggedListId(null)
            setDragOverListId(null)
            setOrderedListIds(null)
            return
        }

        const putAfterItemId = targetIndex > 0 ? previewOrderedListIds[targetIndex - 1] : null

        try {
            await reorderTodolist({ todolistId: draggedListId, putAfterItemId }).unwrap()
            toast.success('List order saved')
        } catch (error) {
            toast.error('Failed to save list order')
            console.error('Error reordering lists:', error)
            setOrderedListIds(null)
        } finally {
            setDraggedListId(null)
            setDragOverListId(null)
            setOrderedListIds(null)
        }
    }

    const handleListDragEnd = () => {
        setDraggedListId(null)
        setDragOverListId(null)
    }

    return {
        displayTodolists,
        draggedListId,
        dragOverListId,
        handleListDragStart,
        handleListDragEnter,
        handleListDrop,
        handleListDragEnd,
    }
}
