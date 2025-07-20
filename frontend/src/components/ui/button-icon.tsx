import { ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface ButtonIconProps {
    onClick?: () => void
    disabled?: boolean
    loading?: boolean
    className?: string
}

export function ButtonIcon({ onClick, disabled, loading, className }: ButtonIconProps) {
    return (
        <Button
            variant="secondary"
            size="icon"
            className={`size-12 ${className}`}
            onClick={onClick}
            disabled={disabled || loading}
            asChild
        >
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
                {loading ? (
                    <motion.div
                        className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                )}
            </motion.button>
        </Button>
    )
}