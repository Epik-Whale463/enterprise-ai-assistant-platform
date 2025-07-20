"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Textarea, TextareaProps } from '@/components/ui/textarea'
import { ToolMentionDropdown } from '@/components/ui/tool-mention-dropdown'
import styles from './mention-styles.module.css'

interface MentionTextareaProps extends Omit<TextareaProps, 'onChange'> {
    onChange: (value: string) => void;
    onToolSelect?: (toolName: string) => void;
}

export function MentionTextarea({
    value,
    onChange,
    onToolSelect,
    ...props
}: MentionTextareaProps) {
    const [mentionState, setMentionState] = useState({
        isActive: false,
        query: '',
        position: null as { top: number; left: number } | null
    })
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Handle input changes and detect @ mentions
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        onChange(newValue)

        // Check if we're starting a mention
        if (newValue === '@') {
            activateMention(e.target)
        }
        // Check if we're in an active mention and update the query
        else if (mentionState.isActive) {
            const match = newValue.match(/@([^@\s]*)$/)
            if (match) {
                setMentionState(prev => ({
                    ...prev,
                    query: match[1]
                }))
            } else {
                // If no match, we've moved away from the mention
                setMentionState({
                    isActive: false,
                    query: '',
                    position: null
                })
            }
        }
    }

    // Handle key presses
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // If we're in a mention and press space, deactivate the mention
        if (mentionState.isActive && e.key === ' ') {
            setMentionState({
                isActive: false,
                query: '',
                position: null
            })
        }

        // If we press @ anywhere, activate mention
        if (e.key === '@') {
            activateMention(e.currentTarget)
        }

        // Pass other keys to parent handler
        props.onKeyDown?.(e)
    }

    // Activate mention mode and position the dropdown
    const activateMention = (textarea: HTMLTextAreaElement) => {
        // Get cursor position for dropdown placement
        const cursorPosition = textarea.selectionStart
        const textBeforeCursor = textarea.value.substring(0, cursorPosition)

        // Calculate position based on cursor
        const cursorCoords = getCaretCoordinates(textarea, cursorPosition)

        setMentionState({
            isActive: true,
            query: '',
            position: {
                top: cursorCoords.top + cursorCoords.height,
                left: cursorCoords.left
            }
        })
    }

    // Handle tool selection from dropdown
    const handleSelectTool = (toolName: string) => {
        if (!textareaRef.current) return

        if (toolName) {
            // Replace the @query with the selected @toolName
            const cursorPos = textareaRef.current.selectionStart
            const textBeforeCursor = textareaRef.current.value.substring(0, cursorPos)
            const lastAtPos = textBeforeCursor.lastIndexOf('@')

            if (lastAtPos !== -1) {
                const newValue =
                    textareaRef.current.value.substring(0, lastAtPos) +
                    `@${toolName} ` +
                    textareaRef.current.value.substring(cursorPos)

                onChange(newValue)

                // Notify parent about tool selection
                onToolSelect?.(toolName)
            }
        }

        // Close the dropdown
        setMentionState({
            isActive: false,
            query: '',
            position: null
        })
    }

    // Helper function to get caret coordinates
    const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
        const { offsetLeft, offsetTop } = element
        const div = document.createElement('div')
        const style = getComputedStyle(element)

        // Copy styles from textarea to div
        const properties = [
            'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing',
            'lineHeight', 'textIndent', 'wordSpacing', 'padding'
        ]

        properties.forEach(prop => {
            // @ts-ignore - dynamic property access
            div.style[prop] = style[prop]
        })

        // Set content and measure
        div.textContent = element.value.substring(0, position)
        div.style.position = 'absolute'
        div.style.visibility = 'hidden'
        div.style.whiteSpace = 'pre-wrap'
        div.style.wordWrap = 'break-word'
        div.style.width = `${element.offsetWidth}px`

        document.body.appendChild(div)
        const span = document.createElement('span')
        span.textContent = element.value.substring(position) || '.'
        div.appendChild(span)

        const coordinates = {
            top: offsetTop + div.offsetHeight,
            left: offsetLeft + span.offsetLeft,
            height: parseInt(style.lineHeight)
        }

        document.body.removeChild(div)
        return coordinates
    }

    // Format the display value to bold the tool name after @
    const getFormattedDisplayValue = () => {
        if (!value || typeof value !== 'string') return ''

        // Replace @ToolName with styled version
        return value.replace(/@(\w+)/g, '<strong>@$1</strong>')
    }

    // Format the display value to highlight @mentions
    const formatMentions = (text: string | number | readonly string[] | undefined) => {
        if (!text || typeof text !== 'string') return '';

        // Replace @ToolName with styled version by adding a span with bold styling
        return text.replace(/@(\w+)/g, (match) => {
            return `<span class="${styles.mentionHighlight}">${match}</span>`;
        });
    };

    // Create a styled version of the input for display
    const styledValue = formatMentions(value);

    return (
        <div className={`relative ${styles.mentionContainer}`}>
            {/* The actual textarea for user input */}
            <Textarea
                ref={textareaRef}
                value={value as string}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                {...props}
            />

            {/* Overlay for highlighting @mentions */}
            {value && typeof value === 'string' && value.includes('@') && (
                <div
                    className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none"
                    style={{
                        padding: 'inherit',
                        paddingLeft: props.className?.includes('px-6') ? '1.5rem' : '1rem',
                        paddingTop: props.className?.includes('py-4') ? '1rem' : '0.75rem',
                        overflow: 'hidden'
                    }}
                    dangerouslySetInnerHTML={{
                        __html: typeof styledValue === 'string' ?
                            styledValue.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;') : ''
                    }}
                />
            )}

            {/* Tool mention dropdown */}
            <ToolMentionDropdown
                query={mentionState.query}
                onSelectTool={handleSelectTool}
                position={mentionState.position}
                visible={mentionState.isActive}
            />
        </div>
    )
}