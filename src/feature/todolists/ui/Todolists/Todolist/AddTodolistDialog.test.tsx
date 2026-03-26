import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {Button} from '@/common/components/ui/button';
import {AddTodolistDialog} from './AddTodolistDialog';

describe('AddTodolistDialog', () => {
    it('creates a list from the dialog', async () => {
        const user = userEvent.setup()
        const onAddTodolist = vi.fn(async () => ({}))

        render(
            <AddTodolistDialog
                onAddTodolist={onAddTodolist}
                trigger={<Button>Create</Button>}
            />,
        )

        await user.click(screen.getByRole('button', {name: 'Create'}))
        await user.type(screen.getByPlaceholderText('Example: Product launch checklist'), 'Release board')
        await user.click(screen.getByRole('button', {name: 'Create list'}))

        await waitFor(() => {
            expect(onAddTodolist).toHaveBeenCalledWith('Release board')
        })
    })

    it('keeps submit disabled for empty input', async () => {
        const user = userEvent.setup()
        const onAddTodolist = vi.fn()

        render(
            <AddTodolistDialog
                onAddTodolist={onAddTodolist}
                trigger={<Button>Create</Button>}
            />,
        )

        await user.click(screen.getByRole('button', {name: 'Create'}))

        expect(screen.getByRole('button', {name: 'Create list'})).toBeDisabled()
    })
})
