<template>
  <Modal
    :model-value="modelValue"
    title="选择规则模板"
    width="700"
    footer-hide
    :mask-closable="false"
    @on-cancel="handleCancel"
  >
    <div class="template-list">
      <div
        v-for="tmpl in templates"
        :key="tmpl.type"
        class="template-card"
        :class="{ selected: selectedType === tmpl.type }"
        @click="selectedType = tmpl.type"
      >
        <div class="template-icon">{{ tmpl.icon }}</div>
        <div class="template-info">
          <div class="template-name">
            {{ tmpl.name }}
            <span v-if="tmpl.subName" class="template-subname">({{ tmpl.subName }})</span>
          </div>
          <div class="template-desc">{{ tmpl.description }}</div>
        </div>
        <div class="template-check" v-if="selectedType === tmpl.type">
          <Icon type="md-checkmark-circle" color="#57a3f3" />
        </div>
      </div>
    </div>
    <div slot="footer" style="text-align: right;margin-top: 20px;">
      <Button type="default" @click="handleCancel">取消</Button>
      <Button type="primary" @click="handleConfirm" style="margin-left: 10px;" :disabled="!selectedType">使用模板</Button>
    </div>
  </Modal>
</template>

<script>
import { getAllTemplates, getTemplate } from '../utils/templateLoader.js'

export default {
  name: 'RuleTemplate',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'select'],
  data() {
    return {
      templates: getAllTemplates(),
      selectedType: null
    }
  },
  methods: {
    handleCancel() {
      console.log('>>>>>> [handleCancel] emitting update:modelValue, false, current modelValue:', this.modelValue)
      this.$emit('update:modelValue', false)
    },
    handleConfirm() {
      if (this.selectedType) {
        const template = getTemplate(this.selectedType)
        this.$emit('select', template)
        this.$emit('update:modelValue', false)
      }
    }
  }
}
</script>

<style lang="less" scoped>
.template-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  .template-card {
    display: flex;
    align-items: center;
    padding: 16px;
    background: #f5f5f5;
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #e8e8e8;
    }

    &.selected {
      border-color: #57a3f3;
      background: #f0f7ff;
    }

    .template-icon {
      font-size: 32px;
      margin-right: 16px;
    }

    .template-info {
      flex: 1;

      .template-name {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;

        .template-subname {
          font-size: 12px;
          font-weight: normal;
          color: #999;
          margin-left: 4px;
        }
      }

      .template-desc {
        font-size: 12px;
        color: #666;
      }
    }

    .template-check {
      margin-left: 12px;
    }
  }
}
</style>
