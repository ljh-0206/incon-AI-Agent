<template>
	<div ref="messageRef" class="flex w-full mb-6 overflow-hidden" :class="[{ 'flex-row-reverse': inversion }]">
		<div class="flex items-center justify-center flex-shrink-0 h-8 overflow-hidden rounded-full basis-8"
			:class="[inversion ? 'ml-2' : 'mr-2']">
			<AvatarComponent :image="inversion" />
		</div>
		<div class="overflow-hidden text-sm " :class="[inversion ? 'items-end' : 'items-start']">
			<p class="text-xs text-[#b4bbc4]" :class="[inversion ? 'text-right' : 'text-left']">
				<!-- {{ dateTime }} -->
			</p>
			<div class="flex items-end gap-1 " :class="[inversion ? 'flex-row-reverse' : 'flex-row']">
				<TextComponent ref="textRef" :inversion="inversion" :error="error" :text="text" :loading="loading"
					:as-raw-text="asRawText" :sdskText="sdskText" :reasoner="reasoner" />
				<div class="flex flex-col" v-if="false">
					<button v-if="!inversion"
						class="mb-2 transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-300"
						@click="handleRegenerate">
						<SvgIcon icon="ri:restart-line" />
					</button>
					<!-- <Dropdown @on-click="handleSelect" :trigger="'click'" :placement="!inversion ? 'right' : 'left'">
						<a href="javascript:void(0)">
							<Icon type="md-more" />
						</a>
						<DropdownMenu slot="list">
							<DropdownItem name="copyText">
								<Icon type="ios-paper" />
								<span>复制</span>
							</DropdownItem>
						</DropdownMenu>
					</Dropdown> -->
				</div>
			</div>
		</div>
	</div>
</template>
<script>
    import { computed, ref } from 'vue'
    import AvatarComponent from './Avatar.vue'
    import TextComponent from './Text.vue'
    import { copyToClip } from '@/utils/copy.js'
    export default {
        props: {
            dateTime: String,
            text: String,
            inversion: Boolean,
            error: Boolean,
            loading: Boolean,
            sdskText: String,
            reasoner: Boolean
        },
        emits: ['delete',
                'regenerate'],
        components: {
            AvatarComponent,
            TextComponent
        },
        data () {
            return {
                asRawText: this.inversion
            }
        },
        methods: {
            handleRegenerate () {
                this.$refs.messageRef.scrollIntoView()
                emit('regenerate')
            },
            handleSelect (key) {
                switch (key) {
                case 'copyText':
                    this.handleCopy()
                    return
                case 'delete':
                    emit('delete')
                }
            },
            async handleCopy () {
                try {
                    await copyToClip(this.text || '')
                    this.$Message.success('复制成功')
                } catch (error) {
                    console.log(error);
                    this.$Message.error('复制失败')
                }
            }
        }
    }

</script>
<style lang="less"></style>
