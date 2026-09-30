<!-- 通用上传组件，需自己处理上传后页面元素 -->
<template>
    <div id="global-uploader" :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <!-- 上传 带切片-->
        <uploader ref="uploader" :options="options" :autoStart="false" :file-status-text="statusText"
            @file-added="onFileAdded" @file-success="onFileSuccess" @file-progress="onFileProgress"
            @file-error="onFileError" class="uploader-app">
            <uploader-unsupport></uploader-unsupport>

            <uploader-btn id="global-uploader-btn" :class="'btn'+uid" :attrs="accept.length?{accept}:attrs"
                ref="uploadBtn">选择文件</uploader-btn>

            <uploader-list v-show="panelShow">
                <template #default="{ fileList }">
                    <div class="file-panel" :class="{'collapse': collapse}">
                        <ul class="file-list">
                            <li v-for="file in fileList" :key="file.id">
                                <uploader-file :class="'file_' + file.id" ref="files" :file="file" :list="true"></uploader-file>
                            </li>
                        </ul>
                    </div>
                </template>
            </uploader-list>
        </uploader>
    </div>
</template>
<script>
    /**
     *   全局上传插件
     *   调用方法：Bus.$emit('openUploader', {}) 打开文件选择框，参数为需要传递的额外参数
     *   监听函数：Bus.$on('fileAdded', fn); 文件选择后的回调
     *   Bus.$on('fileSuccess', fn); 文件上传成功的回调
     */

    import Bus from './js/bus'
    import SparkMD5 from 'spark-md5'
    import Setting from '@/setting'
    import { mapState, mapGetters } from 'vuex'
    import uploader from 'vue-simple-uploader'
    import 'vue-simple-uploader/dist/style.css'

    export default {
        name: 'global-uploader',
        components: {
            uploader: uploader.Uploader,
            'uploader-btn': uploader.UploaderBtn,
            'uploader-list': uploader.UploaderList,
            'uploader-file': uploader.UploaderFile,
            'uploader-unsupport': uploader.UploaderUnsupport
        },

        props: {
            configdata: { type: Object, default: () => ({}) },
            uid: { type: Number, default: 111 },
            // 上传存储方式
            uploadType: { type: String, default: 'local' },
            // 上传文件类型
            accept: { type: String, default: '' },
            // 文件数量限制
            maxNumber: { type: Number, default: 1 },
            // 文件大小限制
            maxSize: { type: Number, default: 100 },
            // 操作的系统
            czxt: { type: String, default: '' },
            // 操作的模块
            czmk: { type: String, default: '上传组件' },
            // 要自定义存储的路径
            cclj: { ype: String, default: '' },
            // 已上传数量
            yscsl: { type: Number, default: 0 },
            // 是否需要转码
            sfzm: { type: String, default: '' },
            // 视频上传控制参数
            videoParams: {
                type: Object,
                default: () => ({
                    // 视频是否需要转码为mp4
                    spsfxyzm: '0',
                    // 同时生成进度条雪碧图
                    scjdtxbt: '0',
                    // 同时生成480p视频
                    sc480sp: '0',
                    // 同时生成720p视频
                    sc720sp: '0',
                    // 同时生成1080p视频
                    sc1080sp: '0',
                    // 同时生成视频的音频
                    scspyp: '0'
                })
            }
        },
        data () {
            return {
                uploadBaseURL: Setting.uploadBaseURL,
                fileList: [],
                options: {
                    target: Setting.uploadBaseURL + '/fileManagerSystem/uploadFile', // 目标上传 URL
                    chunkSize: '2048000', // 分块大小
                    fileParameterName: 'file', // 上传文件时文件的参数名，默认file
                    maxChunkRetries: 3, // 最大自动失败重试上传次数
                    singleFile: this.maxNumber == 1, // 单文件上传
                    testChunks: true, // 是否开启服务器分片校验
                    simultaneousUploads: 5, // 分片并发上传数，默认是3
                    // 格式化时间
                    parseTimeRemaining: function (timeRemaining, parsedTimeRemaining) {
                        return parsedTimeRemaining
                            .replace(/\syears?/, '年')
                            .replace(/\days?/, '天')
                            .replace(/\shours?/, '小时')
                            .replace(/\sminutes?/, '分钟')
                            .replace(/\sseconds?/, '秒')
                    },
                    // 服务器分片校验函数，秒传及断点续传基础
                    checkChunkUploadedByResponse: function (chunk, message) {
                        const objMessage = JSON.parse(message)
                        if (objMessage.mc) return true
                        return (objMessage.data || []).indexOf(chunk.offset + 1) >= 0
                    },
                    headers: {
                        Token: 'Inco-' + localStorage.getItem('token' + '_' + Setting.xmid)
                    },
                    query () {
                        // form或data里的参数 根据实际需要
                    }
                },
                attrs: {
                    accept: (!this.accept) ? [] : this.accept.split(',').map((item) => '.' + item)
                },
                statusText: {
                    success: '上传成功',
                    error: '上传失败',
                    uploading: '正在上传',
                    paused: '等待上传',
                    waiting: '等待上传'
                },
                panelShow: false, // 选择文件后，展示上传panel
                collapse: false,
                params: {},
                tempdata: {}
            }
        },
        // created方法，页面初始调用
        created: function () {
            try {
                this.attrs.accept = (!this.accept) ? [] : this.accept.split(',').map((item) => '.' + item);
            } catch (e) {
                this.attrs.accept = (!this.accept) ? [] : this.accept.split(',').map((item) => '.' + item);
            }
        },
        mounted () {
            this.params = {
                czxt: this.czxt ? this.czxt : Setting.xmid,
                czmk: this.czmk,
                czr: this.info.yhdm,
                cclj: this.cclj,
                uploadType: this.uploadType,
                sfzm: this.sfzm,
                ...this.videoParams
            }
            Bus.$on('openUploader', (query) => {
                this.params = {
                    ...this.params,
                    ...query
                }
                if (this.$refs.uploadBtn && query.uid == this.uid) {
                    $('.btn' + this.uid)[0].click()
                }
            })
        },
        computed: {
            ...mapState('admin/user', ['info']),
            // Uploader实例
            uploader () {
                return this.$refs.uploader?.uploader
            },
            // 正在上传的文件数量（显示在上传列表的文件的数量）
            xzwjsl () {
                const uploaderRef = this.$refs.uploader
                if (!uploaderRef) return 0
                // fileList is a ref exposed from uploader component, access .value or use optional chaining
                const fileList = uploaderRef.fileList?.value ?? uploaderRef.fileList
                if (!fileList) return 0
                return Array.isArray(fileList) ? fileList.length : 0
            }
        },
        methods: {
            onFileAdded (file) {
                // 文件上传先暂停
                file.pause();

                // 判断是否超文件上传数量this.maxNumber
                if (this.yscsl + this.xzwjsl > this.maxNumber) {
                    this.$Message.error('最多只能上传' + this.maxNumber + '个文件')
                    file.ignored = true; // 过滤文件
                    file.cancel(); // 停止上传
                    return false;
                }

                // 上传文件格式判断
                const isFormat = this.checkFileType(file.name);
                // 上传文件大小判断
                const fileSizeBoolean = this.checkFileSize(file.size);

                if (!isFormat || !fileSizeBoolean) {
                    file.ignored = true; // 过滤文件
                    file.cancel(); // 停止上传
                    return false;
                } else {
                    this.panelShow = true
                    this.computeMD5(file)
                    Bus.$emit('fileAdded', file)
                }
            },
            onFileProgress (rootFile, file, chunk) {
            },
            onFileSuccess (rootFile, file, response, chunk) {
                // 上传成功
                const self = this
                const responseObj = JSON.parse(response)
                if (responseObj.mc) {
                    // 秒传
                    // 添加到返回数据
                    self.fileList.push(responseObj.data)
                    self.over();
                } else {
                    // 非秒传，服务器合并
                    // 文件状态设为“合并中”
                    self.statusSet(file.id, 'merging')
                    $.ajax({
                        url: this.uploadBaseURL + '/fileManagerSystem/mergeFile',
                        type: 'POST',
                        headers: {
                            Token: 'Inco-' + localStorage.getItem('token' + '_' + Setting.xmid)
                        },
                        data: {
                            identifier: file.uniqueIdentifier,
                            filename: file.name,
                            totalSize: file.size,
                            czxt: self.params.czxt,
                            czmk: self.params.czmk,
                            czr: self.params.czr,
                            cclj: self.params.cclj,
                            uploadType: self.params.uploadType,
                            sfzm: self.sfzm,
                            ...self.videoParams
                        },
                        dataType: 'json',
                        success: function (res) {
                            self.statusRemove(file.id)
                            // 添加到返回数据
                            self.fileList.push(res)
                            self.over();
                        }
                    })
                }
            },
            onFileError (rootFile, file, response, chunk) {
                this.$Message.error({
                    content: response
                })
            },

            /**
             * 校验文件格式
             */
            checkFileType (fileName) {
                const acceptArray = this.attrs.accept;
                if (acceptArray != null && acceptArray != '') {
                    const format = '.' + fileName.split('.').pop().toLowerCase(); // 用户上传的文件格式
                    // 把允许上传文件格式的数组转为字符串
                    const s = acceptArray.join(',').toLowerCase();
                    const exp = new RegExp(format);
                    if (!exp.test(s.split(','))) {
                        this.$Message.warning('请上传 [' + s + '] 格式的文件!');
                        return false;
                    }
                }
                return true;
            },
            /**
             * 校验文件大小
             */
            checkFileSize (fileSize) {
                if (fileSize / 1024 / 1024 > this.maxSize) {
                    this.$Message.warning('文件过大！文件大小最大为' + this.maxSize + 'M!');
                    return false;
                }
                return true;
            },

            /**
             * 计算md5，实现断点续传及秒传
             * @param file
             */
            computeMD5 (file) {
                const fileReader = new FileReader()
                const time = new Date().getTime()
                const blobSlice =
                    File.prototype.slice ||
                    File.prototype.mozSlice ||
                    File.prototype.webkitSlice
                let currentChunk = 0
                const chunkSize = 10 * 1024 * 1000
                const chunks = Math.ceil(file.size / chunkSize)
                const spark = new SparkMD5.ArrayBuffer()

                // 文件状态设为"计算MD5"
                this.statusSet(file.id, 'md5')
                // 文件上传先暂停
                // file.pause()

                loadNext()

                fileReader.onload = (e) => {
                    spark.append(e.target.result)

                    if (currentChunk < chunks) {
                        currentChunk++
                        loadNext()

                        // 实时展示MD5的计算进度
                        this.$nextTick(() => {
                            $(`.myStatus_${file.id}`).text(
                                '校验MD5 ' + ((currentChunk / chunks) * 100).toFixed(0) + '%'
                            )
                        })
                    } else {
                        const md5 = spark.end()
                        this.computeMD5Success(md5, file)
                    }
                }

                fileReader.onerror = function () {
                    this.error(`文件${file.name}读取出错，请检查该文件`)
                    file.cancel()
                }

                function loadNext () {
                    const start = currentChunk * chunkSize
                    const end = start + chunkSize >= file.size ? file.size : start + chunkSize

                    fileReader.readAsArrayBuffer(blobSlice.call(file.file, start, end))
                }
            },

            computeMD5Success (md5, file) {
                // 将自定义参数直接加载uploader实例的opts上
                if (file.uploader) {
                    Object.assign(file.uploader.opts, {
                        query: {
                            ...this.params
                        }
                    })
                }

                file.uniqueIdentifier = md5
                // 使用 file.resume() 恢复上传
                if (typeof file.resume === 'function') {
                    file.resume()
                } else {
                    file.uploader?.upload()
                }
                this.statusRemove(file.id)
            },

            over () {
                // 没文件上传时可关闭
                if (this.fileList.length == this.xzwjsl) {
                    Bus.$emit('uploadSuccess', this.fileList)
                    this.$emit('uploadSuccess', this.fileList)
                    this.fileList = []
                    if (this.uploader) {
                        this.uploader.cancel()
                    }
                    this.panelShow = false
                }
            },

            /**
             * 新增的自定义的状态: 'md5'、'transcoding'、'failed'
             * @param id
             * @param status
             */
            statusSet (id, status) {
                const statusMap = {
                    md5: {
                        text: '校验MD5',
                        bgc: '#fff'
                    },
                    merging: {
                        text: '合并中',
                        bgc: '#e2eeff'
                    },
                    transcoding: {
                        text: '转码中',
                        bgc: '#e2eeff'
                    },
                    failed: {
                        text: '上传失败',
                        bgc: '#e2eeff'
                    }
                }

                this.$nextTick(() => {
                    $(`<p class="myStatus_${id}"></p>`)
                        .appendTo(`.file_${id} .uploader-file-status`)
                        .css({
                            position: 'absolute',
                            top: '0',
                            left: '0',
                            right: '0',
                            bottom: '0',
                            zIndex: '1',
                            backgroundColor: statusMap[status].bgc
                        })
                        .text(statusMap[status].text)
                })
            },
            statusRemove (id) {
                this.$nextTick(() => {
                    $(`.myStatus_${id}`).remove()
                })
            },

            error (msg) {
                this.$notify({
                    title: '错误',
                    message: msg,
                    type: 'error',
                    duration: 2000
                })
            }
        },
        watch: {

        },
        beforeDestroy () {
            delete this.$root.componentRefs[this.componentName]
        }
        // 先注释掉，不然同时使用多个时，有某个是动态渲染的，会导致Bus失效
        // destroyed() {
        //     Bus.$off('openUploader')
        // },
    }
</script>

<style scoped lang="less">
  #global-uploader {
    position: fixed;
    z-index: 9999;
    top: 3px;
    right: 0px;

    .uploader-app {
      width: 550px;
    }

    .file-panel {
      background-color: #fff;
      border: 1px solid #e2e2e2;
      border-radius: 7px 7px 0 0;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);

      .file-title {
        display: flex;
        height: 40px;
        line-height: 40px;
        padding: 0 15px;
        border-bottom: 1px solid #ddd;

        .operate {
          flex: 1;
          text-align: right;
        }
      }

      .file-list {
        position: relative;
        /*height: 240px;*/
        overflow-x: hidden;
        overflow-y: auto;
        background-color: #fff;

        > li {
          background-color: #fff;
        }
      }

      &.collapse {
        .file-title {
          background-color: #e7ecf2;
        }
      }
    }

    .no-file {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 16px;
    }

    .uploader-file {
      height: 60px;
      line-height: 60px;
    }

    :deep(.uploader-file-icon) {
      margin-top: 19px;

      &:before {
        content: '' !important;
      }

      &[icon='image'] {
        background: url(./images/image-icon.png);
      }

      &[icon='video'] {
        background: url(./images/video-icon.png);
      }

      &[icon='document'] {
        background: url(./images/text-icon.png);
      }
    }

    :deep(.uploader-file-actions > span) {
      margin-right: 6px;
      margin-top: 21px;
    }
  }

  /* 隐藏上传按钮 */
  #global-uploader-btn {
    position: absolute;
    clip: rect(0, 0, 0, 0);
  }
</style>
