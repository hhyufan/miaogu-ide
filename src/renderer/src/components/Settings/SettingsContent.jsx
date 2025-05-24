import { Input, Select , Button , message } from 'antd';
import { useState , useEffect} from 'react';


const SettingsContent = () => {
  const [localSettings, setLocalSettings] = useState({})

  const initSettings = async () => {
    const settings = await window.ipcApi.getSettings()
    setLocalSettings(settings)
    if (!settings) return false
    return true
  }
  
  const saveSettings = (settings) => {
    setLocalSettings(settings)
    if (window.ipcApi.setSettings(settings)) {
      message.success('设置保存成功')
    } else {
      message.error('设置保存失败')
    }
  }
  

  useEffect(() => {
    if (!initSettings()) {
      return
    }
  }, [])

  if (!localSettings) return

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24  }}>
      <div id="textEditor">
        <h2>文本编辑器</h2>

        <div id="fontSize" data-section style={{ marginBottom: 48 }}>
          <h4>字体大小</h4>
          <Input value={`${localSettings.fontSize}`} style={{ width: 120 }} onChange={(e) => {
            setLocalSettings({ ...localSettings, fontSize: e.target.value })
          }} />
          <span>px</span>
        </div>

        <div id="fontFamily" data-section style={{ marginBottom: 48 }}>
          <h4>字体</h4>
          <Select value={`${localSettings.fontFamily}`} style={{ width: 150 }} onChange={(value) => {
            setLocalSettings({ ...localSettings, fontFamily: value })
          }}>
            <Select.Option value="Arial">Arial</Select.Option>
            <Select.Option value="Verdana">Verdana</Select.Option>
            <Select.Option value="Courier New">Courier New</Select.Option>
          </Select>
        </div>
      </div>
      <div id="background">
        <h2>背景</h2>
        <div id="bgImage" data-section style={{ marginBottom: 48 }}>
          <h4>背景图片</h4>
          <Button type="primary">浏览...</Button>
        </div>
      </div>
      <div id="save">
        <Button type="primary" onClick={() => saveSettings(localSettings)}>保存</Button>
      </div>
    </div>
    );
};

export default SettingsContent;
