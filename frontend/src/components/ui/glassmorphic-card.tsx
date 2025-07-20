"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const GlassmorphicCard = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        variant?: "default" | "chat" | "sidebar" | "floating"
        blur?: "sm" | "md" | "lg" | "xl" | "2xl"
        opacity?: "low" | "medium" | "high"
    }
>(({ className, variant = "default", blur = "lg", opacity = "medium", children, ...props }, ref) => {
    const getVariantStyles = () => {
        const blurMap = {
            sm: "backdrop-blur-sm",
            md: "backdrop-blur-md",
            lg: "backdrop-blur-lg",
            xl: "backdrop-blur-xl",
            "2xl": "backdrop-blur-2xl"
        }

        const opacityMap = {
            low: "bg-glass-light",
            medium: "bg-glass-medium",
            high: "bg-glass-strong"
        }

        const baseStyles = `${blurMap[blur]} ${opacityMap[opacity]} border border-glass-border`

        switch (variant) {
            case "chat":
                return `${baseStyles} shadow-xl hover:shadow-2xl rounded-2xl transition-all duration-300 hover:border-primary/30 hover:-translate-y-1`
            case "sidebar":
                return `${baseStyles} shadow-lg hover:shadow-xl rounded-xl transition-all duration-300 hover:border-primary/20 hover:-translate-y-0.5`
            case "floating":
                return `${baseStyles} shadow-2xl hover:shadow-3xl rounded-3xl bg-gradient-to-br from-glass-medium to-glass-light transition-all duration-300 hover:border-primary/40 hover:-translate-y-2`
            default:
                return `${baseStyles} shadow-md hover:shadow-lg rounded-xl transition-all duration-300 hover:border-primary/20 hover:-translate-y-0.5`
        }
    }

    // Separate motion-incompatible props
    const { onAnimationStart, onAnimationEnd, ...divProps } = props as any

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "relative overflow-hidden",
                getVariantStyles(),
                className
            )}
            {...divProps}
        >
            {/* Warm glassmorphic shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gradient-accent/5 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    )
})
GlassmorphicCard.displayName = "GlassmorphicCard"

const GlassmorphicCardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
))
GlassmorphicCardHeader.displayName = "GlassmorphicCardHeader"

const GlassmorphicCardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-2xl font-semibold leading-none tracking-tight text-foreground hover:text-primary transition-colors",
            className
        )}
        {...props}
    />
))
GlassmorphicCardTitle.displayName = "GlassmorphicCardTitle"

const GlassmorphicCardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground hover:text-foreground transition-colors", className)}
        {...props}
    />
))
GlassmorphicCardDescription.displayName = "GlassmorphicCardDescription"

const GlassmorphicCardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
GlassmorphicCardContent.displayName = "GlassmorphicCardContent"

const GlassmorphicCardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
))
GlassmorphicCardFooter.displayName = "GlassmorphicCardFooter"

export {
    GlassmorphicCard,
    GlassmorphicCardHeader,
    GlassmorphicCardFooter,
    GlassmorphicCardTitle,
    GlassmorphicCardDescription,
    GlassmorphicCardContent,
}