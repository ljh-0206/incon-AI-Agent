// 知识库文档管理接口 —— 对应后端 KbDocController（@RequestMapping("/kbdoc")）
import request from '@/plugins/request';
import axios from 'axios';
import Setting from '@/setting';

/**
 * 文档列表（可按 kbid、parsestatus、chunkstatus、wjmc 过滤）
 * GET /kbdoc/list
 */
export function kbdocList (params) {
    return request({ url: '/kbdoc/list', method: 'get', params });
}

/**
 * 分页查询文档列表
 * GET /kbdoc/listPage
 */
export function kbdocListPage (params) {
    return request({ url: '/kbdoc/listPage', method: 'get', params });
}

/**
 * 查询文档详情（含解析/切片状态、切片数量、错误信息）
 * GET /kbdoc/getBy?id=
 */
export function kbdocGetBy (params) {
    return request({ url: '/kbdoc/getBy', method: 'get', params });
}

/**
 * 上传文档：后台 Tika 解析 + 内容切片，全程状态跟踪。
 * POST /kbdoc/upload （multipart/form-data：kbid + file）
 * 说明：该接口为文件上传，需用 FormData + 裸 axios 手动携带 Token/RoleCode，
 *       不能走 request 实例的默认 Content-Type（application/json）。
 */
export function kbdocUpload (kbid, file) {
    const formData = new FormData();
    formData.append('kbid', kbid);
    formData.append('file', file);
    const token = localStorage.getItem('token' + '_' + Setting.xmid);
    let jsdm = '';
    const userinfoStr = localStorage.getItem('userinfo' + '_' + Setting.xmid);
    if (userinfoStr) jsdm = JSON.parse(userinfoStr).jsdm;
    return axios({
        url: Setting.apiBaseURL + '/kbdoc/upload',
        method: 'POST',
        headers: {
            Token: token ? 'Inco-' + token : '',
            RoleCode: jsdm,
            // FormData 需由浏览器自动设置 boundary，勿手动设 Content-Type
            'X-Requested-With': 'XMLHttpRequest'
        },
        data: formData,
        timeout: 600000
    }).then(res => {
        // 后端返回 ReturnT{code,msg,content}，axios 直接返回 res.data
        const body = res.data;
        if (body && body.code === 200) return body.content;
        throw new Error((body && body.msg) || '上传失败');
    });
}

/**
 * 重新解析：状态流转回 pending，重新 Tika 解析 + 切片
 * POST /kbdoc/reparse （@RequestBody KbDocPage，取 id）
 */
export function kbdocReparse (data) {
    return request({ url: '/kbdoc/reparse', method: 'post', data });
}

/**
 * 删除单条文档（级联清理切片 + Tika 记录 + 本记录）
 * POST /kbdoc/delete （@RequestBody KbDocPage，取 id）
 */
export function kbdocDelete (data) {
    return request({ url: '/kbdoc/delete', method: 'post', data });
}

/**
 * 批量删除文档
 * POST /kbdoc/batchDelete （@RequestBody List<String> idList）
 */
export function kbdocBatchDelete (data) {
    return request({ url: '/kbdoc/batchDelete', method: 'post', data });
}

/**
 * 查询文档解析文本内容（关联 tika 记录的 tsnr 字段）
 * GET /tika/getBy?id=
 * 说明：kbdoc.tikaid 关联 t_ai_tika.id，切片 docid 亦取 tikaid，故文本走 tika 详情接口。
 */
export function tikaGetBy (params) {
    return request({ url: '/tika/getBy', method: 'get', params });
}
