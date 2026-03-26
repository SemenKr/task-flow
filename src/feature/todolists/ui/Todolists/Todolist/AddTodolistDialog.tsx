import {type ReactNode, useState} from 'react';
import {Plus} from 'lucide-react';
import {Button} from '@/common/components/ui/button';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from '@/common/components/ui/dialog';
import {Input} from '@/common/components/ui/input';
import {cn} from '@/common/lib/utils';
import {toast} from 'sonner';

interface AddTodolistDialogProps {
    onAddTodolist: (title: string) => Promise<unknown> | unknown
    trigger?: ReactNode
    showFloatingButton?: boolean
    floatingButtonClassName?: string
}

export const AddTodolistDialog = ({
    onAddTodolist,
    trigger,
    showFloatingButton = false,
    floatingButtonClassName,
}: AddTodolistDialogProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleClose = () => {
        if (!isSubmitting) {
            setIsOpen(false)
            setInputValue('')
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!open && isSubmitting) {
            return
        }
        setIsOpen(open)
        if (!open) {
            setInputValue('')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const trimmedValue = inputValue.trim()

        if (!trimmedValue) {
            toast.error('Enter a list name')
            return
        }

        if (trimmedValue.length < 2) {
            toast.error('List name must be at least 2 characters long')
            return
        }

        if (trimmedValue.length > 50) {
            toast.error('List name is too long (max 50 characters)')
            return
        }

        setIsSubmitting(true)

        try {
            await onAddTodolist(trimmedValue)
            toast.success(`List "${trimmedValue}" created`)
            handleClose()
        } catch (error) {
            toast.error('Failed to create list')
            console.error('Error adding todolist:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }

        if (e.key === 'Escape') {
            handleClose()
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (value.length <= 50) {
            setInputValue(value)
        }
    }

    const charactersLeft = 50 - inputValue.length

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
            {showFloatingButton ? (
                <DialogTrigger asChild>
                    <Button
                        size="icon-lg"
                        className={cn(
                            'fixed right-5 bottom-5 z-50 size-14 rounded-full shadow-[0_20px_60px_-20px_rgba(15,23,42,0.45)] transition-transform duration-300 hover:-translate-y-1 sm:right-8 sm:bottom-8',
                            floatingButtonClassName,
                        )}
                    >
                        <Plus className="h-6 w-6" />
                        <span className="sr-only">Create a new list</span>
                    </Button>
                </DialogTrigger>
            ) : null}

            <DialogContent className="overflow-hidden border-border/60 p-0 sm:max-w-lg">
                <div className="border-b border-border/60 bg-muted/35 px-6 py-5">
                    <DialogHeader className="gap-3 text-left">
                        <DialogTitle className="flex items-center gap-2 text-2xl font-semibold">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                                <Plus className="h-5 w-5" />
                            </span>
                            Create a new list
                        </DialogTitle>
                        <DialogDescription className="max-w-md text-sm leading-6">
                            Start a focused list for personal tasks, sprint work, or feature planning.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Input
                                placeholder="Example: Product launch checklist"
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyPress}
                                className="h-12 text-base"
                                disabled={isSubmitting}
                                autoFocus
                            />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Short, specific names work best.</span>
                                <span>{charactersLeft} characters left</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                            Keep separate lists for focused areas of work. Add tasks inside each list card after creation.
                        </div>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!inputValue.trim() || isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Create list'}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
