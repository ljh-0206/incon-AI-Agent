<template>
    <div :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <Button v-if="env()" @click="test">自定义组件index</Button>
        <collection ref="collection" :key="number" :propstocollection="propstocomponent" :configdata="configdata"
            :childmethodparams="excuteData" @handleReturnValue="handleReturnValue" @excutefunc="handleexcutefunc"
            @handleReturnData="handleReturnData" />
    </div>
</template>
<script>
    import collection from '@/components/commonComponent/starandCollection/collection.vue'
    export default {
        components: { collection },
        props: {
            // initData_props:{type:String,default:''},
            value: { type: [String, Array, Object], default: '' },
            yyid: { type: String, default: '' },
            propstocollection: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                propstocomponent: {},
                configdata: {},
                excuteData: { name: null, methodName: '', param: null },
                number: 1
            }
        },
        watch: {
            yyid: {
                handler () {
                    if (this.yyid) {
                        this.number = this.commonsJs.sys_guid()
                        this.getConfig(this.yyid);
                    }
                },
                deep: true,
                immediate: true
            },
            value: {
                handler (n) {
                    this.propstocomponent.value = this.value
                    this.childMethod('collection', 'openComponent', true);
                },
                deep: true,
                immediate: true

            }
        },
        methods: {
            /**
             *
             * @param {*} code 是创建的class的代码
             */
            loadCssCode (code) {
                if (document.getElementById('style-' + this.componentName)) document.getElementById('style-' + this.componentName).remove()
                if (!document.getElementById('style-' + this.componentName)) {
                    const style = document.createElement('style');
                    style.type = 'text/css';
                    //   style.lang='less'
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
            test () {
                console.log(this.configdata, 'configdata print from index.vue of commonLayoutCrud test')
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
            handleReturnValue (value) {
                this.$emit('input', value)
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
            childMethod (blm, methodName, param) {
                this.excuteData = { name: blm, methodName, param }
            },
            async getConfig (listId) {
                this.configdata = await this.commonsJs.getzjpzxx(listId);
                this.childMethod('collection', 'open', true);
            }
        },
        computed: {},
        mounted () {}
    }
</script>
