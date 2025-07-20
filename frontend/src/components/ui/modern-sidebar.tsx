"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
    Menu,
    X,
    MessageCircle,
    User,
    Sparkles,
    Clock,
    Trash2,
    Plus,
    Search,
    Bot,
    Loader2,
    AlertTriangle,
    CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { chatHistoryService, type ChatSession } from '@/lib/chat-history'

interface ModernSidebarProps {
    className?: string
    onSessionSelect?: (sessionId: string) => void
    onNewChat?: () => void
    currentSessionId?: string
    onOpenChange?: (isOpen: boolean) => void
    refreshTrigger?: number // Add this to trigger refresh from parent
}

const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    return date.toLocaleDateString()
}

const truncateToThreeWords = (text: string) => {
    const words = text.trim().split(/\s+/)
    if (words.length <= 3) {
        return text
    }
    return words.slice(0, 3).join(' ') + '..'
}

// Confirmation Dialog Component
const ConfirmationDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Delete",
    cancelText = "Cancel",
    isDestructive = false
}: {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    isDestructive?: boolean
}) => (
    <AnimatePresence>
        {isOpen && (
            <>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                    onClick={onClose}
                />

                {/* Dialog */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md mx-4"
                >
                    <div className="glass-card rounded-lg shadow-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center",
                                isDestructive ? "bg-red-500/10 text-red-500" : "bg-indigo-300/10 text-indigo-300"
                            )}>
                                {isDestructive ? (
                                    <AlertTriangle className="h-5 w-5" />
                                ) : (
                                    <CheckCircle className="h-5 w-5" />
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-white">
                                {title}
                            </h3>
                        </div>

                        <p className="text-sm text-slate-300 mb-6">
                            {message}
                        </p>

                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                                className="text-white border-slate-700 hover:bg-slate-800"
                            >
                                {cancelText}
                            </Button>
                            <Button
                                size="sm"
                                onClick={onConfirm}
                                className={cn(
                                    isDestructive
                                        ? "bg-red-600 hover:bg-red-700 text-white"
                                        : "bg-indigo-500/60 hover:bg-indigo-500/80 text-white backdrop-blur-md"
                                )}
                            >
                                {confirmText}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </>
        )}
    </AnimatePresence>
)

const SessionItem = ({
    session,
    isActive,
    onSelect,
    onDelete
}: {
    session: ChatSession
    isActive: boolean
    onSelect: () => void
    onDelete: () => void
}) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
            "group relative rounded-lg p-3 cursor-pointer transition-all duration-200 hover:bg-slate-700/30",
            isActive && "bg-gradient-to-r from-slate-600/20 to-slate-700/20 border border-slate-500/30 shadow-lg"
        )}
        onClick={onSelect}
    >
        <div className="flex items-start gap-2 w-full">
            {/* Main content */}
            <div className="flex-1 min-w-0 overflow-hidden">
                {/* Title Row */}
                <div className="flex items-center gap-2 mb-1 min-w-0">
                    <MessageCircle className="h-3 w-3 text-slate-400 flex-shrink-0" />
                    <h3 className="text-sm font-medium text-white truncate">
                        {truncateToThreeWords(session.title)}
                    </h3>
                </div>

                {/* Preview Text */}
                <p className="text-xs text-slate-300 line-clamp-2 mb-2 break-words">
                    {session.preview}
                </p>

                {/* Enhanced Bottom Info with more metadata */}
                <div className="flex flex-col gap-1.5">
                    {/* First row: Model and message count */}
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5 flex-shrink-0 bg-indigo-500/20 text-indigo-200 border border-indigo-400/20">
                            {chatHistoryService.getModelBadge(session.model)}
                        </Badge>
                        <span className="text-xs text-slate-300">
                            {session.message_count} {session.message_count === 1 ? 'msg' : 'msgs'}
                        </span>
                    </div>

                    {/* Second row: Timestamps - More responsive */}
                    <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap">
                        <div className="flex items-center gap-1 mr-2">
                            <Clock className="h-3 w-3" />
                            <span>
                                Last: {formatTimeAgo(session.updated_at)}
                            </span>
                        </div>
                        <span className="text-slate-500 text-[10px]">
                            Created: {formatTimeAgo(session.created_at)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Delete Button - Fixed positioning */}
            <div className="flex-shrink-0 self-start">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-500 text-slate-300"
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                    }}
                    aria-label="Delete chat"
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
        </div>

        {isActive && (
            <>
                <motion.div
                    layoutId="activeSession"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-300 to-purple-400 rounded-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-2 right-2 w-2 h-2 bg-indigo-400 rounded-full shadow-lg"
                />
            </>
        )}
    </motion.div>
)

export function ModernSidebar({
    className,
    onSessionSelect,
    onNewChat,
    currentSessionId,
    onOpenChange,
    refreshTrigger
}: ModernSidebarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDesktop, setIsDesktop] = useState(false)
    const [screenWidth, setScreenWidth] = useState(0)

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean
        sessionId: string | null
        sessionTitle: string
    }>({
        isOpen: false,
        sessionId: null,
        sessionTitle: ''
    })

    // Focus management refs
    const sidebarRef = React.useRef<HTMLDivElement>(null)
    const searchInputRef = React.useRef<HTMLInputElement>(null)
    const toggleButtonRef = React.useRef<HTMLButtonElement>(null)
    const previousFocusRef = React.useRef<HTMLElement | null>(null)

    const toggleSidebar = useCallback(() => {
        setIsOpen(prev => {
            const newState = !prev

            // Focus management
            if (newState) {
                // Store current focus before opening sidebar
                previousFocusRef.current = document.activeElement as HTMLElement
                // Focus search input after sidebar opens
                setTimeout(() => {
                    searchInputRef.current?.focus()
                }, 300) // Wait for animation to complete
            } else {
                // Restore focus when closing sidebar
                if (previousFocusRef.current) {
                    previousFocusRef.current.focus()
                } else {
                    toggleButtonRef.current?.focus()
                }
            }

            onOpenChange?.(newState)
            return newState
        })
    }, [onOpenChange])

    const handleSessionSelect = useCallback((sessionId: string) => {
        onSessionSelect?.(sessionId)
        // On mobile, close sidebar after selection with animation delay
        if (!isDesktop) {
            // Small delay to show selection feedback before closing
            setTimeout(() => {
                setIsOpen(false)
                onOpenChange?.(false)
            }, 150)
        }
    }, [onSessionSelect, onOpenChange, isDesktop])

    const handleNewChat = useCallback(() => {
        onNewChat?.()
        if (!isDesktop) {
            setIsOpen(false)
            onOpenChange?.(false)
        }
    }, [onNewChat, onOpenChange, isDesktop])

    // Enhanced session loading with retry mechanism
    const loadSessions = useCallback(async (retryAttempt: number = 0) => {
        try {
            setIsLoading(true)
            setError(null)
            console.log('Loading chat sessions from backend...', retryAttempt > 0 ? `(retry ${retryAttempt})` : '');
            const response = await chatHistoryService.getAllSessions()
            console.log('Received response:', response);

            // Ensure we have a valid sessions array
            if (response && Array.isArray(response.sessions)) {
                // Sort sessions by timestamp (newest first)
                const sortedSessions = [...response.sessions].sort(
                    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
                );
                console.log(`Loaded ${sortedSessions.length} sessions`);
                setSessions(sortedSessions)
            } else {
                // If we get an unexpected response format, set sessions to empty array
                console.warn('Unexpected response format:', response)
                setSessions([])
            }
        } catch (err) {
            const errorMessage = err instanceof Error
                ? `${err.message} (${err.name})`
                : 'Failed to load chat history';

            console.error('Error loading sessions:', err)

            // Retry mechanism - up to 2 attempts
            if (retryAttempt < 1) {
                console.log(`Retrying session load in 2 seconds... (attempt ${retryAttempt + 1}/2)`)
                setTimeout(() => {
                    loadSessions(retryAttempt + 1)
                }, 2000)
                return
            }

            // Set error after all retries failed
            setError(errorMessage)
            // On error, ensure sessions is set to empty array
            setSessions([])
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Handle responsive behavior with screen size detection
    useEffect(() => {
        const handleResize = () => {
            const newIsDesktop = window.innerWidth >= 768
            const newScreenWidth = window.innerWidth

            setIsDesktop(newIsDesktop)
            setScreenWidth(newScreenWidth)

            // Auto-close sidebar on mobile when switching from desktop to mobile
            if (!newIsDesktop && isOpen) {
                setIsOpen(false)
                onOpenChange?.(false)
            }
        }

        // Set initial state
        handleResize()

        // Add event listener with debouncing for better performance
        let timeoutId: NodeJS.Timeout
        const debouncedHandleResize = () => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(handleResize, 100)
        }

        window.addEventListener('resize', debouncedHandleResize)

        // Cleanup
        return () => {
            window.removeEventListener('resize', debouncedHandleResize)
            clearTimeout(timeoutId)
        }
    }, [isOpen, onOpenChange])

    // Load sessions on component mount
    useEffect(() => {
        loadSessions()
    }, [loadSessions])

    // Refresh sessions when refreshTrigger changes
    useEffect(() => {
        if (refreshTrigger !== undefined && refreshTrigger > 0) {
            loadSessions()
        }
    }, [refreshTrigger, loadSessions])

    // Keyboard navigation and accessibility
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Toggle sidebar with Ctrl+B or Cmd+B
            if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
                event.preventDefault()
                toggleSidebar()
                return
            }

            // Close sidebar with Escape key when open
            if (event.key === 'Escape' && isOpen) {
                event.preventDefault()
                setIsOpen(false)
                onOpenChange?.(false)
                // Restore focus to toggle button
                toggleButtonRef.current?.focus()
                return
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onOpenChange, toggleSidebar])

    // Trap focus within sidebar when open
    useEffect(() => {
        if (!isOpen) return

        const handleTabKey = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return

            const sidebar = sidebarRef.current
            if (!sidebar) return

            const focusableElements = sidebar.querySelectorAll(
                'button, input, [tabindex]:not([tabindex="-1"])'
            )
            const firstElement = focusableElements[0] as HTMLElement
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

            if (event.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    event.preventDefault()
                    lastElement?.focus()
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    event.preventDefault()
                    firstElement?.focus()
                }
            }
        }

        document.addEventListener('keydown', handleTabKey)
        return () => document.removeEventListener('keydown', handleTabKey)
    }, [isOpen])

    // Show confirmation dialog for session deletion
    const showDeleteConfirmation = useCallback((sessionId: string, sessionTitle: string) => {
        setConfirmDialog({
            isOpen: true,
            sessionId,
            sessionTitle
        })
    }, [])

    // Close confirmation dialog
    const closeDeleteConfirmation = useCallback(() => {
        setConfirmDialog({
            isOpen: false,
            sessionId: null,
            sessionTitle: ''
        })
    }, [])

    // Confirm and execute session deletion
    const confirmDeleteSession = useCallback(async () => {
        const { sessionId } = confirmDialog
        if (!sessionId) return

        // Close dialog first
        closeDeleteConfirmation()

        // Execute deletion with enhanced cleanup
        await handleDeleteSession(sessionId)
    }, [confirmDialog, closeDeleteConfirmation])

    const handleDeleteSession = useCallback(async (sessionId: string, retryAttempt: number = 0) => {
        try {
            const success = await chatHistoryService.deleteSession(sessionId)
            if (success) {
                // Remove session from local state
                setSessions(prev => prev.filter(s => s.id !== sessionId))

                // If we deleted the current session, trigger new chat
                if (currentSessionId === sessionId) {
                    onSessionSelect?.('')
                    // Trigger new chat to clear the current session completely
                    setTimeout(() => {
                        onNewChat?.()
                    }, 100)
                }

                console.log(`Session ${sessionId} deleted successfully`)

                // Show success feedback (could be enhanced with toast notifications)
                console.log('Session deleted and cleaned up successfully')
            } else {
                throw new Error('Delete operation returned false')
            }
        } catch (err) {
            console.error('Error deleting session:', err)
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'

            // Retry mechanism - up to 1 attempt for deletion
            if (retryAttempt < 1) {
                console.log(`Retrying session deletion in 1 second... (attempt ${retryAttempt + 1}/2)`)
                setTimeout(() => {
                    handleDeleteSession(sessionId, retryAttempt + 1)
                }, 1000)
                return
            }

            // Show error after all retries failed
            console.error(`Failed to delete session ${sessionId} after ${retryAttempt + 1} attempts:`, errorMessage)
            // Could add a toast notification here if needed
        }
    }, [currentSessionId, onSessionSelect, onNewChat])

    // Enhanced search functionality with multiple criteria
    const filteredSessions = sessions.filter(session => {
        if (!searchQuery.trim()) return true

        const query = searchQuery.toLowerCase().trim()

        // Search in title, preview, and model
        const titleMatch = session.title.toLowerCase().includes(query)
        const previewMatch = session.preview.toLowerCase().includes(query)
        const modelMatch = session.model.toLowerCase().includes(query)

        // Search by date keywords
        const dateKeywords = ['today', 'yesterday', 'week', 'month']
        const isDateSearch = dateKeywords.some(keyword => query.includes(keyword))

        if (isDateSearch) {
            const now = new Date()
            const sessionDate = session.updated_at

            if (query.includes('today')) {
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                return sessionDate >= today
            }

            if (query.includes('yesterday')) {
                const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                return sessionDate >= yesterday && sessionDate < today
            }

            if (query.includes('week')) {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                return sessionDate >= weekAgo
            }

            if (query.includes('month')) {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                return sessionDate >= monthAgo
            }
        }

        return titleMatch || previewMatch || modelMatch
    })

    return (
        <>
            {/* Sidebar Toggle Button - Responsive positioning */}
            <motion.div
                className="fixed top-4 left-4 z-[60]"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    // Responsive button positioning based on screen size and sidebar state
                    x: isOpen ? (isDesktop ? 320 : screenWidth >= 480 ? 288 : Math.max(screenWidth - 64, 16)) : 0
                }}
                transition={{
                    delay: isOpen ? 0 : 0.2,
                    type: "spring",
                    damping: 20,
                    stiffness: 300
                }}
            >
                <Button
                    ref={toggleButtonRef}
                    variant="outline"
                    size="sm"
                    onClick={toggleSidebar}
                    aria-label={isOpen ? "Close chat history sidebar" : "Open chat history sidebar"}
                    aria-expanded={isOpen}
                    aria-controls="chat-history-sidebar"
                    className={cn(
                        "h-10 w-10 p-0 rounded-full bg-background/90 backdrop-blur-sm border-border/50 hover:bg-accent/50 transition-all duration-200 shadow-lg",
                        isOpen && "text-white border-[#f97316]"
                    )}
                    style={isOpen ? { backgroundColor: '#f97316' } : {}}
                    onMouseEnter={(e) => {
                        if (isOpen) {
                            e.currentTarget.style.backgroundColor = '#ea580c'
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (isOpen) {
                            e.currentTarget.style.backgroundColor = '#f97316'
                        }
                    }}
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <X className="h-4 w-4" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="menu"
                                initial={{ rotate: 90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: -90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Menu className="h-4 w-4" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Button>
            </motion.div>

            {/* Enhanced Sidebar Overlay with better mobile dimming */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => {
                            setIsOpen(false)
                            onOpenChange?.(false)
                        }}
                        onTouchStart={() => {
                            // Prevent scrolling on background when sidebar is open
                            document.body.style.overflow = 'hidden'
                        }}
                        onTouchEnd={() => {
                            document.body.style.overflow = 'auto'
                        }}
                        style={{
                            // Ensure overlay covers everything including status bars on mobile
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            position: 'fixed'
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={sidebarRef}
                        id="chat-history-sidebar"
                        role="complementary"
                        aria-label="Chat history sidebar"
                        initial={{ x: -320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -320, opacity: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className={cn(
                            "fixed left-0 top-0 bottom-0 w-80 md:w-80 sm:w-72 glass-sidebar z-50 flex flex-col",
                            // On mobile, make sidebar full width on very small screens
                            "max-[480px]:w-full max-[480px]:right-0",
                            className
                        )}
                    >
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-white/10">
                            <div className="flex items-center justify-between mb-4 min-w-0">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className="h-8 w-8 rounded-full glass-morphism flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="h-4 w-4 text-white/80" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-white/90 truncate">
                                        Chat History
                                    </h2>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setIsOpen(false)
                                        onOpenChange?.(false)
                                    }}
                                    className="h-8 w-8 p-0 flex-shrink-0 ml-2 glass-button text-white/70 hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* New Chat Button */}
                            <Button
                                onClick={handleNewChat}
                                className="w-full glass-button text-white/90 hover:text-white border-0 transition-all duration-300"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                New Chat
                            </Button>
                        </div>

                        {/* Enhanced Search with hints */}
                        <div className="p-4 border-b border-white/10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search conversations, models, or try 'today', 'week'..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        // Clear search with Escape
                                        if (e.key === 'Escape' && searchQuery) {
                                            e.preventDefault()
                                            setSearchQuery('')
                                        }
                                        // Focus first session with Enter
                                        if (e.key === 'Enter' && filteredSessions.length > 0) {
                                            e.preventDefault()
                                            handleSessionSelect(filteredSessions[0].id)
                                        }
                                    }}
                                    aria-label="Search conversations by title, content, model, or date"
                                    className="w-full pl-10 pr-4 py-2 text-sm glass-input focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all text-white/90 placeholder:text-white/50"
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 glass-button hover:text-white"
                                        onClick={() => setSearchQuery('')}
                                        aria-label="Clear search"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                            {searchQuery && (
                                <div className="mt-2 text-xs text-indigo-300/80">
                                    {filteredSessions.length} of {sessions.length} conversations
                                </div>
                            )}
                        </div>

                        {/* Chat Sessions */}
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-2">
                                {isLoading ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center py-8"
                                    >
                                        <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin" style={{ color: '#50C878' }} />
                                        <p className="text-sm text-slate-400">
                                            Loading chat history...
                                        </p>
                                    </motion.div>
                                ) : error ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center py-8"
                                    >
                                        <Bot className="h-12 w-12 text-red-500 mx-auto mb-3" />
                                        <p className="text-sm text-red-500 mb-2">
                                            Failed to load chat history
                                        </p>
                                        <p className="text-xs text-slate-400 mb-3">
                                            {error}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => loadSessions()}
                                            className="text-xs"
                                        >
                                            Try Again
                                        </Button>
                                    </motion.div>
                                ) : filteredSessions.length > 0 ? (
                                    filteredSessions.map((session) => (
                                        <SessionItem
                                            key={session.id}
                                            session={session}
                                            isActive={currentSessionId === session.id}
                                            onSelect={() => handleSessionSelect(session.id)}
                                            onDelete={() => showDeleteConfirmation(session.id, session.title)}
                                        />
                                    ))
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center py-8"
                                    >
                                        <Bot className="h-12 w-12 text-indigo-400/50 mx-auto mb-3" />
                                        <p className="text-sm text-white">
                                            {searchQuery ? 'No conversations found' : 'No conversations yet'}
                                        </p>
                                        <p className="text-xs text-indigo-300/80 mt-1">
                                            {searchQuery ? 'Try a different search term' : 'Start a new chat to begin'}
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Enhanced Sidebar Footer with detailed metadata */}
                        <div className="p-4 border-t border-slate-800/30">
                            <div className="flex items-center gap-2 text-sm text-white mb-3">
                                <User className="h-4 w-4 text-indigo-300" />
                                <span>AI Assistant</span>
                                <Badge variant="outline" className="ml-auto text-xs bg-indigo-400/10 text-indigo-300 border border-indigo-400/20">
                                    {filteredSessions.length}{searchQuery ? ` of ${sessions.length}` : ''} chats
                                </Badge>
                            </div>

                            {/* Session Statistics */}
                            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                                <div className="bg-black rounded p-2 border border-slate-800/50">
                                    <div className="text-indigo-300/80">Total Messages</div>
                                    <div className="text-white font-medium">
                                        {sessions.reduce((sum, session) => sum + session.message_count, 0)}
                                    </div>
                                </div>
                                <div className="bg-black rounded p-2 border border-slate-800/50">
                                    <div className="text-indigo-300/80">Active Models</div>
                                    <div className="text-white font-medium">
                                        {new Set(sessions.map(s => s.model)).size}
                                    </div>
                                </div>
                            </div>

                            {/* Search and Filter Info */}
                            {searchQuery && (
                                <div className="mb-3 p-2 bg-indigo-400/10 border border-indigo-400/20 rounded text-xs">
                                    <div className="text-indigo-300 font-medium">Search Active</div>
                                    <div className="text-indigo-200">"{searchQuery}"</div>
                                    <div className="text-indigo-300 mt-1">
                                        {filteredSessions.length} result{filteredSessions.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            )}

                            {/* System Info */}
                            <div className="text-xs text-slate-400 space-y-1">
                                <div className="flex justify-between">
                                </div>
                                <div className="flex justify-between">
                                    <span>Last refresh:</span>
                                    <span>{new Date().toLocaleTimeString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shortcuts:</span>
                                    <span>Ctrl+B, Esc</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={confirmDialog.isOpen}
                onClose={closeDeleteConfirmation}
                onConfirm={confirmDeleteSession}
                title="Delete Conversation"
                message={`Are you sure you want to delete "${confirmDialog.sessionTitle}"? This action cannot be undone and all messages in this conversation will be permanently removed.`}
                confirmText="Delete"
                cancelText="Cancel"
                isDestructive={true}
            />
        </>
    )
}