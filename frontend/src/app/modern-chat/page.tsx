"use client"

import { ModernChat } from '@/components/ui/modern-chat'
import { useToast } from '@/hooks/use-toast'
import Iridescence from '@/components/ui/Iridescence'
import { GlassBackground } from '@/components/ui/GlassBackground'

export default function ModernChatPage() {
    const { toast } = useToast()

    const handleSendMessage = async (message: string, model?: string) => {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minute timeout

            // Get auth token from localStorage if available
            const userJson = localStorage.getItem('currentUser')
            let authToken = null
            if (userJson) {
                try {
                    const user = JSON.parse(userJson)
                    authToken = user.auth_token
                } catch (e) {
                    console.error('Failed to parse user from localStorage', e)
                }
            }

            const response = await fetch('http://localhost:5000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                },
                body: JSON.stringify({
                    message,
                    model: model || 'ollama-qwen2.5',
                    auth_token: authToken // Include auth token in request body as well
                }),
                signal: controller.signal,
                credentials: 'include' // This ensures cookies are sent with the request
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.error) {
                toast({
                    title: "❌ Error",
                    description: data.error,
                    variant: "destructive",
                })
                throw new Error(data.error)
            }

            if (data.tools_used && data.tools_used.length > 0) {
                toast({
                    title: "🔧 Tools Activated",
                    description: `Successfully used: ${data.tools_used.join(', ')}`,
                    variant: "default",
                })
            }

            return data
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            toast({
                title: "🌐 Network Error",
                description: errorMessage,
                variant: "destructive",
            })

            throw error
        }
    }

    return (
        <>
            <GlassBackground />
            <Iridescence
                color={[0.4, 0.3, 0.5]}
                mouseReact={true}
                amplitude={0.5}
                speed={0.7}
            />
            <ModernChat onSendMessage={handleSendMessage} />
        </>
    )
}