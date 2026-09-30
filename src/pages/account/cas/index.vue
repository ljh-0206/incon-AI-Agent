<template>
    <div></div>
</template>
<script>
    import { mapActions } from 'vuex'
    import Setting from '@/setting';

    export default {
        data () {
            return {
            }
        },
        created () {
            const code = this.$route.query.code;
            const msg = this.$route.query.msg;
            const token = this.$route.query.token;
            if (code == 200) {
                localStorage.setItem('token' + '_' + Setting.xmid, token)
                this.casBackUrl(token);
            } else {
                this.$Modal.error({ title: '提示', content: '<p style="font-size: 18px;color: #ff5722;">' + msg + '</p>' });
            }
        },
        methods: {
            ...mapActions('admin/account', ['caslogin']),
            async casBackUrl (token) {
                try {
                    this.$Spin.show({
                        render: (h) => {
                            return h('div', '正在登录中...')
                        }
                    });
                    const data = await this.caslogin({ token });
                    this.$Spin.hide();
                    if (data) {
                        const path = localStorage.getItem('path' + '_' + Setting.xmid);
                        if (path) {
                            localStorage.removeItem('path' + '_' + Setting.xmid);
                            this.$router.replace(path)
                        } else {
                            this.$router.replace(this.$route.query.redirect || '/')
                        }
                    } else {
                        this.$Modal.error({ title: '提示', content: '<p style="font-size: 18px;color: #ff5722;">认证失败，请联系管理员检查登录账号是否存在</p>' });
                    }
                } catch (error) {
                    console.log(error)
                }
            }
        }
    }
</script>
