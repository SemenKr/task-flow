import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {TodolistsSidebarListNavigation} from './TodolistsSidebarListNavigation';
import type {SidebarListNavigationModel} from '../model/types';

const createNavigationModel = (overrides: Partial<SidebarListNavigationModel> = {}): SidebarListNavigationModel => ({
    searchValue: '',
    onSearchValueChange: vi.fn(),
    sortValue: 'custom',
    onSortValueChange: vi.fn(),
    isReorderingLists: false,
    dragListsEnabled: true,
    displayTodolists: [
        {id: 'list-1', title: 'Product'},
        {id: 'list-2', title: 'Marketing'},
    ],
    selectedListId: 'list-1',
    tasksStatsByListId: {
        'list-1': {matched: 5, total: 8, completed: 3, overdue: 1, today: 2},
        'list-2': {matched: 2, total: 4, completed: 1, overdue: 0, today: 0},
    },
    draggedListId: null,
    dragOverListId: null,
    onSelectList: vi.fn(),
    onListDragStart: vi.fn(),
    onListDragEnter: vi.fn(),
    onListDrop: vi.fn(async () => {}),
    onListDragEnd: vi.fn(),
    reorderHelperText: 'Drag lists to change order.',
    showDragHandle: true,
    ...overrides,
})

describe('TodolistsSidebarListNavigation', () => {
    it('renders lists, helper text and selects a list', async () => {
        const user = userEvent.setup()
        const navigation = createNavigationModel()

        render(<TodolistsSidebarListNavigation navigation={navigation} />)

        expect(screen.getByText('Drag lists to change order.')).toBeInTheDocument()
        expect(screen.getByText('5/8 tasks')).toBeInTheDocument()

        await user.click(screen.getByRole('button', {name: 'Open list Marketing'}))

        expect(navigation.onSelectList).toHaveBeenCalledWith('list-2')
    })

    it('shows empty state when there are no visible lists', () => {
        const navigation = createNavigationModel({
            displayTodolists: [],
            tasksStatsByListId: {},
        })

        render(<TodolistsSidebarListNavigation navigation={navigation} />)

        expect(screen.getByText('No lists match your search.')).toBeInTheDocument()
    })
})
