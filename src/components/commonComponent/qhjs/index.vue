<template>
    <component footer-hide v-model="show" :is="propstocomponent.modalType" :title="propstocomponent.modalTitle"
        :width="propstocomponent.modalWidth" :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <div>
            <div class="jsitem" v-for="item in info.role" @click="clickQhjs(item)">
                <div class="sfdqdiv">
                    <span class="sfdq" v-if="info && info.jsdm==item.jsdm">√</span>
                </div>
                <div class="jsmc"> • {{item.jsmc}} </div>
            </div>
        </div>
    </component>
</template>
<script>
    import { mapActions, mapState } from 'vuex';
    import Setting from '@/setting';
    export default {
        components: {},
        props: {
            propstody: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: () => { return { blm: 'qhjs' } } },
            // DOM 容器传入，供组件销毁后从 body 中移除
            incoEl: { type: Object, required: true }
        },
        data () {
            return {
                dyDom: null,
                componentName: 'qhjs_zj',
                propstocomponent: {
                    modalType: 'Modal',
                    modalTitle: '切换角色',
                    modalWidth: '210px'
                },
                show: false
            }
        },
        watch: {
            show (val) {
                if (!val && this.dyDom) {
                    // 销毁组件 - Vue 3 兼容
                    this.dyDom.unmount();
                    if (this.incoEl && this.incoEl.parentNode) {
                        this.incoEl.parentNode.removeChild(this.incoEl);
                    }
                    this.dyDom = null;
                }
            }
        },
        methods: {
            ...mapActions({
                setRoutesAndUser: 'admin/account/setRoutesAndUser',
                closeAll: 'admin/page/closeAll'
            }),
            open (obj, dyDom) {
                this.propstocomponent = { ...this.propstocomponent, ...obj };
                this.show = true;
                this.dyDom = dyDom;
            },
            clickQhjs (item) {
                if (this.info.jsdm == item.jsdm) return
                this.$Spin.show()
                this.info.jsdm = item.jsdm;
                this.info.jsmc = item.jsmc;
                // 清除标签页
                this.closeAll()
                localStorage.setItem('lastloginrole' + '_' + Setting.xmid, item.jsdm)
                this.setRoutesAndUser(this.info).then(() => {
                    this.show = false
                    this.propstocomponent.self.$router.replace('/')
                    this.$Spin.hide()
                })
            }
        },
        computed: {
            ...mapState('admin/user', ['info'])
        },
        mounted () {

        }
    }
</script>
<style scoped>
    .jsitem{
        min-height: 36px;
        line-height: 36px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
    }
    .sfdqdiv{
        width: 22px;
        height: 36px;
        float: left;
        display: inline-block;
    }
    .sfdq{
        width: 22px;
        display: inline-block;
        color: #03A9F4;
    }
    .jsmc{
        text-align: left;
        display: inline-block;
        width: calc(100% - 22px);
        word-wrap: break-word;
    }
</style>
