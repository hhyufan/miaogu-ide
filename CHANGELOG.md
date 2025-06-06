![GitHub Release](https://img.shields.io/badge/release-v1.1.0-orange) [![Date](https://img.shields.io/badge/date-2025--06--4-blue)](https://github.com/hhyufan/miaogu-ide)

## 🐞 Bug 修复
- ➖ 解决了若干导致编辑器内容错误置空的问题。
- 🖱️ 修复全局滚动导致使用滚轮或拖拽时，编辑器整体上下浮动的问题。

## 🪛 功能优化
- ✏️ **已修改状态**：重写“已修改”状态判断逻辑，现在根据原始内容判断是否有变更，判断更精准。
- 🍞 **面包屑导航**：为面包屑导航栏添加自定义横向滚动条，提升导航体验。
- 🔗 **外部链接**：在编辑器中打开外部链接时，将在默认浏览器中打开。

## ✨ 新增功能
- ⚙️ **设置页面**：现在支持在“设置”页面中自定义编辑器相关设置！
  - 🖼️ **背景图片**：可为代码编辑器启用/关闭背景图片，自定义图片及透明度。
  - 🔤 **字体设置**：可调整字体大小、行高和字体，字体大小可在编辑器状态栏实时调整。
  - 🎨 **代码高亮**：可选择预设高亮主题风格自定义编辑器外观。
- ▶️ **代码运行**：支持在控制台直接运行 JavaScript 或 HTML 代码。
  - 📜 **JavaScript**：支持 node.js 沙箱环境运行 JavaScript 代码。
  - 📝 **Markdown 控制台渲染**：JavaScript 代码中可用 `console.md()` 函数在控制台渲染 Markdown（支持 mermaid）。
  - 🌐 **HTML**：运行 HTML 时，自动在默认浏览器中打开，临时文件存储于本地 temp 目录后再运行。

## 🚫 功能移除
- 🏷️ **Header 相关**：移除标题栏文件名 hover 时的背景样式。
- 🗺️ **代码小地图**：因与“背景图片”设置冲突，删除代码小地图功能。

---

*遵循 [语义化版本](https://semver.org/lang/zh-CN/)*
