import { InputNumber, Select } from 'antd'

// eslint-disable-next-line react/prop-types
const TextEditor = ({
                      fontSize,
                      setFontSize,
                      lineHeight,
                      setLineHeight,
                      fontFamily,
                      setFontFamily
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div id="textEditor">
              <h2 style={{fontWeight: 500, marginBottom: 32, color: 'var(--text-secondary-color)'}}>通用</h2>
              <h3 style={{fontWeight: 500, marginBottom: 24}}>文本设置</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>

                {/* 字体大小 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h4 style={{ margin: 0, minWidth: '25px', fontWeight: 400}}>大小：</h4>
                  <InputNumber
                    value={fontSize}
                    min={8}
                    max={32}
                    addonAfter="px"
                    style={{ width: 94, marginLeft: 8 }}
                    onChange={(value) => setFontSize(value)}
                  />
                </div>

                {/* 行高 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h4 style={{ margin: 0, minWidth: '25px', fontWeight: 400 }}>行高：</h4>
                  <InputNumber
                    value={lineHeight}
                    min={1.0}
                    max={3.0}
                    step={0.1}
                    style={{ width: 66}}
                    onChange={(value) => setLineHeight(value)}
                  />
                </div>
              </div>
              <div id="fontFamily" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <h4 style={{ margin: 0, minWidth: '40px', fontWeight: 400 }}>字体：</h4>
                <Select
                  value={fontFamily}
                  style={{ width: 240 }}
                  onChange={(value) => {
                    setFontFamily(value)
                  }}
                >
                  <Select.Option value="JetBrains Mono">JetBrains Mono</Select.Option>
                  <Select.Option value="Fira Code">Fira Code</Select.Option>
                  <Select.Option value="Courier New">Courier New</Select.Option>
                  <Select.Option value="Consolas">Consolas</Select.Option>
                </Select>
              </div>
            </div>

        </div>
    )
}

export default TextEditor
