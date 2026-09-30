<template>
	<div class="text-black" style="font-size: 16px;" :class="wrapClass">
		<div ref="textRef" class="leading-relaxed break-words">
			<div class="sdsk" v-if="sdskText">
				<div class="sdsk-header">
					<div class="sdsk-title" @click="seeSdsk = !seeSdsk">
						<span>{{ reasoner ? '思考中...' : '思考完成' }}</span>
						<Icon type="ios-arrow-down" :class="`arrow ${seeSdsk ? '' : 'hiden'}`" />
					</div>
				</div>
				<div :class="`sdsk-text ${seeSdsk ? '' : 'hiden'}`">
					<div v-if="!asRawText" class="markdown-body " v-html="sdskText" />
					<div v-else class="whitespace-pre-wrap" v-text="sdskText" />
				</div>
			</div>
			<div v-if="!inversion">
				<div v-if="!asRawText" class="markdown-body" v-html="viewtext" />
				<div v-else class="whitespace-pre-wrap" v-text="viewtext" />
			</div>
			<div v-else class="whitespace-pre-wrap" v-text="viewtext" />
			<template v-if="loading && (!sdskText && !viewtext)">
				<span class="dark:text-white w-[4px] h-[20px] block animate-blink" />
			</template>
		</div>
	</div>
</template>
<script>
    import { computed, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue'
    import MarkdownIt from 'markdown-it'
    import mdKatex from '@traptitech/markdown-it-katex'
    import mila from 'markdown-it-link-attributes'
    import hljs from 'highlight.js'
    import { copyToClip } from '@/utils/copy.js'

    export default {
        props: {
            inversion: Boolean,
            error: Boolean,
            text: String,
            loading: Boolean,
            asRawText: Boolean,
            sdskText: String,
            reasoner: Boolean
        },
        data () {
            return {
                mdi: null,
                seeSdsk: false
            }
        },
        computed: {
            wrapClass () {
                return [
                    'text-wrap',
                    'min-w-[20px]',
                    'rounded-md',
                    'px-3 py-2',
                    this.inversion ? 'bg-stu' : 'bg-tea',
                    this.inversion ? 'dark:bg-[#a1dc95]' : 'dark:bg-[#1e1e20]',
                    this.inversion ? 'message-request' : 'message-reply',
                    { 'text-red-500': this.error }
                ]
            },
            viewtext () {
                const value = this.text ? this.text : ''
                if (!this.asRawText) {
                    return this.mdi.render(value)
                }
                return value
            },
            sdsk () {
                const value = this.sdskText ? this.sdskText : ''
                if (!this.asRawText) {
                    return this.mdi.render(value)
                }
                return value
            }
        },
        // 监听props的变化
        watch: {
            sdskText (newValue, oldValue) {
                this.seeSdsk = true;
            }
        },

        updated () {
            this.addCopyEvents();
        },
        created () {
            const _this = this
            let mdi;
            mdi = new MarkdownIt({
                html: false,
                linkify: true,
                highlight (code, language) {
                    const validLang = !!(language && hljs.getLanguage(language))
                    if (validLang) {
                        const lang = language || ''
                        return _this.highlightBlock(hljs.highlight(code, { language: lang }).value, lang)
                    }
                    return _this.highlightBlock(hljs.highlightAuto(code).value, '')
                }
            })
            this.mdi = mdi;
            this.mdi.use(mila, { attrs: { target: '_blank', rel: 'noopener' } })
            this.mdi.use(mdKatex, { blockClass: 'katexmath-block rounded-md p-[10px]', errorColor: ' #cc0000' })
        },
        mounted () {
            this.addCopyEvents();
        },
        methods: {
            addCopyEvents () {
                if (this.$refs.textRef) {
                    const copyBtn = this.$refs.textRef.querySelectorAll('.code-block-header__copy')
                    copyBtn.forEach((btn) => {
                        btn.addEventListener('click', () => {
                            const code = btn.parentElement ? btn.parentElement.nextElementSibling ? btn.parentElement.nextElementSibling.textContent : null : null
                            if (code) {
                                copyToClip(code).then(() => {
                                    btn.textContent = '复制成功'
                                    setTimeout(() => {
                                        btn.textContent = '复制代码'
                                    }, 1000)
                                })
                            }
                        })
                    })
                }
            },
            removeCopyEvents () {
                if (this.$refs.textRef) {
                    const copyBtn = this.$refs.textRef.querySelectorAll('.code-block-header__copy')
                    copyBtn.forEach((btn) => {
                        btn.removeEventListener('click', () => { })
                    })
                }
            },
            highlightBlock (str, lang) {
                return `<pre class="code-block-wrapper"><div class="code-block-header"><span class="code-block
			-header__lang">${lang}</span><span class="code-block-header__copy">复制代码</span></div><code class="hljs code-block-body ${lang}">${str}</code></pre>`
            },
            // 用于监听props的变化
            onTextChange (newValue, oldValue) {
                console.log('myProp changed from', oldValue, 'to', newValue);
            },
            handleCopy () {
                try {
                    copyToClip(this.text || '')
                    this.$Message.success('复制成功')
                } catch {
                    this.$Message.error('复制失败')
                }
            }
        }
    }

</script>

<style lang="less">
@tailwind components;
@tailwind utilities;
// @import '../../../style/lib/tailwind.css';
// @import '../../../style/lib/highlight.less';
// @import '../../../style/lib/github-markdown.less';
// @import '../../../style/global.less';
@import './style.less';

.bg-stu {
	background-color: rgb(210, 249, 209);
}

.bg-tea {
	background-color: rgb(244, 246, 248);
}
</style>
