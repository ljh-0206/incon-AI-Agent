<template>
  <div class="tinymce-editor" style="width:100%;" v-cloak :class="'style-' + configdata.blm + ' ' + configdata.blm">
<!--     <Button @click="test">编辑按钮测试</Button>-->
    <div :key="editable" style="width:100%">
      <div ref="previewEl" v-if="!editable" style="width:100%;"></div>
      <editor v-else :id="computeId()" :ref="'editor' + id" v-model="myValue" :init="init"
        :disabled="!editable" @onClick="onClick" style="width:100%;" @onBlur="onBlur" @onChange="onBlur">
      </editor>
    </div>
    <Global-Uploader :maxNumber=1 :maxSize=2048 :accept="upload_accept" :uid="_uid" v-if="editable" />
  </div>
</template>
<script>
    import Bus from '@/components/commonComponent/upload/js/bus'
    import GlobalUploader from '@/components/commonComponent/upload'
    import tinymce from 'tinymce/tinymce'
    import Editor from '@tinymce/tinymce-vue'
    import 'tinymce/themes/silver'
    import 'tinymce/icons/default'
    import 'tinymce/models/dom'
    // 编辑器插件 - 标准插件（通过 npm 内置加载）
    import 'tinymce/plugins/advlist'
    import 'tinymce/plugins/anchor'
    import 'tinymce/plugins/autolink'
    import 'tinymce/plugins/autoresize'
    import 'tinymce/plugins/charmap'
    import 'tinymce/plugins/code'
    import 'tinymce/plugins/codesample'
    import 'tinymce/plugins/fullscreen'
    import 'tinymce/plugins/image'
    import 'tinymce/plugins/insertdatetime'
    import 'tinymce/plugins/link'
    import 'tinymce/plugins/lists'
    import 'tinymce/plugins/media'
    import 'tinymce/plugins/preview'
    import 'tinymce/plugins/quickbars'
    import 'tinymce/plugins/searchreplace'
    import 'tinymce/plugins/table'
    import 'tinymce/plugins/wordcount'
    import Setting from '@/setting';

    let self;
    export default {
        name: 'tinymceeditor',
        components: {
            Editor,
            GlobalUploader
        },
        props: {
            index: { type: Number },
            id: { type: String, default: '' },
            fathername: { type: String, default: '' },
            configdata: { type: Object, default: () => ({}) },
            opentype: { type: String },
            propstocomponent: { type: Object, default: () => ({}) },
            attrs: { type: Object, default: () => ({}) },
            // Vue 3 v-model support
            modelValue: { type: String, default: '' },
            // Legacy Vue 2 support
            value: { type: String, default: '' },
            plugins: {
                type: Array,
                default: () => [
                    'quickbars', 'advlist', 'anchor', 'autolink', 'autoresize', 'charmap', 'code',
                    'codesample', 'fullscreen', 'image', 'insertdatetime', 'link', 'lists', 'media',
                    'preview', 'searchreplace', 'table', 'wordcount'
                ]
            },
            numberSequenceConfig: {
                type: Object,
                default: () => ({
                    enableMainNumber: true,
                    enableSubNumber: true,
                    mainStyle: { backgroundColor: '#fff', color: '#333' },
                    subStyle: { backgroundColor: '#fff', color: '#333' }
                })
            }
        },
        data () {
            return {
                componentName: '',
                ref: this.$root.componentRefs,
                upload_accept: '',
                init: {},
                myValue: this.modelValue,
                tempdata: {},
                str: ''
            }
        },
        methods: {
            computeId () {
                return (this.configdata.blm ? this.configdata.blm : '') + this.index + this._uid
            },
            insertString (str = '') {
                tinymce.activeEditor.insertContent(str)
            },
            onBlur (e) {
                this.$emit('onBlur', e, tinymce);
            },
            test () {
                console.log(this.configdata, 'this.configdata')
                console.log(this.fathername, 'this.fathername')
                console.log(this.height, 'tinymce')
                console.log(this.index, 'index')
                console.log(this.id, 'id')
                console.log(this.editable, 'editable')
                console.log(this.propstocomponent, 'propstocomponent')
                console.log(this.opentype, 'opentype')
            },
            // 需要什么事件可以自己增加
            onClick (e) {
                this.$emit('onClick', e, tinymce)
            },
            // 可以添加一些自己的自定义事件，如清空内容
            clear () {
                this.myValue = ''
            },

            // 设置序号插件的事件监听
            setupNumberSequenceEvents () {
                // 检查当前组件是否启用了 numbersequence 插件
                const hasNumberSequence = this.plugins && this.plugins.some(plugin =>
                    typeof plugin === 'string' && plugin.includes('numbersequence')
                );

                if (!hasNumberSequence) {
                    console.log('当前编辑器未启用 numbersequence 插件，跳过事件监听设置');
                    return;
                }

                // 修正编辑器ID构建方式 - 与模板中的ID保持一致
                const editorId = (this.configdata.blm || '') + (this.index || '') + this._uid;

                // 先尝试精确匹配
                let editor = tinymce.get(editorId);

                // 如果精确匹配不到，尝试从现有编辑器中找到匹配的
                if (!editor) {
                    editor = tinymce.editors.find(e => {
                        // 检查编辑器ID是否包含当前组件的blm标识
                        return e.id.includes(this.configdata.blm || '');
                    });

                    if (editor) {
                        console.log('通过模糊匹配找到编辑器:', editor.id);
                    }
                }

                if (editor) {
                    // 再次确认编辑器是否有 numbersequence 插件
                    if (!editor.plugins.numbersequence) {
                        return;
                    }

                    // 监听编辑器的自定义事件
                    editor.on('numberSequenceInsertMain', (e) => {
                        this.$emit('numberSequenceInsertMain', e);
                    });

                    editor.on('numberSequenceInsertSub', (e) => {
                        this.$emit('numberSequenceInsertSub', e);
                    });

                    editor.on('numberSequenceDeleteMain', (e) => {
                        this.$emit('numberSequenceDeleteMain', e);
                    });

                    editor.on('numberSequenceDeleteSub', (e) => {
                        this.$emit('numberSequenceDeleteSub', e);
                    });
                } else {
                    console.warn('未找到对应的编辑器实例，目标ID:', editorId);
                    console.log('可用的编辑器实例:', tinymce.editors.map(e => ({ id: e.id, plugins: Object.keys(e.plugins) })));
                }
            },
            setupShadowRoot () {
                this.$nextTick(() => {
                    const el = this.$refs.previewEl
                    if (!el) return

                    const rawHref = (process.env.NODE_ENV === 'development') ? location.origin : (this.commonsJs.publicPath || '/')
                    const href = rawHref.replace(/\/+$/, '') + '/tinymce'

                    if (!el.shadowRoot) {
                        el.attachShadow({ mode: 'open' })
                        el.shadowRoot.innerHTML = `
                            <link type="text/css" rel="stylesheet" href="${href}/skins/ui/oxide/content.min.css">
                            <link type="text/css" rel="stylesheet" href="${href}/skins/content/default/content.css">
                            <style>
                                ${this.init.content_style || ''}
                                :host { display: block; width: 100%; }
                            </style>
                            <div class="mce-content-body" id="preview-content"></div>
                        `
                    }

                    const contentDiv = el.shadowRoot.getElementById('preview-content')
                    if (contentDiv) {
                        contentDiv.innerHTML = this.modelValue || ''
                    }
                })
            },
            updatePreviewContent () {
                const el = this.$refs.previewEl
                if (!el || !el.shadowRoot) return
                const contentDiv = el.shadowRoot.getElementById('preview-content')
                if (contentDiv) {
                    contentDiv.innerHTML = this.modelValue || ''
                }
            },
            // 上传文件
            async uploadFile (formData) {
                const res = await this.commonsJs.Axios({
                    method: 'POST',
                    url: this.commonsJs.setting.uploadBaseURL + '/fileManagerSystem/uploadFullfile', // 请求上传图片服务器的路径
                    headers: {
                        Token: 'Inco-' + localStorage.getItem('token' + '_' + this.commonsJs.setting.xmid)
                    },
                    data: formData
                })
                if (res.data.code == 200) {
                    let filePath = this.commonsJs.setting.uploadBaseURL + '/fileManagerSystem/downLoadFullFile?wjid=' + res.data.content.id;
                    // 如果开启流媒体服务
                    if (this.commonsJs.setting.streamServerEnable) filePath = this.commonsJs.setting.streamServerUrl + res.data.content.ccxdlj;
                    return filePath
                }
            },
            // 拖拽上传文件
            dropUploadFiles (files) {
                if (files.length > 0) {
                    //  此处编写自定义文件上传逻辑，例如使用 AJAX 发送文件到服务器
                    for (let i = 0; i < files.length; i++) {
                        const formData = new FormData();
                        formData.append('file', files[i]);
                        const fileName = files[i].name;
                        this.uploadFile(formData).then(filePath => {
                            // 根据文件类型插入不同的内容
                            const fileExtension = fileName.split('.').pop().toLowerCase();
                            let insertContent = '';

                            // 图片类型文件
                            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
                                insertContent = `<img src="${filePath}" alt="${fileName}" />`;
                            }
                            // 视频类型文件
                            else if (['mp4'].includes(fileExtension)) {
                                insertContent = `<video controls><source src="${filePath}" type="video/${fileExtension}">${fileName}</video>`;
                            }
                            // 音频类型文件
                            else if (['mp3', 'wav', 'ogg', 'aac'].includes(fileExtension)) {
                                insertContent = `<audio controls><source src="${filePath}" type="audio/${fileExtension}">${fileName}</audio>`;
                            }
                            // 其他文件类型作为链接插入
                            else {
                                insertContent = `<a href="${filePath}" target="_blank">${fileName}</a>`;
                            }

                            tinymce.activeEditor.insertContent(insertContent);
                        })
                    }
                }
            }
        },
        created () {
            self = this;
            // 在 editor 初始化前设置 baseURL
            const rawHref = (process.env.NODE_ENV === 'development') ? location.origin : (this.commonsJs.publicPath || '/')
            const href = rawHref.replace(/\/+$/, '')
            window.tinymce.baseURL = href + '/tinymce'
        },
        watch: {
            componentName: {
                handler (n, o) {
                    if (n) { this.$nextTick(() => { this.$root.componentRefs[this.componentName] = this }) }
                },
                deep: true,
                immediate: true
            },
            // Vue 3 v-model
            modelValue (newValue) {
                this.myValue = newValue;
                if (!this.editable) {
                    this.updatePreviewContent();
                }
            },
            // Vue 2 legacy support
            value (newValue) { this.myValue = newValue; },
            myValue (newValue) { this.$emit('update:modelValue', newValue) },
            configdata: {
                handler (n, o) {
                    if (n.blm) { this.componentName = n.blm }
                    const editable = this.editable;
                    const rawHref = (process.env.NODE_ENV === 'development') ? location.origin : (this.commonsJs.publicPath || '/');
                    const href = rawHref.replace(/\/+$/, '');
                    // 根据配置动态构建工具栏
                    let defaultToolbar = 'undo redo bold italic underline strikethrough forecolor backcolor lineheight alignleft aligncenter alignright outdent indent subscript superscript hr formatselect fontselect fontsizeselect bullist numlist table blockquote codesample anchor insertdatetime link image media charmap importword kityformula-editor fullscreen searchreplace preview print';

                    // 根据添加序号按钮
                    if (this.numberSequenceConfig.enableMainNumber) {
                        defaultToolbar += ' number_main';
                    }
                    if (this.numberSequenceConfig.enableSubNumber) {
                        defaultToolbar += ' number_sub';
                    }
                    let init = {
                        language: 'zh_CN',
                        language_url: href + '/tinymce/langs/zh_CN.js',
                        plugins: this.plugins,
                        // 外部自定义插件（位于 public/tinymce/plugins/）
                        external_plugins: {
                            'kityformula-editor': href + '/tinymce/plugins/kityformula-editor/plugin.js',
                            importword: href + '/tinymce/plugins/importword/plugin.js',
                            imagetools: href + '/tinymce/plugins/imagetools/plugin.js',
                            pastewordimage: href + '/tinymce/plugins/pastewordimage/plugin.js',
                            numbersequence: href + '/tinymce/plugins/numberSequencePlugin/plugin.js'
                        },
                        toolbar: (n.attrs && n.attrs.toolbar) ? n.attrs.toolbar : defaultToolbar,
                        menubar: false,
                        placeholder: (n.attrs && n.placeholder) ? n.placeholder : '在这里输入内容...',
                        contextmenu: false,
                        contextmenu_never_use_native: true,
                        quickbars_selection_toolbar: (n.attrs && n.attrs.quickbars_selection_toolbar) ? n.attrs.quickbars_selection_toolbar : 'bold italic underline strikethrough forecolor backcolor fontsizeselect',
                        quickbars_insert_toolbar: false,

                        fontsize_formats: '12px 14px 16px 18px 20px 22px 24px 28px 32px 36px 48px 56px 72px', // 字体大小
                        font_formats: '微软雅黑=Microsoft YaHei,Helvetica Neue,PingFang SC,sans-serif;苹果苹方=PingFang SC,Microsoft YaHei,sans-serif;宋体=simsun,serif;仿宋体=FangSong,serif;黑体=SimHei,sans-serif;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;', // 字体样式
                        lineheight_formats: '0.5 0.8 1 1.2 1.5 1.75 2 2.5 3 4 5', // 行高配置，也可配置成"12px 14px 16px 20px"这种形式

                        deprecation_warnings: false, // 禁用 tiny 弃用警告
                        branding: false, // tiny技术支持信息是否显示
                        resize: true, // 编辑器宽高是否可变，false-否,true-高可变，'both'-宽高均可，注意引号
                        statusbar: true, // 最下方的元素路径和字数统计那一栏是否显示
                        elementpath: true, // 元素路径是否显示
                        content_style: 'p {font-size: 18px;line-height:1.75;font-family:PingFang SC,Microsoft YaHei,sans-serif} img {max-width:100%;height:auto;} table {max-width: 100% height:auto;}',
                        custom_undo_redo_levels: 30, // 允许撤销次数
                        paste_data_images: true, // 图片是否可粘贴
                        // 解决粘贴图片后，不自动上传，而是使用base64编码。
                        urlconverter_callback: (url, node, onSave, name) => {
                            if (node === 'img' && url.startsWith('blob:')) {
                                tinymce.activeEditor && tinymce.activeEditor.uploadImages()
                            }
                            return url
                        },
                        // 此处为图片上传处理函数，这个直接用了base64的图片形式上传图片，
                        // 如需ajax上传可参考https://www.tiny.cloud/docs/configure/file-image-upload/#images_upload_handler
                        images_upload_handler: (blobInfo, success, failure) => {
                            // const img = 'data:image/jpeg;base64,' + blobInfo.base64()
                            // success(img)
                            const formData = new FormData();
                            formData.append('file', blobInfo.blob(), blobInfo.filename());
                            self.uploadFile(formData).then(filePath => {
                                success(filePath)
                            })
                        },
                        // 此为链接、图片、视频中的插入文件功能的上传
                        file_picker_callback: (callback, value, meta) => {
                            // meta.filetype  视频media 图片image 文件file
                            // 打开文件选择框
                            Bus.$emit('openUploader', { uid: this._uid });

                            // 上传成功回调
                            Bus.$on('uploadSuccess', (fileList) => {
                                const item = fileList[0];
                                let filePath = self.commonsJs.setting.uploadBaseURL + '/fileManagerSystem/getFileStream?scjlid=' + item.id;
                                switch (item.uploadType) {
                                case 'local':
                                    if (self.commonsJs.setting.streamServerEnable) filePath = self.commonsJs.setting.streamServerUrl + item.ccxdlj;
                                    break;
                                case 'minio':
                                    if (self.commonsJs.setting.oss && self.commonsJs.setting.oss.minioServerUrl) filePath = self.commonsJs.setting.oss.minioServerUrl + item.ccxdlj;
                                    break;
                                case 'aliyun':
                                    if (self.commonsJs.setting.oss && self.commonsJs.setting.oss.aliyunServerUrl) filePath = self.commonsJs.setting.oss.ailiyunServerUrl + item.ccxdlj;
                                    break;
                                }
                                callback(filePath, { alt: item.fileName, title: item.fileName, text: item.fileName });
                            })
                        },

                        // Word导入插件
                        importword_handler: function (editor, files, next) {
                            const file_name = files[0].name;
                            if (file_name.substr(file_name.lastIndexOf('.') + 1) == 'docx') {
                                next(files);
                            } else {
                                self.$Message.warning('目前仅支持docx文件格式，若为doc，请将扩展名改为docx');
                            }
                        },
                        importword_filter: function (result, insert, message) {
                            // 自定义操作部分
                            insert(result) // 回插函数
                        },
                        // 限制字数
                        wordlimit: (this.configdata && this.configdata.attrs && this.configdata.attrs.wordlimit) ? this.configdata.attrs.wordlimit : '20000000',
                        setup: function (ed) {
                            const limit = this.wordlimit;
                            const currentPlugins = this.plugins;
                            const numberConfig = self.numberSequenceConfig; // 获取配置

                            if (limit != false) {
                                ed.on('setContent undo redo keyup', function (e) {
                                    const wordcount = ed.plugins.wordcount ? ed.plugins.wordcount.body.getCharacterCount() : 0;
                                    if (wordcount > limit) {
                                        const content = ed.getContent({ format: 'text' }) || e.content || '';
                                        ed.setContent(content.substring(0, limit));
                                        alert('当前字数：' + wordcount + '，超出限制字数：' + limit);
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.stopImmediatePropagation();
                                        return false;
                                    }
                                });

                                ed.on('init', function () {
                                    // 检查当前编辑器的插件配置中是否包含 numbersequence
                                    const hasNumberSequence = currentPlugins && currentPlugins.some(plugin =>
                                        typeof plugin === 'string' && plugin.includes('numbersequence')
                                    );

                                    if (hasNumberSequence) {
                                        // 设置序号插件配置
                                        if (ed.plugins.numbersequence) {
                                            const plugin = ed.plugins.numbersequence.getPlugin();
                                            if (plugin && numberConfig) {
                                                plugin.updateConfig(numberConfig);
                                            }
                                        }

                                        // 使用 nextTick 确保 Vue 组件状态更新完成
                                        self.$nextTick(() => {
                                            self.setupNumberSequenceEvents();
                                        });
                                    }

                                    if (!editable) {
                                        // 隐藏编辑器外框
                                        document.querySelector('.tox-tinymce').style.border = 'none';
                                        // 隐藏编辑区域iframe边框
                                        document.querySelector('.tox-edit-area__iframe').style.border = '0';
                                    }
                                });
                            }

                            ed.on('drop', (e) => { // 监听 drop 事件来处理拖拽上传图片的逻辑（可选）
                                // 这里可以添加额外的逻辑来处理拖拽事件，例如阻止默认行为等。
                                e.preventDefault(); // 阻止默认行为，例如阻止文本粘贴等。
                                const files = e.dataTransfer.files;
                                self.dropUploadFiles(files)
                            });
                        }

                    }
                    if (n.attrs && Object.keys(n.attrs).length > 0) Object.assign(init, n.attrs)
                    if (n.attrsMethod) {
                        const newInit = this.commonsJs.funcEval1(this, { init }, n.attrsMethod)
                        init = { ...init, ...newInit }
                    }

                    if (!editable) {
                        init.toolbar = false
                        init.quickbars_selection_toolbar = false;
                        init.menubar = false
                        init.statusbar = false
                        init.elementpath = false
                        if (!init.overflow) {
                            init.height = 'auto'
                            init.min_height = 'auto'
                            init.max_height = 'auto'
                        }
                    }
                    this.init = init
                },
                deep: true,
                immediate: true
            },
            editable(newVal) {
              if (!newVal) {
                this.$nextTick(() => {
                    this.setupShadowRoot();
                })
              }
            },
        },
        computed: {
            editable () {
                let flag = false
                if (!this.opentype || this.opentype == 'add' || this.opentype == 'edit') {
                    flag = true
                    if (this.propstocomponent.initMethod) {
                        const funcEval = new Function('_this', 'obj', this.propstocomponent.initMethod)
                        flag = funcEval(this, {}) // 执行内部方法
                    }
                }
                if (this.propstocomponent.editable == '1' || this.configdata.editable == '1') flag = true
                if (this.propstocomponent.editable == '0' || this.configdata.editable == '0') flag = false
                return flag
            },

        },
        mounted () {
            if (this.configdata.createClass) this.commonsJs.loadCssCode(this.configdata.createClass, this.componentName);

            if (!this.editable) {
                this.setupShadowRoot();
            }
        },

        beforeUnmount () {
            const editorId = this.computeId()
            const editorInstance = tinymce.get(editorId)
            if (editorInstance) {
                editorInstance.destroy()
            }
            delete this.$root.componentRefs[this.componentName]
            const styleclass = document.getElementById('style-' + this.componentName)
            if (styleclass) styleclass.remove()
        },
        unmounted () {
        }
    }
</script>
<style>
.tox-notifications-container {
  display: none;
}

.tox-tinymce-aux {
  z-index: 5000 !important;
}
</style>
