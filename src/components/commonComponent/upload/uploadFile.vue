<!-- 通用上传组件，上传文件时使用，可回显 -->
<template :class="'style-'+configdata.blm + ' ' + configdata.blm">
    <div>
        <template v-if="configdata && configdata.kfbj==='1'">
            <Upload ref="qpupload" action='' type="drag" :accept="onlyOfficeAccept.join(',')"
                :before-upload="beforeUpload" v-if="!fileObj.id">
                <div style="padding: 20px 0">
                    <Icon type="ios-cloud-upload" size="52" style="color: #3399ff"></Icon>
                    <p>点击此处上传</p>
                </div>
            </Upload>
            <div v-else style="">
                <span>{{ fileObj.wjm }}</span>
                <Tooltip content="删除">
                    <Icon type="ios-close" size="18" style="color: red;cursor: pointer;" @click="deleteFileObj"></Icon>
                </Tooltip>
                <Tooltip content="下载">
                    <a style="color: green;cursor: pointer;" @click="downLoadFullFile">
                        <Icon type="md-arrow-round-down" size="14" />
                    </a>
                </Tooltip>
                <Tooltip content="预览">
                    <a style="color: #ff9900;cursor: pointer;" @click="viewFullFile">
                        <Icon type="ios-eye" size="18" />
                    </a>
                </Tooltip>
            </div>
        </template>
        <template v-else>
            <GlobalUploader :accept="accept" :maxSize="maxSize" :maxNumber="maxNumber" :cclj="cclj" :czxt="xmid" :yscsl="data.length" :sfzm="sfzm" :videoParams="videoParams" :uploadType="uploadType"
                :uid="_uid" @uploadSuccess="uploadSuccess" />
            <Button v-if="env()" @click="test">上传文件test</Button> <!--测试按钮-->
            <div v-if="computeEdit()">
              <Button @click="upload" style="margin-right: 10px" type="primary" :icon="uploadIcon">{{btnTitle}}</Button>
              <span style="font-weight: 100;font-size: 14px;font-family: cursive;">
                可上传文件格式:<span style="color: #e91e63;"> {{accept?accept:'任意'}}</span>
                单个文件大小不超过:<span style="color: #e91e63;"> {{maxSize}}M</span>
                <span v-if="maxNumber>1">
                  还可上传文件数量:<span style="color: #e91e63;"> {{maxNumber-data.length}}</span>
                </span>
              </span>
            </div>

            <Table class="ivu-mt-8" :columns="columns" :data="data" :tooltip-max-width="300" :show-header="showHead" :border="border" :draggable="computeEdit() &&  sfkpx" @on-drag-drop="handleWjpx">
                <template #wjmslot="{row,index}">
                    <i-input v-model="row.wjxsmc" v-if="computeEdit() && sfkgm" @on-blur="updateWjxsmc(row)"></i-input>
                    <span v-else>{{row.wjxsmc}}</span>
                </template>
                <template #option="{ row, index }">
                    <a v-if="row.lxid=='01'" class="ivu-ml-8" @click="showImg(row,index)">预览</a>
                    <a v-if="row.zmlx=='pdf'||row.wjhzm=='pdf'||row.wjhzm=='PDF'" class="ivu-ml-8" @click="showPdf(row,index)">预览</a>
                    <a v-if="streamServerEnable && (row.zmlx=='mp4'||row.wjhzm=='mp4')" class="ivu-ml-8" @click="showVideo(row,index)">预览</a>
                    <a class="ivu-ml-8" @click="downLoadFile(row,index)">下载</a>
                    <a v-if="computeEdit()" class="ivu-ml-8" @click="deleteFile(row,index)">删除</a>
                </template>
            </Table>
        </template>
    </div>
</template>

<script>
    import Bus from '@/components/commonComponent/upload/js/bus'
    import GlobalUploader from '@/components/commonComponent/upload'
    import Setting from '@/setting'
    import axios from 'axios'

    export default {
        name: 'uploadfile',

        components: {
            GlobalUploader
        },
        props: {
            configdata: {
                type: Object,
                default: () => ({})
            },
            propstocomponent: {
                type: Object,
                default: () => ({})
            },
            fathername: {
                type: String,
                default: ''
            },
            // 绑定的value (Vue 3 v-model uses modelValue)
            modelValue: {
                type: String,
                default: ''
            },
            // 打开方式（控制只读）
            opentype: {
                type: String,
                default: 'add'
            },
            sfkpx: {
                type: Boolean,
                default: false
            },
            sfkgm: {
                type: Boolean,
                default: false
            }
        },
        data () {
            return {
                componentName: '',
                ref: this.$root.componentRefs,
                uploadBaseURL: Setting.uploadBaseURL,
                columns: [
                    { title: '文件名', slot: 'wjmslot', align: 'left', tooltip: true },
                    { title: '上传时间', key: 'czsj', align: 'left', tooltip: true },
                    { title: '文件类型', key: 'lx', align: 'left', width: 100, tooltip: true },
                    { title: '文件大小', key: 'fileSize', align: 'left', width: 100, tooltip: true },
                    { title: '操作', slot: 'option', align: 'left', minWidth: 100, maxWidth: 160 }
                ],
                data: [],
                successFileList: [],
                fileObj: {},
                onlyOfficeAccept: [
                    '.doc', '.docm', '.docx', '.dot', '.dotm', '.dotx', '.epub', '.fodt', '.htm', '.html', '.mht', '.odt', '.ott', '.pdf',
                    '.rtf', '.txt', '.djvu', '.xps', '.csv', '.fods', '.ods', '.ots', '.xls', '.xlsm', '.xlsx', '.xlt', '.xltm', '.xltx', '.fodp', '.odp', '.otp',
                    '.pot', '.potm', '.potx', '.pps', '.ppsm', '.ppsx', '.ppt', '.pptm', '.pptx'
                ],
                tempdata: {},
                streamServerEnable: Setting.streamServerEnable
            }
        },
        watch: {
            componentName: {
                handler (n, o) {
                    if (n) {
                        this.$nextTick(() => {
                            if (!this.$root.componentRefs) { this.$root.componentRefs = {} }
                            this.$root.componentRefs[this.componentName] = this
                        })
                    }
                },
                deep: true,
                immediate: true
            },
            modelValue: {
                immediate: true,
                handler: function (val) {
                    if (this.configdata.kfbj === '1') {
                        if (val) this.fileObj = JSON.parse(val)
                    } else {
                        if (val && val.length > 0) {
                            axios({
                                url: this.uploadBaseURL + '/fileManagerSystem/queryFileByIds',
                                method: 'POST',
                                headers: {
                                    Token: 'Inco-' + localStorage.getItem('token' + '_' + Setting.xmid)
                                },
                                params: {
                                    sclj: val
                                }
                            }).then(({ data }) => {
                                this.data = data || [];
                            })
                        } else {
                            this.data = [];
                        }
                    }
                }
            },
            configdata: {
                handler (n, o) {
                    if (n.blm) { this.componentName = n.blm }
                },
                deep: true,
                immediate: true
            }
        },

        mounted () { if (this.configdata.createClass) this.loadCssCode(this.configdata.createClass) },
        computed: {
            xmid () {
                return this.propstocomponent && this.propstocomponent.xmid ? this.propstocomponent.xmid : Setting.xmid
            },
            // 上传按钮图标
            uploadIcon () {
                return this.configdata.attrs && this.configdata.attrs.uploadIcon ? this.configdata.attrs.uploadIcon : 'ios-cloud-upload-outline'
            },
            // 上传按钮名
            btnTitle () {
                return this.configdata.attrs && this.configdata.attrs.btnTitle ? this.configdata.attrs.btnTitle : '上传'
            },
            // 上传文件类型
            accept () {
                return this.configdata.attrs && this.configdata.attrs.accept ? this.configdata.attrs.accept : ''
            },
            // 文件数量限制
            maxNumber () {
                return this.configdata.attrs && this.configdata.attrs.maxNumber ? this.configdata.attrs.maxNumber : 1
            },
            // 文件大小限制
            maxSize () {
                return this.configdata.attrs && this.configdata.attrs.maxSize ? this.configdata.attrs.maxSize : 100
            },
            // 要自定义存储的路径
            cclj () {
                return this.configdata.attrs && this.configdata.attrs.cclj ? this.configdata.attrs.cclj : ''
            },
            // 上传存储方式
            uploadType () {
                return this.configdata.uploadType ? this.configdata.uploadType : 'local'
            },
            // 是否需要转码
            sfzm () {
                return this.configdata.sfzm
            },
            // 视频上传相关参数
            videoParams () {
                return {
                    // 视频是否需要转码为mp4
                    spsfxyzm: this.configdata.spsfxyzm ? this.configdata.spsfxyzm : '0',
                    // 同时生成进度条雪碧图
                    scjdtxbt: this.configdata.scjdtxbt ? this.configdata.scjdtxbt : '0',
                    // 同时生成480p视频
                    sc480sp: this.configdata.sc480sp ? this.configdata.sc480sp : '0',
                    // 同时生成720p视频
                    sc720sp: this.configdata.sc720sp ? this.configdata.sc720sp : '0',
                    // 同时生成1080p视频
                    sc1080sp: this.configdata.sc1080sp ? this.configdata.sc1080sp : '0',
                    // 同时生成视频的音频
                    scspyp: this.configdata.scspyp ? this.configdata.scspyp : '0'
                }
            },
            // 是否显示文件列表表头
            showHead () {
                let showHead = true
                if (this.configdata.attrs) showHead = this.configdata.attrs.showHead
                return showHead
            },
            // 是否显示文件列表边框
            border () {
                let border = true
                if (this.configdata.attrs) border = this.configdata.attrs.border
                return border
            }
        },
        methods: {
            test () {
                console.log(this.configdata, 'configdata from uploadFile.vue')
                console.log(this.fileObj, 'this.fileObj')
                console.log(this, 'this')
            },
            env () {
                let returnValue = false
                const str = localStorage.getItem('incoenv')
                if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1)returnValue = true
                return returnValue
            },
            computeEdit () {
                let returnValue = true;
                if (this.configdata.editable == '0') returnValue = false
                if (this.configdata.uploadcondition) {
                    const obj = {}
                    const funcEval = new Function('_this', 'obj', this.configdata.uploadcondition)
                    returnValue = funcEval(this, obj, this.configdata.uploadcondition)
                }
                if (this.opentype == 'show') returnValue = false
                return returnValue
            },
            loadCssCode (code) {
                if (!document.getElementById('style-' + this.componentName)) {
                    const style = document.createElement('style');
                    style.type = 'text/css';
                    style.rel = 'stylesheet';
                    style.id = 'style-' + this.componentName
                    // for Chrome Firefox Opera Safari
                    style.appendChild(document.createTextNode(code));
                    // for IE
                    // style.styleSheet.cssText = code;
                    const head = document.getElementsByTagName('head')[0];
                    head.appendChild(style);
                }
            },
            beforeUpload (file) {
                // 上传文件格式判断
                const isFormat = this.checkFileType(file.name);
                // 上传文件大小判断
                const fileSizeBoolean = this.checkFileSize(file.size);
                if (!isFormat || !fileSizeBoolean) return false;

                const formData = new FormData();
                formData.append('file', file);
                formData.append('xmid', this.commonsJs.setting.xmid);
                this.$Spin.show();
                this.commonsJs.Axios({
                    url: this.uploadBaseURL + '/fileManagerSystem/uploadFullfile',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Token: 'Inco-' + localStorage.getItem('token' + '_' + Setting.xmid)
                    },
                    dataType: 'json',
                    data: formData
                }).then((res) => {
                    this.$Spin.hide();
                    if (res.data.code != 200) {
                        this.$Message.warning('上传失败，请重试！');
                        console.log('失败原因：', res.data.msg)
                    } else {
                        this.$Message.success('上传成功');
                        const returnStr = JSON.stringify(res.data.content)
                        this.$emit('input', returnStr)
                        this.$emit('update:modelValue', returnStr)
                    }
                });
                return false;
            },
            async deleteFileObj () {
                this.$Modal.confirm({
                    title: '删除提醒',
                    content: '您要删除该文件吗？',
                    onOk: () => {
                        const url = this.uploadBaseURL + '/fileManagerSystem/deleteFullfile'
                        this.commonsJs.axiosRequest(url, { id: this.fileObj.id }).then((res) => {
                            this.$emit('input', '')
                            this.$emit('update:modelValue', '')
                            this.fileObj = {}
                        })
                    },
                    onCancel: () => {}
                });
            },
            // 校验文件格式
            checkFileType (fileName) {
                const acceptArray = this.onlyOfficeAccept;
                if (acceptArray != null && acceptArray != '') {
                    const format = '.' + fileName.split('.').pop().toLowerCase(); // 用户上传的文件格式
                    // 把允许上传文件格式的数组转为字符串
                    const s = acceptArray.join(',').toLowerCase();
                    const exp = new RegExp(format);
                    if (!exp.test(s.split(','))) {
                        this.$Message.warning({ background: true, content: '请上传 [' + s + '] 格式的文件!', duration: 3 });
                        return false;
                    }
                }
                return true;
            },
            // 校验文件大小
            checkFileSize (fileSize) {
                if (fileSize / 1024 / 1024 > this.maxSize) {
                    this.$Message.warning('文件过大！文件大小最大为' + this.maxSize + 'M!');
                    return false;
                }
                return true;
            },
            computeUploadBtn () {
                let returnValue = true;
                if (this.configdata.uploadcondition) {
                    const obj = {}
                    const funcEval = new Function('_this', 'obj', this.configdata.uploadcondition)
                    returnValue = funcEval(this, obj, this.configdata.uploadcondition)
                }
                return returnValue
            },
            // 文件上传成功的回调
            uploadSuccess (fileList) {
                // 合并到已经上传的文件中
                // 服务器返回字段: fileName, fileSize, lx, ccxdlj, wjhzm, id, sfmc, url, md5
                // Table 期望字段: wjm, czsj, lx, fileSize, wjxsmc
                // 需要进行字段映射
                const mappedList = fileList.map((item) => ({
                    id: item.id,
                    wjm: item.fileName,
                    wjxsmc: item.fileName,
                    fileSize: item.fileSize,
                    lx: item.lx,
                    czsj: item.czrq || item.scsj || new Date().toLocaleString(),
                    wjhzm: item.wjhzm,
                    ccxdlj: item.ccxdlj,
                    url: item.url,
                    sfmc: item.sfmc,
                    md5: item.md5
                }))

                const ids = mappedList.map((item) => item.id);
                if (this.maxNumber == 1) {
                    this.$emit('input', ids.join(','))
                    this.$emit('update:modelValue', ids.join(','))
                    this.successFileList = mappedList;
                    this.data = mappedList;
                } else {
                    this.$emit('update:modelValue', this.modelValue ? (this.modelValue + ',' + ids.join(',')) : ids.join(','))
                    this.successFileList = this.successFileList.concat(mappedList);
                    this.data = this.data.concat(mappedList);
                }
                this.$emit('uploadSuccess', fileList)
            },
            // 上传文件
            upload () {
                if (this.maxNumber != 1 && this.data.length >= this.maxNumber) {
                    this.$Message.warning('超过限制文件上传数量：' + this.maxNumber);
                    return false;
                }
                // 打开文件选择框
                Bus.$emit('openUploader', { uid: this._uid });
            },
            // 下载文件
            async downLoadFile (row, index) {
                this.commonsJs.downloadFile(row.id, this)
            },
            // 下载文件
            async downLoadFullFile () {
                // window.location.href = this.uploadBaseURL + '/fileManagerSystem/downLoadFullFile?wjid=' + this.fileObj.id;
                this.$progress.show()
                axios({
                    url: this.uploadBaseURL + '/fileManagerSystem/getFullfileStream?wjid=' + this.fileObj.id,
                    method: 'POST',
                    headers: {
                        Token: 'Inco-' + localStorage.getItem('token' + '_' + Setting.xmid),
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    responseType: 'blob',
                    data: {},
                    // 监听下载进度的方法，后端response需返回Content-Length
                    onDownloadProgress (progress) {
                        // progress对象中的loaded表示已经下载的数量，total表示总数量，这里计算出百分比。注意这里一定需要后端接口返回 Content-Length，没有的话是拿不到的
                        const downProgress = Math.round((100 * progress.loaded) / progress.total);
                        this.$progress.set(downProgress)
                    }
                }).then(res => {
                    this.$progress.show()
                    if (!res) {
                        Message.warning('下载失败，请重试！')
                    } else {
                        const Blob = res.data
                        let a = document.createElement('a')
                        a.download = this.fileObj.wjm;
                        a.href = window.URL.createObjectURL(Blob);
                        a.click()
                        window.URL.revokeObjectURL(Blob)
                        a = null // 设置为空，gc自动回收
                    }
                })
            },
            // 查看非分片文件
            viewFullFile () {
                this.$office_dy({ modalType: 'Drawer', modalTitle: this.fileObj.wjm, modalWidth: '100%', fileType: this.fileObj.wjhzm, title: this.fileObj.wjm, wjid: this.fileObj.id, mode: 'view' })
            },
            // 删除文件
            deleteFile (row, index) {
                this.$Modal.confirm({
                    title: '删除上传文件',
                    content: `您要删除【${row.wjxsmc}】这个文件吗？`,
                    onOk: () => {
                        // 从 data 中删除
                        this.data.splice(index, 1);
                        // 更新 value（ID列表）
                        let val = this.modelValue || '';
                        const idIndex = val.indexOf(String(row.id));
                        if (idIndex >= 0) {
                            val = idIndex == 0 ? (val.replace(String(row.id), '')) : (val.replace(',' + row.id, ''));
                            val = val.replace(/^,|,$/g, ''); // 清理首尾逗号
                        }
                        this.$emit('input', val);
                        this.$emit('update:modelValue', val)
                    },
                    onCancel: () => {}
                })
            },
            // 预览图片
            showImg (row, index) {
                this.$viewfile_dy({ wjlx: 'wjid', wjid: row.id, modalType: 'Modal', modalTitle: row.wjxsmc, modalWidth: 900 })
            },
            // 预览pdf
            showPdf (row, index) {
                this.$viewfile_dy({ wjlx: 'wjid', wjid: row.id, modalType: 'Drawer', modalTitle: row.wjxsmc, modalWidth: 60 })
            },
            showVideo (row, index) {
                this.$viewfile_dy({ wjlx: 'wjid', wjid: row.id, modalType: 'Modal', modalTitle: row.wjxsmc, modalWidth: 900 })
            },
            // 改变文件顺序
            handleWjpx (start, end) {
                const item = this.data[start]
                this.data.splice(start, 1)
                if (start > end) {
                    this.data.splice(end, 0, item)
                } else {
                    this.data.splice(end - 1, 0, item)
                }
                // 修改改变后的文件顺序
                this.commonsJs.axiosRequest(this.uploadBaseURL + '/fileManagerSystem/updateWjpx', { wjList: this.data }).then((res) => {})
            },
            // 修改文件显示名称
            updateWjxsmc (row) {
                if (!row.wjxsmc) {
                    this.$Message.error('请输入文件名称');
                    return;
                }
                axios({
                    url: this.uploadBaseURL + '/fileManagerSystem/updateWjxsmc',
                    method: 'POST',
                    headers: {
                        Token: 'Inco-' + localStorage.getItem('token' + '_' + Setting.xmid),
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    params: { id: row.id, wjxsmc: row.wjxsmc }
                }).then(res => {

                })
            }
        },
        beforeUnmount () {
            delete this.$root.componentRefs[this.componentName]
            if (this.configdata.createClass && this.configdata.createClass.trim()) document.getElementById('style-' + this.componentName).remove()
        }
    }
</script>

<style scoped lang="less">
  a:hover {
    color: #fc6464;
    font-weight: bolder;
    text-decoration:none;
  }
</style>
