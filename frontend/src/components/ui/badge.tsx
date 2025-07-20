import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:-translate-y-0.5 shadow-sm hover:shadow-md",
    {
        variants: {
            variant: {
                default:
                    "border-transparent gradient-warm text-white shadow-lg",
                secondary:
                    "border-glass-border glass-card text-foreground hover:glass-strong",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                outline: "border-glass-border glass-card text-foreground hover:glass-strong",
                warm: "gradient-warm text-white shadow-lg",
                glass: "glass-card border-glass-border text-foreground hover:glass-strong",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }