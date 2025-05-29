import { Button,Input,Checkbox,Slider } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

// eslint-disable-next-line react/prop-types
const BackgroundSettings = ({ bgImage, setBgImage}) => {

    const [isVisible, setIsVisible] = useState(false)
    const [savedBgImage, setSavedBgImage] = useState('')
    const [bgTransparency, setBgTransparency] = useState({dark: 50, light: 50})

    const handleSelectBgImage = async () => {
        const filePath = await window.ipcApi.selectBgImage()
        window.ipcApi.setSavedImage(filePath)
        window.ipcApi.setBgImage(filePath)
        setBgImage(filePath)
      }
    
    const closeBgImage = async () => {
        setSavedBgImage(bgImage)
        setBgImage('')
        window.ipcApi.setBgImage('')
    }

    const openBgImage = async () => {
      window.ipcApi.setBgImage(savedBgImage)
      setBgImage(savedBgImage)
    }

    const handleBgTransparency = (theme, value) => {
      window.ipcApi.setBgTransparency(theme, value)
    }

    const initSavedImage = async () => {
      const savedImage = await window.ipcApi.getSavedImage()
      const bgTransparency = await window.ipcApi.getBgTransparency()
      if (savedImage !== '') {
        setSavedBgImage(savedImage)
      }
      if (bgImage !== '') {
        setIsVisible(true)
      }
      if (bgTransparency) {
        setBgTransparency(bgTransparency)
      }
    }


    useEffect(() => {
      initSavedImage()
    }, [])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div id="background">
        <h2>背景设置</h2>
        <Checkbox style={{color: 'inherit'}}
          defaultChecked={bgImage !== ''} 
          onChange={(e) => {
            if (e.target.checked) {
              openBgImage()
              setIsVisible(true)
            }
            else {
              setIsVisible(false)
              closeBgImage()
            }
          }}
        >
          <span>开启背景</span>
        </Checkbox>

        {isVisible && (
        <div id="bgImage" data-section style={{ marginBottom: 48,color: 'inherit' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start',marginTop: 32,marginBottom: 32 }}>
            <Input value={bgImage? bgImage : savedBgImage} readOnly />
            <Button icon={<UploadOutlined />} onClick={() => handleSelectBgImage()}>浏览</Button>
          </div>
          <div style={{display: 'flex', marginTop: 32,marginBottom: 50}}>
              <label style={{marginRight: 16}}>深色背景透明度</label>
              <Slider style={{marginLeft: 16 ,width: 200}}
                defaultValue={bgTransparency.dark}
                min={0}
                max={100}
                step={1}
                onChange={(value) => handleBgTransparency('dark', value)}
              />
          </div>
          <div style={{display: 'flex', marginTop: 32,marginBottom: 50}}>
              <label style={{marginRight: 16}}>浅色背景透明度</label>
              <Slider style={{marginLeft: 16 ,width: 200}}
                defaultValue={bgTransparency.light}
                min={0}
                max={100}
                step={1}
                onChange={(value) => handleBgTransparency('light', value)}
              />
          </div>
        </div>
        )
        }
      </div>
    </div>
  );
};

export default BackgroundSettings;