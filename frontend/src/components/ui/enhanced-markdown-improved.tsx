"use client"

import React from 'react'
import { motion } from 'framer-motion'

interface EnhancedMarkdownProps {
    content: string
    className?: string
}

export function EnhancedMarkdownImproved({ content, className = "" }: EnhancedMarkdownProps) {
    const renderContent = (text: string): string => {
        if (!text) return ''

        // Remove duplicate consecutive tables before processing
        let cleanedText = text.replace(/(\|[^|\n]*\|(?:\n\|[^|\n]*\|)*)\n*(\1)/g, '$1')

        let html = cleanedText
            // LaTeX Math Expressions - Block (display math)
            .replace(/\\\[([\s\S]*?)\\\]/g, '<div class="math-block my-4 p-4 bg-muted text-muted-foreground rounded-lg overflow-x-auto border border-border shadow-sm"><span class="math-display">\\[$1\\]</span></div>')

            // LaTeX Math Expressions - Inline
            .replace(/\\\((.*?)\\\)/g, '<span class="math-inline bg-accent text-accent-foreground px-2 py-1 rounded text-sm font-mono border border-border">\\($1\\)</span>')

            // Alternative LaTeX syntax - Block
            .replace(/\$\$([\s\S]*?)\$\$/g, '<div class="math-block my-4 p-4 bg-muted text-muted-foreground rounded-lg overflow-x-auto border border-border shadow-sm"><span class="math-display">$$1$$</span></div>')

            // Alternative LaTeX syntax - Inline  
            .replace(/\$([^$\n]+)\$/g, '<span class="math-inline bg-accent text-accent-foreground px-2 py-1 rounded text-sm font-mono border border-border">$1</span>')

            // Headers with consistent theming
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-foreground border-b border-border pb-2 hover:text-primary transition-colors">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-4 text-foreground border-b-2 border-primary pb-2 hover:text-primary transition-colors">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-6 text-foreground border-b-2 border-primary pb-3 hover:text-primary transition-colors">$1</h1>')

            // Enhanced code blocks with consistent theming
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                const language = lang || 'text'

                // Handle Mermaid diagrams
                if (language === 'mermaid') {
                    return `<div class="mermaid-container my-6 p-4 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div class="mermaid-diagram" data-mermaid="${code.replace(/"/g, '&quot;')}">${code}</div>
                    </div>`
                }

                // Handle mathematical plots
                if (language === 'plot' || language === 'graph') {
                    return `<div class="plot-container my-6 p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                        <div class="plot-header text-sm font-medium text-primary mb-2 flex items-center gap-2">
                            <span class="text-lg">📊</span>
                            <span>Graph/Plot</span>
                        </div>
                        <pre class="text-sm text-foreground whitespace-pre-wrap font-mono">${code}</pre>
                    </div>`
                }

                return `<div class="code-block my-4 rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div class="code-header bg-muted text-muted-foreground px-4 py-2 text-sm font-mono flex justify-between items-center border-b border-border">
                        <span class="text-primary font-semibold">${language}</span>
                        <button class="copy-btn text-xs bg-accent hover:bg-accent-hover text-accent-foreground px-2 py-1 rounded transition-colors" onclick="navigator.clipboard.writeText(\`${code.replace(/`/g, '\\`')}\`)">Copy</button>
                    </div>
                    <pre class="bg-card text-card-foreground p-4 overflow-x-auto"><code class="language-${language} text-sm">${code}</code></pre>
                </div>`
            })

            // Inline code with theme colors
            .replace(/`([^`]+)`/g, '<code class="bg-muted text-primary px-2 py-1 rounded text-sm font-mono border border-border">$1</code>')

            // Enhanced tables with consistent theming
            .replace(/(\|.+\|\n)+/g, (tableMatch) => {
                const rows = tableMatch.trim().split('\n')
                let tableHTML = '<div class="table-container overflow-x-auto my-6 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow"><table class="w-full border-collapse bg-card">'

                rows.forEach((row, index) => {
                    const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell)
                    const isHeaderSeparator = cells.every(cell => /^[-:]+$/.test(cell))

                    if (isHeaderSeparator) return

                    const isHeader = index === 0
                    const cellTag = isHeader ? 'th' : 'td'
                    const cellClass = isHeader
                        ? 'px-6 py-3 text-left font-semibold bg-muted text-muted-foreground border-b-2 border-border'
                        : 'px-6 py-4 border-b border-border text-card-foreground'

                    const cellTags = cells.map(cell =>
                        `<${cellTag} class="${cellClass}">${cell}</${cellTag}>`
                    ).join('')

                    tableHTML += `<tr class="${isHeader ? '' : 'hover:bg-accent/50 transition-colors'}">${cellTags}</tr>`
                })

                tableHTML += '</table></div>'
                return tableHTML
            })

            // Enhanced lists with theme colors
            .replace(/^\* (.+)$/gm, '<li class="ml-6 mb-2 flex items-start"><span class="text-primary mr-2 mt-1 font-bold">•</span><span class="text-foreground">$1</span></li>')
            .replace(/^- (.+)$/gm, '<li class="ml-6 mb-2 flex items-start"><span class="text-primary mr-2 mt-1 font-bold">•</span><span class="text-foreground">$1</span></li>')
            .replace(/^\d+\. (.+)$/gm, '<li class="ml-6 mb-2 list-decimal list-inside text-foreground marker:text-primary">$1</li>')

            // Enhanced blockquotes with theme colors
            .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary pl-6 py-2 my-4 bg-primary/5 italic text-muted-foreground rounded-r-lg hover:bg-primary/10 transition-colors">$1</blockquote>')

            // Bold and italic with theme colors
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
            .replace(/__(.*?)__/g, '<strong class="font-bold text-foreground">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic text-muted-foreground">$1</em>')
            .replace(/_(.*?)_/g, '<em class="italic text-muted-foreground">$1</em>')

            // Enhanced links with theme colors
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-primary hover:text-primary-hover underline hover:no-underline transition-colors inline-flex items-center gap-1">$1 <span class="text-xs opacity-70">↗</span></a>')

            // Line breaks and paragraphs
            .replace(/\n\n/g, '</p><p class="mb-4 text-foreground leading-relaxed">')
            .replace(/\n/g, '<br>')

        // Wrap in paragraphs if not already wrapped
        if (!html.startsWith('<h') && !html.startsWith('<p') && !html.startsWith('<ul') && !html.startsWith('<ol') && !html.startsWith('<pre') && !html.startsWith('<blockquote') && !html.startsWith('<div')) {
            html = '<p class="mb-4 text-foreground leading-relaxed">' + html + '</p>'
        }

        // Fix list formatting
        html = html.replace(/(<li.*?>.*?<\/li>)/g, (match) => {
            if (!match.includes('<ul>') && !match.includes('<ol>')) {
                return '<ul class="space-y-1 mb-4">' + match + '</ul>'
            }
            return match
        })

        return html
    }

    React.useEffect(() => {
        // Load MathJax for LaTeX rendering
        if (typeof window !== 'undefined' && !window.MathJax) {
            const script = document.createElement('script')
            script.src = 'https://polyfill.io/v3/polyfill.min.js?features=es6'
            document.head.appendChild(script)

            const mathJaxScript = document.createElement('script')
            mathJaxScript.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
            mathJaxScript.async = true
            document.head.appendChild(mathJaxScript)

            window.MathJax = {
                tex: {
                    inlineMath: [['\\(', '\\)'], ['$', '$']],
                    displayMath: [['$$', '$$'], ['\\[', '\\]']]
                },
                options: {
                    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
                }
            }
        }

        // Load Mermaid for graph rendering
        if (typeof window !== 'undefined' && !window.mermaid) {
            const mermaidScript = document.createElement('script')
            mermaidScript.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
            mermaidScript.async = true
            mermaidScript.onload = () => {
                window.mermaid.initialize({
                    startOnLoad: true,
                    theme: 'default',
                    securityLevel: 'loose'
                })
            }
            document.head.appendChild(mermaidScript)
        }

        // Re-render MathJax when content changes
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise()
        }

        // Re-render Mermaid diagrams when content changes
        if (window.mermaid) {
            setTimeout(() => {
                const mermaidElements = document.querySelectorAll('.mermaid-diagram')
                mermaidElements.forEach((element) => {
                    const code = element.getAttribute('data-mermaid')
                    if (code) {
                        element.innerHTML = code
                        window.mermaid.init(undefined, element)
                    }
                })
            }, 100)
        }
    }, [content])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
            dangerouslySetInnerHTML={{ __html: renderContent(content) }}
        />
    )
}

// Type declarations
declare global {
    interface Window {
        MathJax: any
        mermaid: any
    }
}