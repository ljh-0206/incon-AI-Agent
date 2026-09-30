import JSEncrypt from 'jsencrypt'

// 公钥
const publicKey = 'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANELbqgeJGSenOxEcpfkRdXij2yqPQv7yNtX/UnfJtBz+NqGQOXDBHMBhXRGht27T/1K1MhGF9XP2x+25KZI5g8CAwEAAQ=='

// 加密
export function encrypt (txt) {
    const encryptor = new JSEncrypt()
    encryptor.setPublicKey(publicKey) // 设置公钥
    return encryptor.encrypt(txt) // 对需要加密的数据进行加密
}
