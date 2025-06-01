import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import './index.scss'
// Import Monaco Editor setup to configure web workers
import './monaco-setup'

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
