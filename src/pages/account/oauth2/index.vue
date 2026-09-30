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
            const path = this.$route.query.path;
            if (path) localStorage.setItem('path' + '_' + Setting.xmid, path);
            this.toLogin(code);
        },
        methods: {
            ...mapActions('admin/account', ['oauth2Login']),
            async toLogin (code) {
                this.$Spin.show({
                    render: (h) => {
                        return h('div', '正在登录中...')
                    }
                });
                const res = await this.oauth2Login({ code });
                this.$Spin.hide();
                if (res.code == 200) {
                    const path = localStorage.getItem('path' + '_' + Setting.xmid);
                    if (path) {
                        localStorage.removeItem('path' + '_' + Setting.xmid);
                        this.$router.replace(path)
                    } else {
                        this.$router.replace(this.$route.query.redirect || '/')
                    }
                } else if (res.code == 302) {
                    window.location.href = res.msg;
                } else {
                    this.$Modal.error({ title: '提示', content: '<p style="font-size: 18px;color: #ff5722;">' + res.msg + '</p>' });
                }
            }
        }
    }
</script>
