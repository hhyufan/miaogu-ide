import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import './index.scss'
// 导入Monaco编辑器配置
import './monaco/monaco-config'
// 导入Monaco编辑器图标字体
import './monaco/monaco-icons.css'

const router = createBrowserRouter(
  [
    {
      path: '/*', // 保持原有路由匹配逻辑
      element: <App />
    }
  ],
  {
    future: {
      v7_relativeSplatPath: true // 启用未来标志
    }
  }
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
