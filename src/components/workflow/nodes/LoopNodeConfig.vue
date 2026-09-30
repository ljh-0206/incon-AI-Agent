<template>
  <div class="loop-config">
    <!-- 循环列表变量 -->
    <FormItem label="循环列表变量">
      <Select :transfer="true" 
        v-model="localConfig.listVariable" 
        placeholder="选择要遍历的列表变量"
        @on-change="emitUpdate"
        filterable
        allow-create
      >
        <Option
          v-for="v in availableVariables"
          :key="v"
          :label="v"
          :value="v"
        />
      </Select>
      <div class="param-hint">选择包含列表数据的变量</div>
    </FormItem>

    <!-- 当前项变量名 -->
    <FormItem label="当前项变量名">
      <Input 
        v-model="localConfig.itemVariable" 
        placeholder="item"
        @on-blur="emitUpdate"
      />
      <div class="param-hint">循环体内访问当前元素的变量名</div>
    </FormItem>

    <!-- 索引变量名 -->
    <FormItem label="索引变量名">
      <Input 
        v-model="localConfig.indexVariable" 
        placeholder="index"
        @on-blur="emitUpdate"
      />
      <div class="param-hint">循环体内访问当前索引的变量名</div>
    </FormItem>

    <!-- 输出变量名 -->
    <FormItem label="输出变量名">
      <Input 
        v-model="localConfig.outputVariable" 
        placeholder="loop_results"
        @on-blur="emitUpdate"
      />
      <div class="param-hint">循环结果列表的变量名</div>
    </FormItem>

    <!-- 最大迭代次数 -->
    <FormItem label="最大迭代次数">
      <InputNumber 
        v-model="localConfig.maxIterations" 
        :min="1" 
        :max="1000"
        @on-change="emitUpdate"
      />
      <div class="param-hint">防止无限循环的保护机制</div>
    </FormItem>

    <!-- 使用说明 -->
    <Alert
      type="info"
      :closable="false"
      style="margin-top: 16px;"
    >
      <template #title>
        <strong>循环节点使用说明：</strong>
        <br/>1. <strong>loop</strong> 句柄：连接到循环体的第一个节点
        <br/>2. <strong>done</strong> 句柄：连接到循环结束后要执行的节点
        <br/>3. 循环体最后一个节点需要连接回此循环节点
      </template>
    </Alert>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  config: Object,
  availableVariables: Array
})

const emit = defineEmits(['update:config'])

const localConfig = reactive({
  listVariable: '',
  itemVariable: 'item',
  indexVariable: 'index',
  outputVariable: 'loop_results',
  maxIterations: 100
})

watch(() => props.config, (newConfig) => {
  if (newConfig) {
    Object.assign(localConfig, newConfig)
  }
}, { immediate: true, deep: true })

const emitUpdate = () => {
  emit('update:config', { ...localConfig })
}
</script>

<style scoped>
.loop-config {
  padding: 8px 0;
}

.param-hint {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}
</style>
