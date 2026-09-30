// 智能体应用管理接口 —— 对应后端 AgentAppController（@RequestMapping("/ai/agent-app")）
import request from '@/plugins/request';
import Setting from '@/setting';

/**
 * 应用列表
 * GET /ai/agent-app/list
 */
export function agentAppList (params) {
    return request({ url: '/ai/agent-app/list', method: 'get', params });
}

/**
 * 已发布（启用）应用列表
 * GET /ai/agent-app/published
 */
export function agentAppPublished () {
    return request({ url: '/ai/agent-app/published', method: 'get' });
}

/**
 * 推荐应用列表（is_recommended=1 且 enabled=1）
 * GET /ai/agent-app/recommended
 */
export function agentAppRecommended () {
    return request({ url: '/ai/agent-app/recommended', method: 'get' });
}

/**
 * 我的智能体（当前登录用户创建）
 * GET /ai/agent-app/mine
 */
export function agentAppMine () {
    return request({ url: '/ai/agent-app/mine', method: 'get' });
}

/**
 * 我的收藏列表（返回应用详情，按收藏时间倒序）
 * GET /ai/agent-app/favorites
 */
export function agentAppFavorites () {
    return request({ url: '/ai/agent-app/favorites', method: 'get' });
}

/**
 * 设为/取消推荐
 * POST /ai/agent-app/{id}/recommend  body: { recommended: true/false }
 */
export function agentAppRecommend (id, recommended) {
    return request({ url: `/ai/agent-app/${id}/recommend`, method: 'post', data: { recommended } });
}

/**
 * 收藏应用（幂等：已收藏则跳过）
 * POST /ai/agent-app/{id}/favorite
 */
export function agentAppFavorite (id) {
    return request({ url: `/ai/agent-app/${id}/favorite`, method: 'post' });
}

/**
 * 取消收藏
 * POST /ai/agent-app/{id}/unfavorite
 */
export function agentAppUnfavorite (id) {
    return request({ url: `/ai/agent-app/${id}/unfavorite`, method: 'post' });
}

/**
 * 应用详情
 * GET /ai/agent-app/{id}
 */
export function agentAppGet (id) {
    return request({ url: `/ai/agent-app/${id}`, method: 'get' });
}

/**
 * 创建应用
 * POST /ai/agent-app/create
 */
export function agentAppCreate (data) {
    return request({ url: '/ai/agent-app/create', method: 'post', data });
}

/**
 * 更新应用
 * POST /ai/agent-app/update
 */
export function agentAppUpdate (data) {
    return request({ url: '/ai/agent-app/update', method: 'post', data });
}

/**
 * 删除应用
 * POST /ai/agent-app/delete/{id}
 */
export function agentAppDelete (id) {
    return request({ url: `/ai/agent-app/delete/${id}`, method: 'post' });
}

/**
 * 发布应用
 * POST /ai/agent-app/{id}/publish
 */
export function agentAppPublish (id) {
    return request({ url: `/ai/agent-app/${id}/publish`, method: 'post' });
}

/**
 * 启用/禁用应用
 * POST /ai/agent-app/{id}/toggle
 */
export function agentAppToggle (id, enabled) {
    return request({ url: `/ai/agent-app/${id}/toggle`, method: 'post', data: { enabled } });
}

/**
 * 标准模式流式对话 URL（fetchEventSource POST，body={question,startMessageId}）
 * 返回完整 URL（含 apiBaseURL），供 fetchEventSource 直连
 */
export function agentAppChatStreamUrl (id) {
    return Setting.apiBaseURL + `/ai/agent-app/${id}/chat/stream`;
}

export default {
    agentAppList,
    agentAppPublished,
    agentAppRecommended,
    agentAppMine,
    agentAppFavorites,
    agentAppGet,
    agentAppCreate,
    agentAppUpdate,
    agentAppDelete,
    agentAppPublish,
    agentAppToggle,
    agentAppRecommend,
    agentAppFavorite,
    agentAppUnfavorite,
    agentAppChatStreamUrl
};
