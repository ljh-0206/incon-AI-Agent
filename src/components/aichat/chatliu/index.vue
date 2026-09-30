<template>
	<div class="flex flex-col w-full h-full" :style="{ height }">
		<main class="flex-1 overflow-hidden">
			<vue-scroll ref="myScroll">
				<div id="scrollRef" ref="scrollRef" class="h-full overflow-hidden overflow-y-auto">
					<div id="image-wrapper" class="w-full max-w-screen-xl m-auto dark:bg-[#101014]" :class="['p-4']">
						<template v-if="dataSources.length">
							<div>
								<Message v-for="(item, index) of dataSources" :key="index" :date-time="item.dateTime"
									:text="item.text" :inversion="item.inversion" :error="item.error"
									:loading="item.loading" @regenerate="onRegenerate(index)"
									@delete="handleDelete(index)" :reasoner="item.reasoner" :sdskText="item.sdskText" />
							</div>
						</template>
					</div>
				</div>
			</vue-scroll>
		</main>
		<footer :class="footerClass">
			<div class="w-full max-w-screen-xl m-auto">
				<div class="sticky bottom-0 left-0 flex justify-center">
					<Button v-if="loading" type="warning" @click="handleStop">
						<template #icon>
							<SvgIcon icon="ri:stop-circle-line" />
						</template>
						停止
					</Button>
				</div>
				<div :class="langShow ? 'visi language' : 'language'">
					<Input v-model="language" placeholder="请输入问题环境" :disabled="loading" />
				</div>
				<div class="flex items-center justify-between space-x-2">
					<Input ref="inputRef" class="inputRef" v-model="prompt" type="textarea" :maxlength="maxlength"
						placeholder='来说点什么吧...' :disabled="loading" :autosize="{ minRows: 4, maxRows: 8 }" />
				</div>
				<div class="option-btn">
					<div class="show-word-limit" :style="{ visibility: showWordLimit ? 'initial' : 'hidden' }">
						{{ prompt.length }}/{{ maxlength }}
					</div>
					<div>
						<Button type="text" @click="handleClear">清空</Button>
						<Button class="handleSubmit" type="primary" :disabled="buttonDisabled" @click="handleSubmit"
							size="large">
							发送
						</Button>
					</div>
				</div>
				<div class="flex">
					<div class="feedback" v-if="showEvaluate && xsst">
						<Button @click="feedback('1')" type="primary" :disabled="loading">答案很满意</Button>
						<Button @click="feedback('2')" type="primary" :disabled="loading">答案不满意</Button>
						<Button type="primary" @click="handleClear"
							v-if="evaluate && !showEvaluate && dataSources.length && xsst" :disabled="loading">
							换一个问题
						</Button>
					</div>
				</div>
			</div>
		</footer>
	</div>
</template>
<script>
    import Message from './components/Message/index.vue'
    import HeaderComponent from './components/Header/index.vue'
    import { fetchApiChatProcess, feedbackEvaluate } from '@/api/aichat'
    import eventSourceFun from '@/plugins/request/eventSource.js'

    import { v4 as uuidv4 } from 'uuid';
    import { mapState, mapActions } from 'vuex'

    export default {
        name: 'apichat',
        components: {
            Message,
            HeaderComponent
        },
        props: {
            height: {
                type: String,
                default: '800px'
            },
            maxlength: { // 最大输入长度
                type: Number,
                default: 800
            },
            kcid: { // 课程id
                type: String,
                default: ''
            },
            showWordLimit: { // 是否显示字数限制
                type: Boolean,
                default: true
            },
            xsst: { // 学生视图true，教师视图false
                type: Boolean,
                default: true
            },
            kcmc: { // 课程名称
                type: String,
                default: ''
            },
            ktxx: { // 课程栏目id
                type: Object,
                default: () => {
                    return {
                        kcmlid: ''
                    }
                }
            }
        },
        data () {
            return {
                // chatStore: useApiChatStore(),
                uuid: uuidv4(),
                newuuid: uuidv4(),
                // dataSources: [],
                prompt: '',
                functionValue: false,
                loading: false,
                showEvaluate: false,
                evaluate: '',
                evaluateType: '1',
                language: '',
                langShow: false,
                footerClass: ['p-4'],
                controller: new AbortController(),
                eventSource: null,
                lastText: '',
                sdskText: '',
                reasoner: false
            }
        },
        computed: {
            ...mapState('admin/user', ['info']), // 获取用户信息
            ...mapState('admin/apichat', ['chatList']), // 获取对话

            buttonDisabled () {
                return this.loading || !this.prompt || this.prompt.trim() === ''
            },
            dataSources () {
                return this.chatList
            }

        },
        created () {
            this.empty();
        },
        mounted () {
            this.$refs.inputRef.focus();
            // this.kcid = '8f1e75ea-97c8-4292-b9ed-246b729ba3ef'
            this.getChatList(this.kcid);
            this.$nextTick(() => {
                this.scrollToBottom()
            })
        },
        methods: {
            ...mapActions('admin/apichat', ['getChatList', 'addChat', 'clearChatList', 'updateChat']),
            handleSubmit () {
                this.onConversation()
            },
            languageShow () {
                this.language = ''
                this.langShow = !this.langShow
            },
            scrollToBottom () {
                this.$nextTick(() => {
                    if (this.$refs.scrollRef) {
                        this.$refs.myScroll.scrollTo({ x: 0, y: this.$refs.scrollRef.scrollHeight }, 300);
                    }
                })
            },
            async onConversation () {
                const message = this.prompt
                // await requestCheckContent(content) // 敏感词校验
                if (this.loading) { return }
                if (!message || message.trim() === '') { return }
                this.addChat({
                    id: this.kcid,
                    chat: {
                        dateTime: new Date().toLocaleString(),
                        text: message,
                        inversion: true,
                        error: false
                    }
                }
                )
                this.scrollToBottom()

                this.loading = true

                const options = {}

                // 添加用户回话信息
                this.addChat({
                    id: this.kcid,
                    chat: {
                        dateTime: new Date().toLocaleString(),
                        text: '',
                        loading: true,
                        inversion: false,
                        error: false
                    }
                })
                this.prompt = ''
                // 滚动屏幕到最低端
                this.scrollToBottom()
                const params = {
                    question: message,
                    startMessageId: this.newuuid,
                    // xh: this.info.yhdm,
                    name: this.info.xm,
                    kcid: this.kcid
                }
                this.xsst ? params.xh = this.info.yhdm : params.zgh = this.info.yhdm
                try {
                    // fetchApiChatProcess(params).then(data => {
                    // 	try {
                    // 		const text = data;
                    // 		this.updateChat({
                    // 			id: this.kcid,
                    // 			index: this.dataSources.length - 1,
                    // 			chat: {
                    // 				dateTime: new Date().toLocaleString(),
                    // 				// text: message + '``` javascript \/n console.log(222) ```',
                    // 				text: text,
                    // 				inversion: false,
                    // 				error: false,
                    // 				loading: true,
                    // 			},
                    // 		})
                    // 		this.showEvaluate = true
                    // 	}
                    // 	catch (error) {
                    // 		console.log(error)
                    // 	}
                    // }).catch((error) => {
                    // 	console.log(error, 'error');
                    // 	this.updateChat({
                    // 		id: this.kcid,
                    // 		index: this.dataSources.length - 1,
                    // 		chat: {
                    // 			dateTime: new Date().toLocaleString(),
                    // 			text: "好像出错了，请稍后再试。",
                    // 			inversion: false,
                    // 			error: false,
                    // 			loading: true,
                    // 		},
                    // 	})
                    // 	this.scrollToBottom()
                    // })
                    const url = '/chatgpt/chat/sse/send/question'
                    // let url = `http://192.168.2.26:28009/sse/question?question=${encodeURIComponent(message)}&startMessageId=${this.newuuid}&appid=101&kcid=${this.kcid}`
                    // this.xsst ? url += `&xh=${this.info.yhdm}` : url += `&zgh=${this.info.yhdm}`
                    // url += `&xh=${this.info.yhdm}`
                    const data = {
                        question: message,
                        startMessageId: this.newuuid,
                        appid: 101,
                        kcid: this.kcid,
                        kcmlid: this.ktxx.kcmlid
                    }
                    if (this.xsst) {
                        data.xh = this.info.yhdm
                    } else {
                        data.zgh = this.info.yhdm
                    }
                    this.lastText = '';
                    this.sdskText = '';
                    this.eventSource = eventSourceFun({
                        url,
                        params: data,
                        callback: this.getData
                    })
                } catch (error) {
                    const errorMessage = error ? error.message : '好像出错了，请稍后再试。'

                    this.updateChat({
                        id: this.kcid,
                        index: this.dataSources.length - 1,
                        chat: {
                            dateTime: new Date().toLocaleString(),
                            text: errorMessage,
                            inversion: false,
                            error: false,
                            loading: true
                        }
                    })
                    this.scrollToBottom()
                } finally {
                    // this.loading = false
                }
            },

            getData (e) {
                if (e.data.indexOf('result') != -1) {
                    const data = JSON.parse(e.data)[0].result;
                    if (data == '[DONE]') {
                        this.handleStop();
                        this.showEvaluate = true
                    } else {
                        if (data.indexOf('<think>') !== -1 || data.indexOf('</think>') !== -1) {
                            // 替换
                            this.sdskText += data.replace(/<think>/g, '').replace(/<\/think>/g, '');
                            this.reasoner = !this.reasoner;
                        } else if (this.reasoner) {
                            this.sdskText += data;
                        } else {
                            this.lastText += data;
                        }
                        this.updateChat({
                            id: this.kcid,
                            index: this.dataSources.length - 1,
                            chat: {
                                dateTime: new Date().toLocaleString(),
                                text: this.lastText,
                                sdskText: this.sdskText,
                                inversion: false,
                                reasoner: this.reasoner,
                                error: false,
                                loading: true
                            }
                        })

                        this.scrollToBottom();
                    }
                }
            },
            handleClear () {
                if (this.loading && this.dataSources.length) { return }

                this.$Modal.confirm({
                    title: '清空记录',
                    content: '是否清空当前聊天记录？',
                    okText: '是',
                    cancelText: '否',
                    onOk: () => {
                        this.empty()
                        this.newuuid = uuidv4();
                        this.showEvaluate = false
                        this.$Message.success({
                            content: '操作成功'
                        });
                    },
                    onCancel: () => {
                    }
                });
            },
            async empty () {
                await this.clearChatList(this.kcid)
                this.infoAddChat()
            },
            infoAddChat () {
                console.log(this.xsst, 'xsst');
                this.addChat({
                    id: this.kcid,
                    chat: {
                        dateTime: new Date().toLocaleString(),
                        text: `${this.info.xm}${this.xsst ? '同学' : '老师'}，您好！关于${this.kcmc}课程，“AI助教”有什么可以帮助您的吗？`,
                        loading: false,
                        inversion: false,
                        error: false
                    }
                })
            },
            handleEnter (event) {
                event.preventDefault()
                this.handleSubmit()
            },
            async feedback (type) {
                this.evaluate = type

                if (this.dataSources.length > 1) {
                    await feedbackEvaluate({
                        startMessageId: this.newuuid,
                        xh: this.info.yhdm,
                        name: this.info.xm,
                        kcid: this.kcid,
                        studentjudge: type,
                        kcmlid: this.ktxx.kcmlid
                    }).then(() => {
                        this.$Message.success('评价成功')
                    }).catch(() => {
                        this.$Message.error('评价失败')
                    })
                }

                this.showEvaluate = false
                // if (type == '2') {
                //   empty();
                // }
            },
            handleStop () {
                if (this.loading) {
                    this.updateChat({
                        id: this.kcid,
                        index: this.dataSources.length - 1,
                        chat: {
                            dateTime: new Date().toLocaleString(),
                            text: this.lastText,
                            sdskText: this.sdskText,
                            inversion: false,
                            reasoner: this.reasoner,
                            error: false,
                            loading: false
                        }
                    })
                    this.lastText = '';
                    this.sdskText = '';
                    this.controller.abort();
                    if (this.eventSource) {
                        this.eventSource.abort();
                    }
                    this.loading = false
                }
            }

        }

    }

</script>

<style lang="less">
#image-wrapper {
	max-width: 100%;
}

.language {
	width: 50%;
	margin-bottom: 10px;
	visibility: hidden;

	&.visi {
		visibility: visible;
	}
}

#languageBtn {
	font-size: 26px;
	margin-left: 20px;
	cursor: pointer;
}

.inputRef {
	textarea {
		resize: none;
	}
}

.option-btn {
	margin-top: 10px;
	display: flex;
	align-items: center;
	justify-content: space-between;

	.handleSubmit {
		width: 64px;
		height: 32px;
		margin-left: 5px;
		color: #fff;

		&[disabled] {
			color: #8e8e8e;
		}
	}

	.handleClear {
		width: 64px;
		height: 32px;
		display: inline-block;
		text-align: center;
		line-height: 32px;
	}
}

.feedback {
	display: flex;
	flex: 1;
	justify-content: space-around;
	align-items: center;

	button {
		// width: 172px;
	}
}
</style>
