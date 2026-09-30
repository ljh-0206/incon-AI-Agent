<template>
    <div>
        <!-- <onlyoffice style="height: 600px;" :option="option"></onlyoffice> -->
        <!-- <Button v-if="env()" @click="test">index按钮</Button> -->
        <collection ref="collection"
            :propstocomponent="propsAll"
            :configdata="configdata"
            :childmethodparams="excuteData"
            @excutefunc="handleexcutefunc"
            @handleReturnData="handleReturnData"
        />
    </div>
</template>
<script>
    import collection from '@/components/commonComponent/starandCollection/collection.vue'
    export default {
        components: { collection },
        props: {
            // initData_props:{type:String,default:''},
            routerProps: { type: Object, default: () => ({}) },
            propstocollection: { type: Object, default: () => ({}) }

        },
        data () {
            return {
                // option:{
                // fileType:'docx',
                // key:'1OBByFqLpEuX6EjRUVFKaLNbt3BWQlWM',
                // title:'文档.docx',
                // url:this.commonsJs.fileUrl + '0782EA0288837A2FE0632401A8C06D65',
                // user:{
                //     id:'',
                //     name:'',
                //     isOperation:false
                // },
                // },
                componentName: 'webMain',
                propstocomponent: {},
                configdata: {},
                excuteData: { name: null, methodName: '', param: null },
                number: 1
            }
        },
        methods: {

            test () {
                console.log(this.propstocollection, 'propstocollection print from index.vue of commonLayoutCrud test')
                console.log(this.propsAll, 'routerPropsAll print from index.vue of commonLayoutCrud test')
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
            loadCssCode (code) {
                if (!document.getElementById('style-commonCrud')) {
                    const style = document.createElement('style');
                    style.type = 'text/css';
                    style.rel = 'stylesheet';
                    style.id = 'style-commonCrud'
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
            childMethod (blm, methodName, param) {
                this.excuteData = { name: blm, methodName, param }
            },
            async getConfig (listId) {
                // 获取collection的zjpzxx
                this.configdata = await this.commonsJs.getzjpzxx(listId);
                this.childMethod('collection', 'open', true);
            }
        },

        computed: {
            propsAll () {
                return { ...this.routerProps, ...this.$route.query, ...this.propstocomponent }
            }
        },
        watch: {
            routerProps: {
                handler () {
                    if (this.propsAll.initData_props) this.getConfig(this.propsAll.initData_props);
                },
                deep: true,
                immediate: true
            }
        },
        mounted () {
            const cssnr_ht = this.$root.cssnr_ht
            if (cssnr_ht && cssnr_ht.trim()) this.loadCssCode(cssnr_ht)
        }
    }
</script>
