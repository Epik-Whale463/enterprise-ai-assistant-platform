"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Cloud,
    Music,
    Search,
    Pause,
    SkipForward,
    Newspaper,
    BookOpen,
    Volume2,
    Brain,
    Mic,
    FileText,
    Globe,
    Play,
    Info
} from 'lucide-react'

const tools = [
    {
        name: "Weather",
        icon: Cloud,
        description: "Get current weather conditions for any city worldwide",
        category: "Information",
        usage: "Ask about weather in any location",
        examples: ["What's the weather in Tokyo?", "Is it raining in London?"]
    },
    {
        name: "Music Control",
        icon: Music,
        description: "Control Spotify playback, search tracks, and manage playlists",
        category: "Entertainment",
        usage: "Control your Spotify music",
        examples: ["Play some jazz", "What's currently playing?", "Skip this song"]
    },
    {
        name: "Web Search",
        icon: Search,
        description: "Search the web for the latest information on any topic",
        category: "Information",
        usage: "Search for current information",
        examples: ["Search for latest AI news", "Find Python tutorials"]
    },
    {
        name: "Pause Music",
        icon: Pause,
        description: "Pause current music playback",
        category: "Entertainment",
        usage: "Pause your music",
        examples: ["Pause music", "Stop playing"]
    },
    {
        name: "Skip Track",
        icon: SkipForward,
        description: "Skip to the next track in your playlist",
        category: "Entertainment",
        usage: "Skip songs",
        examples: ["Skip track", "Next song", "Skip this"]
    },
    {
        name: "News",
        icon: Newspaper,
        description: "Get the latest headlines and breaking news on any topic",
        category: "Information",
        usage: "Get current news",
        examples: ["Latest tech news", "News about climate change"]
    },
    {
        name: "Wikipedia",
        icon: BookOpen,
        description: "Look up information from Wikipedia",
        category: "Knowledge",
        usage: "Get encyclopedic information",
        examples: ["What is machine learning?", "Tell me about Einstein"]
    },
    {
        name: "Volume Control",
        icon: Volume2,
        description: "Control audio volume levels",
        category: "Entertainment",
        usage: "Adjust music volume",
        examples: ["Set volume to 70", "Turn volume up", "Make it quieter"]
    },
    {
        name: "Sequential Thinking",
        icon: Brain,
        description: "Step-by-step reasoning and complex problem solving",
        category: "Analysis",
        usage: "Complex reasoning tasks",
        examples: ["Think step by step about climate change", "Analyze this problem"]
    },
    {
        name: "Lyrics",
        icon: Mic,
        description: "Get lyrics for the currently playing song",
        category: "Entertainment",
        usage: "Get song lyrics",
        examples: ["Get lyrics", "What are the words to this song?"]
    },
    {
        name: "Resume Processing",
        icon: FileText,
        description: "Parse and analyze PDF resumes",
        category: "Document",
        usage: "Process resume documents",
        examples: ["Process my resume", "Analyze this CV"]
    },
    {
        name: "Web Scraping",
        icon: Globe,
        description: "Extract content from web pages",
        category: "Information",
        usage: "Scrape web content",
        examples: ["Scrape this webpage", "Get content from URL"]
    }
]

const categories = ["All", "Information", "Entertainment", "Knowledge", "Analysis", "Document"]

export default function ToolsPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Available Tools
                </h1>
                <p className="text-slate-600">
                    Explore all the powerful tools and capabilities available in the AI Assistant
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{tools.length}</div>
                        <div className="text-sm text-slate-600">Total Tools</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">5</div>
                        <div className="text-sm text-slate-600">Categories</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">24/7</div>
                        <div className="text-sm text-slate-600">Availability</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">∞</div>
                        <div className="text-sm text-slate-600">Requests</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all duration-200">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <tool.icon className="h-8 w-8 text-blue-600" />
                                <Badge variant="secondary">{tool.category}</Badge>
                            </div>
                            <CardTitle className="text-lg">{tool.name}</CardTitle>
                            <CardDescription>{tool.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-2">Usage:</h4>
                                <p className="text-sm text-slate-600">{tool.usage}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm mb-2">Examples:</h4>
                                <ul className="space-y-1">
                                    {tool.examples.map((example, i) => (
                                        <li key={i} className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                            "{example}"
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* How to Use */}
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        How to Use Tools
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2">Natural Language</h3>
                            <p className="text-sm text-slate-600 mb-2">
                                Simply describe what you want in natural language. The AI will automatically detect and use the appropriate tools.
                            </p>
                            <div className="bg-slate-100 p-3 rounded text-sm">
                                <strong>Example:</strong> "What's the weather like in Paris and play some relaxing music"
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Tool Combinations</h3>
                            <p className="text-sm text-slate-600 mb-2">
                                Multiple tools can be used together in a single request for complex tasks.
                            </p>
                            <div className="bg-slate-100 p-3 rounded text-sm">
                                <strong>Example:</strong> "Search for news about AI and summarize the key points"
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}