<template>
    <div style="display:inline-block" >
        <!-- <Button @click="test">倒计时</Button> -->
        <span v-if="data.seconds>0">{{ data.seconds }} 秒</span>
    </div>
  </template>
  <script>
    export default {
        name: 'timecountdown',
        components: {},
        props: {
            fathername: { type: String, default: '' },
            opentype: { type: String, default: '' },
            configdata: {
                type: Object,
                default: () => ({})
            },
            propstocomponent: {
                type: Object,
                default: () => ({})
            }
        },
        data () {
            return {
                ref: this.$root.componentRefs,
                data: {
                    seconds: -1,
                    time_data: 15
                },
                style: {},
                attrs: {},
                timeinterval: null,
                tempdata: {}

            };
        },
        methods: {
            test () {
                console.log(this.configdata, 'configdata')
                console.log(this.data, 'data')
            },
            handleTime () {
                this.timeinterval = setInterval(() => {
                    if (this.data.seconds === 0) {
                        clearInterval(this.timeinterval);
                        if (this.configdata.finish) { this.$emit('commonMethod', { method: this.configdata.finish }) } else {
                            const method = `_this.attrs.${this.configdata.blm}['disabled'] = false`
                            this.$emit('commonMethod', { method })
                        }
                    } else this.data.seconds = this.data.seconds - 1
                }, 1000);
            }
        },
        watch: {
            opentype: {
                handler (n) {
                    if (n) {
                        if (this.configdata.seconds) this.data.seconds = this.configdata.seconds
                        this.handleTime()
                    } else {
                        if (this.timeinterval) { clearInterval(this.timeinterval); }
                    }
                },
                deep: true,
                immediate: true
            }
        },
        mounted () {},
        created () {}
    };
  </script>
  <style  scoped>
  </style>
