<template>
    <!-- 门户一级壳（父路由组件）：公共顶栏 + v3 主题层（PortalLayout）+ 二级页面出口（router-view）。
         契约：/portal/* 的公共部分只在这里渲染一次，各门户页面不再自持 PortalLayout。
         作用：页间互切时壳不重建，body.page-portal-v3 只随「进出门户区」增删
         （此前每页各挂一次壳，离场页面卸载时会把它从 body 上删掉，导致切回首页整站样式丢失）。 -->
    <PortalLayout :solid="solid">
        <!-- 壳内缓存白名单：仅门户首页（保留其分屏 index 与内部滚动位置） -->
        <router-view v-slot="{ Component }">
            <keep-alive :include="portalKeepAlive">
                <component :is="Component" />
            </keep-alive>
        </router-view>
    </PortalLayout>
</template>

<script>
import PortalLayout from './PortalLayout.vue'

// 与 home/index.vue 的组件 name 一字不差；不要扩大为全部或按 meta 缓存
const PORTAL_KEEP_ALIVE = ['PortalV3Home']

export default {
    name: 'PortalShell',

    components: {
        PortalLayout
    },

    // 顶栏实底态由子页面回传（目前只有首页随分屏 index 变化）：注入同一对象，子页面直接调方法。
    // 注入可穿过 <router-view>，无需事件总线。
    provide () {
        return { portalShell: this.portalShellApi }
    },

    data () {
        return {
            // 顶栏实底态：默认实底（除首页首屏外，各门户页原本都传 solid: true），
            // 首页首屏由 home 页在 mount/activate 时回传 false 覆盖
            solid: true,
            portalKeepAlive: PORTAL_KEEP_ALIVE,
            // 壳接口：对象常驻，箭头函数捕获 data() 的 this（即组件实例）
            portalShellApi: {
                setSolid: (v) => { this.solid = !!v }
            }
        }
    },

    watch: {
        // 换页先把实底态复位为 true，子页面挂载/激活后再按自身需要覆盖。
        // 否则「首页首屏（透明顶栏）→ 其它门户页」会继承到透明顶栏。
        // 时序：本 watcher 属 pre-flush，早于子页面的 mounted / activated（post-flush）
        '$route.path' () {
            this.solid = true
        }
    }
}
</script>
