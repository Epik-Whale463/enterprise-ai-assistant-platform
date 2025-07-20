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
import {
    Cloud,
    Music,
    Search,
    Pause,
    SkipForward,
    Newspaper,
    BookOpen,
    Volume2,
    Brain,
    Mic,
    FileText,
    Globe,
    Plus,
    Zap
} from 'lucide-react'

interface Tool {
    name: string
    icon: React.ComponentType<{ className?: string }>
    description: string
    category: string
    prompt: string
}

const tools: Tool[] = [
    {
        name: "Weather",
        icon: Cloud,
        description: "Get current weather conditions",
        category: "Information",
        prompt: "What's the weather like in "
    },
    {
        name: "Music Search",
        icon: Music,
        description: "Search and play music",
        category: "Entertainment",
        prompt: "Play "
    },
    {
        name: "Web Search",
        icon: Search,
        description: "Search the web",
        category: "Information",
        prompt: "Search for "
    },
    {
        name: "News",
        icon: Newspaper,
        description: "Get latest headlines",
        category: "Information",
        prompt: "Get news about "
    },
    {
        name: "Wikipedia",
        icon: BookOpen,
        description: "Look up information",
        category: "Knowledge",
        prompt: "Tell me about "
    },
    {
        name: "Sequential Thinking",
        icon: Brain,
        description: "Step-by-step reasoning",
        category: "Analysis",
        prompt: "Think step by step about "
    },
    {
        name: "Lyrics",
        icon: Mic,
        description: "Get song lyrics",
        category: "Entertainment",
        prompt: "Get lyrics for the current song"
    },
    {
        name: "Volume Control",
        icon: Volume2,
        description: "Control audio volume",
        category: "Entertainment",
        prompt: "Set volume to "
    },
    {
        name: "Web Scraping",
        icon: Globe,
        description: "Extract web content",
        category: "Information",
        prompt: "Scrape content from "
    }
]

const categories = [
    { name: "Information", tools: tools.filter(t => t.category === "Information") },
    { name: "Entertainment", tools: tools.filter(t => t.category === "Entertainment") },
    { name: "Knowledge", tools: tools.filter(t => t.category === "Knowledge") },
    { name: "Analysis", tools: tools.filter(t => t.category === "Analysis") }
]

interface ToolsDropdownProps {
    onToolSelect: (prompt: string) => void
    selectedModel?: string
    className?: string
}

export function ToolsDropdown({ onToolSelect, selectedModel, className }: ToolsDropdownProps) {
    const isSarvamModel = selectedModel?.startsWith('sarvam-')

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 hover:bg-accent ${className} ${isSarvamModel ? 'opacity-50' : ''}`}
                    disabled={isSarvamModel}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-80 max-h-96 overflow-y-auto"
                sideOffset={8}
            >
                <DropdownMenuLabel className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    {isSarvamModel ? 'Tools Not Available' : 'Available Tools'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {isSarvamModel ? (
                    <div className="p-4 text-center">
                        <div className="text-sm text-muted-foreground mb-2">
                            🚫 Tools are not supported with Sarvam models
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Switch to an Ollama model (Qwen2.5 or Llama 3.2) to use tools like weather, web search, music control, etc.
                        </div>
                    </div>
                ) : (
                    <>
                        {categories.map((category) => (
                            <div key={category.name}>
                                <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
                                    {category.name}
                                </DropdownMenuLabel>
                                {category.tools.map((tool) => (
                                    <DropdownMenuItem
                                        key={tool.name}
                                        onClick={() => onToolSelect(tool.prompt)}
                                        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent"
                                    >
                                        <tool.icon className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm">{tool.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {tool.description}
                                            </div>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                            </div>
                        ))}

                        <DropdownMenuItem
                            onClick={() => onToolSelect("Show me all available tools and their capabilities")}
                            className="flex items-center gap-2 p-3 cursor-pointer hover:bg-accent border-t"
                        >
                            <FileText className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-sm">View All Tools</span>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}