import moment from 'moment';

function extractFirstPemCertificate(pemContent) {
    const match = pemContent.match(/-----BEGIN CERTIFICATE-----[\r\n]+([\s\S]*?)-----END CERTIFICATE-----/);
    if (!match) {
        return null;
    }
    return `-----BEGIN CERTIFICATE-----\n${match[1].replace(/\r/g, '').trim()}\n-----END CERTIFICATE-----`;
}

function pemToUint8Array(pemBlock) {
    const base64 = pemBlock
        .replace(/-----BEGIN CERTIFICATE-----/g, '')
        .replace(/-----END CERTIFICATE-----/g, '')
        .replace(/\s+/g, '');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function readAsn1Length(bytes, offset) {
    const first = bytes[offset];
    if (first < 0x80) {
        return { length: first, size: 1 };
    }
    const numBytes = first & 0x7f;
    if (numBytes === 0 || offset + 1 + numBytes > bytes.length) {
        return null;
    }
    let length = 0;
    for (let i = 0; i < numBytes; i++) {
        length = (length << 8) | bytes[offset + 1 + i];
    }
    return { length, size: 1 + numBytes };
}

function parseAsn1Time(bytes, offset) {
    const tag = bytes[offset];
    const lenInfo = readAsn1Length(bytes, offset + 1);
    if (!lenInfo) {
        return null;
    }
    const valueStart = offset + 1 + lenInfo.size;
    const value = String.fromCharCode(...bytes.slice(valueStart, valueStart + lenInfo.length)).replace(/\0/g, '');
    if (tag === 0x17) {
        const year = parseInt(value.substr(0, 2), 10);
        const fullYear = year >= 50 ? 1900 + year : 2000 + year;
        const hasSeconds = value.length >= 13;
        const template = hasSeconds
            ? `${fullYear}-${value.substr(2, 2)}-${value.substr(4, 2)} ${value.substr(6, 2)}:${value.substr(8, 2)}:${value.substr(10, 2)}`
            : `${fullYear}-${value.substr(2, 2)}-${value.substr(4, 2)} ${value.substr(6, 2)}:${value.substr(8, 2)}`;
        const parsed = moment(template, hasSeconds ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm');
        return parsed.isValid() ? parsed : null;
    }
    if (tag === 0x18 && value.length >= 14) {
        const parsed = moment(
            `${value.substr(0, 4)}-${value.substr(4, 2)}-${value.substr(6, 2)} ${value.substr(8, 2)}:${value.substr(10, 2)}:${value.substr(12, 2)}`,
            'YYYY-MM-DD HH:mm:ss'
        );
        return parsed.isValid() ? parsed : null;
    }
    return null;
}

function parseNotAfterFromDer(bytes) {
    const times = [];
    for (let i = 0; i < bytes.length - 2; i++) {
        if (bytes[i] !== 0x17 && bytes[i] !== 0x18) {
            continue;
        }
        const parsed = parseAsn1Time(bytes, i);
        if (parsed) {
            times.push(parsed);
        }
    }
    if (times.length >= 2) {
        return times[1];
    }
    if (times.length === 1) {
        return times[0];
    }
    return null;
}

function parseOpenSslTextNotAfter(content) {
    const match = content.match(/Not After\s*:\s*(.+?)\s*GMT/i);
    if (!match) {
        return null;
    }
    const date = new Date(`${match[1].trim()} GMT`);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
}

function formatExpiredDate(date) {
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 从证书文件内容解析过期时间，逻辑对齐后端 parseExpiredDate：
 * 取第一个 PEM CERTIFICATE 块并解析 NotAfter
 * @param {string} pemContent - 证书文件文本
 * @returns {string|null} - 格式 YYYY-MM-DD HH:mm:ss，解析失败返回 null
 */
export function parseCertExpiredDate(pemContent) {
    if (!pemContent || typeof pemContent !== 'string') {
        return null;
    }

    const pemBlock = extractFirstPemCertificate(pemContent);
    if (pemBlock && typeof X509Certificate !== 'undefined') {
        try {
            const cert = new X509Certificate(pemBlock);
            const formatted = formatExpiredDate(new Date(cert.validTo));
            if (formatted) {
                return formatted;
            }
        } catch (e) {
            // fallback to DER / OpenSSL text parsing
        }
    }

    if (pemBlock) {
        try {
            const bytes = pemToUint8Array(pemBlock);
            const expiredDate = parseNotAfterFromDer(bytes);
            if (expiredDate) {
                return expiredDate.format('YYYY-MM-DD HH:mm:ss');
            }
        } catch (e) {
            // fallback to OpenSSL text parsing
        }
    }

    return parseOpenSslTextNotAfter(pemContent);
}
