/*
 * @Author: lijiahao
 * @Date: 2022-04-08 13:04:25
 * @LastEditTime: 2022-04-11 09:10:06
 * @Msg: Nothing
 */
/**
 * iView Admin Pro 开发配置
 * */

const env = process.env.NODE_ENV;
const qdbaseUrl = 'http://cas.incons.com.cn:19070';
const Setting_qd = {
    // 部署应用包时的基本 URL
    publicPath: '/',
    // 生产环境构建文件的目录名
    outputDir: 'dist',
    // 放置生成的静态资源 (js、css、img、fonts) 的 (相对于 outputDir 的) 目录。
    assetsDir: '',
    // 开发环境每次保存时 lint 代码，会将 lint 错误输出为编译警告
    // true || false || error
    lintOnSave: false,

    // iView Loader 的选项
    // 详见 https://www.iviewui.com/docs/guide/iview-loader
    iviewLoaderOptions: {
        prefix: false
    }
};

module.exports = Setting_qd;
