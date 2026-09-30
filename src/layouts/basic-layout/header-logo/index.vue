<template>
    <i-link class="i-layout-header-logo" :class="{ 'i-layout-header-logo-stick': !isMobile }" to="/">
        <img :src="logoSmallSrc" v-if="isMobile">
        <img :src="logoSrc" v-else-if="headerTheme === 'light'">
        <img :src="logoDarkSrc" v-else>
    </i-link>
</template>
<script>
    import { mapState } from 'vuex';
    import Setting from '@/setting'

    export default {
        name: 'iHeaderLogo',
        data () {
            return {
                logoSrc: Setting.logoSrcId ? this.commonsJs.fileUrl + Setting.logoSrcId : require('@/assets/images/logo.png'),
                logoSmallSrc: Setting.logoSrcId ? this.commonsJs.fileUrl + Setting.logoSmallSrcId : require('@/assets/images/logo-small.png'),
                logoDarkSrc: Setting.logoSrcId ? this.commonsJs.fileUrl + Setting.logoDarkSrcId : require('@/assets/images/logo-dark.png')
            }
        },
        computed: {
            ...mapState('admin/layout', [
                'isMobile',
                'headerTheme'
            ])
        }
    }
</script>
