<template>
  <div class="ai-kbdoc-list">
    <Spin v-if="loading" fix>加载中...</Spin>

    <div class="sub-title-row">
      <h3 class="sub-title">知识库文档管理{{ kbmc ? '（知识库：' + kbmc + '）' : '' }}</h3>
      <div class="sub-title-actions">
        <Button icon="md-arrow-back" @click="goBack">返回</Button>
        <Button type="primary" icon="md-cloud-upload" @click="openUploadModal">上传文档</Button>
        <Button type="primary" icon="md-copy" @click="openBatchModal">批量导入</Button>
        <Button type="error" icon="md-trash" @click="handleBatchDelete">批量删除</Button>
      </div>
    </div>

    <!-- 查询条件 -->
    <div class="search-row">
      <Input v-model="searchForm.wjmc" placeholder="文档文件名" clearable style="width:200px" @on-enter="handleSearch" />
      <Select v-model="searchForm.parsestatus" placeholder="解析状态" clearable style="width:140px" @on-change="handleSearch">
        <Option value="pending">待解析</Option>
        <Option value="parsing">解析中</Option>
        <Option value="parsed">解析完成</Option>
        <Option value="failed">解析失败</Option>
      </Select>
      <Select v-model="searchForm.chunkstatus" placeholder="切片状态" clearable style="width:140px" @on-change="handleSearch">
        <Option value="pending">待切片</Option>
        <Option value="chunking">切片中</Option>
        <Option value="chunked">切片完成</Option>
        <Option value="failed">切片失败</Option>
      </Select>
      <Button type="primary" icon="md-search" @click="handleSearch">查询</Button>
      <Button icon="md-refresh" @click="handleReset">重置</Button>
    </div>

    <!-- 数据表格 -->
    <Table :columns="columns" :data="tableData" border @on-selection-change="onSelectionChange">
      <template #parsestatus="{ row }">
        <Tag :color="statusColor(row.parsestatus)">{{ statusText(row.parsestatus) }}</Tag>
      </template>
      <template #chunkstatus="{ row }">
        <Tag :color="statusColor(row.chunkstatus)">{{ statusText(row.chunkstatus) }}</Tag>
      </template>
      <template #action="{ row }">
        <!-- <Button type="text" style="color:#2d8cf0" @click="openStatusModal(row)">状态</Button> -->
        <Button type="text" style="color:#2d8cf0" @click="openTextModal(row)">文本</Button>
        <Button type="text" style="color:#19be6b" @click="goChunk(row)">切片管理</Button>
        <Button type="text" style="color:#ff9900" :loading="reparseId === row.id" @click="handleReparse(row)">重新解析</Button>
        <Button type="text" style="color:#ed4014" @click="handleDelete(row)">删除</Button>
      </template>
    </Table>

    <!-- 分页 -->
    <div class="page-row">
      <Page
        :total="total"
        :current="pageNum"
        :page-size="pageSize"
        show-total
        show-sizer
        :page-size-opts="[10, 20, 50, 100]"
        @on-change="onPageChange"
        @on-page-size-change="onPageSizeChange"
      />
    </div>

    <!-- 上传弹窗 -->
    <Modal v-model="uploadVisible" title="上传文档" :width="520" :mask-closable="false" footer-hide>
      <Form ref="uploadForm" :model="uploadForm" :rules="uploadRules" :label-width="100">
        <FormItem label="所属知识库">
          <Input :model-value="kbmc || uploadForm.kbid" disabled placeholder="请从知识库管理进入" />
        </FormItem>
        <FormItem label="文档" prop="file">
          <Upload
            ref="uploader"
            :before-upload="beforeUpload"
            :show-upload-list="false"
            :action="''"
          >
            <Button icon="md-add">选择文档</Button>
          </Upload>
          <div v-if="uploadForm.file" class="chosen-file">
            <Icon type="md-document" />
            <span>{{ uploadForm.file.name }}</span>
            <span class="size">（{{ formatSize(uploadForm.file.size) }}）</span>
            <Button type="text" style="color:#ed4014" @click="uploadForm.file = null">移除</Button>
          </div>
          <div class="upload-tip">支持 PDF / Word / Excel / PPT / TXT / HTML 等常见文档，上传后自动解析并切片</div>
        </FormItem>
      </Form>
      <div class="modal-footer">
        <Button @click="uploadVisible = false">取消</Button>
        <Button type="primary" :loading="uploading" @click="handleUpload">确定上传</Button>
      </div>
    </Modal>

    <!-- 批量导入弹窗：复用单文件 /kbdoc/upload，前端逐个串行上传并跟踪每文件状态 -->
    <Modal v-model="batchVisible" title="批量导入文档" :width="640" :mask-closable="false" :closable="!batchUploading" footer-hide>
      <Form :label-width="100">
        <FormItem label="所属知识库">
          <Input :model-value="kbmc || searchForm.kbid" disabled placeholder="请从知识库管理进入" />
        </FormItem>
        <FormItem label="选择文档">
          <Upload
            multiple
            :show-upload-list="false"
            :action="''"
            :before-upload="onBatchFileSelected"
            :disabled="batchUploading"
          >
            <Button icon="md-add" :disabled="batchUploading">选择文档（可多选）</Button>
          </Upload>
          <div class="upload-tip">支持 PDF / Word / Excel / PPT / TXT / HTML 等，可连续多批选择；逐个后台解析并切片，无需等待全部选完</div>
        </FormItem>
        <FormItem v-if="batchFiles.length" label="文件列表">
          <div class="batch-files">
            <div v-for="(f, i) in batchFiles" :key="i" class="batch-file-item">
              <Icon type="md-document" />
              <span class="bf-name" :title="f.name">{{ f.name }}</span>
              <span class="bf-size">{{ formatSize(f.size) }}</span>
              <Tag :color="batchStatusColor(f.status)" size="small">{{ batchStatusText(f.status) }}</Tag>
              <span v-if="f.err" class="bf-err" :title="f.err">{{ f.err }}</span>
              <Button v-if="f.status === 'wait'" type="text" size="small" style="color:#ed4014" :disabled="batchUploading" @click="removeBatchFile(i)">移除</Button>
            </div>
          </div>
        </FormItem>
      </Form>
      <!-- 整体进度 -->
      <div v-if="batchFiles.length" class="batch-progress">
        <Progress :percent="batchSummary.percent" :status="batchProgressStatus" />
        <span class="batch-progress-text">共 {{ batchSummary.total }} 个 · 成功 {{ batchSummary.success }} · 失败 {{ batchSummary.failed }}</span>
      </div>
      <div class="modal-footer">
        <Button @click="closeBatchModal" :disabled="batchUploading">{{ batchDone ? '关闭' : '取消' }}</Button>
        <Button v-if="batchFiles.length && !batchDone" type="warning" ghost icon="md-trash" :disabled="batchUploading" @click="clearBatchFiles">清空</Button>
        <Button type="primary" :loading="batchUploading" :disabled="batchUploading || !batchFiles.length || !batchFiles.some(f => f.status === 'wait')" @click="handleBatchUpload">
          {{ batchUploading ? '导入中...' : '开始上传' }}
        </Button>
      </div>
    </Modal>

    <!-- 解析/切片状态弹窗 -->
    <Modal v-model="statusVisible" title="解析状态" :width="560" footer-hide>
      <div v-if="statusRow" class="status-detail">
        <div class="status-line"><span class="lbl">文档名称</span><span>{{ statusRow.wjmc }}</span></div>
        <div class="status-line"><span class="lbl">文件大小</span><span>{{ formatSize(statusRow.wjdx) }}</span></div>
        <div class="status-line">
          <span class="lbl">文档解析</span>
          <Tag :color="statusColor(statusRow.parsestatus)">{{ statusText(statusRow.parsestatus) }}</Tag>
        </div>
        <div class="status-line">
          <span class="lbl">内容切片</span>
          <Tag :color="statusColor(statusRow.chunkstatus)">{{ statusText(statusRow.chunkstatus) }}</Tag>
          <span class="count">切片数量：{{ statusRow.chunkcount || 0 }}</span>
        </div>
        <div class="status-line" v-if="statusRow.errmsg">
          <span class="lbl">错误信息</span>
          <span class="errmsg">{{ statusRow.errmsg }}</span>
        </div>
        <div class="status-line" v-if="statusRow.tikaid">
          <span class="lbl">Tika记录</span><span class="mono">{{ statusRow.tikaid }}</span>
        </div>
      </div>
    </Modal>

    <!-- 解析文本内容弹窗 -->
    <Modal v-model="textVisible" title="解析文本内容" :width="760" :mask-closable="false" footer-hide>
      <Spin v-if="textLoading" fix>加载中...</Spin>
      <Input
        v-model="textContent"
        type="textarea"
        :rows="22"
        :readonly="true"
        placeholder="（无文本内容）"
      />
    </Modal>

    <!-- 切片管理弹窗：显隐由子组件内部管理，父组件通过 $refs.chunkList.open() 打开 -->
    <AiChunkList ref="chunkList" @closed="loadData" />
  </div>
</template>

<script>
    import {
        kbdocListPage,
        kbdocUpload,
        kbdocReparse,
        kbdocDelete,
        kbdocBatchDelete,
        tikaGetBy
    } from '@/api/kbdoc';
    import { kbList } from '@/api/kb';
    import AiChunkList from '@/pages/project/ai/chunk/ChunkList.vue';

    export default {
        name: 'AiKbDocList',
        components: { AiChunkList },

        data () {
            return {
                loading: false,
                kbmc: '',
                // 知识库 id -> 名称 映射，用于列表「知识库」列展示名称而非 id
                kbMap: {},
                uploading: false,
                reparseId: '',
                selectedIds: [],
                // 查询条件
                searchForm: { kbid: '', wjmc: '', parsestatus: '', chunkstatus: '' },
                pageNum: 1,
                pageSize: 10,
                total: 0,
                tableData: [],
                // 上传弹窗
                uploadVisible: false,
                uploadForm: { kbid: '', file: null },
                uploadRules: {},
                // 批量导入弹窗
                batchVisible: false,
                batchUploading: false,
                batchDone: false,
                batchFiles: [], // { file, name, size, status: wait|uploading|success|failed, err }
                // 状态弹窗
                statusVisible: false,
                statusRow: null,
                // 文本弹窗
                textVisible: false,
                textLoading: false,
                textContent: '',
                // 切片管理弹窗（显隐由子组件内部管理；关闭后本页分页/筛选状态保持不变）
                columns: [
                    { type: 'selection', width: 55, align: 'center' },
                    { title: '文档名称', key: 'wjmc', minWidth: 200, tooltip: true },
                    { title: '知识库', key: 'kbid', width: 140, tooltip: true,
                        render: (h, p) => h('span', this.kbMap[p.row.kbid] || p.row.kbid) },
                    { title: '大小', key: 'wjdx', width: 100, align: 'right',
                        render: (h, p) => h('span', this.formatSize(p.row.wjdx)) },
                    { title: '解析状态', slot: 'parsestatus', width: 110, align: 'center' },
                    { title: '切片状态', slot: 'chunkstatus', width: 110, align: 'center' },
                    { title: '切片数', key: 'chunkcount', width: 80, align: 'center' },
                    { title: '操作', slot: 'action', width: 340, align: 'center', fixed: 'right' }
                ]
            };
        },

        computed: {
            // 批量导入进度汇总（百分比按已完成计）
            batchSummary () {
                const total = this.batchFiles.length;
                let success = 0, failed = 0, uploading = 0;
                this.batchFiles.forEach(f => {
                    if (f.status === 'success') success++;
                    else if (f.status === 'failed') failed++;
                    else if (f.status === 'uploading') uploading++;
                });
                const completed = success + failed;
                const percent = total ? Math.round((completed / total) * 100) : 0;
                return { total, success, failed, uploading, completed, percent };
            },
            // iView Progress 状态：进行中 active / 全成功 success / 有失败 wrong
            batchProgressStatus () {
                if (!this.batchDone) return 'active';
                return this.batchSummary.failed > 0 ? 'wrong' : 'success';
            }
        },

        mounted () {
            // 支持路由 query 带入 kbid 直接过滤（从知识库管理跳转而来），与 ChunkList 读 docid 一致
            if (this.$route.query.kbid) {
                this.searchForm.kbid = String(this.$route.query.kbid);
            }
            if (this.$route.query.kbmc) {
                this.kbmc = String(this.$route.query.kbmc);
            }
            this.loadKbMap();
            this.loadData();
        },

        methods: {
            // 加载知识库 id->名称 映射，供列表「知识库」列展示名称而非 id
            async loadKbMap () {
                try {
                    const list = await kbList();
                    const map = {};
                    (Array.isArray(list) ? list : (list && list.list) || []).forEach(k => {
                        if (k && k.id) map[k.id] = k.kbmc || k.id;
                    });
                    this.kbMap = map;
                } catch (e) {
                    // 加载失败不影响列表展示，列将回退显示 id
                }
            },

            // 组装查询参数：仅携带非空筛选条件，避免空串干扰后端 <if> 判断
            buildQuery () {
                const q = { pageNum: this.pageNum, pageSize: this.pageSize };
                const s = this.searchForm;
                if (s.kbid) q.kbid = s.kbid;
                if (s.wjmc) q.wjmc = s.wjmc;
                if (s.parsestatus) q.parsestatus = s.parsestatus;
                if (s.chunkstatus) q.chunkstatus = s.chunkstatus;
                return q;
            },

            async loadData () {
                this.loading = true;
                try {
                    const res = await kbdocListPage(this.buildQuery());
                    // listPage 返回 PageHelper 的 PageInfo：{ list, total, pageNum, pageSize, pages, ... }
                    if (res && Array.isArray(res.list)) {
                        this.tableData = res.list;
                        this.total = typeof res.total === 'number' ? res.total : res.list.length;
                    } else if (Array.isArray(res)) {
                        this.tableData = res;
                        this.total = res.length;
                    } else {
                        this.tableData = [];
                        this.total = 0;
                    }
                } catch (e) {
                    this.$Message.error('加载文档列表失败');
                } finally {
                    this.loading = false;
                }
            },

            handleSearch () {
                this.pageNum = 1;
                this.loadData();
            },

            handleReset () {
                // kbid 由知识库管理页传入且不可改，重置时保留
                this.searchForm = { kbid: this.searchForm.kbid, wjmc: '', parsestatus: '', chunkstatus: '' };
                this.pageNum = 1;
                this.loadData();
            },

            onPageChange (p) {
                this.pageNum = p;
                this.loadData();
            },

            onPageSizeChange (s) {
                this.pageSize = s;
                this.pageNum = 1;
                this.loadData();
            },

            onSelectionChange (selection) {
                this.selectedIds = selection.map(r => r.id);
            },

            // 返回知识库管理页
            goBack () {
                this.$router.push({ path: '/ai/kb' });
            },

            // ==================== 上传 ====================
            openUploadModal () {
                this.uploadForm = { kbid: this.searchForm.kbid || '', file: null };
                this.uploadVisible = true;
                this.$nextTick(() => {
                    this.$refs.uploadForm && this.$refs.uploadForm.resetFields();
                });
            },

            // iView Upload before-upload：返回 false 阻止自动上传，仅暂存文件
            beforeUpload (file) {
                this.uploadForm.file = file;
                return false;
            },

            handleUpload () {
                // 文件字段为原生 File 对象，不走 iView Form 的声明式校验，在此手动校验
                if (!this.uploadForm.file) {
                    this.$Message.warning('请选择文档');
                    return;
                }
                this.$refs.uploadForm.validate(async (valid) => {
                    if (!valid) return;
                    this.uploading = true;
                    try {
                        const doc = await kbdocUpload(this.uploadForm.kbid, this.uploadForm.file);
                        this.$Message.success('上传并解析成功');
                        this.uploadVisible = false;
                        this.pageNum = 1;
                        this.loadData();
                    } catch (e) {
                        this.$Message.error(e.message || '上传失败');
                    } finally {
                        this.uploading = false;
                    }
                });
            },

            // ==================== 批量导入 ====================
            // 复用单文件 /kbdoc/upload 接口，前端串行逐个上传：Tika 解析+切片是 CPU/内存密集型，
            // 串行可避免并发解析大文档导致 OOM；每文件独立状态，失败不阻断后续。
            openBatchModal () {
                if (!this.searchForm.kbid) {
                    this.$Message.warning('请从知识库管理进入后再批量导入');
                    return;
                }
                this.batchFiles = [];
                this.batchUploading = false;
                this.batchDone = false;
                this.batchVisible = true;
            },

            // iView Upload before-upload（multiple 多选时每文件触发一次）：返回 false 阻止自动上传，仅暂存
            onBatchFileSelected (file) {
                if (!file) return false;
                if (file.size === 0) {
                    this.$Message.warning(`「${file.name}」为空文件，已忽略`);
                    return false;
                }
                // 去重：同名+同大小+同修改时间视为同一文件
                const dup = this.batchFiles.some(f =>
                    f.file.name === file.name && f.file.size === file.size && f.file.lastModified === file.lastModified);
                if (!dup) {
                    this.batchFiles.push({
                        file, name: file.name, size: file.size,
                        status: 'wait', err: ''
                    });
                }
                return false;
            },

            removeBatchFile (idx) {
                if (this.batchUploading) return;
                this.batchFiles.splice(idx, 1);
            },

            clearBatchFiles () {
                if (this.batchUploading) return;
                this.batchFiles = [];
                this.batchDone = false;
            },

            async handleBatchUpload () {
                const pending = this.batchFiles.filter(f => f.status === 'wait');
                if (!pending.length) {
                    this.$Message.warning('请先选择文档');
                    return;
                }
                this.batchUploading = true;
                this.batchDone = false;
                for (const f of pending) {
                    f.status = 'uploading';
                    f.err = '';
                    try {
                        await kbdocUpload(this.searchForm.kbid, f.file);
                        f.status = 'success';
                    } catch (e) {
                        f.status = 'failed';
                        f.err = (e && e.message) || '上传失败';
                    }
                }
                this.batchUploading = false;
                this.batchDone = true;
                // 刷新列表以展示新导入的文档（成功的已落库；失败的可在弹窗内查看原因）
                this.pageNum = 1;
                this.loadData();
                const s = this.batchSummary;
                if (s.failed > 0) {
                    this.$Message.warning(`批量导入完成：成功 ${s.success} 个，失败 ${s.failed} 个`);
                } else {
                    this.$Message.success(`批量导入完成：成功 ${s.success} 个`);
                }
            },

            closeBatchModal () {
                // 上传中禁止关闭，避免中断未完成的文件
                if (this.batchUploading) return;
                this.batchVisible = false;
            },

            batchStatusText (s) {
                return { wait: '等待', uploading: '上传中', success: '成功', failed: '失败' }[s] || s;
            },

            batchStatusColor (s) {
                return { wait: 'default', uploading: 'processing', success: 'success', failed: 'error' }[s] || 'default';
            },

            // ==================== 状态 / 文本 ====================
            // 以弹窗形式打开切片管理，并带入该文档的 tikaid 作为 docid 过滤条件
            // （切片 t_ai_chunk.docid 取 tika.id，即 kbdoc.tikaid）
            goChunk (row) {
                if (!row.tikaid) {
                    this.$Message.warning('该文档尚未解析，暂无切片');
                    return;
                }
                this.$refs.chunkList.open(row.tikaid);
            },

            openStatusModal (row) {
                this.statusRow = row;
                this.statusVisible = true;
            },

            async openTextModal (row) {
                if (!row.tikaid) {
                    this.$Message.warning('该文档尚未解析，无文本内容');
                    return;
                }
                this.textVisible = true;
                this.textContent = '';
                this.textLoading = true;
                try {
                    // tikaid 关联 t_ai_tika，切片 docid 亦取 tikaid；
                    // 走 tika 详情接口取解析文本内容（tsnr）
                    const tika = await tikaGetBy({ id: row.tikaid });
                    this.textContent = (tika && tika.tsnr) || '（无文本内容）';
                } catch (e) {
                    this.$Message.error('加载文本内容失败');
                    this.textContent = '';
                } finally {
                    this.textLoading = false;
                }
            },

            // ==================== 重新解析 ====================
            handleReparse (row) {
                this.$Modal.confirm({
                    title: '确认重新解析',
                    content: '将清除该文档原有切片并重新解析、切片，是否继续？',
                    onOk: async () => {
                        this.reparseId = row.id;
                        try {
                            await kbdocReparse({ id: row.id });
                            this.$Message.success('已触发重新解析');
                            this.loadData();
                        } catch (e) {
                            // 响应拦截器已弹出错误提示
                        } finally {
                            this.reparseId = '';
                        }
                    }
                });
            },

            // ==================== 删除 ====================
            handleDelete (row) {
                this.$Modal.confirm({
                    title: '确认删除',
                    content: '确定要删除该文档吗？其切片与解析记录将一并删除。',
                    onOk: async () => {
                        try {
                            await kbdocDelete({ id: row.id });
                            this.$Message.success('删除成功');
                            if (this.tableData.length === 1 && this.pageNum > 1) {
                                this.pageNum--;
                            }
                            this.loadData();
                        } catch (e) {
                            // 响应拦截器已弹出错误提示
                        }
                    }
                });
            },

            handleBatchDelete () {
                if (!this.selectedIds.length) {
                    this.$Message.warning('请先选择要删除的文档');
                    return;
                }
                const count = this.selectedIds.length;
                this.$Modal.confirm({
                    title: '确认批量删除',
                    content: `确定要删除选中的 ${count} 个文档吗？其切片与解析记录将一并删除。`,
                    onOk: async () => {
                        try {
                            await kbdocBatchDelete(this.selectedIds);
                            this.$Message.success('批量删除成功');
                            if (this.tableData.length === count && this.pageNum > 1) {
                                this.pageNum--;
                            }
                            this.selectedIds = [];
                            this.loadData();
                        } catch (e) {
                            // 响应拦截器已弹出错误提示
                        }
                    }
                });
            },

            // ==================== 工具 ====================
            statusText (s) {
                return { pending: '待处理', parsing: '解析中', parsed: '解析完成', chunking: '切片中',
                    chunked: '切片完成', failed: '失败' }[s] || s || '-';
            },

            statusColor (s) {
                return { pending: 'default', parsing: 'processing', parsed: 'success',
                    chunking: 'processing', chunked: 'success', failed: 'error' }[s] || 'default';
            },

            formatSize (bytes) {
                if (bytes == null) return '-';
                if (bytes < 1024) return bytes + ' B';
                if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
                return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB';
            }
        }
    };
</script>

<style scoped>
.ai-kbdoc-list { width: 100%; position: relative; }
.sub-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.sub-title { font-size: 15px; font-weight: 600; color: #17233d; margin: 0; padding-left: 12px; border-left: 4px solid #2d8cf0; }
.sub-title-actions { display: flex; gap: 8px; }
.search-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.page-row { display: flex; justify-content: flex-end; margin-top: 12px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.chosen-file { display: flex; align-items: center; gap: 6px; margin-top: 6px; color: #515a6e; }
.chosen-file .size { color: #808695; font-size: 12px; }
.upload-tip { color: #808695; font-size: 12px; margin-top: 6px; line-height: 1.6; }
.status-detail .status-line { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px dashed #e8eaec; }
.status-detail .lbl { width: 90px; color: #808695; flex-shrink: 0; }
.status-detail .count { color: #2d8cf0; margin-left: 12px; }
.status-detail .errmsg { color: #ed4014; }
.status-detail .mono { font-family: Consolas, monospace; font-size: 12px; word-break: break-all; }

/* 批量导入文件列表 */
.batch-files { max-height: 280px; overflow-y: auto; border: 1px solid #efefef; border-radius: 4px; }
.batch-file-item { display: flex; align-items: center; gap: 8px; padding: 7px 12px; border-bottom: 1px solid #f5f5f5; }
.batch-file-item:last-child { border-bottom: none; }
.batch-file-item:hover { background: #f7f8fa; }
.batch-file-item .bf-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #17233d; }
.batch-file-item .bf-size { color: #808695; font-size: 12px; flex-shrink: 0; }
.batch-file-item .bf-err { color: #ed4014; font-size: 12px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0; }
.batch-progress { margin: 4px 0 0; }
.batch-progress-text { display: block; font-size: 12px; color: #515a6e; margin-top: 4px; }
</style>
