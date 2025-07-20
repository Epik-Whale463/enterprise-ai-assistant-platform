"use client"

import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = React.forwardRef<
    React.ElementRef<typeof HoverCardPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> & {
        animated?: boolean
    }
>(({ className, align = "center", sideOffset = 4, animated = true, children, ...props }, ref) => {
    if (!animated) {
        return (
            <HoverCardPrimitive.Content
                ref={ref}
                align={align}
                sideOffset={sideOffset}
                className={cn(
                    "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
                    className
                )}
                {...props}
            >
                {children}
            </HoverCardPrimitive.Content>
        )
    }

    return (
        <HoverCardPrimitive.Content
            ref={ref}
            align={align}
            sideOffset={sideOffset}
            className={cn(
                "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
                className
            )}
            {...props}
            asChild
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{
                    duration: 0.2,
                    ease: "easeOut"
                }}
            >
                {children}
            </motion.div>
        </HoverCardPrimitive.Content>
    )
})
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }