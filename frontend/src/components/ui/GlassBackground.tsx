import React from 'react';
import { motion } from 'framer-motion';

export function GlassBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden">
            {/* Main gradient background */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
                style={{
                    backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.6) 100%)'
                }}
            />

            {/* Animated gradient orbs */}
            <motion.div
                className="absolute top-[10%] left-[15%] w-[40vw] h-[40vw] rounded-full bg-blue-500/20 blur-[120px]"
                animate={{
                    x: [0, 30, 0],
                    y: [0, -30, 0],
                    opacity: [0.2, 0.3, 0.2],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <motion.div
                className="absolute bottom-[20%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-purple-500/20 blur-[100px]"
                animate={{
                    x: [0, -40, 0],
                    y: [0, 40, 0],
                    opacity: [0.15, 0.25, 0.15],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
            />

            <motion.div
                className="absolute top-[40%] right-[30%] w-[25vw] h-[25vw] rounded-full bg-orange-500/20 blur-[80px]"
                animate={{
                    x: [0, 50, 0],
                    y: [0, 20, 0],
                    opacity: [0.1, 0.2, 0.1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 5
                }}
            />

            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Light noise texture */}
            <div
                className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />
        </div>
    );
}