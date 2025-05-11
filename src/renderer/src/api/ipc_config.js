// IPC API配置文件

// 创建API接口对象
const api = {
  // 获取模型密钥配置
  getModelKeys: async () => {
    try {
      const response = await window.ipcApi.getModelKeys()
      return { data: response.data } // 假设后端直接返回
    } catch (error) {
      console.error('IPC API请求错误 (getModelKeys):', error)
      throw error
    }
  },

  // 添加或更新模型密钥
  setModelKey: async (baseUrl, modelName, keyValue) => {
    try {
      const response = await window.ipcApi.setModelKey(baseUrl, modelName, keyValue)
      return { data: response.data } // 假设后端返回成功或错误信息
    } catch (error) {
      console.error('IPC API请求错误 (setModelKey):', error)
      throw error
    }
  }
}

export default api
