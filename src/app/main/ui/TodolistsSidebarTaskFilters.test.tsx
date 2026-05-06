import {act, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {DesktopTodolistsSidebarTaskFilters} from './TodolistsSidebarTaskFilters';
import type {SidebarFiltersModel} from '@/feature/todolists/model/types';

const createFiltersModel = (overrides: Partial<SidebarFiltersModel> = {}): SidebarFiltersModel => ({
    globalTaskFilters: {
        query: '',
        status: 'all',
        priority: 'all',
        due: 'all',
    },
    hasActiveGlobalTaskFilters: false,
    activeFiltersCount: 0,
    matchedTasksCount: 12,
    totalTasksCount: 20,
    onUpdateGlobalTaskFilters: vi.fn(),
    onResetGlobalTaskFilters: vi.fn(),
    ...overrides,
})

describe('DesktopTodolistsSidebarTaskFilters', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('shows result count and debounces search updates', async () => {
        vi.useFakeTimers()
        const filters = createFiltersModel()

        render(<DesktopTodolistsSidebarTaskFilters filters={filters} />)

        expect(screen.getByText('12 of 20 tasks found')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', {name: 'Show'}))
        fireEvent.change(screen.getByLabelText('Search tasks'), {
            target: {value: 'deploy'},
        })

        expect(filters.onUpdateGlobalTaskFilters).not.toHaveBeenCalled()

        await act(async () => {
            vi.advanceTimersByTime(300)
        })

        expect(filters.onUpdateGlobalTaskFilters).toHaveBeenCalledWith({query: 'deploy'})
    })

    it('renders active filter chips and allows reset', async () => {
        const user = userEvent.setup()
        const filters = createFiltersModel({
            globalTaskFilters: {
                query: 'release',
                status: '1',
                priority: '2',
                due: 'today',
            },
            hasActiveGlobalTaskFilters: true,
            activeFiltersCount: 4,
        })

        render(<DesktopTodolistsSidebarTaskFilters filters={filters} />)

        expect(screen.getByText('Search:')).toBeInTheDocument()
        expect(screen.getByText('release')).toBeInTheDocument()
        expect(screen.getByText('Status:')).toBeInTheDocument()
        expect(screen.getByText('In progress')).toBeInTheDocument()
        expect(screen.getByText('Priority:')).toBeInTheDocument()
        expect(screen.getByText('High')).toBeInTheDocument()
        expect(screen.getByText('Due:')).toBeInTheDocument()
        expect(screen.getByText('Today')).toBeInTheDocument()

        await user.click(screen.getByRole('button', {name: 'Reset'}))

        expect(filters.onResetGlobalTaskFilters).toHaveBeenCalled()
    })
})
