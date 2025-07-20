"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Music } from 'lucide-react'

interface SpotifyEmbedProps {
    trackId: string
    className?: string
}

export function SpotifyEmbed({ trackId, className }: SpotifyEmbedProps) {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);

    // Validate track ID format
    const isValidId = /^[a-zA-Z0-9]{22}$/.test(trackId);
    const embedUrl = isValidId
        ? `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`
        : '';

    // Log for debugging
    React.useEffect(() => {
        console.log(`🎵 SpotifyEmbed - Rendering with track ID: ${trackId} (valid: ${isValidId})`);
    }, [trackId, isValidId]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: 0.2
            }}
            className={className}
        >
            <Card className="overflow-hidden bg-gradient-to-br from-slate-500/5 to-slate-600/10 border-slate-500/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <motion.div
                    className="p-4"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    {/* Header */}
                    <motion.div
                        className="flex items-center gap-2 mb-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="p-1 rounded-full bg-slate-500/10"
                        >
                            <Music className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </motion.div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-400">
                            Now Playing
                        </span>
                        {isLoaded && (
                            <span className="text-xs text-green-500 ml-auto">
                                ✓ Loaded
                            </span>
                        )}
                    </motion.div>

                    {/* Spotify Embed */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                        className="rounded-xl overflow-hidden shadow-md"
                    >
                        {isValidId ? (
                            <iframe
                                data-testid="embed-iframe"
                                style={{ borderRadius: '12px', border: 'none' }}
                                src={embedUrl}
                                width="100%"
                                height="152"
                                allowFullScreen
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy"
                                className="w-full border-0"
                                onLoad={() => setIsLoaded(true)}
                                onError={() => setHasError(true)}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-[152px] bg-slate-800/20 rounded-xl text-slate-400 text-sm">
                                Invalid track ID format
                            </div>
                        )}
                    </motion.div>

                    {/* Track ID display for debugging */}
                    <div className="mt-2 text-xs text-slate-500 flex justify-between items-center">
                        <span>Track ID: {trackId}</span>
                        {hasError && (
                            <span className="text-red-500">Failed to load</span>
                        )}
                    </div>

                    {/* Subtle glow effect */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-transparent to-slate-500/5 rounded-lg blur-xl pointer-events-none"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />
                </motion.div>
            </Card>
        </motion.div>
    )
}