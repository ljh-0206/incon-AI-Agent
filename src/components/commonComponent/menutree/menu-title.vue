<template>
    <div :class="computeClass(menu)" @click="handleClick(menu)"><Icon :type="menu.icon" size="20"></Icon>{{ menu.content }}</div>
</template>
<script>

    export default {
        name: 'iMenuSideTitleTree',
        props: {
            menu: { type: Object, default () { return {} } },
            configdata: { type: Object, default: () => ({}) }
        },
        computed: {

        },
        data () {
            return {
                ref: this.$root.componentRefs
            }
        },
        methods: {
            handleClick (item) {
                if (this.configdata.itemClick && this.configdata.itemClick.trim()) {
                    const obj = { row: item }
                    this.ref[this.configdata.blm].itemClick(obj)
                }
            },
            computeClass (item) {
                let classname = this.configdata.className
                if (this.configdata.classMethod) classname = this.commonsJs.funcEval1(this, { row: item, configdata: this.configdata }, this.configdata.classMethod)
                return classname
            }
        }
    }
</script>
