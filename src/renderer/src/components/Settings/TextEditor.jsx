import { Input, Select} from 'antd';

// eslint-disable-next-line react/prop-types
const TextEditor = ({ fontSize, setFontSize, fontFamily, setFontFamily }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24  }}>
      <div id="textEditor">
        <h2>文本设置</h2>

        <div id="fontSize" data-section style={{ marginBottom: 48 }}>
          <h4>字体大小</h4>
          <Input value={fontSize} style={{ width: 120 }} onChange={(e) => {
            setFontSize(e.target.value);  // 更新 fontSize 状态
          }} />
          <span>px</span>
        </div>

        <div id="fontFamily" data-section style={{ marginBottom: 48 }}>
          <h4>字体</h4>
          <Select value={fontFamily} style={{ width: 150 }} onChange={(value) => {
            setFontFamily(value)
          }}>
            <Select.Option value="JetBrains Mono">JetBrains Mono</Select.Option>
            <Select.Option value="Fira Code">Fira Code</Select.Option>
            <Select.Option value="Courier New">Courier New</Select.Option>
            <Select.Option value="Consolas">Consolas</Select.Option>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
