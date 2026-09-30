<!--
 * @Author: lijiahao
 * @Date: 2022-04-08 13:04:25
 * @LastEditTime: 2022-04-11 14:09:43
 * @Msg: Nothing
-->
<template>
    <GlobalFooter class="i-copyright" :links="links" :copyright="copyright" />
</template>
<script>
    export default {
        name: 'i-copyright',
        data () {
            return {
                links: [{
                    title: '',
                    key: '',
                    href: '/',
                    blankTarget: true
                }],
                // copyright: 'Copyright © 2021 赢科项目配置平台3.0'
                copyright: ''
            }
        }
    }
</script>
<style lang="less">
    .i-copyright {
        flex: 0 0 auto;

        &-hidden {
            display: none;
        }
    }
</style>
