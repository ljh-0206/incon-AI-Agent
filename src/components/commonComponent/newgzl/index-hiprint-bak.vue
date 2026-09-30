<template>
    <Row>
        <Col span="24">
            <Button @click="print">打印</Button>
            <Button @click="test">test</Button>
        </Col>
        <Col span="6">
            <div class="flex-row justify-center flex-wrap">
                <div class="title">基础元素</div>
                <!-- tid 与 defaultElementTypeProvider 中对应 -->
                <!-- 包含 class="ep-draggable-item" -->
                <div class="ep-draggable-item item" tid="defaultModule.text">
                    <i class="iconfont sv-text" />
                    <span>文本</span>
                </div>
                <div class="ep-draggable-item item" tid="defaultModule.image">
                    <i class="iconfont sv-image" />
                    <span>图片</span>
                </div>
                <div class="ep-draggable-item item" tid="defaultModule.table">
                    <i class="iconfont sv-table" />
                    <span>表格</span>
                </div>
            </div>
        </Col>
        <Col span="12">

            <div class="flex-5 center">
            <!-- 设计器的 容器 -->
            <div id="hiprint-printTemplate"></div>
        </div>
        </Col>
        <Col span="6">
            <div class="aa">
            <div id="PrintElementOptionSetting"></div>
        </div>
        </Col>
    </row>
</template>
<script>

    import { hiprint, defaultElementTypeProvider } from 'vue-plugin-hiprint';
    hiprint.init({
        providers: [defaultElementTypeProvider()]
    });
    let hiprintTemplate
    export default {
        name: 'test',
        components: {},
        props: {
            index: { type: Number, default: null },
            propstocomponent: {
                type: Object,
                default: () => ({})
            },
            configdata: { type: Object, default: function () { return {} } },
            value: { type: String, default: '' },
            fathername: { type: String, default: '' }

        },
        data () {
            return {}
        },
        methods: {
            test () {
                async function aa () {
                    await console.log('abc')
                    const bb = 3
                    return bb
                }
                aa().then(res => {
                    console.log(res, 'res')
                })
            },
            /**
             * 构建左侧可拖拽元素
             * 注意: 可拖拽元素必须在 hiprint.init() 之后调用
             * 而且 必须包含 class="ep-draggable-item" 否则无法拖拽进设计器
             */
            buildLeftElement () {
                // eslint-disable-next-line no-undef
                hiprint.PrintElementTypeManager.buildByHtml($('.ep-draggable-item'));
            },
            buildDesigner () {
                // eslint-disable-next-line no-undef
                $('#hiprint-printTemplate').empty(); // 先清空, 避免重复构建
                hiprintTemplate = new hiprint.PrintTemplate({
                    settingContainer: '#PrintElementOptionSetting' // 元素参数容器
                });
                // 构建 并填充到 容器中
                hiprintTemplate.design('#hiprint-printTemplate');
            },
            print () {
                // 打印数据，key 对应 元素的 字段名
                const printData = { name: 'CcSimple' };
                // 参数: 打印时设置 左偏移量，上偏移量
                const options = { leftOffset: -1, topOffset: -1 }
                // 扩展
                const ext = {
                    callback: () => {
                        console.log('浏览器打印窗口已打开')
                    },
                    styleHandler: () => {
                        // 重写 文本 打印样式
                        return '<style>.hiprint-printElement-text{color:red !important;}</style>'
                    }
                }
                // 调用浏览器打印
                hiprintTemplate.print(printData, options, ext);
            }

        },
        watch: {},
        computed: {},
        mounted () {
            this.buildLeftElement();
            this.buildDesigner();
        },

        beforeDestroy () { }
    }
</script>
