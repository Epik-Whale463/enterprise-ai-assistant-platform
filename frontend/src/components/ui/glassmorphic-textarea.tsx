"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface GlassmorphicTextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    variant?: "default" | "chat" | "floating"
}

const GlassmorphicTextarea = React.forwardRef<HTMLTextAreaElement, GlassmorphicTextareaProps>(
    ({ className, variant = "default", ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false)

        const getVariantStyles = () => {
            switch (variant) {
                case "chat":
                    return "glass-card border-glass-border backdrop-blur-xl shadow-2xl"
                case "floating":
                    return "bg-gradient-to-br from-glass-medium to-glass-light backdrop-blur-2xl border border-glass-border shadow-xl"
                default:
                    return "glass-card border-glass-border backdrop-blur-lg shadow-lg"
            }
        }

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative"
            >
                <textarea
                    className={cn(
                        "flex min-h-[60px] w-full rounded-2xl px-4 py-3 text-base font-medium transition-all duration-300",
                        "placeholder:text-muted-foreground text-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "resize-none overflow-hidden",
                        getVariantStyles(),
                        isFocused && "ring-2 ring-primary/50 scale-[1.02] shadow-2xl border-primary/30",
                        className
                    )}
                    ref={ref}
                    onFocus={(e) => {
                        setIsFocused(true)
                        props.onFocus?.(e)
                    }}
                    onBlur={(e) => {
                        setIsFocused(false)
                        props.onBlur?.(e)
                    }}
                    {...props}
                />

                {/* Warm glassmorphic overlay effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-primary/5 to-transparent pointer-events-none" />

                {/* Animated warm border glow */}
                {isFocused && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-gradient-accent/20 to-gradient-end/20 blur-sm -z-10"
                    />
                )}
            </motion.div>
        )
    }
)
GlassmorphicTextarea.displayName = "GlassmorphicTextarea"

export { GlassmorphicTextarea }