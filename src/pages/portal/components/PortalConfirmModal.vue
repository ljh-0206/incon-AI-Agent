<template>
    <Modal
        v-model="visible"
        width="400"
        :mask-closable="false"
        :closable="false"
        :transfer="true"
        class-name="portal-workflow-confirm"
    >
        <template #header>
            <div class="portal-workflow-confirm__header">
                <span class="portal-workflow-confirm__mark" aria-hidden="true">!</span>
                <h2 class="portal-workflow-confirm__title">{{ title }}</h2>
            </div>
        </template>

        <div class="portal-workflow-confirm__body">
            <p class="portal-workflow-confirm__content">{{ content }}</p>
        </div>

        <template #footer>
            <div class="portal-workflow-confirm__footer">
                <Button
                    class="portal-workflow-confirm__cancel"
                    :disabled="loading"
                    @click="onCancel"
                >
                    取消
                </Button>
                <Button
                    class="portal-workflow-confirm__confirm"
                    :type="confirmType"
                    :loading="loading"
                    @click="onConfirm"
                >
                    {{ confirmText }}
                </Button>
            </div>
        </template>
    </Modal>
</template>

<script>
    export default {
        name: 'PortalConfirmModal',

        props: {
            modelValue: {
                type: Boolean,
                default: false
            },
            title: {
                type: String,
                default: ''
            },
            content: {
                type: String,
                default: ''
            },
            confirmText: {
                type: String,
                default: '确认'
            },
            confirmType: {
                type: String,
                default: 'primary'
            },
            loading: {
                type: Boolean,
                default: false
            }
        },

        emits: ['update:modelValue', 'confirm'],

        computed: {
            visible: {
                get () {
                    return this.modelValue
                },
                set (value) {
                    this.$emit('update:modelValue', value)
                }
            }
        },

        methods: {
            onCancel () {
                this.visible = false
            },

            onConfirm () {
                this.$emit('confirm')
            }
        }
    }
</script>

<style scoped lang="less">
:global(.portal-workflow-confirm) {
    padding: 24px 16px;
    font-family: var(--font-body, "Microsoft YaHei", "微软雅黑", "PingFang SC", "Segoe UI", sans-serif);
}

:global(.portal-workflow-confirm .ivu-modal) {
    width: 400px !important;
    max-width: 100%;
    margin: 0 auto;
    top: 10vh;
}

:global(.portal-workflow-confirm .ivu-modal-content) {
    overflow: hidden;
    background: var(--c-paper-2, #F7EBDF);
    border: 1px solid var(--c-border, rgba(26, 20, 16, .12));
    border-radius: var(--r-md, 8px);
    box-shadow: var(--shadow-md, 0 8px 24px rgba(26, 20, 16, .12));
}

:global(.portal-workflow-confirm .ivu-modal-header) {
    padding: 20px 24px 16px;
    margin: 0;
    border-bottom: 1px solid var(--c-border, rgba(26, 20, 16, .12));
    background: transparent;
}

:global(.portal-workflow-confirm .portal-workflow-confirm__header) {
    display: flex;
    align-items: center;
    gap: 12px;
}

:global(.portal-workflow-confirm .portal-workflow-confirm__mark) {
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    display: grid;
    place-items: center;
    border: 1px solid var(--c-red-600, #992A18);
    border-radius: 50%;
    background: rgba(153, 42, 24, .08);
    color: var(--c-red-600, #992A18);
    font-family: var(--font-display, "Noto Serif SC", "Songti SC", SimSun, Georgia, serif);
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
}

:global(.portal-workflow-confirm .portal-workflow-confirm__title) {
    margin: 0;
    color: var(--c-ink, #1A1410);
    font-family: var(--font-display, "Noto Serif SC", "Songti SC", SimSun, Georgia, serif);
    font-size: 18px;
    font-weight: 700;
    line-height: 1.4;
    letter-spacing: .04em;
}

:global(.portal-workflow-confirm .ivu-modal-body) {
    padding: 20px 24px 22px;
}

:global(.portal-workflow-confirm .portal-workflow-confirm__body) {
    margin: 0;
}

:global(.portal-workflow-confirm .portal-workflow-confirm__content) {
    margin: 0;
    color: var(--c-ink-2, #3D342C);
    font-size: 14px;
    line-height: 1.75;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

:global(.portal-workflow-confirm .ivu-modal-footer) {
    padding: 0 24px 20px;
    border-top: 0;
}

:global(.portal-workflow-confirm .portal-workflow-confirm__footer) {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid var(--c-border, rgba(26, 20, 16, .12));
}

:global(.portal-workflow-confirm .ivu-btn) {
    min-width: 84px;
    min-height: 36px;
    margin: 0;
    border-radius: var(--r-md, 8px);
    box-shadow: none;
    font-weight: 600;
    transition: background var(--t-fast, 150ms ease), border-color var(--t-fast, 150ms ease), color var(--t-fast, 150ms ease), box-shadow var(--t-fast, 150ms ease);
}

:global(.portal-workflow-confirm .ivu-btn:focus-visible) {
    outline: 2px solid var(--c-ring, rgba(246, 156, 32, .55));
    outline-offset: 2px;
}

:global(.portal-workflow-confirm .portal-workflow-confirm__cancel.ivu-btn) {
    background: var(--c-paper, #EFE3D7);
    border-color: var(--c-ink-2, #3D342C);
    color: var(--c-ink-2, #3D342C);
}

:global(.portal-workflow-confirm .portal-workflow-confirm__cancel.ivu-btn:hover:not(:disabled)),
:global(.portal-workflow-confirm .portal-workflow-confirm__cancel.ivu-btn:focus-visible:not(:disabled)) {
    background: var(--c-paper-2, #F7EBDF);
    border-color: var(--c-ink, #1A1410);
    color: var(--c-ink, #1A1410);
}

:global(.portal-workflow-confirm .portal-workflow-confirm__confirm.ivu-btn.ivu-btn-primary),
:global(.portal-workflow-confirm .portal-workflow-confirm__confirm.ivu-btn.ivu-btn-error) {
    background: var(--c-red-600, #992A18);
    border-color: var(--c-red-600, #992A18);
    color: var(--c-paper-2, #F7EBDF);
}

:global(.portal-workflow-confirm .portal-workflow-confirm__confirm.ivu-btn.ivu-btn-primary:hover:not(:disabled)),
:global(.portal-workflow-confirm .portal-workflow-confirm__confirm.ivu-btn.ivu-btn-primary:focus-visible:not(:disabled)),
:global(.portal-workflow-confirm .portal-workflow-confirm__confirm.ivu-btn.ivu-btn-error:hover:not(:disabled)),
:global(.portal-workflow-confirm .portal-workflow-confirm__confirm.ivu-btn.ivu-btn-error:focus-visible:not(:disabled)) {
    background: var(--c-red-700, #7E2214);
    border-color: var(--c-red-700, #7E2214);
    color: var(--c-paper-2, #F7EBDF);
}

@media (max-width: 480px) {
    :global(.portal-workflow-confirm) {
        padding: 12px;
    }

    :global(.portal-workflow-confirm .ivu-modal) {
        top: 8vh;
    }

    :global(.portal-workflow-confirm .ivu-modal-header) {
        padding: 18px 18px 14px;
    }

    :global(.portal-workflow-confirm .ivu-modal-body) {
        padding: 16px 18px 18px;
    }

    :global(.portal-workflow-confirm .ivu-modal-footer) {
        padding: 0 18px 18px;
    }

    :global(.portal-workflow-confirm .portal-workflow-confirm__footer) {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    :global(.portal-workflow-confirm .portal-workflow-confirm__footer .ivu-btn) {
        width: 100%;
    }
}
</style>
