"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MessageCircle, Wrench, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navigation() {
    const pathname = usePathname()

    return (
        <nav className="flex justify-center gap-4 mb-8">
            <Button
                asChild
                variant={pathname === '/' ? 'default' : 'outline'}
                className={cn(
                    "relative overflow-hidden transition-all duration-300",
                    pathname === '/' && "bg-gradient-to-r from-blue-600 to-purple-600"
                )}
            >
                <Link href="/" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Chat
                </Link>
            </Button>

            <Button
                asChild
                variant={pathname === '/modern-chat' ? 'default' : 'outline'}
                className={cn(
                    "relative overflow-hidden transition-all duration-300",
                    pathname === '/modern-chat' && "bg-gradient-to-r from-orange-500 to-red-500"
                )}
            >
                <Link href="/modern-chat" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Modern Chat
                </Link>
            </Button>

            <Button
                asChild
                variant={pathname === '/tools' ? 'default' : 'outline'}
                className={cn(
                    "relative overflow-hidden transition-all duration-300",
                    pathname === '/tools' && "bg-gradient-to-r from-blue-600 to-purple-600"
                )}
            >
                <Link href="/tools" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Tools
                </Link>
            </Button>
        </nav>
    )
}