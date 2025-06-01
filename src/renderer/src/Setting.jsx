import './setting.scss'

import { useState, useEffect } from 'react'
import SettingHeader from './components/Setting/SettingHeader'
import SettingMenu from './components/Setting/SettingMenu'

const Setting = () => {
    const [isDarkMode] = useState(() => {
        // 首先尝试从localStorage获取（向后兼容）
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme) {
            return savedTheme === 'dark'
        }
        // 如果没有，尝试从electron-store获取
        if (window.ipcApi && window.ipcApi.getTheme) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        // 如果都没有，使用系统默认值
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    })
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
    }, [isDarkMode])

    return (
        <div className="setting-container">
            <SettingHeader />
            <div className="setting-content" style={{ height: '100vh', width: '100%' }}>
                <SettingMenu />
            </div>
        </div>
    )
}

export default Setting
