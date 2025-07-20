"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { tools } from '@/lib/tools-data'

interface ToolMentionDropdownProps {
    query: string;
    onSelectTool: (toolName: string) => void;
    position: { top: number; left: number } | null;
    visible: boolean;
}

export function ToolMentionDropdown({
    query,
    onSelectTool,
    position,
    visible
}: ToolMentionDropdownProps) {
    const [filteredTools, setFilteredTools] = useState(tools)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Filter tools based on query
    useEffect(() => {
        if (!query) {
            setFilteredTools(tools)
            return
        }

        const filtered = tools.filter(tool =>
            tool.name.toLowerCase().includes(query.toLowerCase())
        )
        setFilteredTools(filtered)
        setSelectedIndex(0)
    }, [query])

    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!visible) return

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(prev => (prev + 1) % filteredTools.length)
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(prev => (prev - 1 + filteredTools.length) % filteredTools.length)
                break
            case 'Enter':
                e.preventDefault()
                if (filteredTools[selectedIndex]) {
                    onSelectTool(filteredTools[selectedIndex].name)
                }
                break
            case 'Escape':
                e.preventDefault()
                onSelectTool('')
                break
        }
    }

    // Add and remove keyboard event listeners
    useEffect(() => {
        if (visible) {
            window.addEventListener('keydown', handleKeyDown)
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [visible, selectedIndex, filteredTools])

    if (!visible || !position) return null

    return (
        <AnimatePresence>
            <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                style={{
                    position: 'absolute',
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                    zIndex: 50
                }}
                className="bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-lg w-64 max-h-80 overflow-y-auto"
            >
                {filteredTools.length > 0 ? (
                    <div className="py-1">
                        <div className="px-3 py-2 text-xs text-muted-foreground font-medium">
                            Tools
                        </div>
                        {filteredTools.map((tool, index) => (
                            <motion.div
                                key={tool.name}
                                onClick={() => onSelectTool(tool.name)}
                                className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${index === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                                    }`}
                                whileHover={{ backgroundColor: 'rgba(var(--accent), 0.5)' }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex-shrink-0 text-primary">
                                    <tool.icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium">{tool.name}</div>
                                    <div className="text-xs text-muted-foreground">{tool.description}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                        No tools match "@{query}"
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    )
}