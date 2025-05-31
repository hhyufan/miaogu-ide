import  { useState, useRef, useEffect } from 'react';
import { Button , message } from 'antd';
import { Menu } from 'antd';
import './SettingsMenu.scss';
import TextEditor from './TextEditor';
import BackgroundSettings from './BackgroundSettings';

const SettingsMenuList = [
  {
    key: 'textEditor',
    label: '文本',
    children: [
      { key: 'fontSize', label: '字体大小' },
      { key: 'fontFamily', label: '字体' },
    ],
  },
  {
    key: 'background',
    label: '背景',
    children: [
    ],
  },
];



const SettingsMenu = () => {
  const [activeKey, setActiveKey] = useState('');
  const contentRef = useRef(null);
  const [localSettings, setLocalSettings] = useState({})
  const [fontSize, setFontSize] = useState(14)
  const [fontFamily, setFontFamily] = useState('')
  const [currentSection, setCurrentSection] = useState('textEditor');
  const [settingBgImage, setBgImage] = useState('');

  const renderContent = () => {
    switch(currentSection) {
      case 'textEditor':
        return (
          <TextEditor 
            fontSize={fontSize}
            setFontSize={setFontSize}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
          />
        );
      case 'background':
        return <BackgroundSettings
          bgImage={settingBgImage}
          setBgImage={setBgImage}
        />;
      default:
        return null;
    }
  };
  
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await window.ipcApi.getSettings()
        const savedImage = await window.ipcApi.getSavedImage()
        if (savedSettings) {
          setLocalSettings(savedSettings)
          setFontSize(savedSettings.fontSize)
          setFontFamily(savedSettings.fontFamily)
          setBgImage(savedImage)
        }
      } catch (error) {
        console.error('加载字体大小设置失败:', error)
      }
    }

    // 初始加载字体大小
    loadSettings()

    // 监听字体大小变化事件
    const handleFontSizeChange = (event, newFontSize) => {
      setFontSize(newFontSize)
    }

    // 添加事件监听器
    window.ipcApi.onFontSizeChange(handleFontSizeChange)

    // 清理事件监听器
    return () => {
      window.ipcApi.removeFontSizeChange(handleFontSizeChange)
    }
  }, [])
  
  const saveSettings = async () => {
    localSettings.fontSize = fontSize
    localSettings.fontFamily = fontFamily
    try {  
      await window.ipcApi.setFontSize(fontSize)
      await window.ipcApi.setFontFamily(fontFamily)
      await window.ipcApi.setSettings(localSettings)
      message.success('设置保存成功')
    } catch (error) {
      message.error('设置保存失败')
      console.error('设置保存失败:', error)
    }
  }


  return (
      <div style={{ display: 'flex', height: '100vh' }}>
        <div style={{ display: 'flow-root' }}>
          <Menu
            mode="inline"
            className="custom-settings-menu"
            selectedKeys={[activeKey]}
            style={{ width: 180, height: '100%', overflow: 'auto' }}
          >
            {SettingsMenuList.map((group) => (
              <Menu.SubMenu key={group.key} title={group.label} onTitleClick={() => {setCurrentSection(group.key); setActiveKey(group.key)}}>
                {group.children.map((item) => (
                  <Menu.Item key={item.key} onClick={() => {setCurrentSection(group.key); setActiveKey(item.key)}}>
                    {item.label}
                  </Menu.Item>
                ))}
              </Menu.SubMenu>
            ))}
          </Menu>
        </div>
        <div
          ref={contentRef}
          style={{
            flex: 1,
            display: 'flow-root',
            overflow: 'auto',
            padding: 36,
          }}
        >
          {renderContent()}
        </div>
        <div id="save" style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000  // 确保按钮在最上层
          }}>
            <Button type="primary" onClick={() => saveSettings()}>
              保存
            </Button>
      </div>
      </div>
  );
}

export default SettingsMenu;