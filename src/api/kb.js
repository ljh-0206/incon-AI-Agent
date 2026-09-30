// 知识库主对象管理接口 —— 对应后端 KbController（@RequestMapping("/kb")）
import request from '@/plugins/request';

/**
 * 查询所有记录（不分页，KbPage 仅作为筛选条件）
 * GET /kb/list
 */
export function kbList (params) {
    return request({ url: '/kb/list', method: 'get', params });
}

/**
 * 分页查询记录，返回 PageHelper 的 PageInfo（{ list, total, pageNum, pageSize, pages, ... }）
 * GET /kb/listPage
 */
export function kbListPage (params) {
    return request({ url: '/kb/listPage', method: 'get', params });
}

/**
 * 根据主键查询
 * GET /kb/getBy
 */
export function kbGetBy (params) {
    return request({ url: '/kb/getBy', method: 'get', params });
}

/**
 * 新增或修改：id 有值则修改，无则新增
 * POST /kb/save  （@RequestBody KbEntity）
 */
export function kbSave (data) {
    return request({ url: '/kb/save', method: 'post', data });
}

/**
 * 删除单条
 * POST /kb/delete （@RequestBody KbPage，取 id）
 */
export function kbDelete (data) {
    return request({ url: '/kb/delete', method: 'post', data });
}

/**
 * 批量删除
 * POST /kb/batchDelete （@RequestBody List<String> idList）
 */
export function kbBatchDelete (data) {
    return request({ url: '/kb/batchDelete', method: 'post', data });
}
