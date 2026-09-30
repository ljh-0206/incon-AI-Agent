<!-- 水印watermark.vue -->
<template>
  <div class="watermark" ref="watermark"></div>
</template>

<script>
    export default {
        name: 'jwatermark',
        props: {
            modelValue: {
                type: String,
                default: ''
            }
        },
        data () {
            return {
                config: {
                    color: '#000',
                    rotate: 0
                }
            }
        },
        watch: {
            modelValue: {
                handler (val) {
                    if (val) {
                        this.renderWatermark(val);
                    } else {
                        this.removeWatermark();
                    }
                },
                immediate: true
            }
        },
        mounted () {
            if (this.modelValue) {
                this.renderWatermark(this.modelValue);
            }
        },
        unmounted () {
            this.removeWatermark();
        },
        methods: {
            createWatermark () {
                // 创建水印
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const ratio = window.devicePixelRatio || 1;
                // 设置文本
                ctx.font = '14px Arial';
                ctx.fillStyle = this.config.color || 'rgba(0, 0, 0, 0.1)';
                ctx.rotate = -this.config.rotate * Math.PI / 180 || 0;

                // 文本重复铺满屏幕
                const textWidth = ctx.measureText(this.modelValue).width || 100;
                const textHeight = 20;
                const rows = Math.ceil(window.innerHeight / textHeight) + 2;
                const cols = Math.ceil((window.innerWidth / textWidth) * ratio) + 2;

                // 绘制水印
                for (let i = 0; i < rows; i++) {
                    for (let j = 0; j < cols; j++) {
                        const x = j * textWidth + (i % 2 === 0 ? 0 : textWidth / 2);
                        const y = i * textHeight;
                        // 绘制单个水印
                        ctx.fillText(this.modelValue, x, y);
                    }
                }

                // 将canvas转为DataURL
                return canvas.toDataURL('image/png');
            },
            renderWatermark (value) {
                const base64Url = this.createWatermark();
                const watermarkEl = this.$refs.watermark;
                if (watermarkEl && base64Url) {
                    watermarkEl.style.backgroundImage = `url(${base64Url})`;
                }
            },
            removeWatermark () {
                const watermarkEl = this.$refs.watermark;
                if (watermarkEl) {
                    watermarkEl.style.backgroundImage = null;
                }
            }
        }
    }
</script>

<style scoped>
.watermark {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    pointer-events: none;
    background-repeat: repeat;
}
</style>
