import { memo, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import ReactMarkdown from 'react-markdown'
import Prism from 'prismjs'
import remarkGfm from 'remark-gfm'
import 'prismjs/plugins/autoloader/prism-autoloader'
import { theme } from 'antd'
import { toast } from '../plugins/toast'
import MermaidRenderer from './MermaidRenderer'
import './MarkdownRenderer.scss'
// 配置必须在模块作用域
Prism.plugins.autoloader.languages_path =
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/'
Prism.languages.vue = Prism.languages.html // 提前注册扩展语言
const { useToken } = theme
// 导入本地主题样式
import darkTheme from 'prism-themes/themes/prism-one-dark.css?raw'
import lightTheme from 'prism-themes/themes/prism-one-light.css?raw'

// eslint-disable-next-line react/prop-types,react/display-name
const MarkdownRenderer = memo(({ content }) => {
    const { token } = useToken()
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    )
    const [fontFamily, setFontFamily] = useState('JetBrains Mono')

    useEffect(() => {
        const initFamily = async () => {
            const setting = await window.ipcApi.getSetting()
            setFontFamily(setting.fontFamily || 'JetBrains Mono')
        }
        initFamily().catch(console.error)
    }, [])
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    const newTheme = document.documentElement.getAttribute('data-theme')
                    setIsDarkMode(newTheme === 'dark')
                }
            })
        })

        observer.observe(document.documentElement, { attributes: true })

        // 创建样式标签
        const styleElement = document.createElement('style')
        styleElement.id = 'prism-theme'
        document.head.appendChild(styleElement)

        // 更新主题样式
        const updateTheme = () => {
            styleElement.textContent = isDarkMode ? darkTheme : lightTheme
        }

        updateTheme()

        return () => {
            observer.disconnect()
            styleElement.remove()
        }
    }, [isDarkMode])
    const containerRef = useRef(null)

    // 使用 useMemo 优化样式对象
    const styles = useMemo(() => {
        const baseStyle = {
            fontFamily: fontFamily,
            color: isDarkMode ? '#ffffff' : token['colorText']
        }

        return {
            base: baseStyle,
            text: {
                ...baseStyle,
                fontSize: '1rem',
                lineHeight: 1.6
            },
            heading: {
                ...baseStyle,
                margin: '0.4rem 0 0.6em',
                lineHeight: 1.2
            },
            quote: {
                ...baseStyle,
                margin: '1rem 0',
                fontStyle: 'italic',
                backgroundColor: isDarkMode ? '#282c34' : '#fafafa',
                padding: '0.5rem 1rem',
                borderRadius: '4px'
            },
            list: {
                ...baseStyle,
                paddingLeft: '1.5rem',
                margin: '1rem 0'
            },
            listItem: {
                ...baseStyle,
                margin: '0.4rem 0'
            },
            link: {
                ...baseStyle,
                color: '#0066cc',
                textDecoration: 'underline'
            },
            hr: {
                ...baseStyle,
                border: 0,
                borderTop: '1px solid #ddd',
                margin: '1.5rem 0'
            },
            table: {
                ...baseStyle,
                borderCollapse: 'collapse',
                margin: '1rem 0'
            },
            tableHead: {
                backgroundColor: isDarkMode ? '#1f1f1f' : '#f5f5f5'
            },
            tableCell: {
                ...baseStyle,
                border: '1px solid #ddd',
                padding: '0.5rem'
            },
            tableHeader: {
                ...baseStyle,
                border: '1px solid #ddd',
                padding: '0.5rem',
                fontWeight: 600,
                color: isDarkMode ? '#ffffff' : token['colorText']
            }
        }
    }, [fontFamily, isDarkMode, token])
    // 语言显示名称映射表
    const LANGUAGE_DISPLAY_MAP = {
        html: 'HTML',
        xml: 'XML',
        sql: 'SQL',
        css: 'CSS',
        cpp: 'C++',
        sass: 'Sass',
        scss: 'Sass',
        js: 'JavaScript',
        ts: 'TypeScript',
        py: 'Python',
        php: 'PHP',
        md: 'Markdown',
        yml: 'YAML',
        yaml: 'YAML',
        json: 'JSON',
        rb: 'Ruby'
    }

    // 清理旧标签 - 使用 useCallback 优化
    const cleanupLabels = useCallback(() => {
        const existingTags = containerRef.current?.querySelectorAll('.lang-tag')
        existingTags?.forEach((tag) => tag.remove())
    }, [])

    // 添加语言标签 - 使用 useCallback 优化
    const addLanguageLabels = useCallback(() => {
        cleanupLabels()

        const codeBlocks = containerRef.current?.querySelectorAll('code') || []

        codeBlocks.forEach((code) => {
            const pre = code.closest('pre')
            if (!pre) return

            // 提取语言类型
            const langClass = [...code.classList].find((c) => c.startsWith('language-'))
            const rawLang = langClass ? langClass.split('-')[1] || '' : ''
            const langKey = rawLang.toLowerCase()

            // 获取显示名称
            let displayLang = LANGUAGE_DISPLAY_MAP[langKey]

            // 处理未定义的特殊情况
            if (!displayLang) {
                const versionMatch = langKey.match(/^(\D+)(\d+)$/)
                if (versionMatch) {
                    displayLang = `${versionMatch[1].charAt(0).toUpperCase()}${versionMatch[1].slice(
                        1
                    )} ${versionMatch[2]}`
                } else {
                    displayLang = langKey.charAt(0).toUpperCase() + langKey.slice(1)
                }
            }

            // 创建标签
            const tag = document.createElement('button')
            tag.className = 'lang-tag'
            Object.assign(tag.style, {
                position: 'absolute',
                top: '8px',
                right: '12px',
                color: token['colorText'],
                fontSize: '0.8em',
                border: 'none',
                background: token['colorBgElevated'],
                padding: '2px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                zIndex: 1
            })

            // 设置显示名称
            tag.textContent = displayLang

            // 添加点击事件
            tag.addEventListener('click', () => copyToClipboard(code.textContent))

            // 添加悬停效果
            tag.addEventListener('mouseover', () => {
                tag.style.backgroundColor = token['colorBgElevated'] // hover 时的背景色
            })
            tag.addEventListener('mouseout', () => {
                tag.style.backgroundColor = token['colorBgElevated'] // 恢复默认背景色
            })

            // 确保 pre 元素有定位上下文
            pre.parentElement.style.position = 'relative'

            // 将标签添加到 pre 元素
            pre.parentElement.appendChild(tag)
        })
    }, [cleanupLabels, token])

    // 存储React根节点的引用
    const mermaidRootsRef = useRef(new Map())

    const renderMermaidDiagrams = () => {
        if (!containerRef?.current) return

        const currentRoots = new Map(mermaidRootsRef.current)
        const processedIds = new Set()

        const mermaidBlocks = containerRef.current.querySelectorAll('pre > code.language-mermaid')

        mermaidBlocks.forEach((codeBlock, index) => {
            const pre = codeBlock.parentElement
            if (!pre) return

            // 获取或生成唯一ID
            let mermaidId = pre.getAttribute('data-mermaid-id')
            const code = codeBlock.textContent
            if (!mermaidId) {
                mermaidId = `mermaid-${index}`
                pre.setAttribute('data-mermaid-id', mermaidId)
            }
            processedIds.add(mermaidId)

            // 通过ID查找现有容器（不再依赖DOM位置）
            let mermaidContainer = document.querySelector(`[data-mermaid-container-id="${index}"]`)

            // 如果容器不存在再创建
            if (!mermaidContainer) {
                mermaidContainer = document.createElement('div')
                mermaidContainer.className = 'mermaid-container'
                mermaidContainer.setAttribute('data-mermaid-container-id', mermaidId)
                if (!document.querySelector(`[data-mermaid-container-id="${mermaidId}"]`)) {
                    if (!document.querySelector(`[data-mermaid-container-id="${mermaidId}"]`)) {
                        pre.parentNode.insertBefore(mermaidContainer, pre.nextSibling)
                    }
                }
            }

            pre.style.display = 'none'

            // 获取或创建React根节点
            let root = currentRoots.get(mermaidId)
            if (!root) {
                const existingRoot = mermaidContainer.querySelector('.mermaid-root')
                if (existingRoot) {
                    // 复用现有DOM节点
                    root = ReactDOM.createRoot(existingRoot)
                } else {
                    // 创建新的根节点
                    const mermaidRoot = document.createElement('div')
                    mermaidRoot.className = 'mermaid-root'
                    mermaidContainer.appendChild(mermaidRoot)
                    root = ReactDOM.createRoot(mermaidRoot)
                }
                currentRoots.set(mermaidId, root)
            }

            root.render(
                <MermaidRenderer
                    code={code}
                    key={`${mermaidId}-${isDarkMode ? 'dark' : 'light'}`}
                />
            )
        })

        mermaidRootsRef.current = currentRoots
    }

    // 高亮核心逻辑
    const highlightCode = () => {
        renderMermaidDiagrams()
        if (containerRef?.current) {
            Prism.highlightAllUnder(containerRef?.current)
        }
        addLanguageLabels()
    }

    // 复制到剪贴板
    const copyToClipboard = (text) => {
        navigator.clipboard
            .writeText(text)
            .then(async () => {
                await toast.success('内容已复制', { debounce: 3000, closable: true })
            })
            .catch((err) => {
                console.error('Failed to copy text: ', err)
            })
    }

    // 修改 useEffect 依赖项
    useEffect(() => {
        const debouncedHighlight = setTimeout(() => {
            highlightCode()
        }, 50)
        return () => clearTimeout(debouncedHighlight)
    }) // 只在 content 变化时执行

    // 优化主题切换处理
    useEffect(() => {
        const timer = setTimeout(renderMermaidDiagrams, 100)
        return () => clearTimeout(timer)
    })

    return (
        <div ref={containerRef}>
            <ReactMarkdown
                remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                components={{
                    p: ({ children }) => <p style={styles.text}>{children}</p>,
                    h1: ({ children }) => (
                        <h1 style={{ ...styles.heading, fontSize: '2rem' }}>{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 style={{ ...styles.heading, fontSize: '1.8rem' }}>{children}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 style={{ ...styles.heading, fontSize: '1.6rem' }}>{children}</h3>
                    ),
                    h4: ({ children }) => (
                        <h4 style={{ ...styles.heading, fontSize: '1.4rem' }}>{children}</h4>
                    ),
                    h5: ({ children }) => (
                        <h5 style={{ ...styles.heading, fontSize: '1.2rem' }}>{children}</h5>
                    ),
                    h6: ({ children }) => (
                        <h6 style={{ ...styles.heading, fontSize: '1rem' }}>{children}</h6>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote style={styles.quote}>{children}</blockquote>
                    ),
                    ul: ({ children }) => <ul style={styles.list}>{children}</ul>,
                    ol: ({ children }) => <ol style={styles.list}>{children}</ol>,
                    li: ({ children }) => <li style={styles.listItem}>{children}</li>,
                    a: ({ children, href }) => (
                        <a
                            href={href}
                            style={styles.link}
                            onClick={(e) => {
                                e.preventDefault()
                                if (href && window.ipcApi?.openExternal) {
                                    window.ipcApi.openExternal(href).catch((e) => console.error(e))
                                }
                            }}
                        >
                            {children}
                        </a>
                    ),
                    em: ({ children }) => <em style={styles.text}>{children}</em>,
                    strong: ({ children }) => (
                        <strong style={{ ...styles.text, fontWeight: 600 }}>{children}</strong>
                    ),
                    hr: () => <hr style={styles.hr} />,
                    table: ({ children }) => <table style={styles.table}>{children}</table>,
                    thead: ({ children }) => <thead style={styles.tableHead}>{children}</thead>,
                    td: ({ children }) => <td style={styles.tableCell}>{children}</td>,
                    th: ({ children }) => <th style={styles.tableHeader}>{children}</th>,
                    code({ className, children, inline, ...props }) {
                        const language = className?.replace('language-', '') || ''
                        return !inline && language ? (
                            <pre
                                className={`language-${language}`}
                                style={{
                                    backgroundColor: 'transparent',
                                    padding: 'none',
                                    position: 'relative',
                                    overflow: 'auto',
                                    fontSize: '0.8rem'
                                }}
                            >
                                <code
                                    className={className}
                                    {...props}
                                    style={{
                                        fontSize: '0.9rem',
                                        fontFamily: `'${fontFamily}', monospace`
                                    }}
                                >
                                    {children}
                                </code>
                            </pre>
                        ) : (
                            <code
                                style={{
                                    backgroundColor: token['colorBgTextHover'],
                                    padding: '2px 4px',
                                    fontFamily: `'${fontFamily}', monospace`,
                                    borderRadius: '4px',
                                    fontSize: '1em',
                                    color: token['colorText']
                                }}
                                {...props}
                            >
                                {children}
                            </code>
                        )
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
})

export default MarkdownRenderer
