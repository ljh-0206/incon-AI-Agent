<!--
 * @Author: lijiahao
 * @Date: 2022-04-09 16:47:15
 * @LastEditTime: 2022-04-09 16:47:39
 * @Msg: Vue 3 登录页面
-->
<template>
  <div class="page-account">
    <div v-if="showI18n" class="page-account-header">
      <i-header-i18n />
    </div>
    <div class="page-account-container">
      <div class="page-account-top">
        <div class="page-account-top-logo">
          <img :src="logoSrc" alt="logo">
        </div>
        <div class="page-account-top-desc">{{ $t('page.main.title') }}</div>
      </div>
      <Form ref="loginForm" :model="form" :rules="rules" class="login-form">
        <FormItem prop="username">
          <Input
            v-model="form.username"
            :placeholder="$t('page.login.username')"
            prefix="ios-contact"
            size="large"
            @on-enter="handleSubmit"
          />
        </FormItem>
        <FormItem prop="password">
          <Input
            v-model="form.password"
            type="password"
            :placeholder="$t('page.login.password')"
            prefix="ios-lock"
            size="large"
            password
            @on-enter="handleSubmit"
          />
        </FormItem>
        <FormItem>
          <Button type="primary" long size="large" :loading="loading" @click="handleSubmit">
            {{ $t('page.login.submit') }}
          </Button>
        </FormItem>
      </Form>
    </div>
    <i-copyright />
  </div>
</template>
<script>
    import iCopyright from '@/components/copyright'
    import {
        mapActions
    } from 'vuex'
    import mixins from '../mixins'
    import Setting from '@/setting'

    export default {
        mixins: [mixins],
        components: {
            iCopyright
        },
        data () {
            return {
                logoSrc: Setting.logoSrcId ? this.commonsJs.fileUrl + Setting.logoSrcId : require('@/assets/images/logo.png'),
                logoSmallSrc: Setting.logoSrcId ? this.commonsJs.fileUrl + Setting.logoSmallSrcId : require('@/assets/images/logo-small.png'),
                logoDarkSrc: Setting.logoSrcId ? this.commonsJs.fileUrl + Setting.logoDarkSrcId : require('@/assets/images/logo-dark.png'),
                form: {
                    username: '',
                    password: ''
                },
                rules: {
                    username: [
                        { required: true, message: this.$t('page.login.usernameRequired'), trigger: 'blur' }
                    ],
                    password: [
                        { required: true, message: this.$t('page.login.passwordRequired'), trigger: 'blur' }
                    ]
                },
                loading: false
            }
        },
        methods: {
            ...mapActions('admin/account', ['login', 'usernameLogin']),
            /**
             * @description 登录
             */
            async handleSubmit () {
                const valid = await this.$refs.loginForm.validate();
                if (!valid) return;

                try {
                    this.loading = true;
                    let code = '123'
                    if (Setting.loginWithCaptcha) {
                        code = await this.$captcha();
                    }
                    if (code) {
                        this.commonsJs.spin('正在登录，请稍后...', 'show', this);
                        this.login({
                            username: this.form.username,
                            password: this.commonsJs.encrypt(this.form.password),
                            code
                        }).then((res) => {
                            this.$Spin.hide();
                            this.loading = false;
                            switch (res.code) {
                            case 200:
                                // 成功
                                this.$router.replace(this.$route.query.redirect || '/');
                                break;
                            case 515:
                                // 密码强度不够
                                this.$Modal.error({ title: '提示', content: '<p style="font-size: 18px;color: #ff5722;">' + res.msg + '</p>' });
                                this.$xgmm({ token: res.token });
                                break;
                            default:
                                // 其他错误
                                this.$Modal.error({ title: '提示', content: '<p style="font-size: 18px;color: #ff5722;">' + res.msg + '</p>' });
                                break;
                            }
                        }).catch(() => {
                            this.$Spin.hide();
                            this.loading = false;
                        });
                    } else {
                        this.loading = false;
                    }
                } catch (e) {
                    this.loading = false;
                    console.error('登录错误:', e);
                }
            }
        },
        created () {

        }
    }
</script>
<style lang="less" scoped>
.login-form {
  margin-top: 20px;
}
</style>
