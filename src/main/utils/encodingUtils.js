import { TextDecoder } from 'text-encoding'
import jschardet from 'jschardet'

/**
 * 检测文件编码
 * @param {Buffer} buffer - 文件内容的Buffer
 * @returns {string} - 检测到的编码
 */
export function detectFileEncoding(buffer) {
    // 优先检查BOM标记
    if (buffer.length >= 4) {
        // UTF-8 BOM（EF BB BF）
        if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
            return 'UTF-8'
        }
        // UTF-16 Little Endian（FF FE）
        if (buffer[0] === 0xff && buffer[1] === 0xfe) {
            return 'UTF-16LE'
        }
        // UTF-16 Big Endian（FE FF）
        if (buffer[0] === 0xfe && buffer[1] === 0xff) {
            return 'UTF-16BE'
        }
    }

    // 无BOM时使用自动检测
    const detected = jschardet.detect(buffer)
    let encoding = 'UTF-8' // 默认值

    if (detected && detected.encoding) {
        // 修复ASCII误判为UTF-8的问题
        if (detected.encoding.toLowerCase() === 'ascii') {
            // ASCII是UTF-8的子集，直接使用UTF-8
            return 'UTF-8'
        }

        encoding = detected.encoding.toLowerCase()

        // 处理常见编码别名
        const encodingMap = {
            'iso-8859-1': 'windows-1252',
            gb2312: 'gb18030',
            big5: 'big5-hkscs'
        }
        encoding = encodingMap[encoding] || encoding

        // 低置信度二次验证（<85%）
        if (detected.confidence < 0.85) {
            // 检查是否可能是UTF-8
            const isValidUtf8 = isValidUTF8(buffer)
            if (isValidUtf8) {
                return 'UTF-8'
            }

            try {
                // 尝试解码前1024字节验证
                new TextDecoder(encoding).decode(buffer.slice(0, 1024))
            } catch {
                encoding = 'UTF-8' // 回退到UTF-8
            }
        }
    }

    // 特殊处理日文编码
    if (encoding === 'shift_jis') {
        try {
            // 验证是否为合法Shift_JIS
            new TextDecoder('shift_jis').decode(buffer.slice(0, 1024))
        } catch {
            encoding = 'cp932' // 回退到CP932
        }
    }

    return encoding
}

/**
 * 检查是否是有效的UTF-8编码
 * @param {Buffer} buffer - 文件内容的Buffer
 * @returns {boolean} - 是否为有效的UTF-8编码
 */
export function isValidUTF8(buffer) {
    let i = 0
    while (i < buffer.length) {
        if (buffer[i] < 0x80) {
            // ASCII范围
            i++
            continue
        }

        // 检查多字节UTF-8序列
        if ((buffer[i] & 0xe0) === 0xc0) {
            // 2字节序列
            if (i + 1 >= buffer.length || (buffer[i + 1] & 0xc0) !== 0x80) {
                return false
            }
            i += 2
        } else if ((buffer[i] & 0xf0) === 0xe0) {
            // 3字节序列
            if (
                i + 2 >= buffer.length ||
                (buffer[i + 1] & 0xc0) !== 0x80 ||
                (buffer[i + 2] & 0xc0) !== 0x80
            ) {
                return false
            }
            i += 3
        } else if ((buffer[i] & 0xf8) === 0xf0) {
            // 4字节序列
            if (
                i + 3 >= buffer.length ||
                (buffer[i + 1] & 0xc0) !== 0x80 ||
                (buffer[i + 2] & 0xc0) !== 0x80 ||
                (buffer[i + 3] & 0xc0) !== 0x80
            ) {
                return false
            }
            i += 4
        } else {
            return false
        }
    }
    return true
}

/**
 * 检测文件的行尾序列
 * @param {string} content - 文件内容
 * @returns {string} - 行尾序列类型 ('LF', 'CRLF', 'CR')
 */
export function detectLineEnding(content) {
    if (content.includes('\r\n')) {
        return 'CRLF'
    } else if (content.includes('\r') && !content.includes('\n')) {
        return 'CR'
    }
    return 'LF'
}
