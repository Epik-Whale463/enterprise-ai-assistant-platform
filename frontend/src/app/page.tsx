import { redirect } from 'next/navigation'

export default function Home() {
    // Redirect to the modern chat interface
    redirect('/modern-chat')
}