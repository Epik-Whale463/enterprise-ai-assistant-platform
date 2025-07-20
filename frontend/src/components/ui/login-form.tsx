"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/lib/auth-service'

interface LoginFormProps {
    onLoginSuccess: () => void
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
    const [isLogin, setIsLogin] = useState(true)
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            if (isLogin) {
                await authService.login(username, password)
            } else {
                await authService.register(username, email, password)
            }
            onLoginSuccess()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Authentication failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md mx-auto p-8 rounded-xl glass-card shadow-xl"
        >
            <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-2xl font-semibold text-center mb-6"
            >
                {isLogin ? 'Welcome Back' : 'Create Account'}
            </motion.h2>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 mb-4 text-sm bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg"
                >
                    {error}
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium mb-1">
                        Username
                    </label>
                    <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full glass-input"
                        placeholder="Enter your username"
                        disabled={isLoading}
                    />
                </div>

                {!isLogin && (
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">
                            Email
                        </label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required={!isLogin}
                            className="w-full glass-input"
                            placeholder="Enter your email"
                            disabled={isLoading}
                        />
                    </div>
                )}

                <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1">
                        Password
                    </label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full glass-input"
                        placeholder="Enter your password"
                        disabled={isLoading}
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full glass-button text-white"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isLogin ? 'Logging in...' : 'Creating account...'}
                        </span>
                    ) : (
                        <>{isLogin ? 'Login' : 'Register'}</>
                    )}
                </Button>

                <div className="text-center mt-4">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-orange-600 hover:text-orange-700"
                    >
                        {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
                    </button>
                </div>
            </form>
        </motion.div>
    )
}