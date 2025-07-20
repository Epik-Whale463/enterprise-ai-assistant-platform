"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedListProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode[]
    stagger?: number
    direction?: "up" | "down" | "left" | "right"
}

const AnimatedList = React.forwardRef<HTMLDivElement, AnimatedListProps>(
    ({ className, children, stagger = 0.1, direction = "up", ...props }, ref) => {
        const getInitialPosition = () => {
            switch (direction) {
                case "up": return { y: 20, opacity: 0 }
                case "down": return { y: -20, opacity: 0 }
                case "left": return { x: 20, opacity: 0 }
                case "right": return { x: -20, opacity: 0 }
                default: return { y: 20, opacity: 0 }
            }
        }

        return (
            <div ref={ref} className={cn("space-y-2", className)} {...props}>
                <AnimatePresence>
                    {React.Children.map(children, (child, index) => (
                        <motion.div
                            key={index}
                            initial={getInitialPosition()}
                            animate={{ x: 0, y: 0, opacity: 1 }}
                            exit={getInitialPosition()}
                            transition={{
                                duration: 0.3,
                                delay: index * stagger,
                                ease: "easeOut"
                            }}
                        >
                            {child}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        )
    }
)
AnimatedList.displayName = "AnimatedList"

interface AnimatedListItemProps extends React.HTMLAttributes<HTMLDivElement> {
    delay?: number
}

const AnimatedListItem = React.forwardRef<HTMLDivElement, AnimatedListItemProps>(
    ({ className, delay = 0, children, ...props }, ref) => {
        // Separate motion-incompatible props
        const { onAnimationStart, onAnimationEnd, ...divProps } = props as any

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{
                    duration: 0.3,
                    delay,
                    ease: "easeOut"
                }}
                whileHover={{ x: 4 }}
                className={cn("transition-colors", className)}
                {...divProps}
            >
                {children}
            </motion.div>
        )
    }
)
AnimatedListItem.displayName = "AnimatedListItem"

export { AnimatedList, AnimatedListItem }