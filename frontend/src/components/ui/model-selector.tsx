import React, { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { models, categories, getDefaultModel } from '@/lib/models-data'

interface ModelSelectorProps {
    onModelSelect: (modelId: string) => void
    className?: string
}

export function ModelSelector({ onModelSelect, className }: ModelSelectorProps) {
    const [open, setOpen] = useState(false)
    const [selectedModel, setSelectedModel] = useState(getDefaultModel())

    const handleSelectModel = (modelId: string) => {
        const model = models.find(m => m.id === modelId)
        if (model) {
            setSelectedModel(model)
            onModelSelect(model.id)
            setOpen(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                >
                    <div className="flex items-center gap-2 truncate">
                        {selectedModel.icon && <selectedModel.icon className="h-4 w-4" />}
                        <span className="truncate">{selectedModel.name}</span>
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search models..." />
                    <CommandList>
                        <CommandEmpty>No model found.</CommandEmpty>
                        {categories.map((category) => (
                            <CommandGroup key={category.name} heading={category.name}>
                                {category.models.map((model) => (
                                    <CommandItem
                                        key={model.id}
                                        onSelect={() => handleSelectModel(model.id)}
                                        className="flex items-center gap-2"
                                    >
                                        {model.icon && <model.icon className="h-4 w-4" />}
                                        <div className="flex flex-col">
                                            <span>{model.name}</span>
                                            <span className="text-xs text-muted-foreground truncate">
                                                {model.description}
                                            </span>
                                        </div>
                                        {selectedModel.id === model.id && (
                                            <Check className="ml-auto h-4 w-4" />
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}