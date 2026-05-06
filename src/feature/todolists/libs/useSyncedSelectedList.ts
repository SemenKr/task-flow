import type {DomainTodolist} from '@/feature/todolists/libs/types';
import {useEffect} from 'react';

type UseSyncedSelectedListParams = {
    todolists: DomainTodolist[]
    selectedListId: string | null
    setSelectedListId: (listId: string | null) => void
}

export const useSyncedSelectedList = ({
    todolists,
    selectedListId,
    setSelectedListId,
}: UseSyncedSelectedListParams) => {
    useEffect(() => {
        if (!todolists.length) {
            setSelectedListId(null)
            return
        }

        const hasSelected = todolists.some((list) => list.id === selectedListId)

        if (!hasSelected) {
            setSelectedListId(todolists[0].id)
        }
    }, [selectedListId, setSelectedListId, todolists])
}
