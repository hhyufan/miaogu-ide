// Monaco Editor Web Worker Setup

// This file configures Monaco Editor's web workers to ensure they load correctly
// It solves the "Could not create web worker(s)" error

// Import the workers directly
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// Import language support
import '@codingame/monaco-vscode-python-default-extension'

// Define the MonacoEnvironment global object to tell Monaco where to load workers from
self.MonacoEnvironment = {
  getWorker(_, label) {
    // JSON相关文件
    if (label === 'json' || label === 'yaml' || label === 'toml') {
      return new jsonWorker()
    }
    // CSS相关样式文件
    if (
      label === 'css' ||
      label === 'scss' ||
      label === 'sass' ||
      label === 'less' ||
      label === 'stylus'
    ) {
      return new cssWorker()
    }
    // HTML相关标记语言
    if (
      label === 'html' ||
      label === 'htm' ||
      label === 'handlebars' ||
      label === 'razor' ||
      label === 'pug' ||
      label === 'jade' ||
      label === 'xml'
    ) {
      return new htmlWorker()
    }
    // JavaScript/TypeScript相关
    if (
      label === 'typescript' ||
      label === 'javascript' ||
      label === 'js' ||
      label === 'jsx' ||
      label === 'ts' ||
      label === 'tsx' ||
      label === 'vue' ||
      label === 'svelte'
    ) {
      return new tsWorker()
    }
    // 其他所有语言使用基础编辑器worker
    return new editorWorker()
  }
}
