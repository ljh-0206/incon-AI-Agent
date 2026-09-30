<template>
    <!-- 门户登录弹窗：顶栏「登录」按钮 / 受限操作 / 路由守卫通过 loginModalState 唤起
         登录逻辑与 src/pages/account/login/index.vue 完全一致（含验证码与 515 改密分支） -->
    <Modal
        v-model="visible"
        width="420"
        :transfer="true"
        :footer-hide="true"
        :mask-closable="false"
        class-name="portal-login-modal"
        @on-cancel="onCancel"
    >
        <!-- 标题：印章 + 衬线标题，贴合门户 v3 的绛红 / 宣纸气质 -->
        <template #header>
            <div class="portal-login-modal__header">
                <span class="portal-login-modal__seal" aria-hidden="true">赢科</span>
                <h2 class="portal-login-modal__title">登录</h2>
                <p class="portal-login-modal__subtitle">登录后继续使用赢科智能体平台</p>
            </div>
        </template>

        <div class="portal-login-modal__body">
            <Form ref="loginForm" :model="form" :rules="rules" class="portal-login-modal__form">
                <FormItem prop="username">
                    <Input
                        v-model="form.username"
                        size="large"
                        prefix="ios-contact"
                        placeholder="请输入用户名"
                        @on-enter="handleSubmit"
                    />
                </FormItem>
                <FormItem prop="password">
                    <Input
                        v-model="form.password"
                        type="password"
                        size="large"
                        prefix="ios-lock"
                        password
                        placeholder="请输入密码"
                        @on-enter="handleSubmit"
                    />
                </FormItem>
                <FormItem class="portal-login-modal__submit">
                    <Button
                        type="primary"
                        size="large"
                        long
                        :loading="loading"
                        @click="handleSubmit"
                    >
                        登录
                    </Button>
                </FormItem>
            </Form>
        </div>
    </Modal>
</template>

<script>
import { mapActions } from 'vuex'
import Setting from '@/setting'
import { loginModalState, closeLoginModal } from './loginModalState'

export default {
    name: 'PortalLoginModal',

    // success：登录成功后的通知（外层可选监听，用于刷新登录态相关数据）
    emits: ['success'],

    data () {
        return {
            form: {
                username: '',
                password: ''
            },
            rules: {
                username: [
                    { required: true, message: '请输入用户名', trigger: 'blur' }
                ],
                password: [
                    { required: true, message: '请输入密码', trigger: 'blur' }
                ]
            },
            loading: false
        }
    },

    computed: {
        // 开关直接读写全局状态；置 false 时统一走 closeLoginModal（顺带清空 redirect）
        visible: {
            get () {
                return loginModalState.visible
            },
            set (value) {
                if (!value) closeLoginModal()
            }
        }
    },

    methods: {
        ...mapActions('admin/account', ['login']),

        /**
         * @description 登录（与 /login 页面同一套逻辑，勿改请求负载形状）
         */
        async handleSubmit () {
            const valid = await this.$refs.loginForm.validate()
            if (!valid) return

            try {
                this.loading = true
                let code = '123'
                if (Setting.loginWithCaptcha) {
                    code = await this.$captcha()
                }
                if (code) {
                    this.commonsJs.spin('正在登录，请稍后...', 'show', this)
                    this.login({
                        username: this.form.username,
                        password: this.commonsJs.encrypt(this.form.password),
                        code
                    }).then((res) => {
                        this.$Spin.hide()
                        this.loading = false
                        switch (res.code) {
                        case 200:
                            // 成功：先取下 redirect（关弹窗会清空它），再关闭弹窗并跳转
                            {
                                const target = loginModalState.redirect
                                closeLoginModal()
                                this.$emit('success')
                                // 登录后只落在门户内：捕获到的门户路径优先，其余（含后台页）一律回门户首页
                                const landing = (target && target.indexOf('/portal/') === 0) ? target : '/portal/home'
                                const result = this.$router.replace(landing)
                                if (result && typeof result.catch === 'function') result.catch(() => { })
                            }
                            break
                        case 515:
                            // 密码强度不够
                            this.$Modal.error({ title: '提示', content: '<p style="font-size: 18px;color: #ff5722;">' + res.msg + '</p>' })
                            this.$xgmm({ token: res.token })
                            break
                        default:
                            // 其他错误
                            this.$Modal.error({ title: '提示', content: '<p style="font-size: 18px;color: #ff5722;">' + res.msg + '</p>' })
                            break
                        }
                    }).catch(() => {
                        this.$Spin.hide()
                        this.loading = false
                    })
                } else {
                    this.loading = false
                }
            } catch (e) {
                this.loading = false
                console.error('登录错误:', e)
            }
        },

        // 关闭弹窗（右上角关闭按钮 / Esc 触发 Modal 的 close → on-cancel）：复位表单与 loading
        onCancel () {
            this.loading = false
            if (this.$refs.loginForm) this.$refs.loginForm.resetFields()
        }
    }
}
</script>

<style scoped lang="less">
/* ══ 门户登录弹窗皮肤（transfer 到 body，靠 body.page-portal-v3 的 token）══ */
:global(.portal-login-modal) {
    font-family: var(--font-body, "Microsoft YaHei", "微软雅黑", "PingFang SC", "Segoe UI", sans-serif);
}

:global(.portal-login-modal .ivu-modal) {
    width: 420px !important;
    max-width: 100%;
    margin: 0 auto;
    top: 12vh;
}

:global(.portal-login-modal .ivu-modal-content) {
    overflow: hidden;
    background: var(--c-paper-2, #F7EBDF);
    border: 1px solid var(--c-border, rgba(26, 20, 16, .12));
    border-radius: var(--r-md, 8px);
    box-shadow: var(--shadow-lg, 0 16px 40px rgba(26, 20, 16, .16));
}

:global(.portal-login-modal .ivu-modal-header) {
    padding: 28px 32px 18px;
    margin: 0;
    border-bottom: 1px solid var(--c-border, rgba(26, 20, 16, .12));
    background: transparent;
}

:global(.portal-login-modal .ivu-modal-header p),
:global(.portal-login-modal .ivu-modal-header-inner) {
    padding: 0;
    white-space: normal;
}

:global(.portal-login-modal .ivu-modal-close) {
    top: 14px;
    right: 12px;
}

:global(.portal-login-modal .ivu-modal-close .ivu-icon-ios-close) {
    color: var(--c-muted, #8C847E);
    transition: color var(--t-fast, 150ms ease);
}

:global(.portal-login-modal .ivu-modal-close:hover .ivu-icon-ios-close) {
    color: var(--c-red-600, #992A18);
}

:global(.portal-login-modal .portal-login-modal__header) {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--s2, 8px);
    text-align: center;
}

:global(.portal-login-modal .portal-login-modal__seal) {
    width: 44px;
    height: 44px;
    margin-bottom: var(--s1, 4px);
    display: grid;
    place-items: center;
    border: 2px solid var(--c-gold-500, #F69C20);
    border-radius: 50%;
    background: var(--c-red-glass, rgba(191, 52, 30, .25));
    color: var(--c-gold-500, #F69C20);
    font-family: var(--font-display, "Noto Serif SC", "Songti SC", SimSun, Georgia, serif);
    font-size: 12px;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: .12em;
}

:global(.portal-login-modal .portal-login-modal__title) {
    margin: 0;
    color: var(--c-ink, #1A1410);
    font-family: var(--font-display, "Noto Serif SC", "Songti SC", SimSun, Georgia, serif);
    font-size: 22px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: .12em;
}

:global(.portal-login-modal .portal-login-modal__subtitle) {
    margin: 0;
    color: var(--c-muted, #8C847E);
    font-size: 12px;
    line-height: 1.6;
    letter-spacing: .04em;
}

:global(.portal-login-modal .ivu-modal-body) {
    padding: 24px 32px 28px;
}

:global(.portal-login-modal .portal-login-modal__form .ivu-form-item) {
    margin-bottom: 18px;
}

:global(.portal-login-modal .portal-login-modal__form .ivu-form-item-error-tip) {
    padding-top: 4px;
    font-size: 12px;
    color: var(--c-red-600, #992A18);
}

/* 输入框：宣纸底 + 绛红聚焦环 */
:global(.portal-login-modal .ivu-input) {
    height: 44px;
    padding: 0 12px;
    background: var(--c-paper, #EFE3D7);
    border-color: var(--c-border, rgba(26, 20, 16, .12));
    border-radius: var(--r-md, 8px);
    color: var(--c-ink, #1A1410);
    font-size: 15px;
    transition: border-color var(--t-fast, 150ms ease), box-shadow var(--t-fast, 150ms ease), background var(--t-fast, 150ms ease);
}

:global(.portal-login-modal .ivu-input::placeholder) {
    color: var(--c-muted, #8C847E);
}

:global(.portal-login-modal .ivu-input:hover) {
    border-color: var(--c-red-600, #992A18);
}

:global(.portal-login-modal .ivu-input:focus) {
    background: var(--c-white, #FFFFFF);
    border-color: var(--c-red-600, #992A18);
    box-shadow: 0 0 0 3px var(--c-red-100, rgba(153, 42, 24, .12));
}

:global(.portal-login-modal .ivu-input-prefix i) {
    color: var(--c-muted, #8C847E);
}

:global(.portal-login-modal .ivu-input-prefix) {
    width: 34px;
}

:global(.portal-login-modal .ivu-input-with-prefix) {
    padding-left: 38px;
}

:global(.portal-login-modal .ivu-form-item-error .ivu-input) {
    border-color: var(--c-red-500, #A31A0B);
}

/* 提交按钮：绛红实底，hover 加深 */
:global(.portal-login-modal .portal-login-modal__submit) {
    margin-top: var(--s5, 20px);
    margin-bottom: 0;
}

:global(.portal-login-modal .portal-login-modal__submit .ivu-btn) {
    min-height: 46px;
    border-radius: var(--r-md, 8px);
    font-family: var(--font-display, "Noto Serif SC", "Songti SC", SimSun, Georgia, serif);
    font-size: 17px;
    font-weight: 700;
    letter-spacing: .16em;
    text-indent: .16em;
    box-shadow: none;
}

:global(.portal-login-modal .portal-login-modal__submit .ivu-btn-primary) {
    background: var(--c-red-600, #992A18);
    border-color: var(--c-red-600, #992A18);
    color: var(--c-paper-2, #F7EBDF);
}

:global(.portal-login-modal .portal-login-modal__submit .ivu-btn-primary:hover:not(:disabled)),
:global(.portal-login-modal .portal-login-modal__submit .ivu-btn-primary:focus-visible:not(:disabled)) {
    background: var(--c-red-700, #7E2214);
    border-color: var(--c-red-700, #7E2214);
    color: var(--c-paper-2, #F7EBDF);
}

:global(.portal-login-modal .portal-login-modal__submit .ivu-btn:focus-visible) {
    outline: 2px solid var(--c-ring, rgba(246, 156, 32, .55));
    outline-offset: 2px;
}

@media (max-width: 480px) {
    :global(.portal-login-modal) {
        padding: 12px;
    }

    :global(.portal-login-modal .ivu-modal) {
        top: 8vh;
    }

    :global(.portal-login-modal .ivu-modal-header) {
        padding: 22px 20px 16px;
    }

    :global(.portal-login-modal .ivu-modal-body) {
        padding: 20px 20px 24px;
    }
}
</style>
