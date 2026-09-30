<template>
    <div></div>
</template>
<script>
    import { mapActions } from 'vuex'

    export default {
        data () {
            return {
            }
        },
        created () {
            const key = this.$route.query.key
            if (key) this.toTokenLogin(key);
            else this.$Modal.error({ title: '提示', content: '<p style="font-size: 18px;color: #ff5722;">认证失败，请检查登录账号是否存在</p>' });
        },
        methods: {
            ...mapActions('admin/account', ['tokenLogin']),
            async toTokenLogin (key) {
                try {
                    this.$Spin.show({
                        render: (h) => {
                            return h('div', '正在认证中，请稍后...')
                        }
                    });
                    const data = await this.tokenLogin({ key: decodeURIComponent(key) });
                    this.$Spin.hide();
                    if (data && data.token) {
                        this.$router.replace(this.$route.query.redirect || '/')
                    } else {
                        this.$Modal.error({ title: '提示', content: '<p style="font-size: 18px;color: #ff5722;">认证失败，请检查登录账号是否存在</p>' });
                    }
                } catch (error) {
                    console.log(error)
                }
            }
        }
    }
</script>
