// 工作流管理接口 —— 对应后端 WorkflowController（@RequestMapping("/ai/workflow")）
import request from '@/plugins/request';

/**
 * 获取工作流列表
 * GET /ai/workflow/list
 */
export function workflowList (params) {
    return request({ url: '/ai/workflow/list', method: 'get', params });
}

/**
 * 获取已发布（启用）工作流列表
 * GET /ai/workflow/published
 */
export function workflowPublished () {
    return request({ url: '/ai/workflow/published', method: 'get' });
}

/**
 * 获取工作流详情
 * GET /ai/workflow/{id}
 */
export function workflowGet (id) {
    return request({ url: `/ai/workflow/${id}`, method: 'get' });
}

/**
 * 创建工作流
 * POST /ai/workflow/create
 */
export function workflowCreate (data) {
    return request({ url: '/ai/workflow/create', method: 'post', data });
}

/**
 * 更新工作流
 * PUT /ai/workflow/update
 */
export function workflowUpdate (data) {
    return request({ url: '/ai/workflow/update', method: 'post', data });
}

/**
 * 保存工作流图数据
 * POST /ai/workflow/{id}/graph
 */
export function workflowSaveGraph (id, graphData) {
    return request({ url: `/ai/workflow/${id}/graph`, method: 'post', data: { graphData } });
}

/**
 * 发布工作流
 * POST /ai/workflow/{id}/publish
 */
export function workflowPublish (id) {
    return request({ url: `/ai/workflow/${id}/publish`, method: 'post' });
}

/**
 * 启用/禁用工作流
 * POST /ai/workflow/{id}/toggle
 */
export function workflowToggle (id, enabled) {
    return request({ url: `/ai/workflow/${id}/toggle`, method: 'post', data: { enabled } });
}

/**
 * 执行工作流（testRun=true 跳过启用检查）
 * POST /ai/workflow/{id}/execute?testRun=
 */
export function workflowExecute (id, input, testRun = false) {
    return request({ url: `/ai/workflow/${id}/execute`, method: 'post', params: { testRun }, data: input });
}

/**
 * 获取执行历史
 * GET /ai/workflow/{id}/executions
 */
export function workflowExecutions (id) {
    return request({ url: `/ai/workflow/${id}/executions`, method: 'get' });
}

/**
 * 获取执行详情
 * GET /ai/workflow/execution/{executionId}
 */
export function workflowExecutionDetail (executionId) {
    return request({ url: `/ai/workflow/execution/${executionId}`, method: 'get' });
}

/**
 * 删除工作流
 * DELETE /ai/workflow/{id}
 */
export function workflowDelete (id) {
    return request({ url: `/ai/workflow/delete/${id}`, method: 'post' });
}

/**
 * 公开 API - 按名称执行
 * POST /ai/workflow/api/run/{workflowName}
 */
export function workflowRunByName (workflowName, input) {
    return request({ url: `/ai/workflow/api/run/${workflowName}`, method: 'post', data: input });
}

/**
 * 重置对外接口 API Key（旧 Key 立即失效，返回新 Key）
 * POST /ai/workflow/{id}/reset-key
 */
export function workflowResetKey (id) {
    return request({ url: `/ai/workflow/${id}/reset-key`, method: 'post' });
}

// ====== 版本管理 ======

export function workflowVersions (id) {
    return request({ url: `/ai/workflow/${id}/versions`, method: 'get' });
}

export function workflowCreateVersion (id, graphData, description) {
    return request({ url: `/ai/workflow/${id}/version`, method: 'post', data: { graphData, description } });
}

export function workflowRollback (id, version) {
    return request({ url: `/ai/workflow/${id}/rollback`, method: 'post', data: { version } });
}

// ====== 统计 ======

export function workflowStats () {
    return request({ url: '/ai/workflow/stats', method: 'get' });
}

export function workflowRanking (limit = 10) {
    return request({ url: '/ai/workflow/ranking', method: 'get', params: { limit } });
}

// ====== AI 生成器（/ai/workflow/generator） ======

export function workflowGenerate (description) {
    return request({ url: '/ai/workflow/generator/generate', method: 'post', data: { description } });
}

export function workflowGenerateAndSave (description, workflowName) {
    return request({ url: '/ai/workflow/generator/generate-and-save', method: 'post', data: { description, workflowName } });
}

export function workflowOptimize (workflowId, instruction) {
    return request({ url: `/ai/workflow/generator/optimize/${workflowId}`, method: 'post', data: { instruction } });
}

export function workflowGeneratorTips () {
    return request({ url: '/ai/workflow/generator/tips', method: 'get' });
}

// ====== 工具管理（/ai/workflow/tool） ======

export function workflowToolList () {
    return request({ url: '/ai/workflow/tool/list', method: 'get' });
}

export function workflowBuiltinTools () {
    return request({ url: '/ai/workflow/tool/builtin', method: 'get' });
}

// ====== SSE 流式执行（fetch-event-source） ======
// 流式接口不走 axios，用 @microsoft/fetch-event-source 直连
// streaming=true 时 LLM 节点逐字推送 output_delta 事件（逐字回复）
export function workflowExecuteStreamUrl (id, testRun = true, input, streaming = false) {
    const base = '/api/ai/workflow';
    let url = `${base}/${id}/execute/stream?testRun=${testRun}`;
    if (streaming) {
        url += '&streaming=true';
    }
    if (input) {
        url += '&input=' + encodeURIComponent(typeof input === 'string' ? input : JSON.stringify(input));
    }
    return url;
}

export default {
    workflowList,
    workflowPublished,
    workflowGet,
    workflowCreate,
    workflowUpdate,
    workflowSaveGraph,
    workflowPublish,
    workflowToggle,
    workflowExecute,
    workflowExecutions,
    workflowExecutionDetail,
    workflowDelete,
    workflowRunByName,
    workflowResetKey,
    workflowVersions,
    workflowCreateVersion,
    workflowRollback,
    workflowStats,
    workflowRanking,
    workflowGenerate,
    workflowGenerateAndSave,
    workflowOptimize,
    workflowGeneratorTips,
    workflowToolList,
    workflowBuiltinTools,
    workflowExecuteStreamUrl
};
