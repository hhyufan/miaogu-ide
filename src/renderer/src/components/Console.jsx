import { useRef, useEffect } from 'react'
import { Button, Card } from 'antd'
import { CloseOutlined, ClearOutlined } from '@ant-design/icons'
import './Console.scss'

// eslint-disable-next-line react/prop-types
const Console = ({ outputs = [], onClear, onClose, visible = false }) => {
  const outputRef = useRef(null)

  // 自动滚动到底部
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [outputs])

  if (!visible) {
    return null
  }

  const getOutputClass = (type) => {
    switch (type) {
      case 'error':
        return 'console-output-error'
      case 'warn':
        return 'console-output-warn'
      case 'info':
        return 'console-output-info'
      case 'success':
        return 'console-output-success'
      case 'result':
        return 'console-output-result'
      default:
        return 'console-output-log'
    }
  }

  const getOutputPrefix = (type) => {
    switch (type) {
      case 'error':
        return '❌'
      case 'warn':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      case 'success':
        return '✅'
      case 'result':
        return '📤'
      default:
        return '📝'
    }
  }

  return (
    <div className={`console-container`}>
      <Card
        size="small"
        title={
          <div className="console-header">
            <span>控制台</span>
            <div className="console-actions">
              <Button
                type="text"
                size="small"
                icon={<ClearOutlined />}
                onClick={onClear}
                title="清空控制台"
              />
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={onClose}
                title="关闭控制台"
              />
            </div>
          </div>
        }
        className="console-card"
      >
        {
          <div className="console-content">
            <div className="console-outputs" ref={outputRef}>
              {outputs.length === 0 ? (
                <div className="console-empty">控制台已准备就绪</div>
              ) : (
                outputs.map((output, index) => (
                  <div key={index} className={`console-output ${getOutputClass(output.type)}`}>
                    <span className="console-prefix">{getOutputPrefix(output.type)}</span>
                    <span className="console-content-text">{output.content}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        }
      </Card>
    </div>
  )
}

export default Console
