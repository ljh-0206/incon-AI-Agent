<!-- 通用上传组件，上传图片时使用，可回显 -->
<template>
    <div :style="computeStyle()" :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <GlobalUploader :accept="'.png,.jpg,.jpeg,.gif,.bmp'" :maxNumber="maxNumber" :maxSize="maxSize" :cclj="cclj"
            :czxt="xmid" :yscsl="fileList.length" :sfzm="sfzm" :uploadType="uploadType" :uid="_uid"
            @uploadSuccess="uploadSuccess" />
        <div class="demo-upload-list" v-for="(item,index) in fileList"
            :style="'width: '+width+'px;height:'+height+'px;line-height:'+height+'px;'" :key="'upload'+index+_uid">
            <img :src="computeImgsrc(item)">
            <div class="demo-upload-list-cover">
                <Icon type="ios-eye-outline" @click.native="viewImg(item)"></Icon>
                <Icon v-if="computeEdit()" type="ios-trash-outline" @click.native="delImg(item)"></Icon>
            </div>
        </div>

        <div class="upload-icon" v-if="computeEdit() && fileList.length<maxNumber"
            :style="'width: '+width+'px;height:'+height+'px;line-height:'+height+'px;'" @click="upload">
            <Icon :type="backgroundIcon" size="38"></Icon>
        </div>
    </div>
</template>

<script>
    import Bus from '@/components/commonComponent/upload/js/bus'
    import GlobalUploader from '@/components/commonComponent/upload'
    import Setting from '@/setting'
    import axios from 'axios';

    export default {
        name: 'uploadimg',

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
            // 绑定的value
            modelValue: {
                type: String,
                default: ''
            },
            // 打开方式（控制只读）
            opentype: {
                type: String,
                default: ''
            }
        },
        data () {
            return {
                componentName: '',
                fileList: [],
                uploadBaseURL: Setting.uploadBaseURL,
                tempdata: {}
            }
        },
        watch: {
            modelValue: {
                immediate: true,
                handler: function (val) {
                    if (val && val.length > 0) {
                        axios({
                            url: this.uploadBaseURL + '/fileManagerSystem/queryFileByIds',
                            method: 'POST',
                            headers: { Token: 'Inco-' + localStorage.getItem('token' + '_' + Setting.xmid) },
                            params: { sclj: val }
                        }).then(({ data }) => {
                            this.fileList = data || [];
                        })
                    } else {
                        this.fileList = [];
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

        mounted () {
            if (this.configdata.createClass) this.loadCssCode(this.configdata.createClass)
        },
        computed: {
            xmid () {
                return this.propstocomponent && this.propstocomponent.xmid ? this.propstocomponent.xmid : Setting.xmid
            },
            // 文件数量限制
            maxNumber () {
                return this.configdata.attrs && this.configdata.attrs.maxNumber ? this.configdata.attrs.maxNumber : 1
            },
            // 文件大小限制
            maxSize () {
                return this.configdata.attrs && this.configdata.attrs.maxSize ? this.configdata.attrs.maxSize : 5
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
            // 图片宽度
            width () {
                return this.configdata.attrs && this.configdata.attrs.width ? this.configdata.attrs.width : 120
            },
            // 图片高度
            height () {
                return this.configdata.attrs && this.configdata.attrs.height ? this.configdata.attrs.height : 120
            },
            backgroundIcon () {
                return this.configdata.attrs && this.configdata.attrs.backgroundIcon ? this.configdata.attrs.backgroundIcon : 'ios-camera'
            }
        },
        methods: {
            computeEdit () {
                let returnValue = true;
                if (this.configdata.editable == '0') returnValue = false
                if (this.opentype == 'show') returnValue = false
                return returnValue
            },
            computeStyle () {
                let style = {}
                if (this.configdata.style) style = { ...this.configdata.style }
                if (this.configdata.styleMethod) {
                    const tempstyle = this.commonsJs.funcEval1(this, {}, this.configdata.styleMethod)
                    style = { ...style, ...tempstyle }
                }
                return style
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
            // 计算图片路径
            computeImgsrc (row) {
                let imgSrc = this.uploadBaseURL + '/fileManagerSystem/getZmhFileStream?scjlid=' + row.id;
                switch (row.uploadType) {
                case 'local':
                    if (Setting.streamServerEnable) imgSrc = Setting.streamServerUrl + row.ccxdlj;
                    break;
                case 'minio':
                    if (Setting.oss && Setting.oss.minioServerUrl) imgSrc = Setting.oss.minioServerUrl + row.ccxdlj;
                    break;
                case 'aliyun':
                    if (Setting.oss && Setting.oss.aliyunServerUrl) imgSrc = Setting.oss.ailiyunServerUrl + row.ccxdlj;
                    break;
                }
                return imgSrc;
            },
            // 文件上传成功的回调
            uploadSuccess (fileList) {
                // 合并到已经上传的文件中
                const ids = fileList.map((item) => item.id);
                if (this.maxNumber == 1) {
                    this.$emit('input', ids.join(','))
                } else {
                    this.$emit('input', this.modelValue ? (this.modelValue + ',' + ids.join(',')) : ids.join(','))
                    this.$emit('update:modelValue', this.modelValue ? (this.modelValue + ',' + ids.join(',')) : ids.join(','))
                }
                this.$emit('uploadSuccess', fileList)
            },
            // 上传文件
            upload () {
                // 打开文件选择框
                Bus.$emit('openUploader', { uid: this._uid });
            },
            // 查看文件
            viewImg (row) {
                this.$viewfile_dy({ wjlx: 'wjid', wjid: row.id, modalType: 'Modal', modalTitle: row.wjxsmc, modalWidth: 900 })
            },
            // 删除文件
            delImg (row) {
                this.$Modal.confirm({
                    title: '删除上传文件',
                    content: `您要删除【${row.wjxsmc}】这个文件吗？`,
                    onOk: () => {
                        let val = this.modelValue;
                        const index = val.indexOf(row.id);
                        val = index == 0 ? (val.replaceAll(row.id, '')) : (val.replaceAll(',' + row.id, ''));
                        this.$emit('input', val);
                        this.$emit('update:modelValue', val);
                    },
                    onCancel: () => {}
                })
            }
        }
    }
</script>

<style scoped lang="less">
  .demo-upload-list{
    float: left;
    display: inline-block;
    text-align: center;
    border: 1px solid transparent;
    border-radius: 4px;
    overflow: hidden;
    background: #fff;
    position: relative;
    box-shadow: 0 1px 1px rgba(0,0,0,.2);
    margin-right: 4px;
    margin-top: 4px;
  }
  .demo-upload-list img{
    width: 100%;
    height: 100%;
  }

  .demo-upload-list-cover{
    display: none;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0,0,0,.6);
  }
  .demo-upload-list:hover .demo-upload-list-cover{
    display: block;
  }
  .demo-upload-list-cover i{
    color: #fff;
    font-size: 20px;
    cursor: pointer;
    margin: 0 2px;
  }

  .upload-icon{
    float:left;
    border:1px dashed #57a3f3;
    border-radius:4px;
    cursor:pointer;
    text-align: center;
    margin-top: 4px;
  }
</style>
