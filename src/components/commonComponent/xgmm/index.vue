<template>
    <div>
        <component footer-hide v-model="show" :is="propstocomponent.modalType" :title="propstocomponent.modalTitle"
            :width="propstocomponent.modalWidth" :class="'style-' + configdata.blm + ' ' + configdata.blm">
            <Form ref="form" :model="pwdobj" label-position="top" label-colon :rules="validateRules">
                <FormItem label="原密码" prop="ymm">
                    <Input v-model="pwdobj.ymm" type="password" password prefix="md-lock" placeholder="请输入原密码" />
                </FormItem>
                <FormItem label="新密码" prop="xmm">
                    <Input v-model="pwdobj.xmm" type="password" password prefix="md-lock" placeholder="请输入新密码" />
                </FormItem>
                <FormItem label="再次输入新密码" prop="xmm1">
                    <Input v-model="pwdobj.xmm1" type="password" password prefix="md-lock" placeholder="请再次输入新密码" />
                </FormItem>
            </Form>
            <Button type="primary" size="large" long @click="savexgmm">提交</Button>
        </component>
    </div>
</template>
<script>
    import { xgmm } from '@api/system';
    import { mapActions } from 'vuex';
    import Setting from '@/setting';
    export default {
        components: {},
        props: {
            propstody: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: () => ({ blm: 'xgmm' }) },
            // DOM 容器传入，供组件销毁后从 body 中移除
            incoEl: { type: Object, required: true }
        },
        data () {
            // 密码校验
            const pwdCheck = (rule, value, callback) => {
                const reg = /^(?![a-zA-Z]+$)(?![A-Z0-9]+$)(?![A-Z\W_!@#$%^&*`~()-+=]+$)(?![a-z0-9]+$)(?![a-z\W_!@#$%^&*`~()-+=]+$)(?![0-9\W_!@#$%^&*`~()-+=]+$)[a-zA-Z0-9\W_!@#$%^&*`~()-+=]{8,16}$/
                if (!reg.test(value)) {
                    return callback(new Error('密码长度须为8-16位，且必须含有字母、数字、特殊字符'));
                } else if (value == this.pwdobj.ymm) {
                    return callback(new Error('修改的新密码不能和原使用的密码相同'));
                } else {
                    callback()
                }
            };
            // 重复密码验证
            const pwdAgainCheck = async (rule, value, callback) => {
                if (value !== this.pwdobj.xmm) {
                    callback(new Error('两次输入的密码不匹配！'));
                } else {
                    callback();
                }
            };
            return {
                dyDom: null,
                componentName: 'xgmm_zj',
                propstocomponent: {
                    modalType: 'Modal',
                    modalTitle: '修改密码',
                    modalWidth: '600px'
                },
                show: false,
                pwdobj: {
                    ymm: '',
                    xmm: '',
                    xmm1: ''
                },
                validateRules: {
                    ymm: [{ required: true, message: '请输入原密码！', trigger: 'change' }],
                    xmm: [{ required: true, message: '密码不能为空！', trigger: 'change' }, { validator: pwdCheck, trigger: 'change' }],
                    xmm1: [{ required: true, message: '确认密码不能为空', trigger: 'change' }, { validator: pwdAgainCheck, trigger: 'change' }]
                }
            }
        },
        watch: {

        },
        methods: {
            ...mapActions('admin/account', ['logout']),
            open (obj, dyDom) {
                this.propstocomponent = { ...this.propstocomponent, ...obj }
                localStorage.setItem('token' + '_' + Setting.xmid, obj.token);
                this.show = true
                this.dyDom = dyDom
            },
            savexgmm () {
                this.$refs.form.validate((valid) => {
                    if (valid) {
                        this.$Spin.show();
                        const obj = {
                            ymm: this.commonsJs.encrypt(this.pwdobj.ymm),
                            xmm: this.commonsJs.encrypt(this.pwdobj.xmm)
                        }
                        xgmm(obj).then((res) => {
                            this.$Spin.hide();
                            if (res == '2') {
                                this.$Message.error('原密码输入不正确');
                                return;
                            }
                            if (res == '3') {
                                this.$Message.error('修改的新密码不能和原使用的密码相同');
                                return;
                            }
                            if (res == '1') {
                                this.show = false
                                this.$Message.success('修改密码成功');
                                // 销毁组件 - Vue 3 兼容
                                if (this.dyDom) {
                                    this.dyDom.unmount();
                                    if (this.incoEl && this.incoEl.parentNode) {
                                        this.incoEl.parentNode.removeChild(this.incoEl);
                                    }
                                    this.dyDom = null;
                                }
                                // 完成后退出
                                this.logout()
                            } else {
                                this.$Message.error('修改密码失败');
                            }
                        });
                    }
                })
            }
        },
        computed: {},
        mounted () {

        }
    }
</script>
