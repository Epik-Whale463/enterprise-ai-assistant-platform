"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = React.forwardRef<
    React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
    React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent> & {
        animated?: boolean
    }
>(({ className, children, animated = true, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)

    React.useEffect(() => {
        const currentRef = typeof ref === 'function' ? null : ref?.current
        const trigger = currentRef?.previousElementSibling as HTMLElement
        if (trigger) {
            const handleClick = () => {
                setIsOpen(prev => !prev)
            }
            trigger.addEventListener('click', handleClick)
            return () => trigger.removeEventListener('click', handleClick)
        }
    }, [ref])

    if (!animated) {
        return (
            <CollapsiblePrimitive.CollapsibleContent
                ref={ref}
                className={className}
                {...props}
            >
                {children}
            </CollapsiblePrimitive.CollapsibleContent>
        )
    }

    return (
        <CollapsiblePrimitive.CollapsibleContent
            ref={ref}
            className={cn("overflow-hidden", className)}
            {...props}
            asChild
        >
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                            duration: 0.3,
                            ease: "easeInOut"
                        }}
                    >
                        <motion.div
                            initial={{ y: -10 }}
                            animate={{ y: 0 }}
                            exit={{ y: -10 }}
                            transition={{ duration: 0.2, delay: 0.1 }}
                        >
                            {children}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </CollapsiblePrimitive.CollapsibleContent>
    )
})
CollapsibleContent.displayName = CollapsiblePrimitive.CollapsibleContent.displayName

export { Collapsible, CollapsibleTrigger, CollapsibleContent }