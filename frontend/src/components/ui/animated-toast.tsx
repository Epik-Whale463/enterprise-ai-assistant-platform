import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Viewport>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Viewport
        ref={ref}
        className={cn(
            "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
            className
        )}
        {...props}
    />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const animatedToastVariants = cva(
    "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
    {
        variants: {
            variant: {
                default: "border bg-background text-foreground",
                destructive: "border-destructive bg-destructive text-destructive-foreground",
                success: "border-green-500 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100",
                warning: "border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100",
                info: "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

const AnimatedToast = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof animatedToastVariants> & {
        showIcon?: boolean
    }
>(({ className, variant, showIcon = true, children, ...props }, ref) => {
    const getIcon = () => {
        switch (variant) {
            case "success": return <CheckCircle className="h-5 w-5 text-green-500" />
            case "destructive": return <AlertCircle className="h-5 w-5 text-red-500" />
            case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />
            case "info": return <Info className="h-5 w-5 text-blue-500" />
            default: return null
        }
    }

    return (
        <ToastPrimitives.Root
            ref={ref}
            className={cn(animatedToastVariants({ variant }), className)}
            {...props}
            asChild
        >
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.3 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 1
                }}
                layout
            >
                {showIcon && getIcon() && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                        className="flex-shrink-0"
                    >
                        {getIcon()}
                    </motion.div>
                )}
                <div className="flex-1">
                    {children}
                </div>
            </motion.div>
        </ToastPrimitives.Root>
    )
})
AnimatedToast.displayName = ToastPrimitives.Root.displayName

const AnimatedToastAction = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Action>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Action
        ref={ref}
        className={cn(
            "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            className
        )}
        {...props}
        asChild
    >
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        />
    </ToastPrimitives.Action>
))
AnimatedToastAction.displayName = ToastPrimitives.Action.displayName

const AnimatedToastClose = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Close>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Close
        ref={ref}
        className={cn(
            "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
            className
        )}
        toast-close=""
        {...props}
        asChild
    >
        <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
        >
            <X className="h-4 w-4" />
        </motion.button>
    </ToastPrimitives.Close>
))
AnimatedToastClose.displayName = ToastPrimitives.Close.displayName

const AnimatedToastTitle = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Title>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Title
        ref={ref}
        className={cn("text-sm font-semibold", className)}
        {...props}
        asChild
    >
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
        />
    </ToastPrimitives.Title>
))
AnimatedToastTitle.displayName = ToastPrimitives.Title.displayName

const AnimatedToastDescription = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Description>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Description
        ref={ref}
        className={cn("text-sm opacity-90", className)}
        {...props}
        asChild
    >
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
        />
    </ToastPrimitives.Description>
))
AnimatedToastDescription.displayName = ToastPrimitives.Description.displayName

type AnimatedToastProps = React.ComponentPropsWithoutRef<typeof AnimatedToast>
type AnimatedToastActionElement = React.ReactElement<typeof AnimatedToastAction>

export {
    type AnimatedToastProps,
    type AnimatedToastActionElement,
    ToastProvider,
    ToastViewport,
    AnimatedToast,
    AnimatedToastTitle,
    AnimatedToastDescription,
    AnimatedToastClose,
    AnimatedToastAction,
}