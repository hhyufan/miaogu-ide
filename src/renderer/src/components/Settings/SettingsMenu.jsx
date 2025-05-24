import  { useState, useRef } from 'react';
import { Menu } from 'antd';
import './SettingsMenu.scss';
import SettingsContent from './SettingsContent';

const SettingsMenuList = [
  {
    key: 'text',
    label: '文本编辑器',
    children: [
      { key: 'fontSize', label: '字体大小' },
      { key: 'fontFamily', label: '字体' },
    ],
  },
  {
    key: 'background',
    label: '背景',
    children: [
      { key: 'bgImage', label: '背景图片' },
    ],
  },
];

const SettingsMenu = () => {
  const [activeKey, setActiveKey] = useState('');
  const contentRef = useRef(null);

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el && contentRef.current) {
      contentRef.current.scrollTo({
        top: el.offsetTop,
        behavior: 'smooth',
      });
      setActiveKey(id);
    }
  };

  const handleScroll = () => {
    const sections = document.querySelectorAll('[data-section]');
    let active = '';
    const scrollTop = contentRef.current.scrollTop;
    sections.forEach((section) => {
      if (section.offsetTop - scrollTop < 80) {
        active = section.getAttribute('id');
      }
    });
    if (active && active !== activeKey) {
      setActiveKey(active);
    }
  };

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
              <Menu.SubMenu key={group.key} title={group.label}>
                {group.children.map((item) => (
                  <Menu.Item key={item.key} onClick={() => handleScrollTo(item.key)}>
                    {item.label}
                  </Menu.Item>
                ))}
              </Menu.SubMenu>
            ))}
          </Menu>
        </div>
        <div
          ref={contentRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            display: 'flow-root',
            overflow: 'auto',
            padding: 36,
          }}
        >
          <SettingsContent />
        </div>
      </div>
  );
}

export default SettingsMenu;