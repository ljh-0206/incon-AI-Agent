<template>
    <div style="height: 100%">
        <!-- <Button v-if="env()" @click="test">web按钮</Button> -->
        <jwatermark v-model="watermarkText" v-if="isVisibleWatermark"></jwatermark>
        <component :is="config.main_page.lx" ref="main_page" v-if="config.main_page" :configdata="config.main_page"
             :propstocomponent="propsAll" @commonMethod="commitMethod"></component>
    </div>
</template>
<script>
    import { mapState } from 'vuex';
    export default {
        name: 'weblayout',
        components: {},
        props: {
            // initData_props:{type:String,default:''},
            routerProps: { type: Object, default: () => ({}) },
            propstocollection: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                data: {},
                config: {},
                propstocomponent: {},
                configdata: {},
                excuteData: { name: null, methodName: '', param: null },
                number: 1
            }
        },
        watch: {
            routerProps: {
                handler () {
                    this.getConfig(this.propsAll.initData_props);
                },
                deep: true,
                immediate: true
            }
        },
        methods: {
            test () {
                console.log(this.propsAll, 'routerPropsAll print from index.vue of commonLayoutCrud test')
                console.log(this.configdata, 'configdata print from index.vue of commonLayoutCrud test')
                console.log(this.$root.componentRefs, 'this.$root.componentRefs')
                console.log(this.config, 'this.config')
            },
            /**
             * 根据系统配置信息组件里面配置的开发环境，如果时开发环境，则显示调试的test按钮
             */
            env () {
                let returnValue = false
                const str = localStorage.getItem('incoenv')
                if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1)returnValue = true
                return returnValue
            },
            loadCssCode (code) {
                if (!document.getElementById('style-commonWeblayout')) {
                    const style = document.createElement('style');
                    style.type = 'text/css';
                    style.rel = 'stylesheet';
                    style.id = 'style-commonWeblayout'
                    // for Chrome Firefox Opera Safari
                    style.appendChild(document.createTextNode(code));
                    // for IE
                    // style.styleSheet.cssText = code;
                    const head = document.getElementsByTagName('head')[0];
                    head.appendChild(style);
                }
            },
            handleReturnData (param) {
                this.$emit('handleReturnData', param)
            },
            handleexcutefunc (obj) {
                const param = JSON.parse(JSON.stringify(obj))
                this.excuteData = {}
                // console.log(this.$refs[param.name][param.methodName],'this.$refs[param.name][obj.param.methodName]')
                this.$refs[param.name][param.methodName](param.param)
            },
            commitMethod (obj) {
                //  console.log(obj,'print commitMethod from configModuleInfo.vue')
                if (obj.method) { this.commonsJs.funcEval(this, obj, obj.method) }
            },
            async getConfig (config_id) {
                const obj = await this.commonsJs.getzjpzxx(config_id)
                this.config.main_page = obj
            }

        },
        computed: {
            ...mapState('admin/user', ['info']),
            propsAll () {
                return { ...this.routerProps, ...this.$route.query, ...this.propstocomponent }
            },
            // 全局水印
            // 水印内容
            watermarkText () {
                let text = this.commonsJs.setting.titleSuffix
                if (this.info && this.info.yhdm) {
                    text = this.info.xm + ' @ ' + text + ' ' + (this.info.yhdm.length >= 4 ? this.info.yhdm.substring(this.info.yhdm.length - 4) : this.info.yhdm)
                }
                if (this.isVisibleWatermark) {
                    if (this.commonsJs.setting.watermark.custom) text = this.commonsJs.setting.watermark.customText
                }
                return text
            },
            // 是否显示水印
            isVisibleWatermark () {
                let flag = false
                const watermark = this.commonsJs.setting.watermark
                if (watermark && watermark.enabled) {
                    if ((watermark.type == 'qd' || watermark.type == 'all') && (!watermark.onlyLoginAfter || (watermark.onlyLoginAfter && this.info && this.info.yhdm))) flag = true
                }
                return flag
            }
        },
        mounted () {
            if (this.commonsJs.setting.websocket) {
            // 此处启动接收websocket
            }
            const cssnr_qt = this.$root.cssnr_qt
            if (cssnr_qt && cssnr_qt.trim()) this.loadCssCode(cssnr_qt)
        }
    }
</script>
<style lang="less" scoped>

</style>
