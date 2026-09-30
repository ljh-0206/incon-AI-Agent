<template>
    <div :id="configdata.blm" :style="computeMainStyleMethod()" class="incocomponent-main"
        :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <Button @click="test" v-if="env()">{{this.componentName}}组件</Button>
        <template v-for="(level0,index0) in layoutConfig">
            <!-- 根部布局 -->
            <component v-if="level0.zjlb=='singledata' && computeKyf(level0,null,index0,null)"
                :is="level0.componentType" :id="level0.blm" :ref="level0.blm" :key="'level0'+level0.blm+index0"
                v-model="data[level0.blm]" v-bind="computeAttrs(level0,null,index0,null)"
                :style="computeStyle(level0,null,index0,null)" :class="componentClass[level0.blm]"
                :list="list[level0.blm]" :fathername="componentName" :configdata="config[level0.blm]"
                :propstocomponent="propstochild[level0.blm]" @commonMethod="commitMethod"
                @update:visible="data[level0.blm] = false" v-on="computeComponentEvent(level0,null,index0,null)">
                <template v-if="config[level0.blm] && config[level0.blm].xscontent!='0'">
                    {{level0.dataSource==='static' ? level0.content : data[level0.blm]}}
                </template>
                <template v-if="level0.children && level0.children.length>0">
                    <!-- 第一层布局 -->
                    <template v-for="(level1,index1) in level0.children">
                        <!-- 如果是单数据组件 -->
                        <component v-if="level1.zjlb==='singledata' && computeKyf(level1,null,index1,null)"
                            :is="level1.componentType" :id="level1.blm" :ref="level1.blm"
                            :key="'level1'+level1.blm+index1" v-model="data[level1.blm]"
                            v-bind="computeAttrs(level1,null,index1,null)"
                            :style="computeStyle(level1,null,index1,null)" :class="componentClass[level1.blm]"
                            :list="list[level1.blm]" :fathername="componentName" :configdata="config[level1.blm]"
                            :propstocomponent="propstochild[level1.blm]" @commonMethod="commitMethod"
                            @update:visible="data[level1.blm] = false"
                            v-on="computeComponentEvent(level1,null,index1,null)">
                            <template v-if="config[level1.blm] && config[level1.blm].xscontent!='0'">
                                {{level1.dataSource==='static' ? level1.content : data[level1.blm]}}
                            </template>
                            <!-- 第二层布局 -->
                            <template v-if="level1.children && level1.children.length>0">
                                <template v-for="(level2,index2) in level1.children">
                                    <!-- 第二层如果是单数据组件 -->
                                    <component v-if="level2.zjlb==='singledata' && computeKyf(level2,null,index2,null)"
                                        :is="level2.componentType" :id="level2.blm" :ref="level2.blm"
                                        :key="'level2'+level2.blm+index2" v-model="data[level2.blm]"
                                        v-bind="computeAttrs(level2,null,index2,null)"
                                        :style="computeStyle(level2,null,index2,null)"
                                        :class="componentClass[level2.blm]" :list="list[level2.blm]"
                                        :fathername="componentName" :configdata="config[level2.blm]"
                                        :propstocomponent="propstochild[level2.blm]" @commonMethod="commitMethod"
                                        @update:visible="data[level2.blm] = false"
                                        v-on="computeComponentEvent(level2,null,index2,null)">
                                        <template v-if="config[level2.blm] && config[level2.blm].xscontent!='0'">
                                            {{level2.dataSource==='static' ? level2.content : data[level2.blm]}}
                                        </template>

                                        <!-- 第三层布局 -->
                                        <template v-if="level2.children && level2.children.length>0">
                                            <template v-for="(level3,index3) in level2.children">
                                                <component
                                                    v-if="level3.zjlb==='singledata' && computeKyf(level3,null,index3,null)"
                                                    :is="level3.componentType" :id="level3.blm" :ref="level3.blm"
                                                    :key="'level3'+level3.blm+index3" v-model="data[level3.blm]"
                                                    v-bind="computeAttrs(level3,null,index3,null)"
                                                    :style="computeStyle(level3,null,index3,null)"
                                                    :class="componentClass[level3.blm]" :list="list[level3.blm]"
                                                    :fathername="componentName" :configdata="config[level3.blm]"
                                                    :propstocomponent="propstochild[level3.blm]"
                                                    @commonMethod="commitMethod"
                                                    @update:visible="data[level3.blm] = false"
                                                    v-on="computeComponentEvent(level3,null,index3,null)">
                                                    <template
                                                        v-if="config[level3.blm] && config[level3.blm].xscontent!='0'">
                                                        {{level3.dataSource==='static' ? level3.content :
                                                        data[level3.blm]}}
                                                    </template>

                                                    <!-- 第四层布局 -->
                                                    <template v-if="level3.children && level3.children.length>0">
                                                        <template v-for="(level4,index4) in level3.children">
                                                            <component
                                                                v-if="level4.zjlb==='singledata' && computeKyf(level4,null,index4,null)"
                                                                :is="level4.componentType" :id="level4.blm"
                                                                :ref="level4.blm" :key="'level4'+level4.blm+index4"
                                                                v-model="data[level4.blm]"
                                                                v-bind="computeAttrs(level4,null,index4,null)"
                                                                :style="computeStyle(level4,null,index4,null)"
                                                                :class="componentClass[level4.blm]"
                                                                :list="list[level4.blm]" :fathername="componentName"
                                                                :configdata="config[level4.blm]"
                                                                :propstocomponent="propstochild[level4.blm]"
                                                                @commonMethod="commitMethod"
                                                                @update:visible="data[level4.blm] = false"
                                                                v-on="computeComponentEvent(level4,null,index4,null)">
                                                                <template
                                                                    v-if="config[level4.blm] && config[level4.blm].xscontent!='0'">
                                                                    {{level4.dataSource==='static' ? level4.content :
                                                                    data[level4.blm]}}
                                                                </template>

                                                                <template v-for="(level5,index5) in level4.children">
                                                                    <component
                                                                        v-if="level5.zjlb==='singledata' && computeKyf(level5,null,index5,null)"
                                                                        :is="level5.componentType" :id="level5.blm"
                                                                        :ref="level5.blm"
                                                                        :key="'level5'+level5.blm+index5"
                                                                        v-model="data[level5.blm]"
                                                                        v-bind="computeAttrs(level5,null,index5,null)"
                                                                        :style="computeStyle(level5,null,index5,null)"
                                                                        :class="componentClass[level5.blm]"
                                                                        :list="list[level5.blm]"
                                                                        :fathername="componentName"
                                                                        :configdata="config[level5.blm]"
                                                                        :propstocomponent="propstochild[level5.blm]"
                                                                        @commonMethod="commitMethod"
                                                                        @update:visible="data[level5.blm] = false"
                                                                        v-on="computeComponentEvent(level5,null,index5,null)">
                                                                        <template
                                                                            v-if="config[level5.blm] && config[level5.blm].xscontent!='0'">
                                                                            {{level5.dataSource==='static' ?
                                                                            level5.content : data[level5.blm]}}
                                                                        </template>

                                                                    </component>
                                                                    <template v-else>
                                                                        <template
                                                                            v-for="(data5,dataindex5) in data[level5.blm]">
                                                                            <component
                                                                                v-if="computeKyf(level5,data5,index5,dataindex5)"
                                                                                :is="level5.componentType"
                                                                                :id="level5.blm+dataindex5"
                                                                                :ref="level5.blm+dataindex5"
                                                                                :key="'level4'+level5.blm+index5+dataindex5"
                                                                                v-model="data5[level5.blm]"
                                                                                v-bind="computeAttrs(level5,data5,index5,dataindex5)"
                                                                                :style="computeStyle(level5,data5,index5,dataindex5)"
                                                                                :class="componentClass[level5.blm]"
                                                                                :list="list[level5.blm]"
                                                                                :fathername="componentName"
                                                                                :index="dataindex5"
                                                                                :configdata="config[level5.blm]"
                                                                                :propstocomponent="propstochild[level5.blm]"
                                                                                @commonMethod="commitMethod"
                                                                                @update:visible="data5[level5.blm] = false"
                                                                                v-on="computeComponentEvent(level5,data5,index5,dataindex5)">
                                                                                <template
                                                                                    v-if="config[level5.blm] && config[level5.blm].xscontent!='0'">
                                                                                    {{level5.dataSource==='static' ?
                                                                                    level5.content : data5[level5.blm]}}
                                                                                </template>
                                                                            </component>
                                                                        </template>
                                                                    </template>
                                                                </template>
                                                            </component>
                                                            <!-- 第四层数据循环 -->
                                                            <template v-else>
                                                                <template
                                                                    v-for="(data4,dataindex4) in data[level4.blm]">
                                                                    <component
                                                                        v-if="computeKyf(level4,data4,index4,dataindex4)"
                                                                        :is="level4.componentType"
                                                                        :id="level4.blm+dataindex4"
                                                                        :ref="level4.blm+dataindex4"
                                                                        :key="'level4'+level4.blm+index4+dataindex4"
                                                                        v-model="data4[level4.blm]"
                                                                        v-bind="computeAttrs(level4,data4,index4,dataindex4)"
                                                                        :style="computeStyle(level4,data4,index4,dataindex4)"
                                                                        :class="componentClass[level4.blm]"
                                                                        :list="list[level4.blm]"
                                                                        :fathername="componentName" :index="dataindex4"
                                                                        :configdata="config[level4.blm]"
                                                                        :propstocomponent="propstochild[level4.blm]"
                                                                        @commonMethod="commitMethod"
                                                                        @update:visible="data4[level4.blm] = false"
                                                                        v-on="computeComponentEvent(level4,data4,index4,dataindex4)">
                                                                        <template
                                                                            v-if="config[level4.blm] && config[level4.blm].xscontent!='0'">
                                                                            {{level4.dataSource==='static' ?
                                                                            level4.content : data4[level4.blm]}}
                                                                        </template>
                                                                        <template
                                                                            v-if="level4.children && level4.children.length>0">
                                                                            <template
                                                                                v-for="(level5,index5) in level4.children">
                                                                                <component
                                                                                    v-if="computeKyf(level5,data4,index5,dataindex4)"
                                                                                    :is="level5.componentType"
                                                                                    :id="level5.blm+dataindex4"
                                                                                    :ref="level5.blm+dataindex4"
                                                                                    :key="'level5'+level5.blm+index5+dataindex4"
                                                                                    v-model="data4[level5.blm]"
                                                                                    v-bind="computeAttrs(level5,data4,index5,dataindex4)"
                                                                                    :style="computeStyle(level5,data4,index5,dataindex4)"
                                                                                    :class="componentClass[level5.blm]"
                                                                                    :list="list[level5.blm]"
                                                                                    :fathername="componentName"
                                                                                    :index="dataindex4"
                                                                                    :configdata="config[level5.blm]"
                                                                                    :propstocomponent="propstochild[level5.blm]"
                                                                                    @commonMethod="commitMethod"
                                                                                    @update:visible="data4[level5.blm] = false"
                                                                                    v-on="computeComponentEvent(level5,data4,index5,dataindex4)">
                                                                                    <template
                                                                                        v-if="config[level5.blm] && config[level5.blm].xscontent!='0'">
                                                                                        {{level5.dataSource==='static' ?
                                                                                        level5.content :
                                                                                        data4[level5.blm]}}
                                                                                    </template>
                                                                                </component>
                                                                            </template>
                                                                        </template>
                                                                    </component>
                                                                </template>

                                                            </template>
                                                        </template>
                                                    </template>
                                                </component>
                                                <!-- 三层数据循环 -->
                                                <template v-else>
                                                    <template v-for="(data3,dataindex3) in data[level3.blm]">
                                                        <component v-if="computeKyf(level3,data3,index3,dataindex3)"
                                                            :is="level3.componentType" :id="level3.blm+dataindex3"
                                                            :ref="level3.blm+dataindex3"
                                                            :key="'level3'+level3.blm+index3+dataindex3"
                                                            v-model="data3[level3.blm]"
                                                            v-bind="computeAttrs(level3,data3,index3,dataindex3)"
                                                            :style="computeStyle(level3,data3,index3,dataindex3)"
                                                            :class="componentClass[level3.blm]" :list="list[level3.blm]"
                                                            :fathername="componentName" :index="dataindex3"
                                                            :configdata="config[level3.blm]"
                                                            :propstocomponent="propstochild[level3.blm]"
                                                            @commonMethod="commitMethod"
                                                            @update:visible="data3[level3.blm] = false"
                                                            v-on="computeComponentEvent(level3,data3,index3,dataindex3)">
                                                            <template
                                                                v-if="config[level3.blm] && config[level3.blm].xscontent!='0'">
                                                                {{level3.dataSource==='static' ? level3.content :
                                                                data3[level3.blm]}}
                                                            </template>

                                                            <!-- 第四层布局 -->
                                                            <template
                                                                v-if="level3.children && level3.children.length>0">
                                                                <template v-for="(level4,index4) in level3.children">
                                                                    <component
                                                                        v-if="level4.zjlb==='singledata' && computeKyf(level4,data3,index4,dataindex3)"
                                                                        :is="level4.componentType"
                                                                        :id="level4.blm+dataindex3"
                                                                        :ref="level4.blm+dataindex3"
                                                                        :key="'level4'+level4.blm+dataindex3+index4"
                                                                        v-model="data3[level4.blm]"
                                                                        v-bind="computeAttrs(level4,data3,index4,dataindex3)"
                                                                        :style="computeStyle(level4,data3,index4,dataindex3)"
                                                                        :class="componentClass[level4.blm]"
                                                                        :list="list[level4.blm]"
                                                                        :fathername="componentName" :index="dataindex3"
                                                                        :configdata="config[level4.blm]"
                                                                        :propstocomponent="propstochild[level4.blm]"
                                                                        @commonMethod="commitMethod"
                                                                        @update:visible="data3[level4.blm] = false"
                                                                        v-on="computeComponentEvent(level4,data3,index4,dataindex3)">
                                                                        <template
                                                                            v-if="config[level4.blm] && config[level4.blm].xscontent!='0'">
                                                                            {{level4.dataSource==='static' ?
                                                                            level4.content : data3[level4.blm]}}
                                                                        </template>
                                                                        <template
                                                                            v-if="level4.children && level4.children.length>0">
                                                                            <template
                                                                                v-for="(level5,index5) in level4.children">
                                                                                <component
                                                                                    v-if="level5.zjlb==='singledata' && computeKyf(level5,data3,index5,dataindex3)"
                                                                                    :is="level5.componentType"
                                                                                    :id="level5.blm+dataindex3"
                                                                                    :ref="level5.blm+dataindex3"
                                                                                    :key="'level5'+level5.blm+dataindex3+index5"
                                                                                    v-model="data3[level5.blm]"
                                                                                    v-bind="computeAttrs(level5,data3,index5,dataindex3)"
                                                                                    :style="computeStyle(level5,data3,index5,dataindex3)"
                                                                                    :class="componentClass[level5.blm]"
                                                                                    :list="list[level5.blm]"
                                                                                    :fathername="componentName"
                                                                                    :index="dataindex3"
                                                                                    :configdata="config[level5.blm]"
                                                                                    :propstocomponent="propstochild[level5.blm]"
                                                                                    @commonMethod="commitMethod"
                                                                                    @update:visible="data3[level5.blm] = false"
                                                                                    v-on="computeComponentEvent(level5,data3,index5,dataindex3)">
                                                                                    <template
                                                                                        v-if="config[level5.blm] && config[level5.blm].xscontent!='0'">
                                                                                        {{level5.dataSource==='static' ?
                                                                                        level5.content :
                                                                                        data3[level5.blm]}}
                                                                                    </template>
                                                                                </component>
                                                                            </template>
                                                                        </template>
                                                                    </component>
                                                                </template>
                                                            </template>
                                                        </component>
                                                    </template>
                                                </template>
                                            </template>
                                        </template>
                                    </component>
                                    <!-- 第二层如果是多数据组件 -->
                                    <template v-else>
                                        <template v-for="(data2,dataindex2) in data[level2.blm]">
                                            <component v-if="computeKyf(level2,data2,index2,dataindex2)"
                                                :is="level2.componentType" :id="level2.blm+dataindex2"
                                                :ref="level2.blm+dataindex2"
                                                :key="'level2'+level2.blm+dataindex2+index2" v-model="data2[level2.blm]"
                                                v-bind="computeAttrs(level2,data2,index2,dataindex2)"
                                                :style="computeStyle(level2,data2,index2,dataindex2)"
                                                :class="componentClass[level2.blm]" :list="list[level2.blm]"
                                                :fathername="componentName" :index="dataindex2"
                                                :configdata="config[level2.blm]"
                                                :propstocomponent="propstochild[level2.blm]"
                                                @commonMethod="commitMethod" @update:visible="data2[level2.blm] = false"
                                                v-on="computeComponentEvent(level2,data2,index2,dataindex2)">
                                                <template
                                                    v-if="config[level2.blm] && config[level2.blm].xscontent!='0'">
                                                    {{level2.dataSource==='static' ? level2.content :
                                                    data2[level2.blm]}}
                                                </template>
                                                <!-- 第三层布局 -->
                                                <template v-if="level2.children && level2.children.length>0">
                                                    <template v-for="(level3,index3) in level2.children">
                                                        <!-- {{level3.blm}}我是第三层 -->
                                                        <component
                                                            v-if="level3.zjlb==='singledata' && computeKyf(level3,data2,index3,dataindex2)"
                                                            :is="level3.componentType" :id="level3.blm+dataindex2"
                                                            :ref="level3.blm+dataindex2"
                                                            :key="'level3'+level3.blm+dataindex2+index3"
                                                            v-model="data2[level3.blm]"
                                                            v-bind="computeAttrs(level3,data2,index3,dataindex2)"
                                                            :style="computeStyle(level3,data2,index3,dataindex2)"
                                                            :class="componentClass[level3.blm]" :list="list[level3.blm]"
                                                            :fathername="componentName" :index="dataindex2"
                                                            :configdata="config[level3.blm]"
                                                            :propstocomponent="propstochild[level3.blm]"
                                                            @commonMethod="commitMethod"
                                                            @update:visible="data2[level3.blm] = false"
                                                            v-on="computeComponentEvent(level3,data2,index3,dataindex2)">
                                                            <template
                                                                v-if="config[level3.blm] && config[level3.blm].xscontent!='0'">
                                                                {{level3.dataSource==='static' ? level3.content :
                                                                data2[level3.blm]}}
                                                            </template>
                                                            <!-- 第四层布局 -->
                                                            <template
                                                                v-if="level3.children && level3.children.length>0">
                                                                <template v-for="(level4,index4) in level3.children">
                                                                    <component
                                                                        v-if="level4.zjlb==='singledata' && computeKyf(level4,data2,index4,dataindex2)"
                                                                        :is="level4.componentType"
                                                                        :id="level4.blm+dataindex2"
                                                                        :ref="level4.blm+dataindex2"
                                                                        :key="'level4'+level4.blm+dataindex2+index4"
                                                                        v-model="data2[level4.blm]"
                                                                        v-bind="computeAttrs(level4,data2,index4,dataindex2)"
                                                                        :style="computeStyle(level4,data2,index4,dataindex2)"
                                                                        :class="componentClass[level4.blm]"
                                                                        :list="list[level4.blm]"
                                                                        :fathername="componentName" :index="dataindex2"
                                                                        :configdata="config[level4.blm]"
                                                                        :propstocomponent="propstochild[level4.blm]"
                                                                        @commonMethod="commitMethod"
                                                                        @update:visible="data2[level4.blm] = false"
                                                                        v-on="computeComponentEvent(level4,data2,index4,dataindex2)">
                                                                        <template
                                                                            v-if="config[level4.blm] && config[level4.blm].xscontent!='0'">
                                                                            {{level4.dataSource==='static' ?
                                                                            level4.content : data2[level4.blm]}}
                                                                        </template>
                                                                        <template
                                                                            v-if="level4.children && level4.children.length>0">
                                                                            <template
                                                                                v-for="(level5,index5) in level4.children">
                                                                                <component
                                                                                    v-if="level5.zjlb==='singledata' && computeKyf(level5,data2,index5,dataindex2)"
                                                                                    :is="level5.componentType"
                                                                                    :id="level5.blm+dataindex2"
                                                                                    :ref="level5.blm+dataindex2"
                                                                                    :key="'level5'+level5.blm+dataindex2+index5"
                                                                                    v-model="data2[level5.blm]"
                                                                                    v-bind="computeAttrs(level5,data2,index5,dataindex2)"
                                                                                    :style="computeStyle(level5,data2,index5,dataindex2)"
                                                                                    :class="componentClass[level5.blm]"
                                                                                    :list="list[level5.blm]"
                                                                                    :fathername="componentName"
                                                                                    :index="dataindex2"
                                                                                    :configdata="config[level5.blm]"
                                                                                    :propstocomponent="propstochild[level5.blm]"
                                                                                    @commonMethod="commitMethod"
                                                                                    @update:visible="data2[level5.blm] = false"
                                                                                    v-on="computeComponentEvent(level5,data2,index5,dataindex2)">
                                                                                    <template
                                                                                        v-if="config[level5.blm] && config[level5.blm].xscontent!='0'">
                                                                                        {{level5.dataSource==='static' ?
                                                                                        level5.content :
                                                                                        data2[level5.blm]}}
                                                                                    </template>
                                                                                </component>
                                                                            </template>
                                                                        </template>
                                                                    </component>
                                                                </template>
                                                            </template>
                                                        </component>
                                                    </template>
                                                </template>
                                            </component>
                                        </template>

                                    </template>
                                </template>
                            </template>
                        </component>
                        <!-- 如果是多数据组件 第一层 -->
                        <template v-else>
                            <template v-for="(data1,dataindex1) in data[level1.blm]">
                                <component v-if="computeKyf(level1,data1,index1,dataindex1)" :is="level1.componentType"
                                    :id="level1.blm+dataindex1" :ref="level1.blm+dataindex1"
                                    :key="'data1'+level1.blm+dataindex1+index1" v-model="data1[data1.blm]"
                                    v-bind="computeAttrs(level1,data1,index1,dataindex1)"
                                    :style="computeStyle(level1,data1,index1,dataindex1)"
                                    :class="componentClass[level1.blm]" :list="list[data1.blm]"
                                    :fathername="componentName" :index="dataindex1" :configdata="config[level1.blm]"
                                    :propstocomponent="propstochild[level1.blm]" @commonMethod="commitMethod"
                                    @update:visible="data1[level1.blm] = false"
                                    v-on="computeComponentEvent(level1,data1,index1,dataindex1)">
                                    <template v-if="config[level1.blm] && config[level1.blm].xscontent!='0'">
                                        {{level1.dataSource==='static' ? level1.content : data1[level1.blm]}}
                                    </template>

                                    <template v-if="level1.children && level1.children.length>0">
                                        <!-- 第二层布局 -->
                                        <template v-for="(level2,index2) in level1.children">
                                            <component
                                                v-if="level2.zjlb==='singledata' && computeKyf(level2,data1,index2,dataindex1)"
                                                :is="level2.componentType" :id="level2.blm+dataindex1"
                                                :ref="level2.blm+dataindex1"
                                                :key="'level2'+level2.blm+index2+dataindex1" v-model="data1[level2.blm]"
                                                v-bind="computeAttrs(level2,data1,index2,dataindex1)"
                                                :style="computeStyle(level2,data1,index2,dataindex1)"
                                                :class="componentClass[level2.blm]" :list="list[level2.blm]"
                                                :fathername="componentName" :index="dataindex1"
                                                :configdata="config[level2.blm]"
                                                :propstocomponent="propstochild[level2.blm]"
                                                @commonMethod="commitMethod" @update:visible="data1[level2.blm] = false"
                                                v-on="computeComponentEvent(level2,data1,index2,dataindex1)">
                                                <template
                                                    v-if="config[level2.blm] && config[level2.blm].xscontent!='0'">
                                                    {{level2.dataSource==='static' ? level2.content :
                                                    data1[level2.blm]}}
                                                </template>
                                                <!-- 第三层布局 -->
                                                <template v-if="level2.children && level2.children.length>0">
                                                    <template v-for="(level3,index3) in level2.children">
                                                        <component
                                                            v-if="level3.zjlb==='singledata' && computeKyf(level3,data1,index3,dataindex1)"
                                                            :is="level3.componentType" :id="level3.blm+dataindex1"
                                                            :ref="level3.blm+dataindex1"
                                                            :key="'level3'+level3.blm+index3+dataindex1"
                                                            v-model="data1[level3.blm]"
                                                            v-bind="computeAttrs(level3,data1,index3,dataindex1)"
                                                            :style="computeStyle(level3,data1,index3,dataindex1)"
                                                            :class="componentClass[level3.blm]" :list="list[level3.blm]"
                                                            :fathername="componentName" :index="dataindex1"
                                                            :configdata="config[level3.blm]"
                                                            :propstocomponent="propstochild[level3.blm]"
                                                            @commonMethod="commitMethod"
                                                            @update:visible="data1[level3.blm] = false"
                                                            v-on="computeComponentEvent(level3,data1,index3,dataindex1)">
                                                            <template
                                                                v-if="config[level3.blm] && config[level3.blm].xscontent!='0'">
                                                                {{level3.dataSource==='static' ? level3.content :
                                                                data1[level3.blm]}}
                                                            </template>
                                                            <!-- 第五层布局 -->
                                                            <template
                                                                v-if="level3.children && level3.children.length>0">
                                                                <template v-for="(level4,index4) in level3.children">
                                                                    <component
                                                                        v-if="level4.zjlb==='singledata' && computeKyf(level4,data1,index4,dataindex1)"
                                                                        :is="level4.componentType"
                                                                        :id="level4.blm+dataindex1"
                                                                        :ref="level4.blm+dataindex1"
                                                                        :key="'level4'+level4.blm+index4+dataindex1"
                                                                        v-model="data1[level4.blm]"
                                                                        v-bind="computeAttrs(level4,data1,index4,dataindex1)"
                                                                        :style="computeStyle(level4,data1,index4,dataindex1)"
                                                                        :class="componentClass[level4.blm]"
                                                                        :list="list[level4.blm]"
                                                                        :fathername="componentName" :index="dataindex1"
                                                                        :configdata="config[level4.blm]"
                                                                        :propstocomponent="propstochild[level4.blm]"
                                                                        @commonMethod="commitMethod"
                                                                        @update:visible="data1[level4.blm] = false"
                                                                        v-on="computeComponentEvent(level4,data1,index4,dataindex1)">
                                                                        <template
                                                                            v-if="config[level4.blm] && config[level4.blm].xscontent!='0'">
                                                                            {{level4.dataSource==='static' ?
                                                                            level4.content : data1[level4.blm]}}
                                                                        </template>
                                                                        <template
                                                                            v-if="level4.children && level4.children.length>0">
                                                                            <template
                                                                                v-for="(level5,index5) in level4.children">
                                                                                <component
                                                                                    v-if="level5.zjlb==='singledata' && computeKyf(level5,data1,index5,dataindex1)"
                                                                                    :is="level5.componentType"
                                                                                    :id="level5.blm+dataindex1"
                                                                                    :ref="level5.blm+dataindex1"
                                                                                    :key="'level5'+level5.blm+index5+dataindex1"
                                                                                    v-model="data1[level5.blm]"
                                                                                    v-bind="computeAttrs(level5,data1,index5,dataindex1)"
                                                                                    :style="computeStyle(level5,data1,index5,dataindex1)"
                                                                                    :class="componentClass[level5.blm]"
                                                                                    :list="list[level5.blm]"
                                                                                    :fathername="componentName"
                                                                                    :index="dataindex1"
                                                                                    :configdata="config[level5.blm]"
                                                                                    :propstocomponent="propstochild[level5.blm]"
                                                                                    @commonMethod="commitMethod"
                                                                                    @update:visible="data1[level5.blm] = false"
                                                                                    v-on="computeComponentEvent(level5,data1,index5,dataindex1)">
                                                                                    <template
                                                                                        v-if="config[level5.blm] && config[level5.blm].xscontent!='0'">
                                                                                        {{level5.dataSource==='static' ?
                                                                                        level5.content :
                                                                                        data1[level5.blm]}}
                                                                                    </template>
                                                                                </component>
                                                                            </template>
                                                                        </template>
                                                                    </component>
                                                                </template>
                                                            </template>
                                                        </component>
                                                    </template>
                                                </template>
                                            </component>
                                        </template>
                                    </template>
                                </component>
                            </template>
                        </template>

                    </template>
                </template>
            </component>
            <!-- 根部带数据循环 -->
            <template v-if="level0.zjlb=='multidata'">
                <template v-for="(data0,dataindex0) in data[level0.blm]">
                    <component v-if="computeKyf(level0,data0,index0,dataindex0)" :is="level0.componentType"
                        :key="level0.blm+dataindex0" :id="level0.blm+dataindex0" :ref="level0.blm+dataindex0"
                        :configdata="config[level0.blm]" :list="list[level0.blm]" :fathername="componentName"
                        :index="dataindex0" v-model="data0[level0.blm]" :propstocomponent="propstochild[level0.blm]"
                        v-bind="computeAttrs(level0,data0,index0,dataindex0)"
                        :style="computeStyle(level0,data0,index0,dataindex0)" :class="componentClass[level0.blm]"
                        @update:visible="data0[level0.blm] = false"
                        v-on="computeComponentEvent(level0,data0,index0,dataindex0)">
                        <template v-if="config[level0.blm] && config[level0.blm].xscontent!='0'">
                            {{level0.dataSource==='static' ? level0.content : data0[level0.blm]}}
                        </template>
                        <template v-if="level0.children && level0.children.length>0">
                            <!-- 第一层布局 -->
                            <template v-for="(level1,index1) in level0.children">
                                <!-- 如果是单数据组件 -->
                                <component
                                    v-if="level1.zjlb==='singledata' && computeKyf(level1,data0,index1,dataindex0)"
                                    :is="level1.componentType" :key="'level1'+level1.blm+index1+dataindex0"
                                    :id="level1.blm+dataindex0" :ref="level1.blm+dataindex0" v-model="data0[level1.blm]"
                                    v-bind="computeAttrs(level1,data0,index1,dataindex0)"
                                    :style="computeStyle(level1,data0,index1,dataindex0)"
                                    :class="componentClass[level1.blm]" :list="list[level1.blm]"
                                    :fathername="componentName" :index="dataindex0" :configdata="config[level1.blm]"
                                    :propstocomponent="propstochild[level1.blm]" @commonMethod="commitMethod"
                                    @update:visible="data0[level1.blm] = false"
                                    v-on="computeComponentEvent(level1,data0,index1,dataindex0)">
                                    <template v-if="config[level1.blm] && config[level1.blm].xscontent !=='0'">
                                        {{level1.dataSource==='static' ? level1.content : data0[level1.blm]}}
                                    </template>
                                    <!-- 第二层布局 -->
                                    <template v-if="level1.children && level1.children.length>0">
                                        <template v-for="(level2,index2) in level1.children">
                                            <!-- 第二层如果是单数据组件 -->
                                            <component
                                                v-if="level2.zjlb==='singledata' && computeKyf(level2,data0,index2,dataindex0)"
                                                :is="level2.componentType" :key="'level2'+level2.blm+index2+dataindex0"
                                                :id="level2.blm+dataindex0" :ref="level2.blm+dataindex0"
                                                v-model="data0[level2.blm]"
                                                v-bind="computeAttrs(level2,data0,index2,dataindex0)"
                                                :style="computeStyle(level2,data0,index2,dataindex0)"
                                                :class="componentClass[level2.blm]" :list="list[level2.blm]"
                                                :fathername="componentName" :index="dataindex0"
                                                :configdata="config[level2.blm]"
                                                :propstocomponent="propstochild[level2.blm]"
                                                @commonMethod="commitMethod" @update:visible="data0[level2.blm] = false"
                                                v-on="computeComponentEvent(level2,data0,index2,dataindex0)">
                                                <template
                                                    v-if="config[level2.blm] && config[level2.blm].xscontent!=='0'">
                                                    {{level2.dataSource==='static' ? level2.content :
                                                    data0[level2.blm]}}
                                                </template>
                                                <!-- 第三层布局 -->
                                                <template v-if="level2.children && level2.children.length>0">
                                                    <template v-for="(level3,index3) in level2.children">
                                                        <component
                                                            v-if="level3.zjlb==='singledata' && computeKyf(level3,data0,index3,dataindex0)"
                                                            :is="level3.componentType"
                                                            :key="'level3'+level3.blm+index3+dataindex0"
                                                            :id="level3.blm+dataindex0" :ref="level3.blm+dataindex0"
                                                            v-model="data0[level3.blm]"
                                                            v-bind="computeAttrs(level3,data0,index3,dataindex0)"
                                                            :style="computeStyle(level3,data0,index3,dataindex0)"
                                                            :class="componentClass[level3.blm]" :list="list[level3.blm]"
                                                            :fathername="componentName" :index="dataindex0"
                                                            :configdata="config[level3.blm]"
                                                            :propstocomponent="propstochild[level3.blm]"
                                                            @commonMethod="commitMethod"
                                                            @update:visible="data0[level3.blm] = false"
                                                            v-on="computeComponentEvent(level3,data0,index3,dataindex0)">
                                                            <template
                                                                v-if="config[level3.blm] && config[level3.blm].xscontent!=='0'">
                                                                {{level3.dataSource==='static' ? level3.content :
                                                                data0[level3.blm]}}
                                                            </template>
                                                            <!-- 第四层布局 -->
                                                            <template
                                                                v-if="level3.children && level3.children.length>0">
                                                                <template v-for="(level4,index4) in level3.children">
                                                                    <component
                                                                        v-if="level4.zjlb==='singledata' && computeKyf(level4,data0,index4,dataindex0)"
                                                                        :is="level4.componentType"
                                                                        :key="'level4'+level4.blm+index4+dataindex0"
                                                                        :id="level4.blm+dataindex0"
                                                                        :ref="level4.blm+dataindex0"
                                                                        v-model="data0[level4.blm]"
                                                                        v-bind="computeAttrs(level4,data0,index4,dataindex0)"
                                                                        :style="computeStyle(level4,data0,index4,dataindex0)"
                                                                        :class="componentClass[level4.blm]"
                                                                        :list="list[level4.blm]"
                                                                        :fathername="componentName" :index="dataindex0"
                                                                        :configdata="config[level4.blm]"
                                                                        :propstocomponent="propstochild[level4.blm]"
                                                                        @commonMethod="commitMethod"
                                                                        @update:visible="data0[level4.blm] = false"
                                                                        v-on="computeComponentEvent(level4,data0,index4,dataindex0)">
                                                                        <template
                                                                            v-if="config[level4.blm] && config[level4.blm].xscontent!=='0'">
                                                                            {{level4.dataSource==='static' ?
                                                                            level4.content : data0[level4.blm]}}
                                                                        </template>
                                                                        <!-- 第五层布局 -->
                                                                        <template
                                                                            v-if="level4.children && level4.children.length>0">
                                                                            <template
                                                                                v-for="(level5,index5) in level4.children">
                                                                                <component
                                                                                    v-if="level5.zjlb==='singledata' && computeKyf(level5,data0,index5,dataindex0)"
                                                                                    :is="level5.componentType"
                                                                                    :key="'level5'+level5.blm+index5+dataindex0"
                                                                                    :id="level5.blm+dataindex0"
                                                                                    :ref="level5.blm+dataindex0"
                                                                                    v-model="data0[level5.blm]"
                                                                                    v-bind="computeAttrs(level5,data0,index5,dataindex0)"
                                                                                    :style="computeStyle(level5,data0,index5,dataindex0)"
                                                                                    :class="componentClass[level5.blm]"
                                                                                    :list="list[level5.blm]"
                                                                                    :fathername="componentName"
                                                                                    :index="dataindex0"
                                                                                    :configdata="config[level5.blm]"
                                                                                    :propstocomponent="propstochild[level5.blm]"
                                                                                    @commonMethod="commitMethod"
                                                                                    @update:visible="data0[level5.blm] = false"
                                                                                    v-on="computeComponentEvent(level5,data0,index5,dataindex0)">
                                                                                    <template
                                                                                        v-if="config[level5.blm] && config[level5.blm].xscontent!=='0'">
                                                                                        {{level5.dataSource==='static' ?
                                                                                        level5.content :
                                                                                        data0[level5.blm]}}
                                                                                    </template>
                                                                                </component>
                                                                            </template>
                                                                        </template>
                                                                    </component>
                                                                </template>
                                                            </template>
                                                        </component>
                                                    </template>
                                                </template>
                                            </component>
                                        </template>
                                    </template>
                                </component>
                            </template>
                        </template>
                    </component>
                </template>
            </template>
        </template>
    </div>
</template>
<script>
    import Bus from '@/components/commonComponent/upload/js/bus' // 上传底层组件使用（勿删）
    import { mapState, mapActions, mapMutations } from 'vuex'

    export default {
        name: 'incocomponent',
        components: {},
        props: {
            value: { type: [Object, Array, String, Number, Boolean] },
            configdata: { type: Object, default: () => ({}) },
            propstocomponent: { type: Object, default: () => ({}) },
            index: { type: Number, default: null },
            fathername: { type: String }
        },
        data () {
            return {
                Bus,
                componentName: '',
                data: {},
                config: {}, // 每个组件的配置数据
                propstochild: {}, // 传递参数给子组件
                layoutConfig: [], // 用来循环布局的tree型数据
                function: {}, // 用来保存配置的方法
                list: {},
                componentClass: {},
                styles: {},
                attrs: {},
                vif: {},
                vshow: {},
                ref: this.$root.componentRefs,
                openStatus: true,
                tempdata: {}
            };
        },
        methods: {
            ...mapActions('admin/account', ['login', 'usernameLogin', 'logout']),
            test () {
                console.log(this.fathername, 'fathername')
                console.log(this.componentName, 'componentnAME')
                console.log(this.ref, 'ref')
                console.log(this.propstocomponent, 'propstocomponent')
                console.log(this.propstochild, 'propstochild')
                console.log(this.config, 'config')
                console.log(this.configdata, 'configdata')
                console.log(this.function, 'function')
                console.log(this.value, 'value')
                console.log(this.data, 'data')
                console.log(this.list, 'list')
                console.log(this.layoutConfig, 'layoutConfig')
                console.log(this.styles, 'styles')
                console.log(this.attrs, 'attrs')
                console.log(this.info, 'this.info')
                console.log(this.$option.components, '$option.components')
            },
            /**
             * 根据系统配置信息组件里面配置的开发环境，如果时开发环境，则显示调试的test按钮
             */
            env () {
                let returnValue = false
                const str = localStorage.getItem('incoenv')
                if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1)returnValue = true
                return returnValue
            },
            // 给propstochild 设置参数
            setPropsToComponent (str = '', obj = {}, replace = true) {
                let arr = []
                if (str) { arr = str.split(',') } else { arr = this.configArr }
                arr.forEach((res) => {
                    let propsObj = {}
                    if (!replace) propsObj = { ...this.propstochild[res], ...obj } // 保留了原来 路由传递过来的 参数
                    else propsObj = obj // 如果replace设置为true，将替代原来的已保存的变量
                    this.propstochild[res] = propsObj
                })
            },
            setProps (str = '', obj = {}, replace = true) {
                this.setPropsToComponent(str, obj, replace)
            },
            setprops (str = '', obj = {}, replace = true) {
                this.setPropsToComponent(str, obj, replace)
            },
            getProps (str = '') {
                if (str) return this.propstochild[str]
                else return this.propstochild
            },
            getprops (str) { this.getProps(str) },
            // 给所有的组件（除了布局layout组件）传递参数

            computeKyf (item, data = {}, itemindex, dataindex) {
                if (item.kyf && item.kyf === '0') returnValue = false
                let returnValue = this.vif[item.blm]
                try {
                    if (item.condition) {
                        const funcEval = new Function('_this', 'obj', item.condition)
                        const obj = { item, data, row: data, itemindex, rowindex: dataindex }
                        returnValue = funcEval(this, obj)
                    }
                    return returnValue
                } catch (e) {
                    console.log('错误信息：', item.blm, item, e)
                }
                return returnValue
            },
            /**
             *
             * @param {*} str 要设置的组件变量名的字符串，变量用‘，’隔开
             * @param {*} type ：vif和vshow，vif是对条件v-if设置，vshow是对组件的show属性设置
             * @param {*} setType ：false是只改变要设置的组件变量名，true是将其他组件设为相反值
             */
            async setAttrsConditionAndShow (str, type, booleanType, setType) {
                if (!str) return
                // 如果输入的字符串不为空
                const arr = str.split(',')
                let conditionAndShow = ''
                if (type === 'vshow') { conditionAndShow = 'vshow' }
                if (type === 'vif') { conditionAndShow = 'vif' }
                // 如setType选择为true，则将先将所有的设置为booleanType取反
                if (setType) {
                    const allComponent = Object.keys(this.config) || []
                    if (allComponent.length > 0) {
                        for (let i = 0; i < allComponent.length; i++) {
                            this[conditionAndShow][allComponent[i]] = !booleanType
                        }
                    }
                }
                for (let i = 0; i < arr.length; i++) {
                    this[conditionAndShow][arr[i]] = booleanType
                }
            },
            /**
             *
             * @param {*} str 为要
             * @param {*} booleanType
             * @param {*} setType
             */
            async setvif (str, booleanType = true, setType = false) {
                await this.setAttrsConditionAndShow(str, 'vif', booleanType, setType)
            },
            async setVif (str, booleanType = true, setType = false) {
                await this.setAttrsConditionAndShow(str, 'vif', booleanType, setType)
            },
            async setvshow (str, booleanType = true, setType = false) {
                await this.setAttrsConditionAndShow(str, 'vshow', booleanType, setType)
            },
            async setvShow (str, booleanType = true, setType = false) {
                await this.setAttrsConditionAndShow(str, 'vshow', booleanType, setType)
            },

            // 计算组件事件
            computeComponentEvent (item, data, itemindex, dataindex) {
                const newItem = item
                const eventObj = {}
                if (item.componentEvent && item.componentEvent.length > 0) {
                    item.componentEvent.forEach((res) => {
                        eventObj[res.name] = (value1, value2, value3, value4, value5, $event) => {
                            const event = $event
                            if (event && event.stopPropagation) event.stopPropagation()// 防止冒泡
                            const obj = { item: newItem, data: this.data, row: data, itemindex, rowindex: dataindex, event, value1, value2, value3, value4, value5 }
                            if (res.eventInside) {
                                const funcEval = new Function('_this', 'obj', res.eventInside)
                                funcEval(this, obj) // 执行内部方法
                            }
                            if (newItem.eventOutside) obj.method = res.eventOutside
                            this.$emit('commonMethod', obj) // 导出外部执行方法
                        }
                    })
                }
                return eventObj
            },
            computeMainStyleMethod () {
                let obj = {}
                let newStyle = {}
                const style = this.configdata.style || {}
                if (this.configdata.mainStyleMethod) {
                    const funcEval = new Function('_this', 'obj', this.configdata.mainStyleMethod)
                    newStyle = funcEval(this, {})
                }
                obj = { ...style, ...newStyle }
                return obj
            },
            // 计算组件的样式
            computeStyle (item, data = {}, itemindex, dataindex) {
                try {
                    let obj = {}
                    let newStyle = {}
                    // 兼容数组格式和对象格式的style
                    const baseStyle = this.styles[item.blm] || {}
                    if (Array.isArray(baseStyle) && baseStyle.length > 0) {
                        baseStyle.forEach((styleItem) => {
                            if (styleItem.key && styleItem.key.trim() && styleItem.label !== undefined) {
                                if (styleItem.valueType === 'number') obj[styleItem.key.trim()] = Number(styleItem.label)
                                else obj[styleItem.key.trim()] = styleItem.label
                            }
                        })
                    } else if (baseStyle && typeof baseStyle === 'object') {
                        obj = { ...baseStyle }
                    }
                    if (item.styleMethod) {
                        const funcEval = new Function('_this', 'obj', item.styleMethod)
                        newStyle = funcEval(this, { item, row: data, data, itemindex, rowindex: dataindex })
                    }
                    obj = { ...obj, ...newStyle }
                    return obj
                } catch (error) {
                    console.log(item, error, '页面计算组件的样式错误')
                }
            },
            // 计算组件的属性
            computeAttrs (item, data = {}, itemindex, dataindex) {
                let obj = {}
                let newAttrs = {}
                // 兼容数组格式和对象格式的attrs
                const baseAttrs = this.attrs[item.blm] || {}
                if (Array.isArray(baseAttrs) && baseAttrs.length > 0) {
                    baseAttrs.forEach((attrItem) => {
                        if (attrItem.key && attrItem.key.trim() && attrItem.label !== undefined) {
                            if (attrItem.valueType === 'number') obj[attrItem.key.trim()] = Number(attrItem.label)
                            else if (attrItem.valueType === 'boolean') obj[attrItem.key.trim()] = attrItem.label === 'true' || attrItem.label === '1'
                            else obj[attrItem.key.trim()] = attrItem.label
                        }
                    })
                } else if (baseAttrs && typeof baseAttrs === 'object') {
                    obj = { ...baseAttrs }
                }
                if (item.attrsMethod) {
                    try {
                        const funcEval = new Function('_this', 'obj', item.attrsMethod)
                        newAttrs = funcEval(this, { item, row: data, data, itemindex, rowindex: dataindex })
                    } catch (e) { console.log(e, item) }
                }
                obj = { ...obj, ...newAttrs }
                return obj
            },

            // 初始化组件的信息
            async initComponentInfo (item) {
                this.vif[item.blm] = true
                if (item.vifCondition === '0') this.vif[item.blm] = false
                this.vshow[item.blm] = true
                if (item.isShow === '0') this.vshow[item.blm] = false
                const lx = item.lx || item.componentType
                const yyzj = ['collection', 'incocomponent', 'newpage', 'renderpage', 'jtable', 'jform']
                if (item.yyid && yyzj.includes(lx)) {
                    if (item.hqpzfs == 'father') {
                        Object.assign(item, await this.getYyzjConfig(item))
                        item.hqpzfs = 'father'
                    } else item.hqpzfs = 'query'
                }
                this.config[item.blm] = item
                if (item.yyzjmc && item.yyzjmc.trim()) {
                    await this.commonsJs.zjRegisterOne(item, this)
                }
                if (item.style && Object.keys(item.style).length > 0) {
                    this.styles[item.blm] = item.style
                }// 初始化样式
                if (item.attrs && Object.keys(item.attrs).length > 0) this.attrs[item.blm] = item.attrs // 初始化属性
                if (item.className && item.className.trim()) this.componentClass[item.blm] = item.className.trim()
                else this.componentClass[item.blm] = item.blm // 初始化class名
                if (item.list) this.list[item.blm] = this.commonsJs.funcEval1(this, {}, item.list) // 初始化list
                if (item.queryId && item.queryType && item.queryId) this.query(item.queryType, item.queryId, {}, item.blm)
            },
            init (initMethod) {
                // console.log(initMethod,'initMethod')
                this.commonsJs.funcEval(this, { data: this.data }, initMethod)
            },
            /** 将组件初始化，清空组件相关数据
             * 清空内容：data,list,config,style,attrs,componentClass
             */
            reset () {
                this.data = {}
                this.list = {}
                this.config = {}
                this.styles = {}
                this.attrs = {}
                this.componentClass = {}
                this.propstochild = {}
                this.function = {}
            },
            open () {
                if (this.configdata.resetData != '0') this.reset()
            },

            query (queryType = '', sqlid = '', obj, blm) {
                if (!queryType || !sqlid || !blm) return
                let param = {}
                if (obj && Object.keys(obj).length > 0) param = obj
                else if (this.configdata.queryParams && this.configdata.queryParams.trim()) {
                    try { param = this.commonsJs.funcEval1(this, {}, this.configdata.queryParams) } catch (e) { console.log('组件查询参数错误：', this.componentName, this.configdata.queryParams) }
                }
                if (queryType === 'querybypage') {
                    if (Object.keys(obj).length == 0) { if (!obj.pageNumber) param.pageNumber = 1 }
                    if (!obj.pageSize) param.pageSize = 5
                }
                try {
                    this.commonsJs.incoRequest(queryType, sqlid, obj).then((res) => {
                        if (queryType === 'querylist') this.data[blm] = res
                        if (queryType === 'querybypage') {
                            if (blm) {
                                this.data[blm] = res.list
                                if (param.pageName) this.data[param.pageName] = { total: res.total, pageSize: res.pageSize, pageNumber: res.pageNumber }
                                else this.data.pageInfo = res.pageInfo
                            } else this.data = res
                        }
                        if (queryType === 'queryone') this.data[blm] = res
                    })
                } catch (e) {
                    console.log('前端组件queryid错误：', blm, 'sqlid:', sqlid, '类型：', queryType)
                }
            },
            commitMethod (obj) {
                // let obj=JSON.parse(JSON.stringify(newObj))
                if (obj.method) {
                    if (!obj.componentName || obj.componentName === this.componentName) this.commonsJs.funcEval(this, obj, obj.method)
                    else this.$emit('commonMethod', obj)
                }
            },
            // 生成自定义方法，并放在function中
            async createFunction (list) {
                const _this = this
                if (this.configdata.registerMethods && this.configdata.registerMethods.trim()) {
                    const methodsArr = this.configdata.registerMethods.replace(' ', '').split(',')
                    const notExistMethods = []
                    for (let i = 0; i < methodsArr.length; i++) {
                        const item = methodsArr[i]
                        if (this.$root.functionMethods[item]) list.push({ name: item, buttonClick: this.$root.functionMethods[item] })
                        else notExistMethods.push(item)
                    }
                    if (notExistMethods.length > 0) {
                        const queryList = await this.commonsJs.incoRequest('querylist', 'get_tyfuncion_from_other_xm', { list: notExistMethods })
                        for (let i = 0; i < queryList.length; i++) {
                            const item = queryList[i]
                            this.$root.functionMethods[item.ffm] = item.fft
                            list.push({ name: item.ffm, buttonClick: item.fft })
                        }
                    }
                }
                for (let i = 0; i < list.length; i++) {
                    const item = list[i]
                    if (item.name && item.buttonClick) {
                        try {
                            const func = eval(item.buttonClick)
                            this.function[item.name] = func
                        } catch (e) {
                            console.log('创建方法时发生错误：createFunction', item.name, e)
                        }
                    }
                }
            },

            // setValue(name,data
            setValue (name, data, blm) {
                if (!name) return
                let method = ''
                if (blm) method = `_this.data['${blm}'] = obj`
                else method = '_this.data = obj'
                this.triggerFunction(name, method, data)
            },
            /**
             * 获取name传入名称的组件数据
             * @param {*} name 组件的名称
             * @param {*} blm data里面的变量名，如果不填，则返回data
             */
            getValue (name, blm) {
                if (blm) return this.ref[name].data[blm]
                else return this.ref[name].data
            },
            triggerFunction (blm, method, obj) {
                this.$root.componentsParam[blm] = [{ blm, method, obj }]
            },
            // 此方法是用来根据triggerFunction，来触发本地的方法
            handleRootFunction (list) {
                if (list.length === 0) return
                list.forEach((item) => {
                    if (item.method && item.method.trim()) {
                        const funcEval = new Function('_this', 'obj', item.method)
                        funcEval(this, item.obj)
                    }
                })
            },
            // 此功能通过id查询获取组件或者是页面的配置信息
            async getConfigById (item, name) {
                const res = await this.commonsJs.getzjpzxx(item.yyid)
                await this.getConfig(res, name)
            },
            // 根据组件的配置信息生成组件配置
            async getConfig (n, name) {
                if (!name) return
                this.componentName = name
                if (this.index) this.componentName = name + this.index
                let zjpzxx_obj = n
                if (n.zjpzxx) zjpzxx_obj = JSON.parse(n.zjpzxx)
                // 创建class
                if (zjpzxx_obj.createClass) this.commonsJs.loadCssCode(zjpzxx_obj.createClass, this.componentName)
                // 计算主框架style样式
                if (zjpzxx_obj.style) this.styles[zjpzxx_obj.blm] = zjpzxx_obj.style
                if (zjpzxx_obj.function && zjpzxx_obj.function.length > 0) { await this.createFunction(zjpzxx_obj.function) } // 创建配置的方法
                let list = []
                if (zjpzxx_obj.layoutConfig && zjpzxx_obj.layoutConfig.length > 0) list = this.commonsJs.treeToList(zjpzxx_obj.layoutConfig)
                else if (zjpzxx_obj.configList && zjpzxx_obj.configList.length > 0) list = this.commonsJs.treeToList(zjpzxx_obj.configList)
                const layoutTree = []
                for (let i = 0; i < list.length; i++) {
                    const item = list[i]
                    if (item.kyf != '0') {
                        this.initComponentInfo(item)
                        layoutTree.push(item)
                    }
                }
                // 全局注册选择组件库中的组件
                if (zjpzxx_obj.registerComponent) {
                    const selfComponent = zjpzxx_obj.registerComponent.replace(' ', '').split(',')
                    await this.commonsJs.registerComponent(selfComponent, this)
                }
                const layout = this.commonsJs.listToTree(layoutTree)
                if (zjpzxx_obj.initMethod) this.init(zjpzxx_obj.initMethod)
                this.layoutConfig = layout
            },
            // 获取collection的配置信息
            async getYyzjConfig (item) {
                const configObj = await this.commonsJs.getzjpzxx(item.yyid);
                configObj.blm = item.blm
                configObj.fid = item.fid
                if (configObj.lx) configObj.componentType = configObj.lx
                return configObj
            }
        },
        computed: {
            ...mapState('admin/user', ['info']),
            ...mapState('admin/layout', ['isMobile', 'logoutConfirm'])
        },
        watch: {
            configdata: {
                handler (n, o) {
                    this.data.componentName = n.blm
                    this.open()
                    if (n.hqpzfs === 'query') {
                        if (!n.yyid) n.yyid = n.id
                        this.getConfigById(n, n.blm)
                    } else {
                        this.getConfig(n, this.configdata.blm)
                    }
                    if (n.configdataChangeMethod) this.commonsJs.funcEval(this, { configdata: n }, n.configdataChangeMethod)
                },
                deep: true,
                immediate: true
            },
            '$root.componentsParam': {
                handler (n, o) {
                    if (n[this.componentName]) {
                        const myComponentsParam = JSON.parse(JSON.stringify(n[this.componentName]))
                        delete n[this.componentName]
                        this.handleRootFunction(myComponentsParam)
                    }
                },
                deep: true,
                immediate: true
            },
            componentName: {
                handler (n, o) {
                    if (n) {
                        // this.$nextTick(()=>{
                        if (!this.$root.componentRefs) { this.$root.componentRefs = {} }
                        this.$root.componentRefs[this.componentName] = this
                    // })
                    }
                },
                deep: true,
                immediate: true
            },
            propstocomponent: {
                handler (n, o) {
                    if (this.configdata.propstocomponentChangeMethod) this.commonsJs.funcEval(this, { propstocomponent: n }, this.configdata.propstocomponentChangeMethod)
                },
                deep: true,
                immediate: true
            },
            data: {
                handler (n, o) {
                    if (this.configdata.dataChangeMethod) this.commonsJs.funcEval(this, { data: this.data }, this.configdata.dataChangeMethod)
                },
                deep: true,
                immediate: true
            },
            value: {
                handler (n, o) {
                    if (n && this.configdata.valueChange) {
                        this.commonsJs.funcEval1(this, { value: n, oldValue: o }, this.configdata.valueChange)
                    }
                },
                deep: true,
                immediate: true
            }

        },

        mounted () {
            if (this.configdata.mountedMethod) this.commonsJs.funcEval1(this, {}, this.configdata.mountedMethod)
        },
        created () {
            if (this.configdata.createdMethod) this.commonsJs.funcEval1(this, {}, this.configdata.createdMethod)
        },
        updated () {
            // 监测根的传递参数的变化，如果变化了，看是否有本组件的数据，如果有本组件的数据，调用处理
            if (this.$root.componentsParam[this.componentName]) {
                const myComponentsParam = JSON.parse(JSON.stringify(this.$root.componentsParam[this.componentName]))
                delete this.$root.componentsParam[this.componentName]
                this.handleRootFunction(myComponentsParam)
            }
        },
        beforeUnmount () {
            delete this.$root.componentRefs[this.componentName]
            this.commonsJs.removeCssCode(this.componentName)
        }

    };
</script>
<style>
.incocomponent-main{
    overflow-y: auto;
}
.incocomponent-main::-webkit-scrollbar{
    width:6px;
    height:6px;
    }
/*正常情况下滑块的样式*/
.incocomponent-main::-webkit-scrollbar-thumb{
    background-color:rgba(0,0,0,.05);
    border-radius:6px;
    -webkit-box-shadow:inset1px1px0rgba(0,0,0,.1);
    }
    /*鼠标悬浮在该类指向的控件上时滑块的样式*/
    .incocomponent-main:hover::-webkit-scrollbar-thumb{
    background-color:rgba(0,0,0,.2);
    border-radius:6px;
    -webkit-box-shadow:inset1px1px0rgba(0,0,0,.1);
    }
    /*鼠标悬浮在滑块上时滑块的样式*/
    .incocomponent-main::-webkit-scrollbar-thumb:hover{
    background-color:rgba(0,0,0,.4);
    -webkit-box-shadow:inset1px1px0rgba(0,0,0,.1);
    }
    /*正常时候的主干部分*/
    .incocomponent-main::-webkit-scrollbar-track{
    border-radius:6px;
    -webkit-box-shadow:inset006pxrgba(0,0,0,0);
    background-color:white;
    }
    /*鼠标悬浮在滚动条上的主干部分*/
    .incocomponent-main::-webkit-scrollbar-track:hover{
    -webkit-box-shadow:inset006pxrgba(0,0,0,.4);
    background-color:rgba(0,0,0,.01);
    }
</style>
