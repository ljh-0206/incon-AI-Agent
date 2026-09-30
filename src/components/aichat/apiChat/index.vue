<template>
	<Modal :model-value="showAi" fullscreen :closable="false" :footer-hide="true">
		<div ref="myAibox" style="height: 100%">
			<Icon type="md-close-circle" size="32" class="float-right cursor-pointer" style="margin-top: 0;"
				@click="$emit('cancel')" />
			<div class="aichat">
				<Chat v-if="showAi" :kcid="kcid" :ktxx="ktxx" :propskcid="kcid" :height="heightKg - 50 + 'px'"
					:xsst="xsst" :kcmc="kcmc"></Chat>
			</div>
		</div>
	</Modal>
</template>
<script>
    import Chat from '../chatliu/index.vue'

    import { mapState, mapActions } from 'vuex'

    export default {
        name: 'apichat',
        components: {
            Chat
        },
        provide () {
            return {
                kcmc: this.kcmc
            }
        },
        props: {
            height: {
                type: Number,
                default: 800
            },
            maxlength: {
                type: Number,
                default: 800
            },
            kcid: {
                type: String,
                default: ''
            },
            showWordLimit: {
                type: Boolean,
                default: true
            },
            kcmc: {
                type: String,
                default: ''
            },
            showAi: {
                type: Boolean,
                default: true
            }
        },
        data () {
            return {
                env: process.env.NODE_ENV,
                sflx: null,
                xsst: null,
                tabPane: ['AI问答'],
                tabsValue: 'chat',
                ailist: [],
                heightKg: 600,
                ktxx: {}
            }
        },
        watch: {
            xsst: {
                handler (newValue, oldValue) {
                    this.tabPane = ['AI问答'];
                    return;
                    if (newValue) {
                        this.tabPane = ['AI问答', '问答历史']
                    } else {
                        this.tabPane = ['小航学伴', '学生问答']
                    }
                },
                deep: true,
                immediate: true
            },
            showAi: {
                handler (newName, oldName) {
                    if (newName) {
                        this.$nextTick(() => {
                            this.heightKg = this.$refs.myAibox.clientHeight;
                        });
                    }
                },
                deep: true,
                immediate: true
            }
        },
        computed: {
            ...mapState('admin/user', ['info'])
        },
        created () {
            this.getSflx();
        },
        mounted () {
            window.addEventListener('UPDATEKTXX', (event) => {
                this.ktxx = event.detail;
            });
        },
        methods: {
            clickTabs (name) {
                if (this.tabPane.indexOf(name) == -1) {
                    // this.tabPane.push(name)
                }
            },
            goZstp () {
                this.$router.push({
                    path: '/builder/' + this.kcid
                })
            },
            getSflx () {
                const routeSfxsst = this.$route.query.sfxsst
                return
                this.mGet('/kc/queryYhSflx', { kcid: this.kcid }).then(res => {
                    console.log(res, '--------getSflx res--------');
                    this.sflx = res;
                    if (res == 1 || res == 3) {
                        if (routeSfxsst && routeSfxsst == '1') {
                            this.xsst = true;
                        } else {
                            this.xsst = false
                        }
                    } else {
                        this.xsst = true
                    }
                    if (res == '-1') {
                        this.sfyqx = false
                    } else {
                        this.sfyqx = true
                    }
                })
            },

            mGet (url, params) {
                return this.commonsJs.request({
                    url,
                    method: 'GET',
                    params
                });
            }

        }
    }
</script>

<style lang="less">
.zstpBtn {
	position: absolute;
	right: 70px;
	top: 12px;
	z-index: 1;

}

.aichat {
	border: 1px solid #e4e7ed;
}
</style>
