"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
    ChevronDown,
    Bot,
    Zap,
    Globe,
    Sparkles,
    Brain,
    Check,
    Cpu,
    Star
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Model {
    id: string
    name: string
    displayName: string
    provider: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    badge?: string
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
    color?: string
}

const models: Model[] = [
    {
        id: 'ollama-qwen2.5',
        name: 'Qwen2.5 7B',
        displayName: 'Qwen2.5 7B',
        provider: 'Ollama',
        description: 'Fast local model with tools',
        icon: Bot,
        badge: 'Local + Tools',
        badgeVariant: 'secondary',
        color: 'text-blue-500'
    },
    {
        id: 'sarvam-m',
        name: 'Sarvam-M',
        displayName: 'Sarvam-M',
        provider: 'Sarvam.ai',
        description: 'Multilingual chat (Hindi support)',
        icon: Globe,
        badge: 'Cloud Chat',
        badgeVariant: 'default',
        color: 'text-green-500'
    },
    {
        id: 'ollama-llama3.1',
        name: 'Llama 3.1 8B',
        displayName: 'Llama 3.1 8B',
        provider: 'Ollama',
        description: 'Lightweight with tools',
        icon: Zap,
        badge: 'Local + Tools',
        badgeVariant: 'secondary',
        color: 'text-purple-500'
    },
    {
        id: 'sarvam-2b',
        name: 'Sarvam 2B',
        displayName: 'Sarvam 2B',
        provider: 'Sarvam.ai',
        description: 'Compact for quick responses',
        icon: Sparkles,
        badge: 'Cloud Chat',
        badgeVariant: 'default',
        color: 'text-[#50C878]'
    },
    // GitHub AI Models
    {
        id: 'github-xai-grok-3-mini',
        name: 'Grok 3 Mini',
        displayName: 'Grok 3 Mini',
        provider: 'GitHub AI',
        description: 'Smaller version of Grok-3 with tools',
        icon: Sparkles,
        badge: 'GitHub + Tools',
        badgeVariant: 'secondary',
        color: 'text-orange-500'
    },
    {
        id: 'github-openai-gpt-4.1',
        name: 'GPT-4.1',
        displayName: 'GPT-4.1',
        provider: 'GitHub AI',
        description: 'OpenAI\'s GPT-4.1 with tools',
        icon: Brain,
        badge: 'GitHub + Tools',
        badgeVariant: 'secondary',
        color: 'text-blue-600'
    },
    {
        id: 'github-openai-gpt-4.1-nano',
        name: 'GPT-4.1 Nano',
        displayName: 'GPT-4.1 Nano',
        provider: 'GitHub AI',
        description: 'Smallest version of GPT-4.1',
        icon: Zap,
        badge: 'GitHub + Tools',
        badgeVariant: 'secondary',
        color: 'text-cyan-500'
    },
    {
        id: 'github-xai-grok-3',
        name: 'Grok 3',
        displayName: 'Grok 3',
        provider: 'GitHub AI',
        description: 'Full version of Grok-3 with tools',
        icon: Bot,
        badge: 'GitHub + Tools',
        badgeVariant: 'secondary',
        color: 'text-red-500'
    },
    {
        id: 'github-openai-gpt-4.1-mini',
        name: 'GPT-4.1 Mini',
        displayName: 'GPT-4.1 Mini',
        provider: 'GitHub AI',
        description: 'Mini version of GPT-4.1',
        icon: Zap,
        badge: 'GitHub + Tools',
        badgeVariant: 'secondary',
        color: 'text-indigo-500'
    }
]

interface InlineModelSelectorProps {
    selectedModel: string
    onModelChange: (modelId: string) => void
    className?: string
    compact?: boolean
}

export function InlineModelSelector({
    selectedModel,
    onModelChange,
    className,
    compact = false
}: InlineModelSelectorProps) {
    const currentModel = models.find(m => m.id === selectedModel) || models[0]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-7 px-2.5 text-sm font-medium hover:bg-accent/50 border-0 rounded-lg transition-all duration-200",
                        "bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                        "flex items-center gap-1.5",
                        className
                    )}
                >
                    <currentModel.icon className={cn("h-3.5 w-3.5", currentModel.color)} />
                    {!compact && (
                        <span className="ml-1.5 hidden sm:inline max-w-20 truncate font-medium">
                            {currentModel.displayName}
                        </span>
                    )}
                    <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                className="w-72 max-w-[90vw] max-h-[70vh] overflow-y-auto bg-background/95 backdrop-blur-md border border-border/50"
                sideOffset={8}
            >
                <DropdownMenuLabel className="flex items-center gap-2 text-foreground">
                    <Brain className="h-4 w-4" style={{ color: '#50C878' }} />
                    Select AI Model
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />

                <DropdownMenuLabel className="text-xs text-muted-foreground">Local Models</DropdownMenuLabel>
                {models.filter(model => model.provider === 'Ollama').map((model) => (
                    <DropdownMenuItem
                        key={model.id}
                        onClick={() => onModelChange(model.id)}
                        className={cn(
                            "flex items-start gap-2.5 p-2 cursor-pointer hover:bg-accent/50 transition-colors",
                            model.id === selectedModel && "bg-[#50C878]/10"
                        )}
                    >
                        <model.icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", model.color)} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-medium text-sm text-foreground">
                                    {model.name}
                                </span>
                                {model.badge && (
                                    <Badge
                                        variant={model.badgeVariant}
                                        className="text-xs px-1.5 py-0.5"
                                    >
                                        {model.badge}
                                    </Badge>
                                )}
                                {model.id === selectedModel && (
                                    <Check className="w-3.5 h-3.5 ml-auto" style={{ color: '#50C878' }} />
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {model.description}
                            </div>
                        </div>
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Cloud Models</DropdownMenuLabel>
                {models.filter(model => model.provider === 'Sarvam.ai').map((model) => (
                    <DropdownMenuItem
                        key={model.id}
                        onClick={() => onModelChange(model.id)}
                        className={cn(
                            "flex items-start gap-2.5 p-2 cursor-pointer hover:bg-accent/50 transition-colors",
                            model.id === selectedModel && "bg-[#50C878]/10"
                        )}
                    >
                        <model.icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", model.color)} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-medium text-sm text-foreground">
                                    {model.name}
                                </span>
                                {model.badge && (
                                    <Badge
                                        variant={model.badgeVariant}
                                        className="text-xs px-1.5 py-0.5"
                                    >
                                        {model.badge}
                                    </Badge>
                                )}
                                {model.id === selectedModel && (
                                    <Check className="w-3.5 h-3.5 ml-auto" style={{ color: '#50C878' }} />
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {model.description}
                            </div>
                        </div>
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuLabel className="text-xs text-muted-foreground">GitHub AI Models</DropdownMenuLabel>
                {models.filter(model => model.provider === 'GitHub AI').map((model) => (
                    <DropdownMenuItem
                        key={model.id}
                        onClick={() => onModelChange(model.id)}
                        className={cn(
                            "flex items-start gap-2.5 p-2 cursor-pointer hover:bg-accent/50 transition-colors",
                            model.id === selectedModel && "bg-[#50C878]/10"
                        )}
                    >
                        <model.icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", model.color)} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-medium text-sm text-foreground">
                                    {model.name}
                                </span>
                                {model.badge && (
                                    <Badge
                                        variant={model.badgeVariant}
                                        className="text-xs px-1.5 py-0.5"
                                    >
                                        {model.badge}
                                    </Badge>
                                )}
                                {model.id === selectedModel && (
                                    <Check className="w-3.5 h-3.5 ml-auto" style={{ color: '#50C878' }} />
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {model.description}
                            </div>
                        </div>
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator className="bg-border/50" />
                <div className="p-2.5 text-xs text-muted-foreground bg-muted/20">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        <span>Local models run on your device</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span>Cloud models require API keys</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        <span>GitHub AI models support tools</span>
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}