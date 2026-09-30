// 问答库管理接口 —— 对应后端 QakController（@RequestMapping("/qak")）
import request from '@/plugins/request';
import axios from 'axios';
import Setting from '@/setting';

/**
 * 查询所有记录（不分页，QakPage 仅作为筛选条件）
 * GET /qak/list
 */
export function qakList (params) {
    return request({ url: '/qak/list', method: 'get', params });
}

/**
 * 分页查询记录，返回 PageHelper 的 PageInfo（{ list, total, pageNum, pageSize, pages, ... }）
 * GET /qak/listPage
 */
export function qakListPage (params) {
    return request({ url: '/qak/listPage', method: 'get', params });
}

/**
 * 根据主键查询
 * GET /qak/getBy
 */
export function qakGetBy (params) {
    return request({ url: '/qak/getBy', method: 'get', params });
}

/**
 * 新增或修改：id 有值则修改，无则新增
 * POST /qak/save  （@RequestBody QakEntity）
 */
export function qakSave (data) {
    return request({ url: '/qak/save', method: 'post', data });
}

/**
 * 删除单条
 * POST /qak/delete （@RequestBody QakPage，取 id）
 */
export function qakDelete (data) {
    return request({ url: '/qak/delete', method: 'post', data });
}

/**
 * 批量删除
 * POST /qak/batchDelete （@RequestBody List<String> idList）
 */
export function qakBatchDelete (data) {
    return request({ url: '/qak/batchDelete', method: 'post', data });
}

/**
 * 导出 Excel
 * POST /qak/exportExcel （QakPage 作为筛选条件，后端直接把 xlsx 写入响应流）
 * 说明：该接口返回的是二进制流（没有 ReturnT 的 code/content 结构），
 *       不能走 request 实例的响应拦截器（会因缺少 code 报“服务器返回值错误”），
 *       故用裸 axios 以 responseType:'blob' 接收，并手动携带 Token/RoleCode。
 */
export function qakExportExcel (params) {
    const token = localStorage.getItem('token' + '_' + Setting.xmid);
    let jsdm = '';
    const userinfoStr = localStorage.getItem('userinfo' + '_' + Setting.xmid);
    if (userinfoStr) jsdm = JSON.parse(userinfoStr).jsdm;
    return axios({
        url: Setting.apiBaseURL + '/qak/exportExcel',
        method: 'POST',
        headers: {
            Token: token ? 'Inco-' + token : '',
            RoleCode: jsdm
        },
        responseType: 'blob',
        params
    });
}
