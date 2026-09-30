<template>
<div style="height:100%" >
    <Card style="height:99%" class="cardClass" v-bind="$attrs" >
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
        </template >
        <div style="height:95%; overflow-y: auto; overflow-x: auto ;background:white">
            <b v-if="data.length==0">无数据</b>
                <template v-if="componentconfig.haveCheckBox" >
                    <CheckboxGroup  v-model="selectedList"  @on-change="handleOnchange">
                        <Row>
                            <Col :span="componentconfig.spanNum ? componentconfig.spanNum : 24" v-for="(item,index) in data"  :key="'cell'+item.id+index">
                                <div :class="index===itemIndex ? 'itemActive' :''" class="cellClass" @click="itemClick(item,index)">
                                    <Checkbox  :label="item[componentconfig.returnKey ? componentconfig.returnKey :'key' ]"  style="font-size:16px">
                                        <template  v-for="(e,i) in componentconfig.showItem" >
                                            <span v-if="i===0" :key="'itemname_'+i+e" > {{item[e]}}</span>
                                            <span v-else :key="'itemname_'+i+e+_uid" >
                                                <Icon type="md-remove"></Icon>
                                                 {{item[e]}}
                                            </span>
                                           </template>
                                    </Checkbox>
                                    <p>
                                        <template v-if="componentconfig && componentconfig.itemButtons">
                                            <a v-for="(bItem,bIndex) in componentconfig.itemButtons" href="#" :key="bItem.blm+bIndex"
                                                @click.stop="itembuttonclick(item,index,bItem)" class="btnClass" >
                                                <Icon v-if="bItem.icon" :type="bItem.icon"  size="20" />
                                                {{bItem.content}}
                                            </a>
                                        </template>
                                    </p>
                                </div>
                            </Col>
                        </Row>
                    </CheckboxGroup>
                </template>
                <template v-else >
                    <Row >
                        <Col :span="componentconfig.spanNum ? componentconfig.spanNum : 24" v-for="(item,index) in data" :key="'col'+index">
                            <div   :key="'cell_'+index+item.id"
                                :class="index===itemIndex ? 'itemActive' :''" class="cellClass"  @click="itemClick(item,index)"
                            >
                                <template  v-for="(e,i) in componentconfig.showItem">
                                   <span  v-if="i==0"   :key="'itemname_'+i+e" >{{item[e]}}</span>
                                   <span  v-else  :key="'itemname_'+i+item.id" >
                                       <Icon type="md-remove"></Icon>
                                       {{item[e]}}</span>
                                </template>
                                <p>
                                    <template v-if="componentconfig && componentconfig.itemButtons">
                                        <a v-for="(bItem,bIndex) in componentconfig.itemButtons" href="#" :key="bItem.blm+bIndex"
                                            @click.stop="itembuttonclick(item,index,bItem)" class="btnClass" >
                                            <Icon v-if="bItem.icon" :type="bItem.icon"  size="20" />
                                            {{bItem.content}}
                                        </a>
                                    </template>
                                </p>
                            </div>
                        </Col>
                    </Row>
                </template>

        </div>
    </Card>
</div>
</template>
<script>

    export default {
        name: 'inco-list',
        components: {},
        props: {
            value: {
                type: [String, Boolean, Array],
                default: () => []
            },
            componentconfig: {
                type: Object,
                default: () => ({})
            },
            list: {
                type: Array,
                default: () => []
            }

        },
        data () {
            return {
                selectedList: [],
                data: [],
                selectValue: [],
                itemIndex: -1
            }
        },
        methods: {
            itembuttonclick (item, index, bItem) {
                this.itemIndex = index
                this.$emit('itembuttonclick', item, index, bItem.blm)
                this.$emit('listitembuttonclick', { item, index, btnName: bItem.blm, name: this.configdata.name })
            },
            itemClick (item, index) {
                this.itemIndex = index
                this.$emit('itemClick', item, index)
            },

            titlebuttonclick (item) {
                this.$emit('titlebuttonclick', item)
            },
            handleOnchange (data) {
                this.$emit('input', this.selectedList)
            }
        },
        watch: {
            list: {
                handler (n) {
                    this.data = this.list
                },
                deep: true,
                immediate: true
            },
            selectedList: {
                handler () { this.$emit('input', this.selectedList) },
                deep: true
            }
        },
        mounted () {}
    }
</script>
<style scoped>

.cardClass{
    height:100%;
    overflow-x: hidden;
    overflow-y: auto;
}

.cardClass .ivu-card-body{
    height:calc(100% - 50px);

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
.btnClass:hover {
    color:green;
}
.item {
    padding: 6px;
    background-color: #fdfdfd;
    border: solid 1px #eee;
    margin-bottom: 10px;
    cursor: move;
}
    .item:hover {
        background-color: #f5baba;
        cursor: move;
    }
/*选中样式*/
.chosen {
    border: solid 1px #3089dc !important;
}
</style>
