<template>
    <component :is="configdata.componentType" :configdata="configdata" :blm="configdata.blm"></component>
</template>
<script>
import { mapState, mapActions, mapMutations } from 'vuex'
export default {
    name: 'pageinterface',
    props: {

    },
    data() {
        return {
            ref: this.$root.componentRefs,
            configdata: {},
            param: {},
        }
    },
    computed: {

    },
    methods: {
        ...mapActions('admin/account', ['usernameLogin']),
        triggerFunction(blm, method, obj) {
            this.$root.componentsParam[blm] = [{ blm: blm, method: method, obj: obj }]
        },
        addEventListener(event) {
            // 检查消息的来源是否可信
            if (event.origin !== this.param.origin) {
                return;
            }
            // 处理接收到的消息
            this.commonsJs.funcEval(this, {}, event.data)
        }
    },
    mounted() {
        if (this.param.watchComponent) {
            let watchComponent = this.param.watchComponent.split(',')
            let ind = 0;
            let timeer = setInterval(() => {
                ind++;
                if (ind == 50) clearInterval(timeer);
                let flag = false
                watchComponent.forEach(item => {
                    if (!this.ref[item]) flag = true
                })
                if (!flag) {
                    window.parent.postMessage('true', this.param.origin);
                    clearInterval(timeer);
                }
            }, 100)
        }
        window.addEventListener("message", this.addEventListener, false)
    },
    created() {
        let param = this.$route.query.param
        if (param) {
            param = JSON.parse(this.commonsJs.decrypt_aes(decodeURIComponent(param)))
            this.param = param
            this.usernameLogin({ username: param.username }).then((res) => {
                if (param.gnid) {
                    this.configdata = {}
                    this.commonsJs.getzjpzxx(param.gnid).then(res => {
                        this.configdata = res
                        if (res.componentType == 'collection' || res.componentType == 'jform') this.triggerFunction(res.blm, '_this.open(true)', {})
                    })
                } else if (param.componentType) {
                    this.commonsJs.registerComponent([param.componentType], this)
                }
            })
        }
    },
    watch: {

    },
}
</script>
