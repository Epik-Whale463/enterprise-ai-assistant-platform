"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
        animated?: boolean
        showValue?: boolean
    }
>(({ className, value, animated = true, showValue = false, ...props }, ref) => (
    <div className="relative">
        <ProgressPrimitive.Root
            ref={ref}
            className={cn(
                "relative h-4 w-full overflow-hidden rounded-full glass-card border-glass-border shadow-inner",
                className
            )}
            {...props}
        >
            <ProgressPrimitive.Indicator
                className="h-full w-full flex-1 bg-primary transition-all"
                style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
                asChild={animated}
            >
                {animated ? (
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: `${-(100 - (value || 0))}%` }}
                        transition={{
                            duration: 0.5,
                            ease: "easeOut",
                            type: "spring",
                            stiffness: 100
                        }}
                        className="h-full gradient-warm rounded-full shadow-lg"
                    />
                ) : (
                    <div />
                )}
            </ProgressPrimitive.Indicator>
        </ProgressPrimitive.Root>
        {showValue && (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center text-xs font-medium text-primary-foreground"
            >
                {value}%
            </motion.div>
        )}
    </div>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }