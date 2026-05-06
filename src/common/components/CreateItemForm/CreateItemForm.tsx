import {useState,KeyboardEvent} from 'react';
import {Button, Input} from '@/common/components/ui';
import {Plus} from 'lucide-react';

type CreateItemFormPropsType = {
    onAdd: (title: string) => void;
    placeholder?: string;
    disabled?: boolean;
};

export const CreateItemForm = ({onAdd, placeholder, disabled = false}: CreateItemFormPropsType) => {

    const [value, setValue] = useState("");

    const add = () => {
        if (disabled) return;
        const trimmed = value.trim();
        if (!trimmed) return;
        onAdd(trimmed);
        setValue("");
    };
    const onEnter = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") add();
    };


    return (
        <>
            <div className="flex gap-2">
                <Input
                    placeholder={placeholder ?? "Type something meaningful..."}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={onEnter}
                    disabled={disabled}
                    className="h-10 rounded-2xl text-sm"
                />

                <Button disabled={disabled || !value.trim()} onClick={add} className="h-10 rounded-2xl px-3.5">
                    <Plus className="h-4.5 w-4.5" />
                </Button>
            </div>
        </>
    );
}
