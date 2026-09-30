<template>
  <div :class="'style-' + configdata.blm + ' ' + configdata.blm">
    <MdPreview
      v-if="!isEdit"
      :model-value="myValue"
      style="height: 100%"
    />
    <MdEditor
      v-else
      v-model="myValue"
      :toolbars="toolbars"
      :footers="['markdownTotal']"
      @onUploadImg="onUploadImg"
      style="height: 100%"
    />
  </div>
</template>
<script>
    import { MdEditor, MdPreview } from 'md-editor-v3'
    import 'md-editor-v3/lib/style.css'

    export default {
        name: 'jmavonEditor',
        components: { MdEditor, MdPreview },
        props: {
            index: { type: Number },
            id: { type: String, default: '' },
            fathername: { type: String, default: '' },
            configdata: { type: Object, default: () => ({}) },
            modelValue: { type: String, default: '' },
            opentype: { type: String, default: 'add' }
        },
        data () {
            return {
                componentName: '',
                ref: this.$root.componentRefs,
                myValue: this.modelValue,
                toolbars: [
                    'bold', 'italic', 'title', 'underline', 'strikeThrough',
                    'mark', 'sup', 'sub',
                    'quote', 'orderedList', 'unorderedList',
                    'link', 'image', 'code', 'table',
                    'revoke', 'next', 'clear',
                    'catalog', 'fullscreen', 'preview',
                    'alignLeft', 'alignCenter', 'alignRight'
                ]
            }
        },
        methods: {
            onUploadImg (files, callback) {
                const urls = []
                let completed = 0
                files.forEach((file) => {
                    const formData = new FormData()
                    formData.append('file', file)
                    this.commonsJs.Axios({
                        method: 'POST',
                        url: this.commonsJs.setting.uploadBaseURL + '/fileManagerSystem/uploadFullfile',
                        headers: {
                            Token: 'Inco-' + localStorage.getItem('token' + '_' + this.commonsJs.setting.xmid)
                        },
                        data: formData
                    }).then(res => {
                        if (res.data.code == 200) {
                            let filePath = this.commonsJs.setting.uploadBaseURL + '/fileManagerSystem/downLoadFullFile?wjid=' + res.data.content.id
                            if (this.commonsJs.setting.streamServerEnable) {
                                filePath = this.commonsJs.setting.streamServerUrl + res.data.content.ccxdlj
                            }
                            urls.push(filePath)
                        }
                        completed++
                        if (completed === files.length) {
                            callback(urls)
                        }
                    })
                })
            }
        },
        watch: {
            modelValue: {
                handler (n) {
                    if (n != this.myValue) this.myValue = n
                },
                immediate: true
            },
            myValue: {
                handler (n) {
                    this.$emit('update:modelValue', n)
                    this.$emit('input', n)
                },
                immediate: true

            },
            configdata: {
                handler (n) {
                    if (n.blm) { this.componentName = n.blm }
                },
                deep: true,
                immediate: true
            }
        },
        computed: {
            isEdit () {
                return this.opentype != 'show'
            }
        }
    }
</script>
