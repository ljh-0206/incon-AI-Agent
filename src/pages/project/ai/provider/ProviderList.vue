<template>
  <div class="ai-llm-provider-list">
    <Spin v-if="loading" fix>加载中...</Spin>

    <div class="sub-title-row">
      <h3 class="sub-title">供应商管理</h3>
      <div class="sub-title-actions">
        <Button type="primary" icon="md-add" @click="openAddModal">添加供应商</Button>
      </div>
    </div>

    <Table :columns="columns" :data="localData" border>
      <template #provider_type="{ row }">
        <Tag :color="row.provider_type === 'system' ? 'primary' : 'default'">
          {{ row.provider_type === 'system' ? '系统预设' : '自定义' }}
        </Tag>
      </template>
      <template #quota="{ row }">
        <span v-if="row.quota_type === 'unlimited'">不限</span>
        <span v-else>{{ row.quota_used || 0 }} / {{ row.quota_limit || 0 }}</span>
      </template>
      <template #is_default="{ row }">
        <Tag v-if="row.is_default === '1'" color="success">默认</Tag>
        <span v-else>-</span>
      </template>
      <template #status="{ row }">
        <Tag :color="row.status === 'enabled' ? 'success' : 'default'">
          {{ row.status === 'enabled' ? '启用' : '禁用' }}
        </Tag>
      </template>
      <template #action="{ row, index }">
        <Button type="text" style="color:#2d8cf0" @click="goModel(row)">模型</Button>
        <Button type="text" style="color:#2d8cf0" @click="handleSetDefault(row)">设默认</Button>
        <Button type="text" style="color:#2d8cf0" @click="openEditModal(row, index)">编辑</Button>
        <Button type="text" style="color:#ed4014" @click="handleDelete(index)">删除</Button>
      </template>
    </Table>

    <jform
      ref="jform"
      :model-value="modalVisible"
      :configdata="jformConfig"
      :propstocomponent="jformProps"
      @update:visible="modalVisible = $event"
      @closemodal="onFormClosed"
    ></jform>

    <!-- 模型管理弹窗（点击「模型」弹出，不跳路由） -->
    <Modal v-model="modelModalVisible" title="模型管理" fullscreen footer-hide>
      <AiLlmModelList
        v-if="modelModalVisible"
        :provider-id="modelProviderId"
      />
    </Modal>
  </div>
</template>

<script>
    import AiLlmModelList from './ModelList.vue';

    export default {
        name: 'AiLlmProviderList',
        components: { AiLlmModelList },

        data () {
            // ========== SQL ID（真实值，见 DATA_MAPPING.md） ==========
            const listQueryId = '59FF70BC80B68429E0631E01A8C079B5'; // 供应商列表
            const queryFormId = '59FF70BC80B78429E0631E01A8C079B5'; // 供应商单条
            const insertId = '59FF70BC80B88429E0631E01A8C079B5'; // 新增
            const updateFormId = '59FF70BC80B98429E0631E01A8C079B5'; // 修改（密钥空不覆盖）
            const deleteId = '59FF70BC80BA8429E0631E01A8C079B5'; // 删除
            const modelListId = '59FF70BC80BB8429E0631E01A8C079B5'; // 模型列表（级联删除用）
            const modelDeleteId = '59FF70BC80BF8429E0631E01A8C079B5'; // 模型删除（级联删除用）
            return {
                loading: false,
                modalVisible: false,
                modelModalVisible: false,
                modelProviderId: '',
                editIndex: -1,
                localData: [],
                columns: [
                    { title: '供应商名称', key: 'provider_label', minWidth: 160 },
                    { title: '标识', key: 'provider_name', width: 120 },
                    { title: '类型', slot: 'provider_type', width: 100 },
                    { title: '协议风格', key: 'api_style', width: 170 },
                    { title: '接口地址', key: 'base_url', minWidth: 200 },
                    { title: '配额', slot: 'quota', width: 120 },
                    { title: '默认', slot: 'is_default', width: 80 },
                    { title: '状态', slot: 'status', width: 90 },
                    { title: '操作', slot: 'action', width: 260 }
                ],
                listQueryId,
                deleteId,
                updateFormId,
                modelListId,
                modelDeleteId,

                jformConfig: {
                    blm: 'ai_llm_provider_form',
                    modalType: 'Modal',
                    modalWidth: '100%',
                    modalAttrs: { fullscreen: true },
                    opentype: '',
                    formId: '',
                    buttonsPosition: 'header',
                    buttonConfig: [
                        { blm: 'save', content: '确定', attrs: { type: 'primary' } },
                        { blm: 'cancel', content: '取消', attrs: { type: 'warning' } }
                    ],
                    formAttrs: { 'label-width': 130, 'label-position': 'right' },
                    modalTitle: { addTitle: '添加供应商', editTitle: '编辑供应商' },
                    funcId: { queryFormId, insertId, updateFormId },
                    // 新增必填：docker 三段式布局下 form-item 的 prop 绑定在容器 blm（docker_xxx），
                    // 与 rules 的字段名（api_key）不匹配，iView 不触发校验；故用 validMethod 兜底。
                    // 编辑留空：beforeEdit 显式 delete 空 api_key/api_secret，确保不传给后端，
                    // 由 SQL decode(#{api_key}, null, api_key, #{api_key}) 保留原值（空→取列原值，非空→用新值）。
                    validMethod: "if(_this.opentype==='add'&&!obj.api_key){return {flag:false,message:'API Key 必填'}};return {flag:true}",
                    beforeAdd: "if(obj.api_key)obj.api_key=_this.commonsJs.encrypt_aes(obj.api_key);if(obj.api_secret)obj.api_secret=_this.commonsJs.encrypt_aes(obj.api_secret);return obj",
                    beforeEdit: "if(obj.api_key){obj.api_key=_this.commonsJs.encrypt_aes(obj.api_key)}else{delete obj.api_key}if(obj.api_secret){obj.api_secret=_this.commonsJs.encrypt_aes(obj.api_secret)}else{delete obj.api_secret}return obj",
                    rules: {
                        provider_name: [{ required: true, message: '供应商标识 必填', trigger: 'change' }],
                        provider_label: [{ required: true, message: '供应商名称 必填', trigger: 'change' }],
                        api_style: [{ required: true, message: '协议风格 必填', trigger: 'change' }],
                        status: [{ required: true, message: '状态 必填', trigger: 'change' }],
                        api_key: []
                    },
                    // 每个字段一个 docker：左侧 label（字段名），中间输入框，右侧 span 帮助文本
                    fields: [
                        {
                            blm: 'docker_provider_name', mc: '供应商标识', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'provider_name', componentType: 'i-input', attrs: { placeholder: '如 deepseek、qwen、zhipu' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_provider_name', componentType: 'span', content: '系统内唯一英文标识，如 deepseek', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_provider_label', mc: '供应商名称', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'provider_label', componentType: 'i-input', attrs: { placeholder: '如 深度求索 DeepSeek' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_provider_label', componentType: 'span', content: '界面展示用，如「深度求索 DeepSeek」', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_provider_type', mc: '类型', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'provider_type', componentType: 'jselect', attrs: { transfer: true, disabled: true }, list: [
                                    { value: 'system', label: '系统预设' }, { value: 'custom', label: '自定义' }
                                ], style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_provider_type', componentType: 'span', content: '系统预设/自定义，新增默认自定义', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_api_style', mc: '协议风格', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'api_style', componentType: 'jselect', default: 'openai_compatible', attrs: { transfer: true }, list: [
                                    { value: 'openai_compatible', label: 'OpenAI 兼容' },
                                    // { value: 'anthropic', label: 'Anthropic' },
                                    // { value: 'native', label: '原生协议' }
                                ], style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_api_style', componentType: 'span', content: '目前支持OpenAI兼容', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_model_prefix', mc: '模型前缀', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'model_prefix', componentType: 'i-input', attrs: { placeholder: '空则直接用模型标识' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_model_prefix', componentType: 'span', content: '调用时拼在模型名前，一般留空', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_base_url', mc: '接口地址', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'base_url', componentType: 'i-input', attrs: { placeholder: '如 https://api.deepseek.com/v1' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_base_url', componentType: 'span', content: 'API 根地址，填到 /v1', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_api_key', mc: 'API Key', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'api_key', componentType: 'i-input', attrs: { type: 'password', placeholder: '新增必填，编辑留空则保留原值' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_api_key', componentType: 'span', content: '新增必填，编辑留空保留原值，加密入库', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_api_secret', mc: 'API Secret', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'api_secret', componentType: 'i-input', attrs: { type: 'password', placeholder: '可选，编辑留空则保留原值' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_api_secret', componentType: 'span', content: '可选，多数供应商不需要', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_quota_type', mc: '配额类型', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'quota_type', componentType: 'jselect', attrs: { transfer: true }, list: [
                                    { value: 'unlimited', label: '不限' }, { value: 'quota', label: '配额限制' }
                                ], style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_quota_type', componentType: 'span', content: '不限 或 限额', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_quota_limit', mc: '配额上限', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'quota_limit', componentType: 'input-number', attrs: { min: 0, precision: 0, placeholder: '仅配额类型为 quota 时填数字' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_quota_limit', componentType: 'span', content: '仅限额时填数字', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_quota_used', mc: '已用配额', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'quota_used', componentType: 'input-number', attrs: { min: 0, precision: 0, disabled: true }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_quota_used', componentType: 'span', content: '网关回写，只读', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_is_default', mc: '是否默认', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'is_default', componentType: 'jselect', attrs: { transfer: true }, list: [
                                    { value: '1', label: '是' }, { value: '0', label: '否' }
                                ], style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_is_default', componentType: 'span', content: '作为网关缺省路由对象', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_sort_order', mc: '排序', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'sort_order', componentType: 'input-number', attrs: { min: 0, precision: 0, placeholder: '数字，越小越靠前' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_sort_order', componentType: 'span', content: '数字越小越靠前', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_status', mc: '状态', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'status', componentType: 'jselect', attrs: { transfer: true }, list: [
                                    { value: 'enabled', label: '启用' }, { value: 'disabled', label: '禁用' }
                                ], style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_status', componentType: 'span', content: '启用/禁用', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_description', mc: '描述', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'description', componentType: 'i-input', attrs: { placeholder: '请输入描述' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_description', componentType: 'span', content: '备注，选填', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        }
                    ]
                },
                jformProps: {}
            };
        },

        mounted () {
            this.loadData();
        },

        methods: {
            async loadData () {
                this.loading = true;
                try {
                    const res = await this.commonsJs.incoRequest(
                        'querylist',
                        this.listQueryId,
                        {}
                    );
                    this.localData = Array.isArray(res) ? res : [];
                } catch (e) {
                    this.$Message.error('加载供应商失败');
                } finally {
                    this.loading = false;
                }
            },

            onFormClosed () {
                this.loadData();
            },

            // 弹出该供应商下的模型列表（弹窗，不跳路由）
            goModel (row) {
                this.modelProviderId = row.id;
                this.modelModalVisible = true;
            },

            openAddModal () {
                this.editIndex = -1;
                // 新增：默认自定义供应商（系统预设由 04_供应商系统预设.sql 预置在库，编辑填 key 即可）
                // API Key 必填由 jformConfig.validMethod 兜底（docker 三段式下 rules 不触发，见 validMethod 注释）
                this.jformProps = {
                    provider_type: 'custom',
                    api_style: 'openai_compatible',
                    quota_type: 'unlimited',
                    quota_used: 0,
                    is_default: '0',
                    status: 'enabled',
                    sort_order: 99
                };
                this.jformConfig.opentype = 'add';
                this.jformConfig.formId = '';
                this.modalVisible = true;
            },

            openEditModal (row, index) {
                this.editIndex = index;
                // 编辑：密钥输入框置空（queryone 不回传密钥），留空时 beforeEdit 删除字段、SQL decode 保留原值
                this.jformProps = {};
                this.jformConfig.opentype = 'edit';
                this.jformConfig.formId = row.id;
                this.modalVisible = true;
            },

            // 设为默认：当前置 1，其余置 0（网关缺省路由对象）
            async handleSetDefault (row) {
                if (row.is_default === '1') return;
                try {
                    await this.commonsJs.incoRequest('update', this.updateFormId, { ...row, is_default: '1' });
                    for (const p of this.localData) {
                        if (p.id !== row.id && p.is_default === '1') {
                            await this.commonsJs.incoRequest('update', this.updateFormId, { ...p, is_default: '0' });
                        }
                    }
                    this.$Message.success('已设为默认');
                    this.loadData();
                } catch (e) {
                    this.$Message.error('设置默认失败');
                }
            },

            handleDelete (index) {
                const row = this.localData[index];
                this.$Modal.confirm({
                    title: '确认删除',
                    content: '确定要删除该供应商吗？其下所有模型将一并删除。',
                    onOk: async () => {
                        try {
                            // 1) 级联删除该供应商下所有模型
                            const models = await this.commonsJs.incoRequest('querylist', this.modelListId, { provider_id: row.id });
                            const modelIds = (Array.isArray(models) ? models : []).map(m => m.id);
                            for (const mid of modelIds) {
                                await this.commonsJs.incoRequest('delete', this.modelDeleteId, { id: mid });
                            }
                            // 2) 删除供应商
                            await this.commonsJs.incoRequest('delete', this.deleteId, { id: row.id });
                            this.$Message.success('删除成功');
                            this.loadData();
                        } catch (e) {
                            this.$Message.error('删除失败');
                        }
                    }
                });
            }
        }
    };
</script>

<style scoped>
.ai-llm-provider-list { width: 100%; position: relative; }
.sub-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.sub-title { font-size: 15px; font-weight: 600; color: #17233d; margin: 0; padding-left: 12px; border-left: 4px solid #2d8cf0; }
.sub-title-actions { display: flex; gap: 8px; }
</style>
