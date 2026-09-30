import request from '@/plugins/request';

export function xgmm (data, callback) {
  return request({
    url: '/sys/xgmm',
    method: 'post',
    data
  });
}

export function szDsbdl (data, callback) {
  return request({
    url: '/UserManager/szDsbdl',
    method: 'post',
    data
  });
}

export function GetRoleList (params, callback) {
  return request.post('/RoleManager/queryRest', params, callback);
}

export function DeleteRole (params, callback) {
  return request({
    url: 'RoleManager/delete',
    method: 'get',
    params
  });
}

export function DeleteRoleMultiple (params, callback) {
  return request({
    url: '/RoleManager/delete',
    method: 'get',
    params
  });
}

export function UpdateRole (params, callback) {
  return request.post('/RoleManager/updateRole', params, callback);
}

export function CreateRole (params, callback) {
  return request.post('/RoleManager/addRole', params, callback);
}

export function GetMenuList (params, callback) {
  return request.post('/AuthManager/menuTree', params, callback);
}

export function UpdateRoleMenu (params, callback) {
  return request.post('/RoleManager/updateRoleMenu', params, callback);
}

// ==================== 规则管理相关API ====================

/**
 * 获取规则列表
 */
export function ruleList (params) {
  return request({
    url: '/rule/list',
    method: 'post',
    data: params
  });
}

/**
 * 新增规则
 */
export function ruleAdd (data) {
  return request({
    url: '/rule/add',
    method: 'post',
    data
  });
}

/**
 * 更新规则
 */
export function ruleUpdate (data) {
  return request({
    url: '/rule/update',
    method: 'post',
    data
  });
}

/**
 * 删除规则
 */
export function ruleDelete (params) {
  return request({
    url: '/rule/delete',
    method: 'get',
    params
  });
}

/**
 * 获取规则详情
 */
export function ruleDetail (params) {
  return request({
    url: '/rule/detail',
    method: 'get',
    params
  });
}

/**
 * 刷新规则缓存
 */
export function ruleRefreshCache () {
  return request({
    url: '/rule/refreshCache',
    method: 'post'
  });
}

/**
 * 获取规则已绑定的SQL列表
 */
export function getBoundSqlList (params) {
  return request({
    url: '/rule/getBoundSqlList',
    method: 'get',
    params
  });
}

/**
 * 绑定SQL到规则
 */
export function bindSqlToRule (data) {
  return request({
    url: '/rule/bindSql',
    method: 'post',
    data
  });
}

/**
 * 解绑SQL
 */
export function unbindSqlFromRule (params) {
  return request({
    url: '/rule/unbindSql',
    method: 'get',
    params
  });
}

/**
 * 获取SQL列表（用于绑定界面）
 */
export function sqlList (params) {
  return request({
    url: '/sql/querySqlList',
    method: 'post',
    data: params
  });
}

// ==================== 规则执行日志API ====================

/**
 * 获取规则执行日志列表
 */
export function ruleLogList (params) {
  return request({
    url: '/rule/log/list',
    method: 'post',
    data: params
  });
}

/**
 * 获取规则执行日志详情
 */
export function ruleLogDetail (params) {
  return request({
    url: '/rule/log/detail',
    method: 'get',
    params
  });
}
