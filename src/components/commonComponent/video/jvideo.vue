<template>
    <div :id="configdata.blm" :class="'style-' + configdata.blm +' '+ configdata.blm" style="position:relative">
      <jwatermark v-model="option.waterMark.content" :configdata="option.waterMark" v-if="option.waterMark&&option.waterMark.content">
      </jwatermark>
    </div>
</template>
<script>
    import Player, { Events } from 'xgplayer';
    import 'xgplayer/dist/index.min.css';
    import Mp4Plugin from 'xgplayer-mp4'
    import { mapState, mapGetters, mapActions } from 'vuex'

    export default {
        name: 'jvideo',
        props: {
            index: { type: Number, default: null },
            propstocomponent: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: function () { return {} } },
            modelValue: { type: String, default: null }
        },
        data () {
            return {
                ref: this.$root.componentRefs ? this.$root.componentRefs : {}, // 组件的地址
                Mp4Plugin,
                componentName: null,
                player: null, // 播放器实例
                option: { // 播放器配置
                    autoplay: false,
                    volume: 0.3,
                    playsinline: true,
                    draggable: true,
                    height: 400,
                    width: 600,
                    waterMark: {}
                },
                data: {
                    currentTime: 0, // 当前播放时间
                    videoLength: 0, // 视频总长度
                    studyPoint: 0, // 学习点
                    dragStatus: false// 是否拖拽状态

                },
                tempdata: {}
            }
        },
        methods: {
            async init () {
                const option = this.option
                let newoption = {}
                if (this.configdata.initMethod) newoption = await this.commonsJs.funcEval(this, {}, this.configdata.initMethod)
                if (newoption) Object.assign(option, newoption)
                option.url = this.modelValue
                this.player = new Player({ ...option, id: this.configdata.blm });
                if (this.configdata.valueChange) await this.commonsJs.funcEval(this, {}, this.configdata.valueChange)
                // 获取视频总市场
                this.player.on('durationchange', () => {
                    const duration = this.player.duration; // 获取视频总长度（单位：秒）
                    this.data.videoLength = duration
                });

                // 监听用户的播放进度
                this.player.on(Events.TIME_UPDATE, (e) => {
                    this.data.currentTime = e.currentTime
                    if (!this.data.dragStatus && e.currentTime > this.data.studyPoint && e.currentTime < this.data.studyPoint + 2) {
                        this.data.studyPoint = e.currentTime;
                    }
                    if (this.option.timeUpdate) this.commonsJs.funcEval(this, { e }, this.option.timeUpdate)
                })

                if (!this.option.draggable) {
                    this.player.usePluginHooks('progress', 'dragstart', (plugin, event, data) => {
                        this.data.dragStatus = true;
                        if (data.currentTime > this.data.studyPoint) return false
                        return true
                    })

                    this.player.usePluginHooks('progress', 'dragend', (plugin, event, data) => {
                        this.data.dragStatus = false
                        if (data.seekTime > this.data.studyPoint) {
                            setTimeout(() => {
                                this.player.seek(data.prePlayTime)
                            }, 10)
                        }
                    })
                }
                this.player.on(Events.ENDED, (e) => {
                    this.playEnd()
                })
            },

            playEnd () {
                if (!this.data.dragStatus) {
                    // 执行完成方法
                    if (this.option.playEnd) this.commonsJs.funcEval(this, {}, this.option.playEnd)
                }
            }
        },
        mounted () { },
        watch: {
            modelValue: {
                handler (n, o) {
                    if (n) {
                        this.$nextTick(() => { this.init() })
                    }
                },
                deep: true,
                immediate: true
            },
            componentName: {
                handler (n, o) {
                    if (n) {
                        if (this.$root.componentRefs) this.$root.componentRefs[this.componentName] = this
                    }
                },
                deep: true,
                immediate: true
            },
            configdata: {
                handler (n, o) {
                    if (this.configdata.blm) {
                        this.componentName = n.blm + (this.index ? this.index : '')
                        if (this.$root.componentRefs) this.$root.componentRefs[this.componentName] = this
                        if (this.configdata.createClass) this.commonsJs.loadCssCode(this.configdata.createClass, n.blm)
                        if (n.configdataChangeMethod) this.commonsJs.funcEval(this, {}, n.configdataChangeMethod)
                    }
                },
                deep: true,
                immediate: true
            }
        },
        computed: {
            ...mapState('admin/user', ['info'])
        },
        beforeDestroy () {
            if (this.$root.componentRefs) delete this.$root.componentRefs[this.configdata.blm]
            const styleClass = document.getElementById('style-' + this.configdata.blm)
            if (styleClass) styleClass.remove()
        }
    }
</script>
<style></style>
