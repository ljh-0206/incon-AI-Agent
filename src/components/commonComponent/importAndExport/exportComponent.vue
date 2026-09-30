<template>
    <Button v-bind="configdata.attrs" :style="configdata.style" @click="expExcel"  onclick="return false">{{configdata.content ? configdata.content:'导出'}}</Button>
</template>
<script>
    import { mapState, mapGetters } from 'vuex'
    import { exportFile } from '@/plugins/exportFile';

    export default {
        name: 'exportcomponent',
        props: {
            configdata: { type: Object, default: () => ({}) },
            fathername: { type: String, default: '' },
            propstocomponent: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                ref: this.$root.componentRefs,
                tempdata: {}
            }
        },
        methods: {
            async expExcel () {
                let sqlCondtion = ''
                let tableform = {}
                if (this.ref[this.fathername] && this.ref[this.fathername].configdata) {
                    const tableformname = this.ref[this.fathername].configdata.tableformName
                    if (tableformname) {
                        if (this.ref[tableformname] && this.ref[tableformname].data && Object.keys(this.ref[tableformname].data) > 0) { tableform = this.ref[tableformname].data }
                    }
                }
                if (this.configdata.exportMethod) sqlCondtion = await this.commonsJs.funcEval(this, tableform, this.configdata.exportMethod)

                this.commonsJs.selfRequest('/zdydrdcZdydc/checkExcel', { id: this.configdata.ywid }).then((res) => {
                    if (res.zt == '0') {
                        this.$Message.error({ background: true, duration: 5, content: '系统错误，导出失败' });
                    } else if (res.zt == '1') {
                        exportFile('/zdydrdcZdydc/expExcel', { id: this.configdata.ywid, cssql: sqlCondtion }, res.ywmc + '.xls', this);
                    } else if (res.zt == '2') {
                        this.$Message.error({ background: true, duration: 5, content: '表或视图不存在，请联系管理员！' });
                    } else if (res.zt == '3') {
                        this.$Message.error({ background: true, duration: 5, content: '导出模板信息维护不全，请联系管理员！' });
                    }
                })
            }
        },
        computed: {
            ...mapState('admin/user', ['info'])
        },
        mounted () {}
    }
</script>
