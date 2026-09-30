<template>
  <component footer-hide :is="modalType" :model-value="value||modelValue" :title="modalTitle" :width="modalWidth"
    v-bind="configdata.attrs" :transfer="false" @on-visible-change="open" class="viewfileMain"
    :class="'style-' + configdata.blm + ' ' + configdata.blm">
    <div style="height:100%" :style="configdata.style">
      <!--图片预览-->
      <img v-if="wjlx=='image'" :src="fileSrc" style="display:block;margin: 0 auto;width: 100%;height: auto;">

      <!--视频播放-->
      <jvideo v-else-if="wjlx=='video'" v-model="fileSrc" :configdata="videoConfigdata"></jvideo>

      <!--音频播放-->
      <audio controls v-else-if="wjlx=='audio'">
        <source :src="fileSrc" type="audio/mpeg">
      </audio>

      <!--文档类型预览-->
      <div v-else-if="wjlx=='pdf'" style="width:100%;height: 100%;background-color: #777;">
        <!--顶部按钮-->
        <div class="my-dialog-title">
          <div class="pdf_btn">
            <div style="display: inline-block;float: left;padding-left: 20px">
              <Icon type="ios-add-circle-outline" @click="changeSize('big')" />
              <span style="display: inline-block;margin: 0 8px;font-size: 14px !important;">{{ pdfData.scale + "%" }}</span>
              <Icon type="ios-remove-circle-outline" @click="changeSize('small')" />
            </div>
            <div style="display: inline-block;font-size: 16px;font-weight: 600;overflow: hidden;">{{ wjmc }}</div>
            <div style="display: inline-block;float: right;padding-right: 20px;">
              <InputNumber v-model="pdfData.currentPageNum" :min="1" :max="pdfData.numPages" :precision="0" size="small"
                style="width: 60px;" @on-change="pageNumChange" /> / {{ pdfData.numPages }}
            </div>
          </div>
        </div>
        <!--pdf 页面显示-->
        <div class="my-dialog-content-box">
          <div class="all-box" ref="allBox" @scroll="scrollEvent">
            <div v-for="i in pdfData.numPages" :key="i" class="pdf-item" :style="{width: pdfData.scale + '%'}">
              <VuePDF :pdf="pdfDocument" :page="i" :scale="scaleFactor" /></div>
            </div>
          </div>
        </div>
      </div>
  </component>
</template>
<script>
    import Setting from '@/setting'
    import axios from 'axios'
    import { VuePDF } from '@tato30/vue-pdf';
    import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

    export default {
        name: 'ViewFile',
        components: {
            VuePDF
        },
        props: {
            value: {
                type: Boolean,
                default: false
            },
            modelValue: {
                type: Boolean,
                default: false
            },
            configdata: {
                type: Object,
                default: () => ({})
            },
            propstocomponent: {
                type: Object,
                default: () => ({})
            }
        },
        data () {
            return {
                fileSrc: '',
                wjlx: '',
                wjmc: '',
                pdfDocument: null,
                pdfData: {
                    scale: 100,
                    baseScale: 1, // 填满容器的实际scale值
                    numPages: 0,
                    currentPageNum: 1,
                    pdfItemHeight: 0,
                    cutHeight: 0,
                    loadedRatio: 0
                },
                allBox: null
            }
        },
        computed: {
            scaleFactor () {
                return this.pdfData.baseScale * (this.pdfData.scale / 100);
            },
            modalType () {
                return this.propstocomponent && this.propstocomponent.modalType ? this.propstocomponent.modalType : 'Drawer'
            },
            modalTitle () {
                return this.propstocomponent && this.propstocomponent.modalTitle ? this.propstocomponent.modalTitle : '文件预览'
            },
            modalWidth () {
                return this.propstocomponent && this.propstocomponent.modalWidth ? this.propstocomponent.modalWidth : 800
            },
            videoConfigdata () {
                const videoConfigdata = {
                    blm: 'videoplayer' + this.commonsJs.sys_guid(),
                    initMethod: `
            return {
              autoplay: true,
              width: '880px',
              height: '400px',
              waterMark: {
                content: ''
              }
            }
          `,
                    valueChange: '',
                    configdataChangeMethod: ''
                }
                return { ...videoConfigdata, ...this.propstocomponent.configdata }
            }
        },
        watch: {
            propstocomponent: {
                handler: async function (n, o) {
                    if (n && n.wjid) {
                        console.log(n, 'n======')
                        if (n.wjlx != 'wjid') {
                            this.wjlx = n.wjlx
                            this.fileSrc = n.wjid
                            if (this.wjlx == 'pdf') {
                                this.loadPdf(n.wjid)
                            }
                        } else {
                            const res = await this.commonsJs.getFileInfo(n.wjid)
                            if (res && res.id) {
                                this.wjmc = res.wjxsmc
                                if (res.lxid == '01') this.wjlx = 'image'
                                else if (res.zmlx == 'mp4' || res.wjhzm == 'mp4' || res.wjhzm == 'MP4') this.wjlx = 'video'
                                else if (res.zmlx == 'mp3' || res.wjhzm == 'mp3' || res.wjhzm == 'MP3') this.wjlx = 'audio'
                                else if (res.zmlx == 'pdf' || res.wjhzm == 'pdf' || res.wjhzm == 'PDF') this.wjlx = 'pdf'

                                let src = ''
                                switch (res.uploadType) {
                                case 'local':
                                    if (Setting.streamServerEnable) {
                                        src = Setting.streamServerUrl + res.ccxdlj;
                                        if (res.zmlx) src = Setting.streamServerUrl + res.zmccxdlj;
                                    } else {
                                        src = Setting.uploadBaseURL + '/fileManagerSystem/getFileStream?scjlid=' + res.id;
                                        if (res.zmlx) src = Setting.uploadBaseURL + '/fileManagerSystem/getZmhFileStream?scjlid=' + res.id;
                                        // 如果是pdf，需要转为本地blob流url
                                        if (this.wjlx == 'pdf') {
                                            this.$Spin.show({ render: (h) => { return h('div', [h('div', '文档加载中，请稍后....')]) } });
                                            const pdfres = await axios({
                                                method: 'get',
                                                url: src,
                                                headers: {},
                                                responseType: 'blob' // 设置响应的数据类型为一个包含二进制数据的 Blob 对象，必须设置！！！
                                            })
                                            src = this.getObjectURL(pdfres.data)
                                            this.$Spin.hide();
                                        }
                                    }
                                    break;
                                case 'minio':
                                    if (Setting.oss && Setting.oss.minioServerUrl) {
                                        src = Setting.oss.minioServerUrl + res.ccxdlj;
                                        if (res.zmlx) src = Setting.oss.minioServerUrl + res.zmccxdlj;
                                    }
                                    break;
                                case 'aliyun':
                                    if (Setting.oss && Setting.oss.aliyunServerUrl) {
                                        src = Setting.oss.ailiyunServerUrl + res.ccxdlj;
                                        if (res.zmlx) src = Setting.oss.ailiyunServerUrl + res.zmccxdlj;
                                    }
                                    break;
                                default:
                                    src = Setting.uploadBaseURL + '/fileManagerSystem/getFileStream?scjlid=' + res.id;
                                    if (res.zmlx) src = Setting.uploadBaseURL + '/fileManagerSystem/getZmhFileStream?scjlid=' + res.id;
                                    if (this.wjlx == 'pdf') {
                                        this.$Spin.show({ render: (h) => { return h('div', [h('div', '文档加载中，请稍后....')]) } });
                                        const pdfres = await axios({
                                            method: 'get',
                                            url: src,
                                            headers: {},
                                            responseType: 'blob'
                                        })
                                        src = this.getObjectURL(pdfres.data)
                                        this.$Spin.hide();
                                    }
                                    break;
                                }
                                this.fileSrc = src;
                                if (this.wjlx == 'pdf') {
                                    this.loadPdf(src)
                                }
                            }
                        }
                    }
                },
                deep: true
            }
        },
        methods: {
            open (open) {
                if (!open) {
                    document.querySelectorAll('.viewfileMain').forEach(el => el.remove())
                    this.$emit('input', false);
                    this.$emit('on-close');
                }
            },
            getObjectURL (file) {
                let url = null;
                if (window.createObjectURL != undefined) {
                    url = window.createObjectURL(file);
                } else if (window.webkitURL != undefined) {
                    try {
                        url = window.webkitURL.createObjectURL(file);
                    } catch (error) { }
                } else if (window.URL != undefined) {
                    try {
                        url = window.URL.createObjectURL(file);
                    } catch (error) { }
                }
                return url;
            },
            loadPdf (pdfUrl) {
                if (!pdfUrl) {
                    console.error('pdfUrl为空，无法加载PDF');
                    return;
                }
                if (!GlobalWorkerOptions.workerSrc) {
                    GlobalWorkerOptions.workerSrc = '/pdfjs-dist/build/pdf.worker.min.mjs';
                }

                const loadingTask = getDocument({
                    url: pdfUrl,
                    cMapUrl: '/pdfjs-dist/cmaps/',
                    cMapPacked: true
                });

                this.pdfDocument = loadingTask;

                loadingTask.promise.then(async (pdf) => {
                    console.log(pdf);
                    this.pdfData.numPages = pdf.numPages;

                    // 计算填满容器的baseScale
                    const page = await pdf.getPage(1);
                    const viewport = page.getViewport({ scale: 1 });
                    const containerWidth = this.$refs.allBox?.clientWidth || 800;
                    this.pdfData.baseScale = containerWidth / viewport.width;
                    console.log('baseScale:', this.pdfData.baseScale, 'containerWidth:', containerWidth, 'pdfWidth:', viewport.width);

                    this.$nextTick(() => {
                        setTimeout(() => {
                            const item = document.getElementsByClassName('pdf-item')[0];
                            this.pdfData.cutHeight = (document.documentElement.clientHeight * 0.85 - 65) * 0.5;
                            this.pdfData.pdfItemHeight = item ? item.offsetHeight + 30 : 0;
                        }, 100);
                    });
                }).catch((err) => {
                    console.error('pdf 加载失败', err);
                });
            },
            scrollEvent (e) {
                if (e instanceof Event) {
                    const scrollTop = e.target.scrollTop;
                    if (scrollTop > 0) {
                        this.pdfData.currentPageNum = Math.ceil((scrollTop + this.pdfData.cutHeight) / this.pdfData.pdfItemHeight);
                    }
                }
            },
            pageNumChange (e) {
                const pdfBox = this.$refs.allBox;
                if (pdfBox && e !== 1) {
                    window.setTimeout(() => {
                        pdfBox.scrollTop = this.pdfData.pdfItemHeight * (this.pdfData.currentPageNum - 1);
                    }, 100);
                } else if (pdfBox) {
                    window.setTimeout(() => {
                        pdfBox.scrollTop = 1;
                    }, 100);
                }
            },
            changeSize (type) {
                if (type === 'big') {
                    if (this.pdfData.scale < 200) {
                        this.pdfData.scale += 10;
                    }
                } else {
                    if (this.pdfData.scale > 50) {
                        this.pdfData.scale -= 10;
                    }
                }
                setTimeout(() => {
                    this.pdfData.cutHeight = (document.documentElement.clientHeight * 0.85 - 65) * 0.5;
                    const item = document.getElementsByClassName('pdf-item')[0];
                    this.pdfData.pdfItemHeight = item ? item.offsetHeight + 30 : 0;
                    const pdfBox = this.$refs.allBox;
                    if (pdfBox) {
                        this.pdfData.currentPageNum = Math.ceil((pdfBox.scrollTop + this.pdfData.cutHeight) / this.pdfData.pdfItemHeight);
                    }
                }, 200);
            }
        }
    }
</script>
<style lang="less" scoped>
.viewfileMain {
  position: absolute;
  z-index: 999999;
}
.pdf-item {
  margin: 0 auto 10px;
  overflow: hidden;
}
.pdf-box {
  margin-top: 60px;
  width: 100%;
  display: flex;
  justify-content: center;
}
.my-dialog-content-box {
  height: 100%;
  padding: 0 20px !important;
  background: #d4d4d7;
  position: relative;
}
.all-box {
  padding-top: 38px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}
.all-box::-webkit-scrollbar {
  display: none;
}
.pdf_btn {
  height: 46px;
  line-height: 46px;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: #fff;
  z-index: 3000;
  border-top: 1px solid #dcdee2;
  box-shadow: 0 1px 3px #e8eaec;
  text-align: center;
}
.pdf_btn i {
  line-height: 32px;
  font-size: 24px;
  cursor: pointer;
}
</style>
