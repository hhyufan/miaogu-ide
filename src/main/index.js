import { app } from 'electron'
import { handleSingleInstance, handleStartupArgs, initializeApp, cleanup } from './modules/appInitializer.js'

// 处理启动参数
handleStartupArgs()

// 处理单实例应用
if (!handleSingleInstance()) {
  // 如果不是第一个实例，退出
  process.exit(0)
}

// 应用准备就绪时初始化
app.whenReady().then(() => {
  initializeApp()
})

// 所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 应用即将退出时清理资源
app.on('will-quit', () => {
  cleanup()
})
