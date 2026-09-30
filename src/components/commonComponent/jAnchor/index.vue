<template>
    <div :style="computeStyle()" :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <div v-for="(item,index) in value" :key="'anchor'+_uid+index" style="position:relative" class="itemClass"
            :class="{'active':actives==index}" @click="tabsAfn(index)">
            <div class="item-head" @click="onSelect(item.href)"></div>
            <div style="margin-left:25px" @click="onSelect(item.href)" class="item-content">{{item.title}}</div>
            <template v-for="(level1,index1) in item.children">
                <div v-if="item.children && item.children.length>0" style="position:relative" class="childitemClass"
                    :class="{'active':childactives==index1}" :key="'anchorchild'+_uid+index1"
                    @click.stop="tabsBfn(index1)">
                    <div class="childitem-head" @click="onSelect(level1.href)"></div>
                    <div class="childitem-content" @click="onSelect(level1.href)" style="margin-left:45px">
                        {{level1.title}}</div>
                </div>
            </template>

        </div>
    </div>
</template>
<script>

    export default {
        name: 'janchor',
        props: {
            fathername: { type: String, default: '' },
            value: {
                type: Array,
                default: () => []
            },
            attrs: {
                type: Object,
                default: () => ({})
            },
            propstocomponent: {
                type: Object,
                default: () => ({})
            },
            configdata: {
                type: Object,
                default: () => ({})
            }
        },
        data () {
            return {
                componentName: '',
                actives: null,
                childactives: null,
                tempdata: {}
            }
        },
        methods: {
            /**
             *
             * @param {*} code 是创建的class的代码
             */
            loadCssCode (code) {
                if (document.getElementById('style-' + this.componentName)) document.getElementById('style-' + this.componentName).remove()
                if (!document.getElementById('style-' + this.componentName)) {
                    const style = document.createElement('style');
                    style.type = 'text/css';
                    //   style.lang='less'
                    style.rel = 'stylesheet';
                    style.id = 'style-' + this.componentName
                    // for Chrome Firefox Opera Safari
                    style.appendChild(document.createTextNode(code));
                    // for IE
                    // style.styleSheet.cssText = code;
                    const head = document.getElementsByTagName('head')[0];
                    head.appendChild(style);
                }
            },
            test () {},
            computeStyle () {
                const style = { 'overflow-y': 'auto' }
                if (this.fathername) {
                    const modal_height = document.getElementById(this.fathername + '_formDiv');
                    const height = modal_height.offsetHeight;
                    style.height = height - 10 + 'px'
                }

                return style
            },
            onSelect (href) {
                if (href) {
                    const element = document.getElementById(href)
                    const iframes = document.getElementsByTagName('iframe');
                    if (iframes && iframes.length > 0) {
                        for (let i = 0; i < iframes.length; i++) {
                            const item = iframes[i]
                            const frameHrefElement = item.contentWindow.document.getElementById(href)
                            if (frameHrefElement) frameHrefElement.scrollIntoView()
                        }
                    }
                    if (element) element.scrollIntoView()
                }
            },
            tabsAfn (index) {
                this.actives = index;
                this.childactives = null
            },
            tabsBfn (index) {
                console.log(index);
                this.childactives = index;
                this.actives = null
            }
        },
        mounted () {
            if (this.configdata.createClass) this.loadCssCode(this.configdata.createClass)
        },
        watch: {
            configdata: {
                handler (n, o) {
                    if (n.blm) { this.componentName = n.blm }
                },
                deep: true,
                immediate: true
            }
        }
    }
</script>
<style lang="less" scoped>
    .itemClass {
        position: relative;
        &::after{
            display: block;
            content: "";
            width: 1px;
            height: 100%;
            background-color: #2d8cf0;
            position: absolute;
            left: 7px;
            top: 20px;
            z-index: 99;
        }
        &:last-child::before{
            display: block;
            content: "";
            width: 1px;
            height: 31px;
            background-color: #fff;
            position: absolute;
            left: 7px;
            bottom: -22px;
            z-index: 111;
        }
        &.active{
            .item-head{
                border-width: 4px;
            }
            .item-content{
                color:#2d8cf0
            }
        }
    }
    .item-head {
        width:13px;
        height:13px;
        background-color: #fff;
        border-radius: 50%;
        border:1px solid #2d8cf0;
        position: absolute;
        left:1px;
        top:9px;
        z-index: 100;
        cursor:pointer;
    }
    .item-content  {
        padding: 5px 0;
        cursor: pointer;
    }
    .timeline span :hover{
        cursor:pointer
    }
    .childitemClass {
        position: relative;
        &::after{
            display: none;
            content: "";
            width: 1px;
            height: 100%;
            background-color: #2d8cf0;
            position: absolute;
            left: 7px;
            top: 20px;
            z-index: 99;
        }
        &.active{
            .childitem-head{
                border-width: 4px;
            }
            .childitem-content{
                color:#2d8cf0
            }
        }
    }
    .childitem-head {
        width:13px;
        height:13px;
        background-color: #fff;
        border-radius: 50%;
        border:1px solid #2d8cf0;
        position: absolute;
        left:1px;
        top:9px;
        z-index: 100;
        cursor:pointer;
    }
    .childitem-content  {
        color: #888;
        padding: 5px 0;
        cursor: pointer;
    }
</style>
