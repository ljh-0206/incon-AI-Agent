<template>
    <div class="collectionMain" :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <component :is="componentType" ref="collection" :model-value="configdata.modal"
            :propstocomponent="innerPropstody.propstocomponent" :configdata="configdata" :childmethodparams="excuteData"
            @excutefunc="handleexcutefunc" @commonMethod="commonMethod" @update:visible="close">
        </component>
    </div>
</template>
<script>
    export default {
        props: {
            propstody: { type: Object, default: () => ({}) },
            fathername: { type: String, default: '' },
            // 传入 DOM 容器元素，供组件销毁后从 body 中移除
            incoEl: { type: Object, required: true }
        },
        data () {
            return {
                incoApp: null,
                componentName: 'incody',
                propstocomponent: {},
                components: {},
                configdata: {},
                excuteData: { name: null, methodName: '', param: null },
                number: 1,
                componentsParam: {},
                componentRefs: {},
                function: {}, // 通用function
                functionMethods: {}, // 通用function方法
                tempdata: {},
                outRef: null,
                activeModal: []
            }
        },
        computed: {
            // 内部用 innerPropstody 避免直接修改 prop（prop 在 Vue 3 中只读）
            innerPropstody () {
                return this.propstody;
            },
            componentType () {
                let type = 'collection';
                if (this.configdata.componentType) type = this.configdata.componentType;
                return type;
            },
            ref () { return this.componentRefs; }
        },
        watch: {},
        methods: {
            test () {
                console.log(this.propstocollection, 'propstocollection print from index.vue of commonLayoutCrud test');
                console.log(this.propsAll, 'routerPropsAll print from index.vue of commonLayoutCrud test');
                console.log(this.configdata, 'configdata print from index.vue of commonLayoutCrud test');
            },
            env () {
                let returnValue = false;
                const str = localStorage.getItem('incoenv');
                if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1) returnValue = true;
                return returnValue;
            },
            close () {
                if (this.propstody.closeMethod) {
                    const data = JSON.parse(JSON.stringify(this.tempdata));
                    this.tempdata = {};
                    this.commonsJs.funcEval1(
                        this.propstody.self,
                        { data, self: this, child_ref: this, fathername: this.fathername, props: this.propstody.props },
                        this.propstody.closeMethod
                    );
                }

                // 销毁组件 - unmount 后从 body 中移除 DOM 容器
                if (this.incoApp) {
                    this.incoApp.unmount();
                    if (this.incoEl && this.incoEl.parentNode) {
                        this.incoEl.parentNode.removeChild(this.incoEl);
                    }
                    this.incoApp = null
                }
            },
            handleexcutefunc (obj) {
                const param = JSON.parse(JSON.stringify(obj));
                this.excuteData = {};
                this.$refs[param.name][param.methodName](param.param);
            },
            childMethod (blm, methodName, param) {
                this.excuteData = { name: blm, methodName, param };
            },
            commonMethod (obj) {
                if (this.propstody.closeMethod) {
                    const funcEval = new Function('_this', 'obj', this.propstody.closeMethod);
                    funcEval(this.propstody.self, obj);
                }
            },
            triggerFunction (blm, method, obj) {
                this.propstody.self.componentsParam[blm] = [{ blm, method, obj }];
            },
            async getConfig (obj, app) {
                this.incoApp = app
                const self = obj.self;
                this.outRef = obj.self;
                this.componentRefs[obj.name] = this;
                this.configdata = await this.commonsJs.getzjpzxx(obj.yyid);
                const componentType = this.configdata.lx || this.configdata.componentType;
                this.configdata.componentType = componentType;
                if (obj.openMethod) {
                    const funcEval = new Function('_this', 'obj', obj.openMethod);
                    funcEval(this, obj);
                }
                this.$nextTick(() => {
                    this.configdata.modal = true
                })
            }
        },
        mounted () { }
    }
</script>
