import {Input} from '@/common/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/common/components/ui/select';
import {Search} from 'lucide-react';
import {LIST_SORT_OPTIONS} from '../model/constants';
import type {ListSortValue} from '../model/types';

type TodolistsSidebarSortControlsProps = {
    searchValue: string
    onSearchValueChange: (value: string) => void
    sortValue: ListSortValue
    onSortValueChange: (value: ListSortValue) => void
}

export const TodolistsSidebarSortControls = ({
    searchValue,
    onSearchValueChange,
    sortValue,
    onSortValueChange,
}: TodolistsSidebarSortControlsProps) => (
    <div className="space-y-3">
        <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={searchValue}
                onChange={(event) => onSearchValueChange(event.target.value)}
                placeholder="Find a list"
                className="h-10 rounded-2xl pl-9 text-sm"
                aria-label="Search lists"
            />
        </div>

        <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Sort</span>
            <Select value={sortValue} onValueChange={onSortValueChange}>
                <SelectTrigger size="sm" className="w-36 rounded-xl">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {LIST_SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    </div>
)
