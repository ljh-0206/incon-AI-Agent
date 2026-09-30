// 引入插件
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const path = require('path');

const Setting_qd = require('./src/setting.env');
// 拼接路径
const resolve = dir => path.join(__dirname, dir);

// 增加环境变量
process.env.VUE_APP_VERSION = require('./package.json').version;
process.env.VUE_APP_BUILD_TIME = require('dayjs')().format('YYYY-M-D HH:mm:ss');

const { defineConfig } = require('@vue/cli-service');
const webpack = require('webpack');

module.exports = defineConfig({
    publicPath: Setting_qd.publicPath,
    lintOnSave: Setting_qd.lintOnSave,
    outputDir: Setting_qd.outputDir,
    assetsDir: Setting_qd.assetsDir,
    runtimeCompiler: true,
    productionSourceMap: false,
    transpileDependencies: ['@asyncapi/parser', '@vue-flow/core'],
    css: {
        loaderOptions: {
            less: {
                lessOptions: {
                    javascriptEnabled: true
                }
            }
        }
    },
    configureWebpack: {
        resolve: {
            fallback: {
                util: false,
                assert: false,
                buffer: require.resolve('buffer/'),
                stream: require.resolve('stream-browserify'),
                zlib: require.resolve('browserify-zlib'),
                path: require.resolve('path-browserify'),
                url: require.resolve('url/'),
                fs: false,
                crypto: require.resolve('crypto-browserify'),
                http: require.resolve('stream-http'),
                https: require.resolve('https-browserify'),
                os: false,
                net: false,
                tls: false,
                child_process: false
            }
        },
        plugins: [
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
                process: 'process/browser'
            })
        ],
        module: {
            rules: [
                {
                    test: /.mjs$/,
                    include: /node_modules/,
                    type: "javascript/auto"
                },
                // 打包时字符替换（仅对项目源码，排除 node_modules 防污染第三方库）
                {
                    test: /\.js|\.mjs$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'string-replace-loader',
                            options: {
                                search: '法轮',
                                replace: '法法',
                                flags: 'g'
                            }
                        },
                        {
                            loader: 'string-replace-loader',
                            options: {
                                search: '#!/usr/bin/env|@gmail.com|@cloudhead.net|@163.com|@brevoort.com|@github.com|@rubaxa.org|@aliax.net|@feross.org|@indutny.com|@quasimondo.com',
                                replace: '',
                                flags: 'g'
                            }
                        },
                        {
                            loader: 'string-replace-loader',
                            options: {
                                search: '.cookie=',
                                replace: '.cookie = ',
                                flags: 'g'
                            }
                        },
                    ]
                }
            ]
        },
        plugins: [
            // 压缩
            new CompressionPlugin({
                test: /\.(js|css)$/,
                algorithm: "gzip",
                threshold: 10240,
                deleteOriginalAssets: false,
            }),
            // 在编译完成后的处理
            {
                apply: (compiler) => {
                    compiler.hooks.compilation.tap('CookieReplacePlugin', (compilation) => {
                        compilation.hooks.processAssets.tap(
                            {
                                name: 'CookieReplacePlugin',
                                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
                            },
                            (assets) => {
                                for (const filename in assets) {
                                    if (filename.endsWith('.js')) {
                                        const asset = assets[filename];
                                        const sourceContent = asset.source().toString();
                                        const replaced = sourceContent.replace(/\.cookie\s*=/g, '.cookie = ');
                                        compilation.updateAsset(filename, new compiler.webpack.sources.RawSource(replaced));
                                    }
                                }
                            }
                        );
                    });
                }
            }
        ],
        // 优化配置
        optimization: {
            splitChunks: {
                chunks: 'all',
                maxSize: 5120000,
                minSize: 2048000,
                cacheGroups: {
                    tinymce: {
                        test: /[\\/]node_modules[\\/](tinymce|@tinymce)[\\/]/,
                        name: 'tinymce',
                        priority: 20,
                        chunks: 'all',
                        enforce: true
                    },
                    vendors: {
                        test: /[\\/]node_modules[\\/]/,
                        name: "vendors",
                        priority: 10
                    }
                }
            },
            minimize: process.env.NODE_ENV === 'production',
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        compress: {},
                        output: {
                            comments: false
                        },
                    },
                    extractComments: false,
                }),
                new CssMinimizerPlugin()
            ],
            runtimeChunk: {
                name: 'runtime'
            },
        },
    },
    // 跨域配置
    devServer: {
        client: {
            overlay: false
        },
        static: {
            publicPath: Setting_qd.publicPath
        },
        historyApiFallback: true,
        hot: true,
        port: 8083,
        // 关闭 devServer 的 gzip 压缩：压缩中间件会对 text/event-stream 响应做缓冲式 gzip，
        // 导致 SSE 流式端点（/ai/llm/chat/stream）的增量被攒到响应结束才一次性发给浏览器。
        // 开发环境无需压缩（构建产物已由 CompressionPlugin 处理）。
        compress: false,
        proxy: {
            '/api': {
                // target: 'http://cas.incons.com.cn:19070/xmpzpt',//配置平台4.0
                target: 'http://127.0.0.1:28009',
                // target: 'http://127.0.0.1:8080/xmpzpt',
                // target: 'http://cas.incons.com.cn:19123/jxdad',//新版教学档案袋
                // target: 'http://cas.incons.com.cn:19071/zhjw4',//配置平台4.0
                pathRewrite: {
                    '^/api': ''
                },
                changeOrigin: true
            },
            '/ureport': {
                target: 'http://127.0.0.1:28009',
                pathRewrite: {
                    '^/ureport': '/ureport'
                },
                changeOrigin: true
            },
            '/deepseek': {
                target: 'http://43.227.254.12:30080',
                pathRewrite: {
                    '^/deepseek': ''
                },
                changeOrigin: true
            },
            '/xmpzpt_19062': {
                target: 'http://cas.incons.com.cn:19062/xmpzpt',
                pathRewrite: {
                    '^/xmpzpt_19062': ''
                },
                changeOrigin: true
            }
        }
    },
    // 默认设置
    chainWebpack: config => {
        // 删除懒加载模块的 prefetch preload
        config.plugins.delete('prefetch').delete('preload');
        config.resolve.symlinks(true);

        config.when(process.env.NODE_ENV === 'development',
            config => config.devtool('cheap-source-map')
        );

        // 不编译 iView Pro
        config.module.rule('js').test(/\.jsx?$/).exclude.add(resolve('src/libs/iview-pro')).end();

        // markdown
        config.module.rule('md').test(/\.md$/).use('text-loader').loader('text-loader').end();

        // i18n - Vue 3 使用 @intlify/vue-i18n-loader
        config.module.rule('i18n').resourceQuery(/blockType=i18n/).use('i18n').loader('@intlify/vue-i18n-loader').end();

        // image exclude
        const imagesRule = config.module.rule('images');
        imagesRule.test(/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/).exclude.add(resolve('src/assets/svg')).end();

        // 重新设置 alias
        config.resolve.alias.set('@api', resolve('src/api'));

        // TinyMCE 的 tree shaking 保护：标记 tinymce 和 @tinymce 模块为有副作用，防止其插件/主题/图标被移除
        config.module.rule('tinymce-side-effects')
            .test(/[\\/]node_modules[\\/](tinymce|@tinymce)[\\/]/)
            .sideEffects(true);
    }
});
