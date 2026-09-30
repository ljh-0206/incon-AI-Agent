<template>
<div style="height:100%">
    <card style="height:100%;" class="card_class" >
        <p v-if="componentconfig.title" slot="title">
            <Icon :type="componentconfig.titleIconName" :style="componentconfig.titleIconStyle" />
            <b :style="componentconfig.titleStyle">{{componentconfig.title}}</b>
        </p>
        <p v-else slot="title">
            <Icon :type="componentconfig.titleIconName" :style="componentconfig.titleIconStyle" />
            <b :style="componentconfig.titleColor">列表</b>
        </p>
        <template v-if="componentconfig.titleButtons && componentconfig.titleButtons.length>0" slot="extra">
            <a v-for="(titleBtnItem,titleBtnIndex) in componentconfig.titleButtons" href="#" @click.prevent="titlebuttonclick(titleBtnItem)" :key="titleBtnItem.blm+titleBtnIndex">
                <Icon v-if="titleBtnItem.icon" :type="titleBtnItem.icon" :style="titleBtnItem.iconStyle"/>
                <b v-if="titleBtnItem.content" :style="titleBtnItem.contentStyle">{{titleBtnItem.content}}</b>
            </a>
        </template>
       <div style="height:100%; overflow-y: auto; overflow-x: auto " >
            <draggable v-model="list" :option="{sort:false}" chosenClass="chosen" forceFallback="true"  animation="1000" @start="onStart" @end="onEnd" >
                <transition-group>
                    <div class="item" v-for="(item,index) in list"  :key="item+index" @click="handleClick(item,index)" >
                            <!-- <span v-for="(tableItem,tableIndex) in componentconfig.showItem" :key="tableItem+tableIndex">
                             {{tableItem}}  {{tableIndex===0 ? element[tableItem] : --element[tableItem]}}
                            </span>
                            <span  class="itemremove" @click.stop="removeItem(element,index)" style="float:right" >
                                <Icon type="md-close" size="20" style="color:red"/>
                            </span>  -->

                            <div   :key="'cell_'+index+_uid"
                                :class="index===itemIndex ? 'itemActive' :''" class="cellClass"  @click="itemClick(item,index)"
                            >
                                <template  v-for="(e,i) in componentconfig.showItem">
                                   <p  v-if="i==0"   :key="'itemname_'+i+e" >{{item[e]}}</p>
                                   <p  v-else  :key="'itemname_'+i+e" >{{item[e]}}</p>
                                </template>
                                <p>
                                    <template v-if="componentconfig && componentconfig.itemButtons">
                                        <a v-for="(bItem,bIndex) in componentconfig.itemButtons" href="#" :key="bItem.blm+bIndex"
                                            @click.stop="itembuttonclick(item,index,bItem.blm)" class="btnClass" >
                                            <Icon v-if="bItem.icon" :type="bItem.icon"  size="20" />
                                            {{bItem.content}}
                                        </a>
                                    </template>
                                </p>
                            </div>

                    </div>
                </transition-group>
            </draggable>
        </div>

    </card>
</div>
</template>
<script>
    import { deepCopy } from 'view-ui-plus/src/utils/assist';

    import draggable from 'vuedraggable'
    export default {
        components: { draggable },
        props: {
            componentconfig: {
                type: Object,
                default: () => ({})
            },
            list: { type: Array, default: () => [] }
        },
        data () {
            return {
                itemIndex: -1,
                drag: false
            }
        },
        methods: {
            onStart () { this.drag = true; },
            // 拖拽结束事件
            onEnd () {
                this.drag = false;
            },
            itemClick (item, index) {
                this.itemIndex = index
            },
            itembuttonclick (item, index, btnName) {
                this.$emit('itembuttonclick', item, index, btnName)
            },
            handleClick (item, index) {
                this.$emit('click', { item, index })
            },
            titlebuttonclick (btnName) {
                this.$emit('titlebuttonclick', btnName)
            }

        },
        watch: {},

        mounted () {}
    }
</script>
<style scoped>
.card_class{
    height:100%;
}

.card_class .ivu-card-body{
        height:calc(100% - 45px);
}

 .cellClass  {
    display: flex;
    justify-content:space-between;
    align-items: center ;
    height:32px ;
    padding-left:10px;
    padding-right:5px;
    font-size:16px;
}
.cellClass:hover {
    background:#f5baba;
    cursor:pointer
}
.itemActive {
    background:#f5baba
}

 /*被拖拽对象的样式*/
/* .item {
    padding: 6px;
    border: solid 1px #eee;
    margin-bottom: 10px;
    cursor: move;
}
    .item:hover {
        background-color: #f8ddd3;
        cursor: move;
    }
    .itemremove:hover {
        background-color: #f5bfab;
        cursor: pointer;
    }       */
/*选中样式*/
.chosen {
    border: solid 1px #3089dc !important;
}
</style>
