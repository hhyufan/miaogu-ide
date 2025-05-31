import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { setupIpcApi } from './ipc_bridge'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI,
      nativeImage: require('electron').nativeImage
    })
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = {
    ...electronAPI,
    nativeImage: require('electron').nativeImage
  }
  window.api = api
}

// 设置IPC API
setupIpcApi()
