import type {DomainTodolist} from '@/feature/todolists/libs/types';
import type {ListSortValue} from '../model/types';

const getTodolistSortValue = (sortValue: ListSortValue, firstList: DomainTodolist, secondList: DomainTodolist) => {
    if (sortValue === 'custom') {
        return 0
    }

    if (sortValue === 'alphabetical') {
        return firstList.title.localeCompare(secondList.title)
    }

    if (sortValue === 'oldest') {
        return new Date(firstList.addedDate).getTime() - new Date(secondList.addedDate).getTime()
    }

    return new Date(secondList.addedDate).getTime() - new Date(firstList.addedDate).getTime()
}

export const normalizeListSearchValue = (searchValue: string) => searchValue.trim().toLowerCase()

export const hasPendingOptimisticTodolists = (todolists: DomainTodolist[] | undefined) => (
    Boolean(todolists?.some((list) => list.entityStatus === 'loading'))
)

export const canReorderTodolists = (
    sortValue: ListSortValue,
    normalizedSearchValue: string,
    isReorderingLists: boolean,
    hasPendingOptimisticTodolist: boolean,
) => (
    sortValue === 'custom' &&
    normalizedSearchValue.length === 0 &&
    !isReorderingLists &&
    !hasPendingOptimisticTodolist
)

export const filterAndSortTodolists = (
    todolists: DomainTodolist[] | undefined,
    normalizedSearchValue: string,
    sortValue: ListSortValue,
): DomainTodolist[] => {
    return [...(todolists ?? [])]
        .sort((firstList, secondList) => getTodolistSortValue(sortValue, firstList, secondList))
        .filter((list) => list.title.toLowerCase().includes(normalizedSearchValue))
}

export const applyPreviewOrder = (
    todolists: DomainTodolist[],
    orderedListIds: string[] | null,
): DomainTodolist[] => {
    if (!orderedListIds) {
        return todolists
    }

    return [...todolists].sort(
        (firstList, secondList) => orderedListIds.indexOf(firstList.id) - orderedListIds.indexOf(secondList.id),
    )
}

export const getTodolistIdsSignature = (todolists: Array<{ id: string }>) => todolists.map((list) => list.id).join('|')
