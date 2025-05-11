export default function stringToUnicode(str) {
  return Array.from(str)
    .map((char) => {
      // 获取字符的 Unicode 编码并转换为十六进制
      const code = char.charCodeAt(0).toString(16)
      return `\\u${code.padStart(4, '0')}` // 确保每个编码都是四位数
    })
    .join('')
}
