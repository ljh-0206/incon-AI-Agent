// 智能体应用对外接口 —— 对应后端 OpenApiController（@RequestMapping("/ai/open")，白名单免 token）
import request from '@/plugins/request';
import Setting from '@/setting';

/**
 * 对外应用公共信息（供对话页渲染；不含 Key/提示词等敏感配置）
 * GET /ai/open/agent-app/{appId}  请求头 X-Api-Key: key
 */
export function agentAppOpenInfo (appId, key) {
  return request({ url: `/ai/open/agent-app/${appId}`, method: 'get', headers: { 'X-Api-Key': key } });
}

/**
 * 对外应用阻塞运行
 * POST /ai/open/agent-app/{appId}/run  请求头 X-Api-Key  body {question, startMessageId?}
 */
export function agentAppOpenRun (appId, key, body) {
  return request({ url: `/ai/open/agent-app/${appId}/run`, method: 'post', headers: { 'X-Api-Key': key }, data: body });
}

/**
 * 对外应用流式运行 URL（fetchEventSource POST，头 X-Api-Key，统一聊天协议）
 * 返回完整 URL（含 apiBaseURL），供 fetchEventSource 直连
 */
export function agentAppOpenStreamUrl (appId) {
  return Setting.apiBaseURL + `/ai/open/agent-app/${appId}/run/stream`;
}

/**
 * 重置智能体应用对外密钥（认证接口，需登录 token）
 * POST /ai/agent-app/{id}/reset-key  返回 {success, apiKey}
 */
export function agentAppResetKey (id) {
  return request({ url: `/ai/agent-app/${id}/reset-key`, method: 'post' });
}

export default { agentAppOpenInfo, agentAppOpenRun, agentAppOpenStreamUrl, agentAppResetKey };
