"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

export class SessionErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Session Error Boundary caught an error:', error, errorInfo)
        this.setState({ errorInfo })
        this.props.onError?.(error, errorInfo)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
    }

    handleGoHome = () => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center min-h-screen p-8 bg-background"
                >
                    <div className="max-w-md w-full text-center space-y-6">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="flex justify-center"
                        >
                            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>
                        </motion.div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-foreground">
                                Session Error
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Something went wrong with the chat session. This might be due to a network issue or server problem.
                            </p>
                        </div>

                        {this.state.error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ delay: 0.2 }}
                                className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 text-left"
                            >
                                <p className="text-xs font-mono text-red-600 break-all">
                                    {this.state.error.message}
                                </p>
                            </motion.div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                onClick={this.handleRetry}
                                className="flex items-center gap-2"
                                variant="default"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Try Again
                            </Button>
                            <Button
                                onClick={this.handleGoHome}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Home className="h-4 w-4" />
                                Reload Page
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            If the problem persists, please check your internet connection or try refreshing the page.
                        </p>
                    </div>
                </motion.div>
            )
        }

        return this.props.children
    }
}