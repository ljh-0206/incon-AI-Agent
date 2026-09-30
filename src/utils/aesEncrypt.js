import CryptoJS from 'crypto-js';

const key = CryptoJS.enc.Utf8.parse('inco12345678ocni'); // 十六位十六进制数作为秘钥
const iv = CryptoJS.enc.Utf8.parse('ocni12345678inco');// 十六位十六进制数作为秘钥偏移量

/**
 * 加密方法
 * @param data
 * @returns {string}
 */
export function encrypt_aes (data) {
    if (data) {
        const srcs = CryptoJS.enc.Utf8.parse(data);
        const encrypted = CryptoJS.AES.encrypt(srcs, key, {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.ZeroPadding
        });
        return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
    }
    return '';
}

/**
 * 解密方法
 * @param data
 * @returns {string}
 */
export function decrypt_aes (data) {
    if (data) {
        const base64 = CryptoJS.enc.Base64.parse(data);
        const src = CryptoJS.enc.Base64.stringify(base64);
        const decrypt = CryptoJS.AES.decrypt(src, key, {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.ZeroPadding
        });

        const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
        return decryptedStr.toString();
    }
    return '';
}

/**
 * md5加密方法
 * @param data
 * @returns {string}
 */
export function md5 (data) {
    if (data) {
        return CryptoJS.MD5(data).toString();
    }
    return '';
}
