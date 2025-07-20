"use client"

import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MentionTextarea } from '@/components/ui/mention-textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ToolsDropdown } from '@/components/ui/tools-dropdown'
import { ModelSelector } from '@/components/ui/model-selector'
import { InlineModelSelector } from '@/components/ui/inline-model-selector'
import { EnhancedMarkdownImproved } from '@/components/ui/enhanced-markdown-improved'
import { ModernSidebar } from '@/components/ui/modern-sidebar'
import { SessionErrorBoundary } from '@/components/ui/session-error-boundary'
import { SpotifyEmbed } from '@/components/ui/spotify-embed'
import {
    Send,
    MoreHorizontal,
    Bot,
    User,
    Sparkles,
    Copy,
    ThumbsUp,
    ThumbsDown,
    RotateCcw,
    Zap,
    CheckCircle,
    XCircle,
    Info,
    AlertCircle,
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { chatHistoryService } from '@/lib/chat-history'
import { extractTrackIdFromMessage, isSpotifyTool } from '@/lib/spotify-utils'
import { authService, type User as AuthUser } from '@/lib/auth-service'
import { AnimatedAuthForm } from '@/components/ui/animated-auth-form'

interface ChatMessage {
    id: string
    content: string
    role: 'user' | 'assistant'
    timestamp: Date
    tools_used?: string[]
    isLoading?: boolean
    sessionId?: string
    spotify_track_id?: string
}

interface ModernChatProps {
    onSendMessage?: (message: string, model?: string) => Promise<any>
    className?: string
    initialSessionId?: string
}

interface WelcomeScreenProps {
    input: string
    isLoading: boolean
    selectedModel: string
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    handleKeyPress: (e: React.KeyboardEvent) => void
    handleSendMessage: () => void
    handleToolSelect: (prompt: string) => void
    handleModelChange: (modelId: string) => void
    welcomeTextareaRef: React.RefObject<HTMLTextAreaElement>
}

interface ChatInterfaceProps {
    messages: ChatMessage[]
    input: string
    isLoading: boolean
    selectedModel: string
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    handleKeyPress: (e: React.KeyboardEvent) => void
    handleSendMessage: () => void
    handleToolSelect: (prompt: string) => void
    handleModelChange: (modelId: string) => void
    chatTextareaRef: React.RefObject<HTMLTextAreaElement>
    messagesEndRef: React.RefObject<HTMLDivElement>
}

interface UserFeedbackNotificationProps {
    feedback: { type: 'success' | 'error' | 'info', message: string, timestamp: number } | null
    onClose: () => void
}

interface SessionLoadingIndicatorProps {
    isLoading: boolean
    error: string | null
    onRetry: () => void
}

// Welcome Screen Component
const WelcomeScreen = memo<WelcomeScreenProps>(({
    input,
    isLoading,
    selectedModel,
    handleInputChange,
    handleKeyPress,
    handleSendMessage,
    handleToolSelect,
    handleModelChange,
    welcomeTextareaRef
}) => {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
            className="flex flex-col items-center justify-center min-h-screen p-8 py-16 relative overflow-hidden"
        >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-orange-500/10 rounded-full"
                        initial={{
                            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                            scale: 0
                        }}
                        animate={{
                            y: [null, -100],
                            scale: [0, 1, 0],
                            opacity: [0, 0.6, 0]
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: i * 0.5,
                            ease: "easeOut"
                        }}
                    />
                ))}
            </div>

            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                className="text-center mb-12 relative"
            >
                <motion.div
                    className="flex items-center justify-center gap-3 mb-6"
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                >
                    <div className="relative">
                        <motion.div
                            animate={{
                                rotate: 360,
                                scale: isHovered ? 1.1 : 1
                            }}
                            transition={{
                                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                                scale: { duration: 0.2 }
                            }}
                        >
                            <Sparkles className="h-8 w-8 text-orange-500 drop-shadow-lg" />
                        </motion.div>

                        {/* Sparkle particles */}
                        <AnimatePresence>
                            {isHovered && [...Array(4)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-orange-400 rounded-full"
                                    initial={{
                                        x: 16, y: 16,
                                        scale: 0,
                                        opacity: 0
                                    }}
                                    animate={{
                                        x: 16 + (Math.random() - 0.5) * 40,
                                        y: 16 + (Math.random() - 0.5) * 40,
                                        scale: 1,
                                        opacity: [0, 1, 0]
                                    }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{
                                        duration: 0.6,
                                        delay: i * 0.1
                                    }}
                                />
                            ))}
                        </AnimatePresence>
                    </div>

                    <motion.h1
                        className="text-4xl md:text-5xl font-light text-foreground bg-gradient-to-r from-foreground via-orange-500/80 to-foreground bg-clip-text"
                        animate={{
                            backgroundPosition: isHovered ? "200% center" : "0% center"
                        }}
                        transition={{ duration: 0.8 }}
                        style={{
                            backgroundSize: "200% 100%"
                        }}
                    >
                        What's new, Hello?
                    </motion.h1>
                </motion.div>

                {/* Subtle glow effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent rounded-full blur-xl"
                    animate={{
                        opacity: isHovered ? 0.8 : 0.3,
                        scale: isHovered ? 1.2 : 1
                    }}
                    transition={{ duration: 0.3 }}
                />
            </motion.div>

            {/* Input Area */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 80 }}
                className="w-full max-w-2xl"
            >
                <motion.div
                    className="relative group"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    {/* Animated border glow */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/20 via-primary/20 to-orange-500/20 blur-sm"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    />

                    <motion.div
                        className="relative"
                        initial={{ boxShadow: "0 0 0 0 rgba(255, 255, 255, 0)" }}
                        whileFocus={{ boxShadow: "0 0 0 4px rgba(255, 255, 255, 0.1)" }}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.3 }}
                    >
                        <MentionTextarea
                            value={input}
                            onChange={(value) => handleInputChange({ target: { value } } as React.ChangeEvent<HTMLTextAreaElement>)}
                            onKeyDown={handleKeyPress}
                            onToolSelect={(toolName) => handleToolSelect(`@${toolName} `)}
                            placeholder="How can I help you today?"
                            className="min-h-[60px] max-h-[200px] resize-none rounded-t-2xl border-b-0 glass-textarea-enhanced px-6 py-4 pr-24 text-base placeholder:text-white/60 focus:ring-0 transition-all duration-300"
                            disabled={isLoading}
                        />

                        {/* Input Controls - Outside textarea */}
                        <motion.div
                            className="flex items-center justify-between px-6 py-3 glass-textarea-controls border-t-0 rounded-b-2xl"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            {/* Left side - Model Selector */}
                            <motion.div
                                className="flex items-center gap-2"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                <InlineModelSelector
                                    selectedModel={selectedModel}
                                    onModelChange={handleModelChange}
                                    className="text-xs"
                                />
                            </motion.div>

                            {/* Right side - Tools and Send */}
                            <motion.div
                                className="flex items-center gap-2"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                    <ToolsDropdown onToolSelect={handleToolSelect} selectedModel={selectedModel} />
                                </motion.div>

                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-accent transition-colors duration-200"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    animate={{
                                        boxShadow: input.trim() && !isLoading
                                            ? "0 0 20px rgba(249, 115, 22, 0.3)"
                                            : "0 0 0px rgba(249, 115, 22, 0)"
                                    }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!input.trim() || isLoading}
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <motion.div
                                            animate={{ rotate: isLoading ? 360 : 0 }}
                                            transition={{
                                                duration: isLoading ? 1 : 0,
                                                repeat: isLoading ? Infinity : 0,
                                                ease: "linear"
                                            }}
                                        >
                                            <Send className="h-4 w-4" />
                                        </motion.div>
                                    </Button>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </motion.div>
    )
})

WelcomeScreen.displayName = 'WelcomeScreen'

// Message Component
const MessageComponent = memo<{ message: ChatMessage }>(({ message }) => {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.8
            }}
            className={cn(
                "flex gap-4 group relative",
                message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            {/* Message glow effect */}
            <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/5 via-transparent to-orange-500/5 blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 0.6 : 0 }}
                transition={{ duration: 0.3 }}
            />

            {message.role === 'assistant' && (
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 25,
                        delay: 0.1
                    }}
                >
                    <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-orange-500/20 transition-all duration-300 group-hover:ring-orange-500/40">
                        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                            <motion.div
                                animate={{ rotate: isHovered ? 360 : 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Bot className="h-4 w-4" />
                            </motion.div>
                        </AvatarFallback>
                    </Avatar>
                </motion.div>
            )}

            <motion.div
                className={cn(
                    "max-w-[80%] space-y-2 relative",
                    message.role === 'user' ? 'order-1' : 'order-2'
                )}
                initial={{ x: message.role === 'user' ? 20 : -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
                {/* Message Content */}
                <motion.div
                    className={cn(
                        "rounded-2xl px-4 py-3 text-sm relative overflow-hidden",
                        message.role === 'user'
                            ? 'glass-message-user text-primary-foreground ml-auto shadow-lg'
                            : 'glass-message text-foreground shadow-md border border-border/50'
                    )}
                    whileHover={{
                        scale: 1.02,
                        boxShadow: message.role === 'user'
                            ? "0 8px 25px rgba(0,0,0,0.15)"
                            : "0 8px 25px rgba(0,0,0,0.1)"
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    {/* Animated background shimmer */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        initial={{ x: "-100%" }}
                        animate={{ x: isHovered ? "100%" : "-100%" }}
                        transition={{ duration: 0.6 }}
                    />

                    {message.isLoading ? (
                        <motion.div
                            className="flex items-center gap-3 relative z-10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2 h-2 bg-current rounded-full"
                                        animate={{
                                            scale: [1, 1.5, 1],
                                            opacity: [0.5, 1, 0.5]
                                        }}
                                        transition={{
                                            duration: 1.2,
                                            repeat: Infinity,
                                            delay: i * 0.2,
                                            ease: "easeInOut"
                                        }}
                                    />
                                ))}
                            </div>
                            <motion.span
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="relative z-10"
                            >
                                Thinking...
                            </motion.span>
                        </motion.div>
                    ) : message.role === 'assistant' ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="relative z-10"
                        >
                            <EnhancedMarkdownImproved
                                content={message.content}
                                className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                            />
                        </motion.div>
                    ) : (
                        <motion.p
                            className="whitespace-pre-wrap relative z-10"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            {message.content}
                        </motion.p>
                    )}
                </motion.div>

                {/* Spotify Embed - Show when Spotify tools are used AND we have a track ID */}
                {message.tools_used?.some(tool => isSpotifyTool(tool)) && message.spotify_track_id && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                        className="mt-3"
                    >
                        <SpotifyEmbed
                            trackId={message.spotify_track_id}
                        />
                        {/* Debug info */}
                        <div className="text-xs text-muted-foreground mt-2">
                            Track ID: {message.spotify_track_id}
                        </div>
                    </motion.div>
                )}

                {/* Show message when Spotify tool is used but no track ID */}
                {message.tools_used?.some(tool => isSpotifyTool(tool)) && !message.spotify_track_id && (
                    <div className="text-xs text-muted-foreground mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                        ⚠️ Spotify tool used but no track ID received from backend
                    </div>
                )}

                {/* Tools Used */}
                {message.tools_used && message.tools_used.length > 0 && (
                    <motion.div
                        className="flex items-center gap-2 text-xs"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                            <Zap className="h-3 w-3 text-orange-500" />
                        </motion.div>
                        <span className="text-muted-foreground">Tools:</span>
                        <div className="flex gap-1 flex-wrap">
                            {message.tools_used.map((tool, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.6 + index * 0.1 }}
                                    whileHover={{ scale: 1.1 }}
                                >
                                    <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20">
                                        {tool}
                                    </Badge>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Message Actions */}
                {message.role === 'assistant' && !message.isLoading && (
                    <motion.div
                        className="flex items-center gap-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                            opacity: isHovered ? 1 : 0,
                            y: isHovered ? 0 : 10
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        {[
                            { icon: Copy, label: "Copy" },
                            { icon: ThumbsUp, label: "Like" },
                            { icon: ThumbsDown, label: "Dislike" },
                            { icon: RotateCcw, label: "Regenerate" }
                        ].map(({ icon: Icon, label }, index) => (
                            <motion.div
                                key={label}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                    scale: isHovered ? 1 : 0,
                                    opacity: isHovered ? 1 : 0
                                }}
                                transition={{
                                    delay: index * 0.05,
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 25
                                }}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-orange-500/10 hover:text-orange-600 transition-colors duration-200"
                                    title={label}
                                >
                                    <Icon className="h-3 w-3" />
                                </Button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </motion.div>

            {message.role === 'user' && (
                <motion.div
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 25,
                        delay: 0.1
                    }}
                    className="order-2"
                >
                    <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/40">
                        <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/80">
                            <motion.div
                                animate={{ rotate: isHovered ? -360 : 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <User className="h-4 w-4" />
                            </motion.div>
                        </AvatarFallback>
                    </Avatar>
                </motion.div>
            )}
        </motion.div>
    )
})

MessageComponent.displayName = 'MessageComponent'

// User Feedback Notification Component
const UserFeedbackNotification = memo<UserFeedbackNotificationProps>(({
    feedback,
    onClose
}) => {
    if (!feedback) return null

    const getIcon = () => {
        switch (feedback.type) {
            case 'success': return <CheckCircle className="h-4 w-4" />
            case 'error': return <XCircle className="h-4 w-4" />
            case 'info': return <Info className="h-4 w-4" />
            default: return <AlertCircle className="h-4 w-4" />
        }
    }

    const getColors = () => {
        switch (feedback.type) {
            case 'success': return 'bg-green-500/10 border-green-500/20 text-green-600'
            case 'error': return 'bg-red-500/10 border-red-500/20 text-red-600'
            case 'info': return 'bg-blue-500/10 border-blue-500/20 text-blue-600'
            default: return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600'
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.95, x: 100 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, y: -50, scale: 0.95, x: 100 }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 0.8
                }}
                className={cn(
                    "fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl",
                    getColors()
                )}
                whileHover={{ scale: 1.05 }}
            >
                {/* Animated background pulse */}
                <motion.div
                    className="absolute inset-0 rounded-xl bg-current/5"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                <motion.div
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                >
                    {getIcon()}
                </motion.div>

                <motion.span
                    className="text-sm font-medium relative z-10"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    {feedback.message}
                </motion.span>

                <motion.div
                    whileHover={{ scale: 1.2, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-2 hover:bg-current/10 relative z-10"
                        onClick={onClose}
                    >
                        <XCircle className="h-3 w-3" />
                    </Button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
})

UserFeedbackNotification.displayName = 'UserFeedbackNotification'

// Session Loading Indicator Component
const SessionLoadingIndicator = memo<SessionLoadingIndicatorProps>(({
    isLoading,
    error,
    onRetry
}) => {
    if (!isLoading && !error) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40"
        >
            <div className="glass-notification border border-border rounded-lg px-4 py-3 shadow-lg">
                {isLoading ? (
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Loading session...</span>
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-3">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">Failed to load session</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRetry}
                            className="h-6 text-xs"
                        >
                            Retry
                        </Button>
                    </div>
                ) : null}
            </div>
        </motion.div>
    )
})

SessionLoadingIndicator.displayName = 'SessionLoadingIndicator'

// Chat Interface Component
const ChatInterface = memo<ChatInterfaceProps>(({
    messages,
    input,
    isLoading,
    selectedModel,
    handleInputChange,
    handleKeyPress,
    handleSendMessage,
    handleToolSelect,
    handleModelChange,
    chatTextareaRef,
    messagesEndRef
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col h-screen"
        >
            {/* Chat Header - Clean without model selector */}
            <motion.div
                className="border-b glass-header p-4 relative overflow-hidden"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            >
                {/* Subtle animated background */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-orange-500/5"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />

                <div className="max-w-4xl mx-auto flex items-center justify-center relative z-10">
                    <motion.div
                        className="text-sm text-muted-foreground flex items-center gap-2"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-2 h-2 bg-orange-500 rounded-full"
                        />
                        {messages.length} messages
                    </motion.div>
                </div>
            </motion.div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4 relative">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.1),transparent_50%)]" />
                </div>

                <motion.div
                    className="max-w-4xl mx-auto space-y-6 relative z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <AnimatePresence mode="popLayout">
                        {messages.map((message, index) => (
                            <motion.div
                                key={message.id}
                                layout
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                                transition={{
                                    delay: index * 0.05,
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 25
                                }}
                            >
                                <MessageComponent message={message} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </motion.div>
            </ScrollArea>

            {/* Bottom Input */}
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                className="border-t glass-header p-4 relative overflow-hidden"
            >
                {/* Animated background glow */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-orange-500/5 via-transparent to-transparent"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                />

                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div
                        className="relative group"
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                        {/* Input glow effect */}
                        <motion.div
                            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/10 via-primary/10 to-orange-500/10 blur-sm"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            whileFocus={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        />

                        <MentionTextarea
                            value={input}
                            onChange={(value) => handleInputChange({ target: { value } } as React.ChangeEvent<HTMLTextAreaElement>)}
                            onKeyDown={handleKeyPress}
                            onToolSelect={(toolName) => handleToolSelect(`@${toolName} `)}
                            placeholder="Reply to AI Assistant..."
                            className="min-h-[50px] max-h-[200px] resize-none rounded-t-2xl border-b-0 glass-textarea-enhanced px-4 py-3 pr-20 text-sm placeholder:text-white/60 focus:ring-0 transition-all duration-300 relative z-10"
                            disabled={isLoading}
                        />

                        {/* Controls Container - Outside textarea */}
                        <motion.div
                            className="flex items-center justify-between px-4 py-2 glass-textarea-controls border-t-0 rounded-b-2xl"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            {/* Left side - Model Selector */}
                            <motion.div
                                className="flex items-center gap-2"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <InlineModelSelector
                                    selectedModel={selectedModel}
                                    onModelChange={handleModelChange}
                                    className="text-xs"
                                    compact={true}
                                />
                            </motion.div>

                            {/* Right side - Tools and Send */}
                            <motion.div
                                className="flex items-center gap-2"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                    <ToolsDropdown onToolSelect={handleToolSelect} selectedModel={selectedModel} />
                                </motion.div>

                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-accent transition-colors duration-200"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    animate={{
                                        boxShadow: input.trim() && !isLoading
                                            ? "0 0 20px rgba(249, 115, 22, 0.4)"
                                            : "0 0 0px rgba(249, 115, 22, 0)"
                                    }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!input.trim() || isLoading}
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                    >
                                        <motion.div
                                            animate={{ rotate: isLoading ? 360 : 0 }}
                                            transition={{
                                                duration: isLoading ? 1 : 0,
                                                repeat: isLoading ? Infinity : 0,
                                                ease: "linear"
                                            }}
                                        >
                                            <Send className="h-4 w-4" />
                                        </motion.div>
                                    </Button>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    )
})

ChatInterface.displayName = 'ChatInterface'

// Main ModernChat Component
export function ModernChat({ onSendMessage, className, initialSessionId }: ModernChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [hasStartedChat, setHasStartedChat] = useState(false)
    const [selectedModel, setSelectedModel] = useState('ollama-qwen2.5')

    // Authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)

    // Sidebar state management
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialSessionId || null)
    const [sessionRefreshTrigger, setSessionRefreshTrigger] = useState(0)
    const [isDesktop, setIsDesktop] = useState(false)
    const [isTransitioningSession, setIsTransitioningSession] = useState(false)

    // Enhanced loading and error states for session operations
    const [isLoadingSession, setIsLoadingSession] = useState(false)
    const [sessionError, setSessionError] = useState<string | null>(null)
    const [isSavingMessage, setIsSavingMessage] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [retryCount, setRetryCount] = useState(0)
    const [showUserFeedback, setShowUserFeedback] = useState<{
        type: 'success' | 'error' | 'info'
        message: string
        timestamp: number
    } | null>(null)

    const welcomeTextareaRef = useRef<HTMLTextAreaElement>(null)
    const chatTextareaRef = useRef<HTMLTextAreaElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Optimized input handler with auto-resize
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        setInput(value)

        // Auto-resize textarea without causing re-renders
        requestAnimationFrame(() => {
            const textarea = e.target
            if (!textarea) return

            textarea.style.height = 'auto'
            const newHeight = Math.min(textarea.scrollHeight, 200)
            textarea.style.height = `${newHeight}px`
        })
    }, [])

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Handle responsive behavior with enhanced mobile detection
    useEffect(() => {
        const handleResize = () => {
            const newIsDesktop = window.innerWidth >= 768
            setIsDesktop(newIsDesktop)

            // Auto-close sidebar on mobile when switching from desktop to mobile
            if (!newIsDesktop && sidebarOpen) {
                setSidebarOpen(false)
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
    }, [sidebarOpen])

    // Trigger session refresh when needed
    const triggerSessionRefresh = useCallback(() => {
        setSessionRefreshTrigger(prev => prev + 1)
    }, [])

    // Enhanced session loading handler with retry mechanism
    const loadSessionMessages = useCallback(async (sessionId: string, retryAttempt: number = 0) => {
        if (!sessionId) return

        setIsLoadingSession(true)
        setSessionError(null)

        // Show user feedback for loading
        setShowUserFeedback({
            type: 'info',
            message: 'Loading chat session...',
            timestamp: Date.now()
        })

        try {
            console.log('Loading session:', sessionId, retryAttempt > 0 ? `(retry ${retryAttempt})` : '')
            const sessionData = await chatHistoryService.getSession(sessionId)

            if (sessionData && sessionData.messages) {
                // Convert backend messages to frontend format
                const convertedMessages: ChatMessage[] = sessionData.messages.map((msg, index) => ({
                    id: `${sessionId}-${index}`,
                    content: msg.content,
                    role: msg.role,
                    timestamp: new Date(typeof msg.timestamp === 'number' ? msg.timestamp * 1000 : msg.timestamp),
                    tools_used: msg.tools_used || [],
                    sessionId: sessionId,
                    spotify_track_id: extractTrackIdFromMessage(msg.content, msg.tools_used) || undefined
                }))

                // Update chat state
                setMessages(convertedMessages)
                setHasStartedChat(convertedMessages.length > 0)

                // Update model if session has a different model
                if (sessionData.session.model && sessionData.session.model !== selectedModel) {
                    setSelectedModel(sessionData.session.model)
                }

                // Show success feedback
                setShowUserFeedback({
                    type: 'success',
                    message: `Loaded ${convertedMessages.length} messages`,
                    timestamp: Date.now()
                })

                // Clear feedback after 3 seconds
                setTimeout(() => setShowUserFeedback(null), 3000)

                console.log(`Loaded ${convertedMessages.length} messages from session ${sessionId}`)
            }
        } catch (error) {
            console.error('Error loading session:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            setSessionError(errorMessage)

            // Retry mechanism - up to 3 attempts
            if (retryAttempt < 2) {
                console.log(`Retrying session load in 2 seconds... (attempt ${retryAttempt + 1}/3)`)
                setTimeout(() => {
                    loadSessionMessages(sessionId, retryAttempt + 1)
                }, 2000)
                return
            }

            // Show error message in chat after all retries failed
            setMessages([{
                id: 'error-' + Date.now(),
                content: `Failed to load chat session after ${retryAttempt + 1} attempts: ${errorMessage}`,
                role: 'assistant',
                timestamp: new Date()
            }])

            // Show error feedback
            setShowUserFeedback({
                type: 'error',
                message: `Failed to load session: ${errorMessage}`,
                timestamp: Date.now()
            })

            // Clear error feedback after 5 seconds
            setTimeout(() => setShowUserFeedback(null), 5000)
        } finally {
            setIsLoadingSession(false)
        }
    }, [selectedModel])

    // Auto-create session when user starts new chat
    const createNewSession = useCallback(async (firstMessage: string, model: string) => {
        try {
            console.log('Creating new session for message:', firstMessage.substring(0, 50) + '...')
            const newSession = await chatHistoryService.createSession(firstMessage, model)

            setCurrentSessionId(newSession.id)
            triggerSessionRefresh()

            console.log('Created new session:', newSession.id, 'with title:', newSession.title)
            return newSession.id
        } catch (error) {
            console.error('Error creating session:', error)
            return null
        }
    }, [triggerSessionRefresh])

    // Enhanced message saving with retry mechanism and user feedback
    const saveMessageToSession = useCallback(async (sessionId: string, message: ChatMessage, retryAttempt: number = 0) => {
        if (!sessionId) {
            console.warn('No session ID provided for message saving')
            setSaveError('No session ID available')
            return false
        }

        setIsSavingMessage(true)
        setSaveError(null)

        try {
            const response = await fetch(`http://localhost:5000/sessions/${sessionId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-auth-token-123'
                },
                body: JSON.stringify({
                    role: message.role,
                    content: message.content,
                    timestamp: message.timestamp.getTime() / 1000, // Convert to seconds
                    model: message.sessionId ? selectedModel : selectedModel, // Use current model
                    tools_used: message.tools_used || [],
                    auth_token: 'test-auth-token-123'
                }),
                credentials: 'include'
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            console.log(`Message saved to session ${sessionId}:`, message.role, message.content.substring(0, 50) + '...')

            // Show success feedback for user messages (less intrusive for assistant messages)
            if (message.role === 'user') {
                setShowUserFeedback({
                    type: 'success',
                    message: 'Message saved',
                    timestamp: Date.now()
                })
                setTimeout(() => setShowUserFeedback(null), 2000)
            }

            return true
        } catch (error) {
            console.error('Error saving message to session:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            setSaveError(errorMessage)

            // Retry mechanism - up to 2 attempts for message saving
            if (retryAttempt < 1) {
                console.log(`Retrying message save in 1 second... (attempt ${retryAttempt + 1}/2)`)
                setTimeout(() => {
                    saveMessageToSession(sessionId, message, retryAttempt + 1)
                }, 1000)
                return false
            }

            // Show error feedback after all retries failed
            setShowUserFeedback({
                type: 'error',
                message: `Failed to save message: ${errorMessage}`,
                timestamp: Date.now()
            })
            setTimeout(() => setShowUserFeedback(null), 4000)

            // Don't throw error to prevent chat from breaking
            return false
        } finally {
            setIsSavingMessage(false)
        }
    }, [selectedModel])

    // Update session metadata when messages are added
    const updateSessionAfterMessage = useCallback(async (sessionId: string, isUserMessage: boolean) => {
        if (!sessionId) return

        try {
            // Trigger sidebar refresh to show updated session info
            triggerSessionRefresh()

            // Log session update
            console.log(`Session ${sessionId} updated after ${isUserMessage ? 'user' : 'assistant'} message`)
        } catch (error) {
            console.error('Error updating session after message:', error)
        }
    }, [triggerSessionRefresh])

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = async () => {
            setIsCheckingAuth(true)
            try {
                const user = await authService.getCurrentUser()
                setIsAuthenticated(!!user)
                setCurrentUser(user)
            } catch (error) {
                console.error('Auth check error:', error)
                setIsAuthenticated(false)
                setCurrentUser(null)
            } finally {
                setIsCheckingAuth(false)
            }
        }

        checkAuth()
    }, [])

    // Load initial session if provided and authenticated
    useEffect(() => {
        if (isAuthenticated && initialSessionId && initialSessionId !== currentSessionId) {
            setCurrentSessionId(initialSessionId)
            loadSessionMessages(initialSessionId)
        }
    }, [initialSessionId, currentSessionId, loadSessionMessages, isAuthenticated])

    const defaultSendMessage = useCallback(async (message: string, model: string) => {
        // Default implementation - replace with your API call
        const response = await fetch('http://localhost:5000/chat', {
            method: 'POST',
            headers: authService.getAuthHeaders(),
            body: JSON.stringify({
                message,
                model: model
            }),
            credentials: 'include'
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        return await response.json()
    }, [])

    const handleSendMessage = useCallback(async () => {
        if (!input.trim() || isLoading) return

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            content: input.trim(),
            role: 'user',
            timestamp: new Date()
        }

        // Clear input and set loading state immediately
        setInput('')
        setIsLoading(true)

        // Determine if this is the first message of a new chat
        const isFirstMessage = !hasStartedChat && !currentSessionId

        // Create new session if this is the first message and no current session
        let sessionId = currentSessionId
        if (isFirstMessage) {
            console.log('First message detected, creating new session...')
            sessionId = await createNewSession(userMessage.content, selectedModel)
            if (sessionId) {
                userMessage.sessionId = sessionId
                console.log('Session created successfully:', sessionId)
            } else {
                console.warn('Failed to create session, continuing without persistence')
            }
        } else if (sessionId) {
            // Link message to existing session
            userMessage.sessionId = sessionId
        }

        // Add user message and start chat mode
        setMessages(prev => [...prev, userMessage])
        setHasStartedChat(true)

        // Add loading message
        const loadingMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: '',
            role: 'assistant',
            timestamp: new Date(),
            isLoading: true,
            sessionId: sessionId || undefined
        }
        setMessages(prev => [...prev, loadingMessage])

        try {
            // Call the onSendMessage prop or default behavior
            const response = onSendMessage ?
                await onSendMessage(userMessage.content, selectedModel) :
                await defaultSendMessage(userMessage.content, selectedModel)

            // Extract track ID and clean content
            const trackId = response.spotify_track_id || extractTrackIdFromMessage(
                response.response || '',
                response.tools_used
            );
            console.log('🎵 Frontend - API Response:', response);
            console.log('🎵 Frontend - Track ID:', trackId);
            console.log('🎵 Frontend - Tools Used:', response.tools_used);

            // Clean content by removing embedded track ID
            const cleanContent = (response.response || 'I received your message!').replace(/\s*\[TRACK_ID:[a-zA-Z0-9]{22}\]/i, '');

            // Create assistant message
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 2).toString(),
                content: cleanContent,
                role: 'assistant',
                timestamp: new Date(),
                tools_used: response.tools_used || [],
                sessionId: sessionId || undefined,
                spotify_track_id: trackId
            }

            // Remove loading message and add real response
            setMessages(prev => {
                const filtered = prev.filter(msg => !msg.isLoading)
                return [...filtered, assistantMessage]
            })

            // Save messages to session if we have a session ID
            if (sessionId) {
                console.log('Saving messages to session:', sessionId)

                // Save user message first
                const userSaved = await saveMessageToSession(sessionId, userMessage)
                if (userSaved) {
                    console.log('User message saved successfully')
                    // Update session after user message
                    await updateSessionAfterMessage(sessionId, true)
                }

                // Save assistant message
                const assistantSaved = await saveMessageToSession(sessionId, assistantMessage)
                if (assistantSaved) {
                    console.log('Assistant message saved successfully')
                    // Update session after assistant message
                    await updateSessionAfterMessage(sessionId, false)
                }

                // Final session refresh to update sidebar
                triggerSessionRefresh()
            } else {
                console.warn('No session ID available for message persistence')
            }

        } catch (error) {
            console.error('Error in handleSendMessage:', error)

            // Create error message
            const errorMessage: ChatMessage = {
                id: (Date.now() + 2).toString(),
                content: 'Sorry, I encountered an error. Please try again.',
                role: 'assistant',
                timestamp: new Date(),
                sessionId: sessionId || undefined
            }

            // Remove loading message and add error
            setMessages(prev => {
                const filtered = prev.filter(msg => !msg.isLoading)
                return [...filtered, errorMessage]
            })

            // Save error message to session if we have a session ID
            if (sessionId) {
                await saveMessageToSession(sessionId, errorMessage)
                await updateSessionAfterMessage(sessionId, false)
            }
        } finally {
            setIsLoading(false)
        }
    }, [input, isLoading, onSendMessage, defaultSendMessage, selectedModel, currentSessionId, hasStartedChat, createNewSession, saveMessageToSession, updateSessionAfterMessage, triggerSessionRefresh])

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }

        // The @ character handling is now managed by the MentionTextarea component
    }, [handleSendMessage])

    const handleToolSelect = useCallback((prompt: string) => {
        // Check if this is an @mention format (starts with @)
        const isMention = prompt.startsWith('@')

        // Set the input value
        setInput(prompt)

        // Focus the textarea after tool selection
        const textarea = hasStartedChat ? chatTextareaRef.current : welcomeTextareaRef.current
        if (textarea) {
            textarea.focus()
            // Move cursor to end
            if (textarea.setSelectionRange) {
                setTimeout(() => {
                    textarea.setSelectionRange(prompt.length, prompt.length)
                }, 0)
            }
        }

        // If it's a mention format and ends with space, it's a completed mention
        // We could trigger special behavior here if needed
        if (isMention && prompt.endsWith(' ')) {
            const toolName = prompt.slice(1, -1).trim()
            console.log(`Tool selected via @mention: ${toolName}`)
            // Additional tool-specific logic could go here
        }
    }, [hasStartedChat])

    const handleModelChange = useCallback((modelId: string) => {
        setSelectedModel(modelId)
        console.log('Model changed to:', modelId)
    }, [])

    // Retry handlers for failed operations
    const handleRetrySessionLoad = useCallback(() => {
        if (currentSessionId) {
            setRetryCount(prev => prev + 1)
            loadSessionMessages(currentSessionId)
        }
    }, [currentSessionId, loadSessionMessages])

    const handleRetryMessageSave = useCallback(async (message: ChatMessage) => {
        if (currentSessionId) {
            await saveMessageToSession(currentSessionId, message)
        }
    }, [currentSessionId, saveMessageToSession])

    // Clear user feedback handler
    const handleClearFeedback = useCallback(() => {
        setShowUserFeedback(null)
    }, [])

    // Sidebar handlers
    const handleSidebarOpenChange = useCallback((isOpen: boolean) => {
        setSidebarOpen(isOpen)
    }, [])

    const handleSessionSelect = useCallback(async (sessionId: string) => {
        if (sessionId === currentSessionId) return // Already selected

        // Start transition animation
        setIsTransitioningSession(true)

        // Show transition feedback
        setShowUserFeedback({
            type: 'info',
            message: 'Switching conversation...',
            timestamp: Date.now()
        })

        try {
            setCurrentSessionId(sessionId)
            await loadSessionMessages(sessionId)

            // Clear transition feedback after successful load
            setTimeout(() => setShowUserFeedback(null), 1500)
        } catch (error) {
            console.error('Error during session transition:', error)
            setShowUserFeedback({
                type: 'error',
                message: 'Failed to switch conversation',
                timestamp: Date.now()
            })
            setTimeout(() => setShowUserFeedback(null), 3000)
        } finally {
            // End transition animation with a slight delay for smooth effect
            setTimeout(() => setIsTransitioningSession(false), 300)
        }
    }, [currentSessionId, loadSessionMessages])

    const handleNewChat = useCallback(() => {
        // Clear all chat state for new session
        setMessages([])
        setInput('')
        setHasStartedChat(false)
        setCurrentSessionId(null)
        setSessionError(null)
        setSaveError(null)
        setIsLoadingSession(false)
        setIsSavingMessage(false)
        setIsTransitioningSession(false)

        // Clear user feedback
        setShowUserFeedback(null)

        // Show user feedback for new chat creation
        setShowUserFeedback({
            type: 'success',
            message: 'New chat started',
            timestamp: Date.now()
        })

        // Clear feedback after 2 seconds
        setTimeout(() => setShowUserFeedback(null), 2000)

        // Focus the input field for immediate typing
        setTimeout(() => {
            const textarea = welcomeTextareaRef.current
            if (textarea) {
                textarea.focus()
            }
        }, 100)

        console.log('New chat started - all session state cleared')
    }, [])

    // Handle successful login
    const handleLoginSuccess = useCallback(() => {
        setIsAuthenticated(true)
        setCurrentUser(authService.getUser())
        setShowUserFeedback({
            type: 'success',
            message: 'Login successful!',
            timestamp: Date.now()
        })
        setTimeout(() => setShowUserFeedback(null), 3000)
    }, [])

    // Handle logout
    const handleLogout = useCallback(async () => {
        try {
            await authService.logout()
            setIsAuthenticated(false)
            setCurrentUser(null)
            setMessages([])
            setHasStartedChat(false)
            setCurrentSessionId(null)
            setShowUserFeedback({
                type: 'info',
                message: 'You have been logged out',
                timestamp: Date.now()
            })
            setTimeout(() => setShowUserFeedback(null), 3000)
        } catch (error) {
            console.error('Logout error:', error)
        }
    }, [])

    // Show loading state while checking authentication
    if (isCheckingAuth) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    // Show animated login form if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="h-screen flex items-center justify-center p-4">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-orange-500/10 rounded-full"
                            initial={{
                                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                                scale: 0
                            }}
                            animate={{
                                y: [null, -100],
                                scale: [0, 1, 0],
                                opacity: [0, 0.6, 0]
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: i * 0.5,
                                ease: "easeOut"
                            }}
                        />
                    ))}
                </div>

                <AnimatedAuthForm onLoginSuccess={handleLoginSuccess} />
            </div>
        )
    }

    return (
        <SessionErrorBoundary
            onError={(error, errorInfo) => {
                console.error('Session error boundary triggered:', error, errorInfo)
                setShowUserFeedback({
                    type: 'error',
                    message: 'A session error occurred. Please try refreshing.',
                    timestamp: Date.now()
                })
            }}
        >
            <div className={cn("h-screen relative", className)}>
                {/* User Feedback Notifications */}
                <UserFeedbackNotification
                    feedback={showUserFeedback}
                    onClose={handleClearFeedback}
                />

                {/* Session Loading Indicator */}
                <SessionLoadingIndicator
                    isLoading={isLoadingSession}
                    error={sessionError}
                    onRetry={handleRetrySessionLoad}
                />

                {/* User Info & Logout Button */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                    className="absolute top-3 right-3 z-50 flex items-center gap-2 p-2 glass-morphism rounded-lg border border-border/50 shadow-md"
                    whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                >
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-medium">
                            {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="text-sm font-medium">
                            {currentUser?.username}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs hover:bg-red-500/10 hover:text-red-600 transition-colors"
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </motion.div>

                {/* Sidebar Integration */}
                <ModernSidebar
                    onSessionSelect={handleSessionSelect}
                    onNewChat={handleNewChat}
                    currentSessionId={currentSessionId || undefined}
                    onOpenChange={handleSidebarOpenChange}
                    refreshTrigger={sessionRefreshTrigger}
                />

                {/* Main Chat Area with Enhanced Responsive Layout Adjustments */}
                <motion.div
                    animate={{
                        marginLeft: sidebarOpen && isDesktop ? 320 : 0,
                        opacity: isTransitioningSession ? 0.7 : 1,
                        scale: isTransitioningSession ? 0.98 : 1
                    }}
                    transition={{
                        marginLeft: { type: "spring", damping: 20, stiffness: 300 },
                        opacity: { duration: 0.2 },
                        scale: { duration: 0.2 }
                    }}
                    className="h-full"
                >
                    <AnimatePresence mode="wait">
                        {!hasStartedChat ? (
                            <motion.div
                                key="welcome"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <WelcomeScreen
                                    input={input}
                                    isLoading={isLoading}
                                    selectedModel={selectedModel}
                                    handleInputChange={handleInputChange}
                                    handleKeyPress={handleKeyPress}
                                    handleSendMessage={handleSendMessage}
                                    handleToolSelect={handleToolSelect}
                                    handleModelChange={handleModelChange}
                                    welcomeTextareaRef={welcomeTextareaRef}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key={`chat-${currentSessionId || 'new'}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChatInterface
                                    messages={messages}
                                    input={input}
                                    isLoading={isLoading}
                                    selectedModel={selectedModel}
                                    handleInputChange={handleInputChange}
                                    handleKeyPress={handleKeyPress}
                                    handleSendMessage={handleSendMessage}
                                    handleToolSelect={handleToolSelect}
                                    handleModelChange={handleModelChange}
                                    chatTextareaRef={chatTextareaRef}
                                    messagesEndRef={messagesEndRef}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </SessionErrorBoundary>
    )
}