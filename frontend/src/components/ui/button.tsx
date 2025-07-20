import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 hover:-translate-y-0.5 relative overflow-hidden",
    {
        variants: {
            variant: {
                default: "gradient-warm text-white shadow-lg hover:shadow-xl before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive-hover shadow-md hover:shadow-lg",
                outline:
                    "glass-card border-glass-border hover:glass-strong shadow-sm hover:shadow-md backdrop-blur-xl",
                secondary:
                    "glass-card text-foreground hover:glass-strong shadow-sm hover:shadow-md backdrop-blur-xl",
                ghost: "hover:glass-strong hover:text-accent-foreground rounded-lg backdrop-blur-sm",
                link: "text-primary underline-offset-4 hover:underline hover:text-primary-hover bg-transparent shadow-none hover:shadow-none hover:translate-y-0",
                success: "bg-success text-success-foreground hover:bg-success-hover shadow-md hover:shadow-lg",
                warning: "bg-warning text-warning-foreground hover:bg-warning-hover shadow-md hover:shadow-lg",
                warm: "gradient-warm text-white shadow-lg hover:shadow-xl before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
                glass: "glass-card border-glass-border hover:glass-strong backdrop-blur-xl shadow-lg hover:shadow-xl",
                gradient: "bg-gradient-to-r from-primary via-gradient-accent to-gradient-end text-white shadow-lg hover:shadow-xl hover:from-primary/90 hover:via-gradient-accent/90 hover:to-gradient-end/90",
                shimmer: "gradient-warm text-white shadow-lg hover:shadow-xl relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700",
            },
            size: {
                default: "h-12 px-6 py-3",
                sm: "h-9 rounded-lg px-4 text-xs",
                lg: "h-14 rounded-2xl px-8 text-base",
                icon: "h-12 w-12",
                xs: "h-8 rounded-md px-3 text-xs",
                xl: "h-16 rounded-2xl px-10 text-lg",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }