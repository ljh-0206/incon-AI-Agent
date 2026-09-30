<template>
    <div @click="handleClick" :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <div v-html="$xss(vhtmlvalue)" :style="styles"></div>
    </div>
</template>
<script>
    export default {
        name: 'vhtml',
        components: {},
        props: {
            value: { type: String, default: '' },
            row: { type: Object, default: () => ({}) },
            propstocomponent: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: function () { return {} } },
            styles: { type: Object, default: function () { return {} } },
            attrs: { type: Object, default: function () { return {} } },
            componentClass: { type: Object, default: function () { return {} } }
        },
        data () {
            return {
                ref: this.$root.componentRefs,
                tempdata: {}
            }
        },
        computed: {
            vhtmlvalue () {
                if (this.configdata.content && this.configdata.content.trim()) { return this.configdata.content } else if (this.configdata.dtzMethod) {
                    const obj = { value: this.value, propstocomponent: this.propstocomponent, row: this.row }
                    return this.commonsJs.funcEval1(this, obj, this.configdata.dtzMethod)
                } else return this.value
            }
        },
        methods: {
            handleClick () {
                if (this.configdata.clickInside) {
                    const obj = { value: this.value, propstocomponent: this.propstocomponent, row: this.row, configdata: this.configdata }
                    this.commonsJs.funcEval1(this, obj, this.configdata.clickInside)
                }
            }
        },
        watch: {}
    }
</script>
