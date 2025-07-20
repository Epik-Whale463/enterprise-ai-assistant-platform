"use client"

import React from 'react'
import { motion } from 'framer-motion'

interface EnhancedMarkdownProps {
    content: string
    className?: string
}

export function EnhancedMarkdown({ content, className = "" }: EnhancedMarkdownProps) {
    const renderContent = (text: string): string => {
        if (!text) return ''

        // Remove duplicate consecutive tables before processing
        let cleanedText = text.replace(/(\|[^|\n]*\|(?:\n\|[^|\n]*\|)*)\n*(\1)/g, '$1')

        let html = cleanedText
            // LaTeX Math Expressions - Block (display math)
            .replace(/\\\[([\s\S]*?)\\\]/g, '<div class="math-block my-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-x-auto"><span class="math-display">\\[$1\\]</span></div>')

            // LaTeX Math Expressions - Inline
            .replace(/\\\((.*?)\\\)/g, '<span class="math-inline bg-blue-50 dark:bg-blue-900/20 px-1 rounded">\\($1\\)</span>')

            // Alternative LaTeX syntax - Block
            .replace(/\$\$([\s\S]*?)\$\$/g, '<div class="math-block my-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-x-auto"><span class="math-display">$$1$$</span></div>')

            // Alternative LaTeX syntax - Inline  
            .replace(/\$([^$\n]+)\$/g, '<span class="math-inline bg-blue-50 dark:bg-blue-900/20 px-1 rounded">$1</span>')

            // Headers with better styling
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white border-b-2 border-blue-500 pb-2">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-6 text-gray-900 dark:text-white border-b-2 border-blue-600 pb-3">$1</h1>')

            // Enhanced code blocks with syntax highlighting and graph support
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                const language = lang || 'text'

                // Handle Mermaid diagrams
                if (language === 'mermaid') {
                    return `<div class="mermaid-container my-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div class="mermaid-diagram" data-mermaid="${code.replace(/"/g, '&quot;')}">${code}</div>
                    </div>`
                }

                // Handle mathematical plots (simple ASCII or description)
                if (language === 'plot' || language === 'graph') {
                    return `<div class="plot-container my-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div class="plot-header text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">📊 Graph/Plot</div>
                        <pre class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${code}</pre>
                    </div>`
                }

                return `<div class="code-block my-4">
                    <div class="code-header bg-gray-800 text-gray-200 px-4 py-2 text-sm font-mono rounded-t-lg flex justify-between items-center">
                        <span>${language}</span>
                        <button class="copy-btn text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded" onclick="navigator.clipboard.writeText(\`${code.replace(/`/g, '\\`')}\`)">Copy</button>
                    </div>
                    <pre class="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto"><code class="language-${language}">${code}</code></pre>
                </div>`
            })

            // Inline code with better styling
            .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 px-2 py-1 rounded text-sm font-mono border">$1</code>')

            // Enhanced tables with deduplication
            .replace(/(\|.+\|\n)+/g, (tableMatch) => {
                const rows = tableMatch.trim().split('\n')
                let tableHTML = '<div class="table-container overflow-x-auto my-6"><table class="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">'

                rows.forEach((row, index) => {
                    const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell)
                    const isHeaderSeparator = cells.every(cell => /^[-:]+$/.test(cell))

                    if (isHeaderSeparator) return

                    const isHeader = index === 0
                    const cellTag = isHeader ? 'th' : 'td'
                    const cellClass = isHeader
                        ? 'px-6 py-3 text-left font-semibold bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                        : 'px-6 py-4 border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'

                    const cellTags = cells.map(cell =>
                        `<${cellTag} class="${cellClass}">${cell}</${cellTag}>`
                    ).join('')

                    tableHTML += `<tr class="${isHeader ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'}">${cellTags}</tr>`
                })

                tableHTML += '</table></div>'
                return tableHTML
            })

            // Enhanced lists with better styling
            .replace(/^\* (.+)$/gm, '<li class="ml-6 mb-2 flex items-start"><span class="text-blue-500 mr-2 mt-1">•</span><span>$1</span></li>')
            .replace(/^- (.+)$/gm, '<li class="ml-6 mb-2 flex items-start"><span class="text-blue-500 mr-2 mt-1">•</span><span>$1</span></li>')
            .replace(/^\d+\. (.+)$/gm, '<li class="ml-6 mb-2 list-decimal list-inside text-gray-700 dark:text-gray-300">$1</li>')

            // Enhanced blockquotes
            .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-blue-500 pl-6 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 italic text-gray-700 dark:text-gray-300 rounded-r-lg">$1</blockquote>')

            // Bold and italic with better styling
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
            .replace(/__(.*?)__/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800 dark:text-gray-200">$1</em>')
            .replace(/_(.*?)_/g, '<em class="italic text-gray-800 dark:text-gray-200">$1</em>')

            // Enhanced links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline hover:no-underline transition-colors">$1 <span class="text-xs">↗</span></a>')

            // Line breaks and paragraphs
            .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">')
            .replace(/\n/g, '<br>')

        // Wrap in paragraphs if not already wrapped
        if (!html.startsWith('<h') && !html.startsWith('<p') && !html.startsWith('<ul') && !html.startsWith('<ol') && !html.startsWith('<pre') && !html.startsWith('<blockquote') && !html.startsWith('<div')) {
            html = '<p class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">' + html + '</p>'
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
                    inlineMath: [['$', '$'], ['\\(', '\\)']],
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
                mermaidElements.forEach((element, index) => {
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

// Type declaration for MathJax
declare global {
    interface Window {
        MathJax: any
    }
}