<!--onlyoffice 编辑器-->
<template>
  <component footer-hide :is="modalType" :model-value="value" :title="modalTitle" :width="modalWidth"
    @on-visible-change="open" class="officeMain" :class="'style-' + configdata.blm + ' ' + configdata.blm">
    <div :style="computeStyle()" v-if="value">
      <div id="officeDiv" ref="officeDiv"></div>
    </div>
  </component>
</template>
  <script>
    import { mapState, mapMutations } from 'vuex'
    export default {
        name: 'onlyoffice',
        props: {
            index: { type: Number, default: null },
            value: { type: Boolean, default: false },
            fathername: { type: String, default: '' },
            childmethodparams: { type: Object, default: () => ({}) },
            setdata: { type: Object, default: () => ({}) },
            propstocomponent: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: () => { return {} } }
        },
        data () {
            return {
                docEditor: null,
                tempdata: {}
            }
        },
        watch: {
            propstocomponent: {
                handler: function (n, o) {
                    if (n.wjid) {
                        this.setEditor(n)
                        // console.log(this.configdata,'print from onlyoffice')
                    }
                },
                deep: true
            }
        },
        created () {
            this.loadCssCode();
        },
        mounted () {},
        computed: {
            ...mapState('admin/user', ['info']),
            modalType () {
                return this.propstocomponent && this.propstocomponent.modalType ? this.propstocomponent.modalType : 'Drawer'
            },
            modalTitle () {
                return this.propstocomponent && this.propstocomponent.modalTitle ? this.propstocomponent.modalTitle : '文件预览'
            },
            modalWidth () {
                return this.propstocomponent && this.propstocomponent.modalWidth ? this.propstocomponent.modalWidth : 800
            }
        },
        methods: {
            open (open) {
                if (!open) {
                    const list = document.getElementsByClassName('officeMain')
                    if (list.length > 0) {
                        for (let i = 0; i < list.length; i++) {
                            list[i].remove()
                        }
                    }
                    this.$emit('input', false);
                }
            },
            loadCssCode (code) {
                if (!document.getElementById('onlyOffice_script')) {
                    const script = document.createElement('script');
                    script.src = this.commonsJs.setting.onlyofficeUrl;
                    script.id = 'onlyOffice_script'
                    const head = document.getElementsByTagName('head')[0];
                    head.appendChild(script);
                }
            },
            computeStyle () {
                let newstyle = { height: (this.commonsJs.contentHeight - 155) + 'px' }
                if (this.propstocomponent.styleMethod) newstyle = this.commonsJs.funcEval1(this, {}, this.propstocomponent.styleMethod)
                return newstyle
            },
            handleDocType (fileType) {
                let docType = ''
                const fileTypesDoc = [
                    'doc', 'docm', 'docx', 'dot', 'dotm', 'dotx', 'epub', 'fodt', 'htm', 'html', 'mht', 'odt', 'ott', 'pdf', 'rtf', 'txt', 'djvu', 'xps'
                ]
                const fileTypesCsv = [
                    'csv', 'fods', 'ods', 'ots', 'xls', 'xlsm', 'xlsx', 'xlt', 'xltm', 'xltx'
                ]
                const fileTypesPPt = [
                    'fodp', 'odp', 'otp', 'pot', 'potm', 'potx', 'pps', 'ppsm', 'ppsx', 'ppt', 'pptm', 'pptx'
                ]
                if (fileTypesDoc.includes(fileType)) {
                    docType = 'text'
                }
                if (fileTypesCsv.includes(fileType)) {
                    docType = 'spreadsheet'
                }
                if (fileTypesPPt.includes(fileType)) {
                    docType = 'presentation'
                }
                return docType
            },

            // 缓存到onlyOffice数据库里面的回调
            onDocumentStateChange (event) {
                if (!event.data) {
                    // console.log('保存，Changes are collected on document editing service')
                    // console.log(event)
                }
                this.$emit('fileIsChanged', event)
            },
            // 点击保存按钮的回调
            onRequestSaveAs (event) {
                const fileType = event.data.fileType
                const title = event.data.title
                const url = event.data.url
                // console.log(fileType)
                // console.log(title)
                // console.log(url)
                this.$emit('saveAs', event)
            },
            // 下载另存为
            onDownloadAs (event) {
                const url = event.data.url
                // console.log('ONLYOFFICE Document Editor create file: ' + url)
            },
            onDocumentReady (event) {
                // console.log('onDocumentReady')
            },
            onAppReady (event) {
                // console.log('onappready')
            },
            setEditor (option) {
                const config = {
                    document: {
                        fileType: option.fileType,
                        key: '',
                        title: option.title,
                        permissions: {
                            comment: true,
                            download: true,
                            modifyContentControl: true,
                            modifyFilter: true,
                            print: false,
                            edit: true, // 文档是否可编辑
                            fillForms: true,
                            review: true // 第一是否显示审阅文档菜单
                        },
                        url: this.commonsJs.setting.uploadBaseURL + '/fileManagerSystem/getFullfileStream?wjid=' + option.wjid
                        // url: 'http://192.168.1.202:28009/fileManagerSystem/getFullfileStream?id='+option.wjid
                    },
                    documentType: this.handleDocType(option.fileType),
                    editorConfig: {
                        callbackUrl: this.commonsJs.uploadBaseURL + '/fileManagerSystem/saveEditfile/' + option.wjid,
                        // callbackUrl: 'http://192.168.1.202:28009/fileManagerSystem/saveEditfile/'+option.wjid,
                        lang: 'zh-CN',
                        customization: {
                            hideRightMenu: false, // 是否显示右侧菜单
                            forcesave: true,
                            autosave: false, // 是否自动保存
                            commentAuthorOnly: false,
                            comments: true,
                            compactHeader: false,
                            compactToolbar: true,
                            feedback: false,
                            plugins: true,
                            showReviewChanges: option.isOperation ? option.isOperation : false, // 定义在加载编辑器时是否自动显示或隐藏审阅更改面板。默认值为false
                            spellcheck: false, // 关闭拼写检查
                            review: {
                                hideReviewDisplay: true, // 定义显示模式按钮是在协作选项卡上显示还是隐藏
                                reviewDisplay: 'view', // 定义打开文档进行查看时将使用的审阅编辑模式
                                trackChanges: true, // true为对自己启动，false为对自己关闭。跟踪变化对自己启动，记录自己的修改。其他人也可以查看在什么时间谁修改的文件的哪部分内容，就是协作功能
                                hoverMode: true // 定义检查显示模式:通过悬停更改(true)在工具提示中显示检查，或者通过单击更改(false)在气泡中显示检查。默认值为false。
                            },
                            logo: {
                                // image: "http://minio.xxx.com:xxxx/xx/xx.png",
                                // imageEmbedded: "http://xx.xx.xxx.xx/favicon-7.ico",
                                image: '',
                                imageEmbedded: '',
                                url: 'www.incons.com.cn'
                            },
                            customer: {
                                address: 'xx市xx区xx路700号',
                                info: '提供高效、协调的团队协作方式',
                                mail: 'xxx@xxx.com.cn',
                                name: 'KR',
                                www: 'www.incons.com.cn'
                            }
                        },
                        user: {
                            id: this.info.yhdm,
                            name: this.info.xm
                        },
                        mode: option.mode ? option.mode : 'view' // 文档操作模式 view 视图模式不可编辑  edit 编辑模式可编辑文档
                    },
                    width: '100%',
                    height: '100%',
                    type: option.mode == 'edit' ? 'desktop' : 'embedded',
                    token: option.token,
                    events: {
                        onAppReady: this.onAppReady,
                        onDocumentStateChange: this.onDocumentStateChange, // 修改文档时调用的函数
                        onRequestSaveAs: this.onRequestSaveAs, // 保存按钮回调 save-copy-as
                        onDownloadAs: this.onDownloadAs, // 下载另存为
                        onDocumentReady: this.onDocumentReady // 文档加载完成
                        // 'onRequestCompareFile': this.onRequestCompareFile // 对比文件
                    }
                }
                if (this.docEditor) this.docEditor.destroyEditor()
                setTimeout(() => {
                    this.docEditor = new DocsAPI.DocEditor('officeDiv', config)
                }, 500)
            }
        }
    }
  </script>

  <style scoped lang="scss">

  </style>
