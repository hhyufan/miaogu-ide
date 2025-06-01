import { memo, useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { Skeleton } from 'antd'

// 引入CSS样式
import './MermaidRenderer.scss'

// 初始化mermaid配置
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: {
        htmlLabels: true,
        curve: 'linear'
    },
    er: {
        layoutDirection: 'TB',
        entityPadding: 15
    },
    sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50
    }
})

/**
 * Mermaid图表渲染组件
 * @param {Object} props 组件属性
 * @param {string} props.code Mermaid图表代码
 * @param {boolean} props.isDarkMode 是否为暗色主题
 */
// eslint-disable-next-line react/prop-types,react/display-name
const MermaidRenderer = memo(({ code }) => {
    const containerRef = useRef(null)
    // 使用useState而不是直接在函数体中生成，避免重新渲染时生成新ID
    const [mermaidId] = useState(() => `mermaid-${Math.random().toString(36).substring(2, 11)}`)
    // 跟踪组件是否已卸载
    const isMounted = useRef(true)

    // 组件卸载时设置标志
    useEffect(() => {
        return () => {
            isMounted.current = false
        }
    }, [])

    // 存储渲染后的SVG内容
    const [svgContent, setSvgContent] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    // 存储错误信息
    const [errorContent, setErrorContent] = useState('')
    // 跟踪当前主题状态，用于动画

    useEffect(() => {
        if (!containerRef.current) return

        setIsLoading(true)

        const timer = setTimeout(async () => {
            try {
                // 渲染图表
                const { svg } = await mermaid.render(mermaidId, code)

                // 确保组件仍然挂载后再更新状态
                if (isMounted.current) {
                    setSvgContent(svg)
                    setErrorContent('')
                    setIsLoading(false)
                }
            } catch (error) {
                console.error('Mermaid渲染错误:', error)
                // 确保组件仍然挂载后再更新状态
                if (isMounted.current) {
                    setErrorContent(`<div style="color: red; padding: 10px; border: 1px solid red; border-radius: 4px;">
          <p><strong>Mermaid图表渲染错误</strong></p>
          <pre>${error.message}</pre>
        </div>`)
                    setSvgContent('')
                    setIsLoading(false)
                }
            }
        }, 500) // 0.5s delay

        return () => {
            clearTimeout(timer)
        }
    }, [code, mermaidId])

    // 创建一个渲染内容的函数
    const renderContent = () => {
        if (errorContent) {
            return <div dangerouslySetInnerHTML={{ __html: errorContent }} />
        }
        if (svgContent) {
            return <div dangerouslySetInnerHTML={{ __html: svgContent }} />
        }
        return <Skeleton />
    }

    return (
        <div
            className="mermaid-diagram-container"
            style={{
                textAlign: 'center',
                margin: '1rem 0',
                overflow: 'hidden', // 改为hidden以避免过渡期间的滚动条闪烁
                padding: '1rem',
                borderRadius: '4px'
            }}
        >
            <div ref={containerRef} className="mermaid-content">
                {isLoading ? <Skeleton /> : renderContent()}
            </div>
        </div>
    )
})

export default MermaidRenderer
