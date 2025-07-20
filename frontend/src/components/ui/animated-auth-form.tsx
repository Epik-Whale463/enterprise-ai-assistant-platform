"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/lib/auth-service'
import { CheckCircle, XCircle, Loader2, ArrowRight, ArrowLeft, User, Mail, Lock } from 'lucide-react'

interface AnimatedAuthFormProps {
    onLoginSuccess: () => void
}

export function AnimatedAuthForm({ onLoginSuccess }: AnimatedAuthFormProps) {
    const [isLogin, setIsLogin] = useState(true)
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setIsLoading(true)

        try {
            if (isLogin) {
                await authService.login(username, password)
                setSuccess('Login successful!')
                setTimeout(() => {
                    onLoginSuccess()
                }, 1000)
            } else {
                await authService.register(username, email, password)
                setSuccess('Account created successfully! Logging you in...')
                setTimeout(() => {
                    onLoginSuccess()
                }, 1500)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Authentication failed')
        } finally {
            setIsLoading(false)
        }
    }

    const toggleMode = () => {
        // Reset form when switching modes
        setError('')
        setSuccess('')
        setIsLogin(!isLogin)
    }

    return (
        <div className="relative w-full max-w-md mx-auto">
            {/* Background Elements */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
            </div>

            {/* Card Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
                className="w-full overflow-hidden rounded-2xl glass-card shadow-xl"
            >
                {/* Card Header */}
                <motion.div
                    className="relative h-32 bg-gradient-to-r from-orange-500/80 to-orange-600/80 p-6 flex items-end"
                    animate={{
                        background: isLogin
                            ? "linear-gradient(to right, rgba(249, 115, 22, 0.8), rgba(234, 88, 12, 0.8))"
                            : "linear-gradient(to right, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.8))"
                    }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Animated Shapes */}
                    <motion.div
                        className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/10"
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 0],
                            opacity: [0.5, 0.7, 0.5]
                        }}
                        transition={{ duration: 8, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute top-10 left-10 w-16 h-16 rounded-full bg-white/5"
                        animate={{
                            scale: [1, 1.3, 1],
                            x: [0, 10, 0],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 6, repeat: Infinity, delay: 1 }}
                    />

                    <motion.h2
                        className="text-2xl font-bold text-white z-10"
                        animate={{ x: isLogin ? 0 : -30, opacity: isLogin ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        Welcome Back
                    </motion.h2>

                    <motion.h2
                        className="text-2xl font-bold text-white absolute bottom-6 left-6 z-10"
                        animate={{ x: isLogin ? 30 : 0, opacity: isLogin ? 0 : 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        Create Account
                    </motion.h2>
                </motion.div>

                {/* Form Container */}
                <div className="p-6">
                    {/* Error Message */}
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 flex items-center gap-2"
                            >
                                <XCircle className="h-4 w-4 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </motion.div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 flex items-center gap-2"
                            >
                                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                <p className="text-sm">{success}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`form-${isLogin ? 'login' : 'register'}`}
                                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                {/* Username Field */}
                                <div className="space-y-2">
                                    <label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        Username
                                    </label>
                                    <Input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        className="w-full transition-all duration-200 glass-input focus:border-orange-500/50 focus:ring-orange-500/20"
                                        placeholder="Enter your username"
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Email Field - Only for Register */}
                                {!isLogin && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-2"
                                    >
                                        <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            Email
                                        </label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required={!isLogin}
                                            className="w-full transition-all duration-200 glass-input focus:border-orange-500/50 focus:ring-orange-500/20"
                                            placeholder="Enter your email"
                                            disabled={isLoading}
                                        />
                                    </motion.div>
                                )}

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                        Password
                                    </label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full transition-all duration-200 glass-input focus:border-orange-500/50 focus:ring-orange-500/20"
                                        placeholder="Enter your password"
                                        disabled={isLoading}
                                    />
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Submit Button */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button
                                type="submit"
                                className="w-full h-11 glass-button text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {isLogin ? 'Logging in...' : 'Creating account...'}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        {isLogin ? 'Login' : 'Create Account'}
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                )}
                            </Button>
                        </motion.div>
                    </form>

                    {/* Toggle Mode Button */}
                    <div className="mt-6 text-center">
                        <motion.button
                            type="button"
                            onClick={toggleMode}
                            className="text-sm text-muted-foreground hover:text-orange-600 inline-flex items-center gap-1"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isLoading}
                        >
                            {isLogin ? (
                                <>
                                    <span>Don't have an account?</span>
                                    <span className="font-medium text-orange-600">Register</span>
                                </>
                            ) : (
                                <>
                                    <ArrowLeft className="h-3 w-3" />
                                    <span>Back to login</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}