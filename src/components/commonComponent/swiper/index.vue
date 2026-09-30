<template>
    <div :class="'style-' + configdata.blm + ' ' + configdata.blm" :style="configdata.mainStyle">
        <Button v-if="env()" @click="test">swiper test</Button>
        <swiper
            ref="mySwiper"
            :modules="modules"
            v-bind="swiperOptions"
            v-if="data && data.length > 0"
            @swiper="onSwiper"
            @slideChange="onSlideChange"
        >
            <swiper-slide v-for='(item, index) in data' :key='index'>
                <div :style="computeStyle(item)" @click="itemclick(item)" class="swiper-slide-item">
                    <slot :row="item" :dataIndex="index"> </slot>
                </div>
            </swiper-slide>
            <div class="swiper-pagination"></div>
            <div class="swiper-button-prev"></div>
            <div class="swiper-button-next"></div>
        </swiper>
    </div>
</template>
<script>
    import { Swiper, SwiperSlide } from 'swiper/vue';
    import { Autoplay, Navigation, Pagination, EffectCards, EffectCube } from 'swiper/modules';
    import 'swiper/css';
    import 'swiper/css/navigation';
    import 'swiper/css/pagination';

    export default {
        name: 'jswiper',
        components: {
            Swiper,
            SwiperSlide
        },
        props: {
            index: { type: Number, default: null },
            propstocomponent: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: function () { return {} } },
            value: { type: Array, default: null }
        },
        data () {
            return {
                componentName: '',
                config: {
                    params: {
                        modify: 0.5,
                        translatewidth: 700,
                        scale: 5
                    },
                    option: {
                        autoplay: true,
                        loop: true,
                        navigation: true,
                        pagination: { clickable: true },
                        slidesPerView: 'auto',
                        watchSlidesProgress: true,
                        centeredSlides: true
                    }
                },
                data: [],
                tempdata: {},
                modules: [Autoplay, Navigation, Pagination, EffectCards, EffectCube]
            }
        },
        computed: {
            swiperOptions () {
                return {
                    autoplay: this.config.option.autoplay,
                    loop: this.config.option.loop,
                    slidesPerView: this.config.option.slidesPerView,
                    centeredSlides: this.config.option.centeredSlides,
                    pagination: this.config.option.pagination,
                    navigation: this.config.option.navigation
                }
            }
        },
        methods: {
            env () {
                let returnValue = false
                const str = localStorage.getItem('incoenv')
                if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1) returnValue = true
                return returnValue
            },
            test () {
            // test逻辑
            },
            computeStyle (item) {
                // 样式计算逻辑
                return {}
            },
            itemclick (item) {
                this.$emit('itemclick', item)
            },
            onSwiper (swiper) {
                this.swiperInstance = swiper
            },
            onSlideChange (swiper) {
            // 切换事件
            },
            getConfig (configdata) {
                if (configdata) {
                    this.componentName = configdata.blm
                    if (configdata.config) {
                        if (configdata.config.params) {
                            this.config.params = { ...this.config.params, ...configdata.config.params }
                        }
                        if (configdata.config.option) {
                            this.config.option = { ...this.config.option, ...configdata.config.option }
                        }
                    }
                }
            },
            getData () {
            // 数据获取逻辑
            }
        },
        watch: {
            configdata: {
                handler (newVal) {
                    this.getConfig(newVal)
                },
                deep: true,
                immediate: true
            },
            value: {
                handler (newVal) {
                    if (newVal) this.data = newVal
                },
                deep: true,
                immediate: true
            }
        },
        beforeUnmount () {
            if (this.swiperInstance) {
                this.swiperInstance.destroy()
            }
        }
    }
</script>
<style scoped>
.style-jswiper {
    width: 100%;
    height: 100%;
}
.swiper-slide-item {
    cursor: pointer;
}
</style>
