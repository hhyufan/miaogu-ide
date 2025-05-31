import { useState, useCallback } from 'react'
import { Button, message } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import * as Babel from '@babel/standalone'

// 配置Babel预设和插件（浏览器兼容版本）
Babel.registerPreset('browser-safe', {
  presets: [['env', { targets: { browsers: ['last 2 versions'] } }]],
  plugins: []
})

// eslint-disable-next-line react/prop-types
const JavaScriptRunner = ({ code, onOutput, disabled = false }) => {
  const [isRunning, setIsRunning] = useState(false)

  const executeCode = useCallback(async () => {
    // eslint-disable-next-line react/prop-types
    if (!code || !code.trim()) {
      message.warning('没有代码可以执行')
      return
    }

    setIsRunning(true)

    try {
      // 清空之前的输出
      onOutput && onOutput({ type: 'clear' })

      // 创建沙箱环境
      const sandbox = {
        console: {
          log: (...args) => {
            const output = args
              .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
              .join(' ')
            onOutput && onOutput({ type: 'log', content: output })
          },
          error: (...args) => {
            const output = args
              .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
              .join(' ')
            onOutput && onOutput({ type: 'error', content: output })
          },
          warn: (...args) => {
            const output = args
              .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
              .join(' ')
            onOutput && onOutput({ type: 'warn', content: output })
          },
          info: (...args) => {
            const output = args
              .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
              .join(' ')
            onOutput && onOutput({ type: 'info', content: output })
          },
          md: (...args) => {
            const output = args
              .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
              .join(' ')
            onOutput && onOutput({ type: 'markdown', content: output })
          }
        },
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval,
        Promise,
        fetch: window.fetch?.bind(window),
        Math,
        Date,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        Error,
        TypeError,
        ReferenceError,
        SyntaxError
      }

      // 使用Babel转译代码（简化版本）
      let transformedCode
      try {
        const result = Babel.transform(code, {
          presets: ['browser-safe']
        })
        transformedCode = result.code
      } catch (transformError) {
        // 如果转译失败，直接使用原代码
        transformedCode = code
        console.warn(transformError)
        // onOutput &&
        //   onOutput({
        //     type: 'warn',
        //     content: `使用原生代码执行（转译跳过）: ${transformError.message}`
        //   })
      }

      // 创建函数并执行
      const sandboxKeys = Object.keys(sandbox)
      const sandboxValues = Object.values(sandbox)

      // 包装代码以捕获返回值
      const wrappedCode = `
        try {
          ${transformedCode}
        } catch (error) {
          console.error('运行时错误:', error.message)
          throw error
        }
      `

      const func = new Function(...sandboxKeys, wrappedCode)

      // 在Promise中执行以捕获异步错误
      await new Promise((resolve, reject) => {
        try {
          const result = func(...sandboxValues)

          // 如果返回Promise，等待其完成
          if (result && typeof result.then === 'function') {
            result
              .then(() => {
                resolve()
              })
              .catch((error) => {
                onOutput &&
                  onOutput({
                    type: 'error',
                    content: `异步错误: ${error.message}`
                  })
                reject(error)
              })
          } else {
            // 如果有返回值，显示它
            if (result !== undefined) {
              onOutput &&
                onOutput({
                  type: 'result',
                  content:
                    typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)
                })
            }
            resolve()
          }
        } catch (error) {
          onOutput &&
            onOutput({
              type: 'error',
              content: `执行错误: ${error.message}`
            })
          reject(error)
        }
      })
    } catch (error) {
      onOutput &&
        onOutput({
          type: 'error',
          content: `执行失败: ${error.message}`
        })
    } finally {
      setIsRunning(false)
    }
  }, [code, onOutput])

  return (
    <Button
      type="text"
      icon={<PlayCircleOutlined />}
      onClick={executeCode}
      loading={isRunning}
      disabled={disabled}
      style={{
        color: '#52c41a'
      }}
      title="运行JavaScript代码"
    />
  )
}

export default JavaScriptRunner
