<template>
    <div class="markmap_sty">
        <div class="markmap_sty_top">
            <Button type="success" @click="downloadSvgToPng">
                下载思维导图
            </Button>
        </div>
        <div class="iview-mark" :style="ComputedStyle()">
            <div class="markmap_sty_main">
                <svg ref="svgRef" id="svgEle"></svg>
            </div>
        </div>
    </div>
</template>

<script>
    import { Transformer } from 'markmap-lib';
    import { Markmap } from 'markmap-view/dist/index.esm';
    import { mapState } from 'vuex'
    const transformer = new Transformer();
    // 显示思维导图组件
    export default {
        name: 'mindmap',
        props: {
            value: { type: [Object, Array, String, Number, Boolean] },
            configdata: { type: Object, default: () => ({}) },
            propstocomponent: { type: Object, default: () => ({}) },
            index: { type: Number, default: null },
            fathername: { type: String }
        },
        data () {
            return {
                ref: this.$root.componentRefs,
                mm: null
            };
        },
        computed: {

            ...mapState('admin/user', ['info']) // 获取用户信息
        },
        watch: {
            value: {
                handler (n, o) {
                    if (n) {
                        this.$nextTick(() => {
                            this.update()
                        })
                    }
                },
                deep: true,
                immediate: true
            }
        },
        mounted () {
        },
        methods: {
            test () {
                console.log(this.value, 'value from mindmap')
                console.log(this.ref[this.fathername].data, 'ref from mindmap')
            },
            ComputedStyle () {
                let style = { height: '400px' }
                if (this.configdata.style) style = { ...style, ...this.configdata.style }
                if (this.configdata.styleMethod) {
                    const newStyle = this.commonsJs.funcEval1(this, {}, this.configdata.styleMethod)
                    style = { ...style, ...newStyle }
                }
                return style
            },
            update () {
                if (!this.mm) {
                    this.mm = Markmap.create(this.$refs.svgRef);
                }
                if (this.value) {
                    const { root } = transformer.transform(this.value);
                    this.mm.setData(root);
                    this.mm.fit();
                } else {
                    this.mm.destroy()
                    this.mm = null;
                }
            },
            // 重新定位svg
            repositionSvg () {
                this.$nextTick(() => {
                    if (this.mm) { this.mm.fit(); }
                });
            },
            // 下载
            async downloadSvgToPng (
                $event,
                id = 'svgEle',
                name = 'svgImage',
                type = 'png'
            ) {
                await this.mm.fit();
                const svgNode = document.getElementById(id); // 获取svg元素
                const width = svgNode.clientWidth; // 获取宽度
                const height = svgNode.clientHeight; // 获取高度
                const serializer = new XMLSerializer();
                const source =
                    '<?xml version="1.0" standalone="no"?>\r\n' +
                    serializer.serializeToString(svgNode);
                const image = new Image();
                image.src =
                    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const context = canvas.getContext('2d');
                context.fillStyle = '#fff';
                context.fillRect(0, 0, 10000, 10000);
                image.onload = function () {
                    context.drawImage(image, 0, 0);
                    const a = document.createElement('a');
                    a.download = `${name}.${type}`;
                    a.href = canvas.toDataURL(`image/${type}`);
                    setTimeout(() => {
                        a.click();
                    }, 1000);
                };
            }
        }
    };
</script>
<style>
.markmap_sty {
    width: 100%;
    height: 100%;
    padding: 10px;
}

.iview-mark {
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
}

.markmap_sty_top {
    margin-bottom: 10px;
}

.markmap_sty_top .ivu-btn {
    margin-bottom: 10px;
}

#svgEle {
    height: 100%;
    width: 100%;
}

.markmap_sty_main {
    width: 100%;
    height: 100%;
}

.spin-icon-load {
    animation: ani-demo-spin 1s linear infinite;
}

@keyframes ani-demo-spin {
    from {
        transform: rotate(0deg);
    }

    50% {
        transform: rotate(180deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.spin-col {
    height: 100%;
    position: relative;
    border: 1px solid #eee;
}

.btn_cancel {
    margin-right: 10px;
}

#sjz {
    overflow-y: auto;
}

#sjz::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

/*正常情况下滑块的样式*/
#sjz::-webkit-scrollbar-thumb {
    background-color: #00c6f8;
    border-radius: 6px;
    -webkit-box-shadow: #00c6f8;
}

/*鼠标悬浮在该类指向的控件上时滑块的样式*/
#sjz:hover::-webkit-scrollbar-thumb {
    background-color: #00c6f8;
    border-radius: 6px;
    -webkit-box-shadow: #9ea3ff;
}

/*鼠标悬浮在滑块上时滑块的样式*/
#sjz::-webkit-scrollbar-thumb:hover {
    background-color: #9ea3ff;
    -webkit-box-shadow: #00c6f8;
}

/*正常时候的主干部分*/
#sjz::-webkit-scrollbar-track {
    border-radius: 6px;
    -webkit-box-shadow: #9ea3ff;
    background-color: #00c6f8;
}

/*鼠标悬浮在滚动条上的主干部分*/
#sjz::-webkit-scrollbar-track:hover {
    -webkit-box-shadow: #9ea3ff;
    background-color: #00c6f8;
}
</style>
