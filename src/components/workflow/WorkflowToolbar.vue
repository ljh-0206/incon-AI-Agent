<template>
  <div class="workflow-toolbar">
    <!-- 左侧：返回和标题 -->
    <div class="toolbar-left">
      <Button text @click="$emit('back')">
        <i class="fa-solid fa-arrow-left"></i>
      </Button>
      
      <div class="workflow-title" v-if="workflow">
        <span class="title-text">{{ workflow.name }}</span>
        <Tag v-if="workflow.status === 1" type="success" size="small">已发布</Tag>
        <Tag v-else type="info" size="small">草稿</Tag>
        <span v-if="hasChanges" class="unsaved-indicator">
          <i class="fa-solid fa-circle"></i> 未保存
        </span>
      </div>
    </div>

    <!-- 中间：视图控制 -->
    <div class="toolbar-center">
      <ButtonGroup>
        <Tooltip content="放大">
          <Button @click="$emit('zoom-in')" :icon="ZoomIn" />
        </Tooltip>
        <Tooltip content="缩小">
          <Button @click="$emit('zoom-out')" :icon="ZoomOut" />
        </Tooltip>
        <Tooltip content="适应画布">
          <Button @click="$emit('fit-view')" :icon="FullScreen" />
        </Tooltip>
      </ButtonGroup>
      
      <Divider direction="vertical" />
      
      <ButtonGroup>
        <Tooltip content="撤销 (Ctrl+Z)">
          <Button @click="$emit('undo')" :disabled="!canUndo">
            <i class="fa-solid fa-rotate-left"></i>
          </Button>
        </Tooltip>
        <Tooltip content="重做 (Ctrl+Y)">
          <Button @click="$emit('redo')" :disabled="!canRedo">
            <i class="fa-solid fa-rotate-right"></i>
          </Button>
        </Tooltip>
      </ButtonGroup>
    </div>

    <!-- 右侧：操作按钮 -->
    <div class="toolbar-right">
      <!-- 调试模式开关 -->
      <Switch
        v-model="debugModeLocal"
        active-text="调试"
        inactive-text=""
        @on-change="$emit('update:debugMode', $event)"
        style="margin-right: 16px;"
      />
      
      <!-- 运行按钮 -->
      <Button 
        type="success" 
        @click="$emit('run')"
        :loading="running"
        :disabled="running"
      >
        <i class="fa-solid fa-play"></i>
        {{ running ? '运行中...' : '运行' }}
      </Button>
      
      <!-- 保存按钮 -->
      <Button 
        type="primary" 
        @click="$emit('save')"
        :loading="saving"
      >
        <i class="fa-solid fa-floppy-disk"></i>
        保存
      </Button>
      
      <!-- 更多操作 -->
      <Dropdown trigger="click" @command="handleCommand">
        <Button>
          <i class="fa-solid fa-ellipsis-v"></i>
        </Button>
        <template #dropdown>
          <DropdownMenu>
            <DropdownItem command="publish">
              <i class="fa-solid fa-rocket"></i> 发布
            </DropdownItem>
            <DropdownItem command="history" divided>
              <i class="fa-solid fa-clock-rotate-left"></i> 执行历史
            </DropdownItem>
            <DropdownItem command="versions">
              <i class="fa-solid fa-code-branch"></i> 版本管理
            </DropdownItem>
            <DropdownItem command="export" divided>
              <i class="fa-solid fa-file-export"></i> 导出
            </DropdownItem>
            <DropdownItem command="import">
              <i class="fa-solid fa-file-import"></i> 导入
            </DropdownItem>
            <DropdownItem command="ai-generate" divided>
              <i class="fa-solid fa-wand-magic-sparkles"></i> AI 生成
            </DropdownItem>
            <DropdownItem command="delete" divided>
              <i class="fa-solid fa-trash" style="color: #f56c6c;"></i>
              <span style="color: #f56c6c;">删除工作流</span>
            </DropdownItem>
          </DropdownMenu>
        </template>
      </Dropdown>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  workflow: Object,
  hasChanges: Boolean,
  running: Boolean,
  saving: Boolean,
  debugMode: Boolean,
  canUndo: Boolean,
  canRedo: Boolean
})

const emit = defineEmits([
  'back', 'save', 'run', 'publish',
  'zoom-in', 'zoom-out', 'fit-view',
  'undo', 'redo',
  'history', 'versions', 'export', 'import', 'delete', 'ai-generate',
  'update:debugMode'
])

const debugModeLocal = ref(props.debugMode)

watch(() => props.debugMode, (val) => {
  debugModeLocal.value = val
})

const handleCommand = (command) => {
  emit(command)
}
</script>

<style scoped>
.workflow-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  height: 56px;
  box-sizing: border-box;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.workflow-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.unsaved-indicator {
  font-size: 12px;
  color: #e6a23c;
  display: flex;
  align-items: center;
  gap: 4px;
}

.unsaved-indicator i {
  font-size: 6px;
}

.toolbar-center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
