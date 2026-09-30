import { getCurrentInstance, reactive} from 'vue';
import { mapState, mapGetters, mapActions } from 'vuex'
import axios from 'axios';
import request from '@/plugins/request';
import util from '@/libs/util';
import Qs from 'qs';
import { Spin, Message } from 'view-ui-plus';
import Bus from '@/components/commonComponent/upload/js/bus'
import SparkMD5 from 'spark-md5'
import * as echarts from 'echarts'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import MarkdownIt from 'markdown-it'
import mdKatex from '@traptitech/markdown-it-katex'
import mila from 'markdown-it-link-attributes'
import hljs from 'highlight.js'

import Setting, { baseUrl, casUrl } from '@/setting'
import Setting_qd from '@/setting.env.js'

import { pinyin } from 'pinyin-pro';
import * as Excel from 'exceljs/dist/exceljs.min.js';
import * as FileSaver from 'file-saver';
import { encrypt } from '@/utils/rsaEncrypt'
import { encrypt_aes, decrypt_aes, md5 } from '@/utils/aesEncrypt'
import import_qd from '@/components/commonComponent/importAndExport/import_qd.js'
import websocket from '@/store/websocket/index.js'
import { initFunAsr, recordState, stopFunAsr } from '@/components/commonComponent/ai/asr/funasr.js'
import JSZip from 'jszip'
import jshint from 'jshint';
import { fetchEventSource } from '@microsoft/fetch-event-source';
const VueAwesomeSwiper = { Swiper, SwiperSlide }
const less = require('less') // 流式请求
const env = process.env.NODE_ENV
export { env };
export { mapState, mapGetters, mapActions };
export { request, axios, Qs, Bus, echarts, SparkMD5, VueAwesomeSwiper, MarkdownIt, mdKatex, mila, hljs, reactive , fetchEventSource}
export const qs = Qs;
export const Axios = axios;
export const bus = Bus;
export const utils = util;
export const setting = Setting;
export { baseUrl, casUrl };
export const publicPath = Setting_qd.publicPath;
export const apiBaseURL = Setting.apiBaseURL
export const uploadBaseURL = Setting.uploadBaseURL
export const fileUrl = uploadBaseURL + '/fileManagerSystem/getFileStream?scjlid='
export const zmhfileUrl = uploadBaseURL + '/fileManagerSystem/getZmhFileStream?scjlid='
export const BrowerWidth = document.documentElement.clientWidth || document.body.clientWidth
export const BrowerHeight = document.documentElement.clientHeight || document.body.clientHeight
export const contentHeight = window.outerHeight
export const contentWidth = window.outerWidth
export { encrypt, encrypt_aes, decrypt_aes, md5 }
export { import_qd, websocket, Excel, FileSaver, JSZip, initFunAsr, recordState, stopFunAsr }
// export {export_qd}

/**
 * 赢科后台调用接口（后台以@RequestBody形式接参）
 * @param {*} type
 * @param {*} sqlid
 * @param {*} obj
 * @returns
 */
export async function incoRequest (type = '', sqlid = '', obj = {}) {
    if (type === 'insert' || type === 'update' || type === 'delete' || type === 'queryOne' || type === 'queryone' || type === 'queryList' || type === 'querylist' || type === 'queryByPage' || type === 'queryBypage' || type === 'querybypage') {
        let url
        if (type === 'insert') url = '/inco/ht/add'
        else if (type === 'update') url = '/inco/ht/upd'
        else if (type === 'delete') url = '/inco/ht/del'
        else if (type === 'queryOne' || type === 'queryone') url = '/inco/ht/queryOne'
        else if (type === 'queryList' || type === 'querylist') url = '/inco/ht/queryList'
        else if (type === 'queryByPage' || type === 'queryBypage' || type === 'querybypage') url = '/inco/ht/queryListByPage'
        return request({
            method: 'post',
            url,
            data: { param: encrypt_aes(JSON.stringify({ sqlid, ...obj })) }
        })
    } else {
        return request({
            method: 'post',
            url: type,
            data: { sqlid, ...obj }
        })
    }
}
/**
 *
 * @param {*} url 请求的后台地址
 * @param {*} method 是get请求还是post请求
 * @param {*} obj 给后台传递的参数
 * @param {*} paramType 传参类型：params或data
 * @param {*} header 请求头
 * @param {*} requestType 请求类型：request或axios
 * @returns
 */
export function incoRequest_self (url = '', method = 'get', obj = {}, paramType = 'params', header = {}, requestType = 'request') {
    const tempObj = { url, method }
    if (Object.keys(header).length > 0) tempObj.headers = header
    if (paramType === 'data') { tempObj.data = obj } else if (paramType === 'params') tempObj.params = obj
    if (requestType === 'request') return request(tempObj)
    else return axios(tempObj)
}

export function incoRequest_tb (type = '', sqlid = '', obj = {}) {
    return incoRequest(type, sqlid, obj)
}

/**
 * 自定义后台方法
 */
export function selfRequest (url, params = {}) {
    const token = localStorage.getItem('token' + '_' + Setting.xmid);
    let jsdm = '';
    const userinfoStr = localStorage.getItem('userinfo' + '_' + Setting.xmid);
    if (userinfoStr) jsdm = JSON.parse(userinfoStr).jsdm;
    return request({
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Token: 'Inco-' + token,
            RoleCode: jsdm
        },
        method: 'post',
        url,
        data: Qs.stringify({
            ...params
        })
    })
}

export function axiosRequest (url, params) {
    const token = localStorage.getItem('token' + '_' + Setting.xmid);
    let jsdm = '';
    const userinfoStr = localStorage.getItem('userinfo' + '_' + Setting.xmid);
    if (userinfoStr) jsdm = JSON.parse(userinfoStr).jsdm;
    // 让每个请求携带token-- ['X-Token']为自定义key 请根据实际情况自行修改
    return axios({
        url,
        method: 'POST',
        headers: {
            Token: 'Inco-' + token,
            RoleCode: jsdm
        },
        data: params
    })
}
export function axiosRequest_get (url, params) {
    const token = localStorage.getItem('token' + '_' + Setting.xmid);
    let jsdm = '';
    const userinfoStr = localStorage.getItem('userinfo' + '_' + Setting.xmid);
    if (userinfoStr) jsdm = JSON.parse(userinfoStr).jsdm;
    // 让每个请求携带token-- ['X-Token']为自定义key 请根据实际情况自行修改
    return axios({
        url,
        method: 'GET',
        headers: {
            Token: 'Inco-' + token,
            RoleCode: jsdm
        },
        params
    })
}

/**
 * 获取功能表组件配置信息
 * id 是功能表的组件id
 */
export async function getzjpzxx (id, type = 'zjpzxx') {
    let configdata = {}
    let res = {}
    if (setting.cacheJson) {
        // 使用缓存json
        try {
            const jsonRes = await axios.get(setting.staticResourceUrl + id + '.json');
            // 存在json文件
            if (jsonRes.status === 200) {
                res = JSON.parse(decrypt_aes(jsonRes.data))
            }
        } catch (error) {
            // 不存在json文件，重新请求后台获取数据，后台返回数据的同时会自动生成此json文件，下次访问的时候就可以请求到json文件了
            res = await incoRequest('queryone', '16775568526735c14954eb188b2dda9a7cf8ee74d2976d', { id, dytype: type })
        }
    } else {
        // 不使用缓存json
        res = await incoRequest('queryone', '16775568526735c14954eb188b2dda9a7cf8ee74d2976d', { id, dytype: type })
    }
    if (type === 'zjpzxx' && res.zjpzxx) configdata = JSON.parse(res.zjpzxx)
    if (type === 'zjsjxx' && res.zjsjxx) configdata = JSON.parse(res.zjsjxx)
    if (type === 'childpzxx' && res.childpzxx) configdata = JSON.parse(res.childpzxx)
    configdata.xmid = res.xmid
    return configdata
}

/**
 * 赢科后台批量调用接口
 * @param [*] sqllist
 * sqllist数据[{type:'querylist',sqlid:'xxxx',blm:'返回数据的变量名'param:{传递给后台的数据对象}}]
 * @returns
 */
export async function multiquery (sqllist = []) {
    return request({
        method: 'post',
        url: '/inco/ht/batchQuery',
        data: { param: encrypt_aes(JSON.stringify({ sqllist })) }
    })
}

/**
 *获取拼音首字母
 * @param {*} str
 */
export function getpy (str, pattern = 'first', toneType = 'none', type = 'array') {
    const py = pinyin(str, { pattern, toneType, type })
    return py.join('')
}

/**
 * 对数组对象排序
 * @param {*} list 数组对象
 * @param {*} blm 要排序的变量名
 * @param {*} type 排序字段变量类型：String或Number
 */
export function arryObjSort (list, blm, type = 'String') {
    if (type === 'String' || type === 'string') {
        list.sort(function (a, b) {
            const x = a[blm] == null ? '' : a[blm].toLowerCase();
            const y = b[blm] == null ? '' : b[blm].toLowerCase();
            if (x < y) { return -1; }
            if (x > y) { return 1; }
            return 0;
        });
    }
    if (type === 'Number' || type === 'number') {
        list.sort(function (a, b) {
            const x = a[blm] == null ? Infinity : a[blm];
            const y = b[blm] == null ? Infinity : b[blm];
            return x - y;
        })
    }
}

/**
 * 比较两个数组，sourseList,去除targetList里面包含的数据，并返回不包含的数据
 * @param {*} sourseList 后台来源数据
 * @param {*} targetList 比较的list
 * @param {*} id 两个数组共同的id值
 */
export function compareArrayAndReturnList (sourceList = [], targetList = [], sourceId = 'id', targetId = 'id') {
    if (sourceList.length > 0) {
        if (targetList.length > 0) {
            const returnList = JSON.parse(JSON.stringify(sourceList))
            for (const item of targetList) {
                for (let i = 0; i < returnList.length; i++) {
                    const row = returnList[i]
                    if (row[sourceId].toLowerCase() === item[targetId].toLowerCase()) {
                        returnList.splice(i, 1);
                        break;
                    }
                }
            }
            return returnList
        } else return sourceList
    } return []
}

/**
 * 比较两个数组，sourseList,去除targetList里面包含的数据，并返回不包含的数据
 * @param {*} sourseList 后台来源数据
 * @param {*} targetList 比较的list
 * @param {*} id 两个数组共同的id值
 */
export function compareArrayAndReturnAll (sourceList = [], targetList = [], sourceId = 'id', targetId = 'id') {
    const returnList = [] // 返回的没有包含的数组
    const includeList = [] // 返回包含的数据
    if (sourceList.length > 0) {
        const returnList = JSON.parse(JSON.stringify(sourceList))
        if (targetList.length > 0) {
            for (const item of targetList) {
                for (let i = 0; i < returnList.length; i++) {
                    const row = returnList[i]
                    if (row[sourceId].toLowerCase() === item[targetId].toLowerCase()) {
                        includeList.push(row)
                        returnList.splice(i, 1);
                        break;
                    }
                }
            }
            return { notIncludeList: returnList, includeList }
        } else return { notIncludeList: returnList, includeList }
    } return { notIncludeList: returnList, includeList }
}
export function compareArray (sourceList = [], targetList = [], sourceId = 'id', targetId = 'id') {
    compareArrayAndReturnAll(sourceList = [], targetList = [], sourceId = 'id', targetId = 'id')
}
/**
 * 获取项目的配置信息，项目配置信息以JSON的形式保存在pzxx字段中
 */
export async function getProjectConfigInfo () {
    const url = '/inco/ht/queryOne'
    const data = { sqlid: '8c61d7691177e4165cc941c366f9989a4411656041740360', id: 'pzxx' }
    const res = await request({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        method: 'post',
url,
data: Qs.stringify(data)
    })
    const obj = JSON.parse(res.pzxx) // 解析项目配置信息
    if (obj.sysConfig && obj.sysConfig.length > 0) {
        obj.sysConfig.forEach((config) => {
            if (config.key.trim() && config.value.trim()) {
                obj[config.key] = config.value
            }
        })
    }
    return obj
}

/**
 * sys_guid返回前端的guid，是有1-10；a-f随机生成的字符串，加上时间戳
 * write by lixiang
 * @export
 * @returns 48位的随机码
 */
// eslint-disable-next-line camelcase
export function sys_guid () {
    const new_time = new Date()
    const current_time = new_time.getTime()
    const s = []
    const hexDigits = '123456789abcdef'
    for (let i = 0; i < 34; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
    }
    const newstring = 'id' + current_time + s.join('')
    return newstring
}
export function spin (content, type, _this) {
    if (type === 'show' && content) {
        Spin.show({
            render: (h) => {
                return h('div', [
                    h('Icon', {
                        class: 'demo-spin-icon-load',
                        props: {
                            type: 'ios-loading',
                            size: 18
                        }
                    }),
                    h('div', content)
                ])
            }
        })
    }
    if (type === 'hide') {
        Spin.hide()
    }
}
export function spin1 (list, type, _this) {
    if (type === 'show' && list.length > 0) {
        Spin.show({
            render: (h) => {
                const zjList = []
                list.forEach((item) => {
                    const obj = h('div', item.name)
                    zjList.push(obj)
                })
                return h('div', [
                    h('Icon', {
                        class: 'demo-spin-icon-load',
                        props: {
                            type: 'ios-loading',
                            size: 18
                        }
                    }),
                    zjList
                ])
            }
        })
    }
    if (type === 'hide') {
        Spin.hide()
    }
}

export function exportFile (url, param, fileName, _this) {
    _this.$progress.show()
    const token = localStorage.getItem('token' + '_' + Setting.xmid);
    let jsdm = '';
    const userinfoStr = localStorage.getItem('userinfo' + '_' + Setting.xmid);
    if (userinfoStr) jsdm = JSON.parse(userinfoStr).jsdm;
    axios({
        url: Setting.apiBaseURL + url,
        method: 'POST',
        headers: {
            Token: 'Inco-' + token,
            RoleCode: jsdm
        },
        timeout: 0,
        responseType: 'blob',
        data: {
            ...param
        },
        // 监听下载进度的方法，后端response需返回Content-Length
        onDownloadProgress (progress) {
            // progress对象中的loaded表示已经下载的数量，total表示总数量，这里计算出百分比。注意这里一定需要后端接口返回 Content-Length，没有的话是拿不到的
            const downProgress = Math.round((100 * progress.loaded) / progress.total);
            _this.$progress.set(downProgress)
        }
    }).then(res => {
        _this.$Spin.hide()
        if (!res) {
            _this.$progress.hide()
            Message.warning('下载失败，请重试！')
        } else {
            const Blob = res.data
            let a = document.createElement('a')
            if (fileName) a.download = fileName;
            a.href = window.URL.createObjectURL(Blob);
            a.click()
            window.URL.revokeObjectURL(Blob)
            a = null // 设置为空，gc自动回收
            _this.$progress.hide()
        }
    })
}

export function exportFile_get (url, param, fileName, _this) {
    _this.$progress.show()
    const token = localStorage.getItem('token' + '_' + Setting.xmid);
    let jsdm = '';
    const userinfoStr = localStorage.getItem('userinfo' + '_' + Setting.xmid);
    if (userinfoStr) jsdm = JSON.parse(userinfoStr).jsdm;
    axios({
        url: Setting.apiBaseURL + url,
        method: 'GET',
        headers: {
            Token: 'Inco-' + token,
            RoleCode: jsdm
        },
        timeout: 0,
        responseType: 'blob',
        params: {
            ...param
        },
        // 监听下载进度的方法，后端response需返回Content-Length
        onDownloadProgress (progress) {
            // progress对象中的loaded表示已经下载的数量，total表示总数量，这里计算出百分比。注意这里一定需要后端接口返回 Content-Length，没有的话是拿不到的
            const downProgress = Math.round((100 * progress.loaded) / progress.total);
            _this.$progress.set(downProgress)
        }
    }).then(res => {
        _this.$Spin.hide()
        if (!res) {
            _this.$progress.hide()
            Message.warning('下载失败，请重试！')
        } else {
            const Blob = res.data
            let a = document.createElement('a')
            if (fileName) a.download = fileName;
            a.href = window.URL.createObjectURL(Blob);
            a.click()
            window.URL.revokeObjectURL(Blob)
            a = null // 设置为空，gc自动回收
            _this.$progress.hide()
        }
    })
}

/**
 *
 *
 * @export
 * @param {any} oldArr 从后台返回树的list，后台查询只需要正常查询出list就行，不需要处理
 * @param {string} [id='id'] 返回list中的id
 * @param {string} [fid='fid'] 返回list中fid，例如：后台返回的事sjdm（上级代码），则传参时写'sjdm'
 * @param {string} [title='title']  设置树的title属性，如果后台返回BT（标题），则传参时写'BT'
 * @param {string} [root='root'] 后台数据根节点的名称
 * @returns 将list转换成树结构的数据
 */

export function listToTree (oldArr, id = 'id', fid = 'fid', title = 'title', root = 'root') {
    if (oldArr && oldArr.length === 0) return []
    const cloneData = JSON.parse(JSON.stringify(oldArr))
    // 返回跟节点tree数据
    const newTree = []
    if (cloneData.length > 0) {
        for (let i = cloneData.length - 1; i >= 0; i--) {
            const item = cloneData[i]
            if (item[fid] == root) {
                newTree.unshift(item)
                cloneData.splice(i, 1)
            }
        }
        getTreeData(newTree)
    }
    // console.log(newTree,'newTree from listToTree in commons.js')
    return newTree
    function getTreeData (fatherlist) {
        fatherlist.forEach((father, fatherIndex) => {
            for (let i = cloneData.length - 1; i >= 0; i--) {
                const child = cloneData[i]
                if (father[id] === child[fid]) {
                    // console.log(father.mc,father[id],child.mc,child.fid,'*********')
                    if (!father.children) father.children = []
                    // child.title = child[title]
                    father.children.unshift(child)
                    cloneData.splice(i, 1)
                }
            }
            if (father.children) getTreeData(father.children)
        })
    }
}

export function getTreeToList (sourceArr, childrenname = 'children') {
    if (!sourceArr) return []
    if (sourceArr && sourceArr.length === 0) return []
    function getList (arr) {
        if (arr.length > 0) {
            arr.forEach((child) => {
                res.push(child)
                if (child[childrenname] && child[childrenname].length > 0) {
                    getList(child[childrenname])
                    delete child[childrenname]
                }
            })
        }
    }
    const res = []
    const cloneArr = JSON.parse(JSON.stringify(sourceArr))
    getList(cloneArr)
    // console.log('getTreeToList')
    return res
}
export function treeToList (sourceArr, childrenname = 'children') {
    return getTreeToList(sourceArr, childrenname)
}
export function treetolist (sourceArr, childrenname = 'children') {
    return getTreeToList(sourceArr, childrenname)
}

/**
 * JS 通过递归查找某个节点的父节点
 * @param {*} row 当前行数据
 * @param {*} tree 整个树的数据即带children的数组
 * @param {*} tableid 查找的主键
 * @returns
 */
export function findFatherNode (row, tree, id = 'id', fid = 'fid', childrenname = 'children') {
    let result = null
    for (let i = 0; i < tree.length; i++) {
        if (row[fid] == tree[i][id]) {
            result = tree[i]
            break;
        } else {
            if (tree[i][childrenname] && tree[i][childrenname].length > 0) {
                result = findFatherNode(row, tree[i][childrenname], id = 'id', fid = 'fid', childrenname)
                if (result) {
                    break;
                }
            }
        }
    }
    return result
}
/**
 *
 * @param {*} blm 要查询那个变量名
 * @param {*} children 要查询的tree的children数据
 * @param {*} value 查询的值
 * @param {*} t=-0987654321·9765有90询的tree的数据
 * @returns 返回查询到treedata中符合条件的child对象
 */
export function findChildNode (blm, children, value, childrenname = 'children') {
    let child = null
    for (let i = 0; i < children.length; i++) {
        const item = children[i]
        if (item[blm] == value) {
            child = item
            break
        } else {
            if (item[childrenname] && item[childrenname].length > 0) {
                child = findChildNode(blm, item[childrenname], value, childrenname)
                if (child) break
            }
        }
    }
    // return searchChild(blm, treedata, value,child)
    return child
}
/**
 *
 * @param {*} targetBlm 要移除节点的变量名
 * @param {*} list 要移除节点的数组
 * @returns
 */
export function removeNode (targetBlm, list) {
    if (!targetBlm) return;
    const removeNode = (list, blm) => {
        if (!Array.isArray(list)) return list;
        return list.filter(item => {
            if (item.blm === blm) { return false; }
            if (item.children && Array.isArray(item.children) && item.children.length > 0) {
                item.children = remove784 - Node(item.children, blm);
            }
            return true;
        });
    };
    removeNode(list, targetBlm);
    // return list;
}
export function addNode (item, list, index = -1) {
    if (list.length >= 0) {
        if (index >= 0 && index < list.length) {
            list.splice(index, 0, item)
        } else {
            list.push(item)
        }
    }
}

/**
 * 查找树某个节点的同级节点
 * 返回的数据是拷贝出来的，不是在原来数组上过滤的
 * @export 返回该节点的同级数据
 * @param {any} oldArr 包含节点的tree的数据
 * @param {any} currentNode 当前节点
 * @param {string} [id='ID'] 节点id
 * @param {string} [fid='FID'] 该节点的父id；FID
 * @param {boolean} [noincludeMe=false] 返回数据是否不包括自己
 * @param {boolean} [exceptChildren=true] 返回数据是否子
 */
export function findTreeBrother (oldArr, currentNode, id = 'id', fid = 'fid', noincludeMe = true) {
    const res = []
    const arrList = getTreeToList(oldArr)
    arrList.forEach((item) => {
        if (item[fid] == currentNode[fid]) {
            res.push(item)
        }
    })
    // 删除自己节点的数据
    const temparr = JSON.parse(JSON.stringify(res))
    if (noincludeMe && temparr && temparr.length > 0) {
        for (let i = temparr.length - 1; i >= 0; i--) {
            if (temparr[i][id] == currentNode[id]) temparr.splice(i, 1)
        }
    }
    return temparr
}

/**
 * 查找树当前节点子的数据，并以list形式返回
 *
 * @export
 * @param {any} currentNode 当前节点
 * @param {boolean} [includeMe=true] 返回值中是否包括自己
 * @returns
 */
export function findTreeChildren (currentNode, includeMe = true) {
    const res = []
    const source = JSON.parse(JSON.stringify(currentNode))
    if (source.children && source.children.length > 0) {
        getData(source.children)
    }

    function getData (arr) {
        if (arr.length > 0) {
            arr.forEach((child) => {
                res.push(child)
                if (child.children && child.children.length > 0) { getData(child.children) }
            })
        }
    }
    // 删除返回数据中的children
    if (res.length > 0) {
        res.forEach((child) => {
            if (child.children) delete child.children
        })
    }
    // 如果选择包含自己，将自己数据加入返回值
    if (includeMe == true) {
        const obj = JSON.parse(JSON.stringify(currentNode))
        if (obj.children) {
            delete obj.children
        }
        res.push(obj)
    }
    // console.log(res,'finedTreeChildren')
    return res
}

/**
 * 过滤树当前节点子的数据
 *
 * @export
 * @param {any} currentNode 当前节点
 * @param {boolean} [includeMe=true] 返回值中是否包括自己
 * @returns
 */
export function filterListExecptMe (list, me) {
    if (!me || list.length == 0) return list
    let res = []
    const source = JSON.parse(JSON.stringify(list))
    res = findItem(source, me)
    return res
    function findItem (arr, me) {
        const arrlength = arr.length
        for (let i = 0; i < arrlength; i++) {
            const item = arr[i]
            if (item.id === me) {
                arr.splice(i, 1)
                return arr
            } else {
                if (item.children && item.children.length > 0) {
                    findItem(item.children, me)
                }
            }
        }
        return arr
    }
}
/**
 * 过滤树当前节点子的数据，并以treelist形式返回,过滤最终节点的数据
 *
 * @export
 * @param {any} currentNode 当前节点
 * @param {boolean} [includeMe=true] 返回值中是否包括自己
 * @returns
 */
export function filterEndNode (list, itemName, itemValue) {
    const source = JSON.parse(JSON.stringify(list))
    let arr = []
    arr = filterItem(source, itemName, itemValue)

    return arr
    function filterItem (s, itemName, itemValue) {
        return s.filter((item) => {
            if (item[itemName] == itemValue) {
                if (item.children && item.children.length > 0) {
                    item.children = filterItem(item.children, itemName, itemValue)
                }
                return item
            }
        })
    }
}
/**
 * 移动数组项
 * @param {*} list source数组
 * @param {*} start 移动项的索引
 * @param {*} end   目标索引
 */
export function moveArrayItem (list, start, end) {
    const item = list[start]
    list.splice(start, 1)
    if (start > end) {
        list.splice(end, 0, item)
    } else {
        list.splice(end - 1, 0, item)
    }
    //  console.log(list,'finish')
}
/**
 * 执行配置的方法
 * @param {*} param
 * @param {*} funcBody
 */
export async function funcEval (_this, param, funcBody) {
    if (!_this || !funcBody) return
    try {
        // Vue 3 兼容：优先从 globalProperties 获取根实例数据，没有则降级到 _this 自身
        let rootInstance = null;
        if (_this.$root) {
            rootInstance = _this.$root;
        } else if (window.__vueRootInstance__) {
            rootInstance = window.__vueRootInstance__;
        } else {
            rootInstance = _this;
        }
        const rootFunction = rootInstance.function || _this.function || {};
        const rootTempdata = rootInstance.tempdata || _this.tempdata || {};
        const func = new Function('_this', 'obj', 'rootFunction', 'rootTempdata', funcBody);
        var returnValue = await func(_this, param, rootFunction, rootTempdata);
    } catch (e) {
        console.log('from:', _this.componentName, '错误：from commns.js--funcEaval方法', param, funcBody, e, _this);
    }
    return returnValue;
}
/**
 * 不转异步的自定义function方法
 * @param {*} _this
 * @param {*} param
 * @param {*} funcBody
 * @returns
 */
export function funcEval1 (_this, param, funcBody) {
    if (!_this || !funcBody) return
    try {
        // Vue 3 兼容：优先从 globalProperties 获取根实例数据，没有则降级到 _this 自身
        let rootInstance = null;
        if (_this.$root) {
            rootInstance = _this.$root;
        } else if (window.__vueRootInstance__) {
            rootInstance = window.__vueRootInstance__;
        } else {
            rootInstance = _this;
        }
        const rootFunction = rootInstance.function || _this.function || {};
        const rootTempdata = rootInstance.tempdata || _this.tempdata || {};
        const func = new Function('_this', 'obj', 'rootFunction', 'rootTempdata', funcBody);
        var returnValue = func(_this, param, rootFunction, rootTempdata);
    } catch (e) {
        console.log('from:', _this.componentName, '错误：from commns.js--funcEaval方法', param, funcBody, e, _this);
    }
    return returnValue;
}
export function getBackgroundImage (id, flag) {
    let imgObj = { 'background-image': "url('" + zmhfileUrl + id + "')" }
    if (flag) {
        imgObj = { 'background-image': "url('" + fileUrl + id + "')" }
    }
    return imgObj
}
/**
 *  该方法主要是对表中的某个字段值做唯一性校验
 * @param {*} bm 要查询字段的表名
 * @param {*} zdm 字段名
 * @param {*} zdz 字段值
 * @param {*} id 当前记录的id
 * @returns
 */
export function getFieldDataNum (bm, zdm, zdz, id, paramname, paramvalue) {
    return incoRequest('queryone', 'verifyFieldDataNumber', { bm, zdm, zdz, id, paramname, paramvalue })
}

/**
 * 校验字符串长度
 * @param {*} str
 * @param {*} length
 */
export function verifyStrLength (str, length) {
    const returnValue = { flag: true, length: null }
    let num = 0;// 汉字长度
    let qtnum = 0;// 其他字符
    for (let k = 0; k < str.length; k++) {
        if (str.charCodeAt(k) > 255) num++;
        else qtnum++
    }
    const totalLeng = num * 2 + qtnum;
    returnValue.length = totalLeng
    if (length && totalLeng > length) {
        returnValue.flag = false
    }
    return returnValue
}
/**
 * 读取本地文件，并返回读取文件内容
 * @param {*} _this 调用组件的this指针
 * @param {*} file 本地文件信息
 * @param {*} func 读取文件后执行的方法
 */
export function readLocalFile (_this, file, func) {
    const reader = new FileReader(); // 这是核心,读取操作就是由它完成.
    // reader.readAsBinaryString(file)
    reader.readAsText(file); // 读取文件的内容,也可以读取文件的URL
    reader.onload = function () {
        // 当读取完成后回调这个函数,然后此时文件的内容存储到了result中,直接操作即可
        if (func) funcEval(_this, { result: reader.result }, func)
    }
}

/**
 * 读取通用上传文件，并返回读取文件内容
 */
export async function readuploadFile (id) {
    const response = await fetch(fileUrl + id)
    return response.text()
}

/**
 * 导出数据到Excel文件
 * @param columns 列 {header,key}
 * @param listdata list数据
 * @param wjmc Excel文件名称
 */
export function exportDataToExcel (columns, listdata, verifyList, wjmc) {
    console.log(listdata, '导出的数据', columns, '导出的列名')
    const workbook = new Excel.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');
    sheet.columns = columns;
    if (listdata && listdata.length > 0) { listdata.forEach((row) => { sheet.addRow(row) }) }
    if (verifyList.length > 0) {
        for (let i = 2; i < 5000; i++) {
            const temprow = sheet.getRow(i)
            verifyList.forEach((item) => {
                temprow.getCell(item.key).dataValidation = item.dataValidation
            })
        }
    }
    workbook.xlsx.writeBuffer().then((buffer) => {
        const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        FileSaver.saveAs(data, wjmc);
    });
}
/**
 * 导出数据到多sheet页的Excel文件
 * @param columns 列 {header,key}
 * @param listdata list数据
 *  @param verifyList 校验字段的数据
 * @param wjmc Excel文件名称
 */
export function exportMultiSheetDataToExcel (list, wjmc) {
    const workbook = new Excel.Workbook();
    for (let listItem = 0; listItem < list.length; listItem++) {
        const item = list[listItem]
        const sheet = workbook.addWorksheet(item.sheetName);
        sheet.columns = item.columns;
        if (item.list && item.list.length > 0) { item.list.forEach((row) => { sheet.addRow(row) }) }
        if (item.verifyList.length > 0) {
            for (let i = 2; i < 5000; i++) {
                const temprow = sheet.getRow(i)
                item.verifyList.forEach((verify) => {
                    temprow.getCell(verify.key).dataValidation = verify.dataValidation
                })
            }
        }
    }
    workbook.xlsx.writeBuffer().then((buffer) => {
        const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        FileSaver.saveAs(data, wjmc);
    });
}
/**
 * 打开路由
 * @param {*} _this 调用组件的this指针
 * @param {*} path 路由路径
 * @param {*} query 路由参数对象
 * @param {*} newWindow 是否新窗口打开
 */
export function openRouter (_this, path, query, newWindow = true) {
    const router = _this.$router.resolve({
        path,
        query
    })
    if (newWindow) {
        window.open(router.href, '_blank');
    } else {
        _this.$router.push({ path, query })
    }
}

// created by lixiang
/**
 * 通用后台的list查询
 * sqlid是查询sqlid
 * data是传入的
 *
 * @export
 * @param {any} sqlid
 * @param {any} data 传入的data对象
 * @returns
 */
export async function queryList (sqlid, data = {}) {
    try {
        return incoRequest('querylist', sqlid, data)
    } catch (error) {
        console.warn(error)
    }
}

export function verify_strlength (length) {
    return [{
        validator: (rule, value, callback) => {
            const res = verifyStrLength(value, length)
            if (!res.flag) callback(new Error(`内容超${length}字符`))
            else callback()
        },
        trigger: 'change'
    }]
}
/**
 * 动态给组件添加class
 * @param {*} componentName
 * @param {*} code
 */
export function appendCssCode (componentName, code) {
    if (!document.getElementById('style-' + componentName)) {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.rel = 'stylesheet';
        style.id = 'style-' + componentName
        // for Chrome Firefox Opera Safari
        style.appendChild(document.createTextNode(code));
        // for IE
        // style.styleSheet.cssText = code;
        const head = document.getElementsByTagName('head')[0];
        head.appendChild(style);
    }
}

/**
 * 常规校验
 * @param {*} type
 * @param {*} param
 */
export function validate (type, param = {}) {
    let rules = []
    switch (type) {
        case 'length':
            rules = [{
                validator: (rule, value, callback) => {
                    const res = verifyStrLength(value, param.length)
                    if (!res.flag) callback(new Error(param.message ? param.message : `内容超${param.length}字符`))
                    else callback()
                },
                trigger: 'change'
            }]
            break;
        case 'mobile':
            rules = [{
                pattern: /^(?:(?:\+|00)86)?1(?:(?:3[\d])|(?:4[5-79])|(?:5[0-35-9])|(?:6[5-7])|(?:7[0-8])|(?:8[\d])|(?:9[189]))\d{8}$/,
                message: param.message ? param.message : '手机号码格式不正确',
                trigger: 'blur'
            }]
            break;
        case 'email':
            rules = [{
                pattern: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                message: param.message ? param.message : '邮箱格式不正确',
                trigger: 'blur'
            }]
            break;
        case 'tel':
            rules = [{
                pattern: /^(?:(?:\d{3}-)?\d{8}|^(?:\d{4}-)?\d{7,8})(?:-\d+)?$/,
                message: param.message ? param.message : '电话格式不正确，如010-82886956',
                trigger: 'blur'
            }]
            break;
        case 'sfzh':
            rules = [{
                pattern: /^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|10|11|12)(?:0[1-9]|[1-2]\d|30|31)\d{3}[\dXx]$/,
                message: param.message ? param.message : '18位身份证号格式不正确',
                trigger: 'blur'
            }]
            break;
        case 'sfzh15':
            rules = [{
                pattern: /^[1-9]\d{5}\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{2}$/,
                message: param.message ? param.message : '15位身份证号格式不正确',
                trigger: 'blur'
            }]
            break;
        case 'zw':
            rules = [{
                pattern: /^(?:[\u3400-\u4DB5\u4E00-\u9FEA\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0])+$/,
                message: param.message ? param.message : '中文格式不正确',
                trigger: 'blur'
            }]
            break;
        case 'zwxm':
            rules = [{
                pattern: /^(?:[\u4e00-\u9fa5·]{2,16})$/,
                message: param.message ? param.message : '不是正确的中文姓名',
                trigger: 'blur'
            }]
            break;
        case 'ywxm':
            rules = [{
                pattern: /(^[a-zA-Z][a-zA-Z\s]{0,20}[a-zA-Z]$)/,
                message: param.message ? param.message : '不是正确的英文姓名',
                trigger: 'blur'
            }]
            break;
        case 'url':
            rules = [{
                pattern: /^(((ht|f)tps?):\/\/)?([^!@#$%^&*?.\s-]([^!@#$%^&*?.\s]{0,63}[^!@#$%^&*?.\s])?\.)+[a-z]{2,6}\/?/,
                message: param.message ? param.message : '网址格式不正确',
                trigger: 'blur'
            }]
            break;
        case 'yhkh':
            rules = [{
                pattern: /^[1-9]\d{9,29}$/,
                message: param.message ? param.message : '银行卡号不正确',
                trigger: 'blur'
            }]
            break;
        case 'wxh':
            rules = [{
                pattern: /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/,
                message: param.message ? param.message : '微信号格式不正确',
                trigger: 'blur'
            }]
            break;
        case 'yzbm':
            rules = [{
                pattern: /^(0[1-7]|1[0-356]|2[0-7]|3[0-6]|4[0-7]|5[1-7]|6[1-7]|7[0-5]|8[013-6])\d{4}$/,
                message: param.message ? param.message : '邮政编码格式不正确',
                trigger: 'blur'
            }]
            break;
        case 'tyshxydm':
            rules = [{
                pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/,
                message: param.message ? param.message : '统一社会信用代码格式不正确',
                trigger: 'blur'
            }]
            break;
        case 'zwym':
            rules = [{
                pattern: /^(254|252|248|240|224|192|128)\.0\.0\.0|255\.(254|252|248|240|224|192|128|0)\.0\.0|255\.255\.(254|252|248|240|224|192|128|0)\.0|255\.255\.255\.(255|254|252|248|240|224|192|128|0)$/,
                message: param.message ? param.message : '子网掩码格式不正确',
                trigger: 'blur'
            }]
            break;
        case 'cp':
            rules = [{
                pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-HJ-NP-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/,
                message: param.message ? param.message : '车牌号格式不正确',
                trigger: 'blur'
            }]
            break;
        case 'hz':
            rules = [{
                pattern: /(^[EeKkGgDdSsPpHh]\d{8}$)|(^(([Ee][a-fA-F])|([DdSsPp][Ee])|([Kk][Jj])|([Mm][Aa])|(1[45]))\d{7}$)/,
                message: param.message ? param.message : '护照格式不正确',
                trigger: 'blur'
            }]
            break;
        case 'zz':
            rules = [{
                pattern: eval(param.zz),
                message: param.message ? param.message : '格式不正确',
                trigger: 'blur'
            }]
            break;
    }
    return rules;
}
export async function getServerTime () {
    const sql = 'select to_char(sysdate,\'yyyy-mm-dd hh24:mi:ss\') as sj from dual'
    const res = await incoRequest('queryone', 'dify_callsql_query', { sql })
    return res.sj;
}

// 图片转base64
export async function getBase64 (file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        let fileResult = '';
        reader.readAsDataURL(file);
        // 开始转
        reader.onload = () => {
            fileResult = reader.result;
        };
        // 转 失败
        reader.onerror = (error) => {
            reject(error);
        };
        // 转 结束
        reader.onloadend = () => {
            resolve(fileResult);
        };
    });
}

// 获取文件信息
export async function getFileInfo (wjid) {
    const token = localStorage.getItem('token' + '_' + Setting.xmid);
    let jsdm = '';
    const userinfoStr = localStorage.getItem('userinfo' + '_' + Setting.xmid);
    if (userinfoStr) jsdm = JSON.parse(userinfoStr).jsdm;
    const res = await axios({
        url: uploadBaseURL + '/fileManagerSystem/queryFileById',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Token: 'Inco-' + token,
            RoleCode: jsdm
        },
        params: { wjid }
    })
    return res.data
}

// 获取文件流地址
export async function getFileStreamUrl (wjid) {
    let src = fileUrl + wjid
    const res = await getFileInfo(wjid)
    switch (res.uploadType) {
        case 'local':
            if (setting.streamServerEnable) src = setting.streamServerUrl + res.ccxdlj;
            break;
        case 'minio':
            if (setting.oss && setting.oss.minioServerUrl) src = setting.oss.minioServerUrl + res.ccxdlj;
            break;
        case 'aliyun':
            if (setting.oss && setting.oss.aliyunServerUrl) src = setting.oss.ailiyunServerUrl + res.ccxdlj;
            break;
    }
    return src
}

/**
 * 获取某一年的周数及每周的日期明细
 * @param {*} year
 * @returns 返回传入year的周list,并且没周包含哪些日期
 */
export function getWeeks (year) {
    function formatNumber (n) { return n.toString().length > 1 ? n : '0' + n; }
    var getWeek = {
        run: function (year) {
            const days = getWeek.getDate(year || new Date().getFullYear())
            const weeks = {};
            for (let i = 0; i < days.length; i++) {
                const weeksKeyLen = Object.keys(weeks).length;
                const daySplit = days[i].split('_');
                if (weeks[weeksKeyLen] == undefined) {
                    weeks[weeksKeyLen + 1] = [daySplit[0]]
                } else {
                    if (daySplit[1] == '1') { weeks[weeksKeyLen + 1] = [daySplit[0]] } else { weeks[weeksKeyLen].push(daySplit[0]) }
                }
            }
            return weeks
        },
        getDate: function (year) {
            const dates = []
            for (let i = 1; i <= 12; i++) {
                for (let j = 1; j <= new Date(year, i, 0).getDate(); j++) {
                    dates.push(year + '-' + formatNumber(i) + '-' + formatNumber(j) + '_' + new Date([year, i, j].join('-')).getDay())
                }
            }
            return dates
        }
    }
    return getWeek.run(year)
}
/**
 *
 * @param {*} year
 * @returns 返回一年的周数
 */
export function getWeeksList (year) {
    const list = []
    const weeks = getWeeks(year)
    const length = Object.keys(weeks).length
    for (let i = 1; i < length + 1; i++) {
        const key = i.toString()
        const item = weeks[key]
        let label = ''
        const item_length = item.length
        label = i + '周：' + item[0] + '至' + item[item_length - 1]
        list.push({ value: i.toString(), label })
    }
    return list
}
/**
 * 计算当前日期是哪一周
 * @returns 返回当前的周数
 */
export function getCurrentWeekNum (inputDay) {
    let mydate = new Date()
    if (inputDay) { mydate = new Date(inputDay) }
    const year = mydate.getFullYear()
    let month = mydate.getMonth() + 1
    let day = mydate.getDate()
    month = (month > 9) ? month : ('0' + month)
    day = (day > 9) ? day : ('0' + day)
    const today = `${year}-${month}-${day}`
    const weeks = getWeeks(year)
    const length = Object.keys(weeks).length
    let weekNum = -1
    for (let i = 1; i <= length; i++) {
        const key = i.toString()
        const item = weeks[key]
        if (item.indexOf(today) !== -1) {
            weekNum = key
            break
        }
    }
    return weekNum
}
/**
 *
 * @param {*} configdata 配置导出参数 其中主要包括moduleId，queryId，exportType，params时传给sql的参数
 * @param {*} _this 调用组件的指针
 * @returns
 */
export async function export_qd (configdata, _this) {
    const res = await incoRequest('queryone', '169399116994992a4339668b6fe5ed5864776d3af2af11e', { id: configdata.moduleId })
    const config = JSON.parse(res.drpzxx)
    if (!config.yxdrzd || config.yxdrzd.length === 0) {
        _this.$Message.error('模板配置错误，请仔细检查模板')
        return
    }
    const moduleConfig = config.module_config
    const yxdrzd = config.fieldsConfig
    const exportType = configdata.exportType
    let exportPurpose = ''
    if (configdata.exportPurpose) exportPurpose = configdata.exportPurpose
    const columns = []
    let verifyList = []
    for (let i = 0; i < yxdrzd.length; i++) {
        const item = yxdrzd[i]
        let flag = false
        if (!item.dclx) {
            if (item.hqsjfs === 'import' || item.hqsjfs === 'changeIntoDm') flag = true
        } else {
            if (exportType === 'exportmodule' && item.dclx.includes('exportmodule')) { flag = true } else {
                if (configdata.exportPurpose) {
                    if (exportPurpose === 'exportlistdata' && item.dclx.includes('exportlistdata')) flag = true
                    if (exportPurpose === 'export_for_update' && item.dclx.includes('export_for_update')) flag = true
                }
            }
        }
        // 是否是非导出字段(此处为兼容原来的导入模板配置，值为1是，则不导入，如果不配置，则默认为导入字段)
        if (flag) {
            const column = { header: item.lm }
            column.key = item.dcblm ? item.dcblm : item.zdm
            if (item.ycdc === '1') column.hidden = true // 是否隐藏导出字段
            if (typeof item.columnWidth !== 'undefined') column.width = item.columnWidth
            columns.push(column)
        }
        if (item.hqsjfs === 'changeIntoDm') {
            await getVerifyList(item, item, verifyList) // 获取下载模板的内容是list下拉框的数据
        }
    }
    let list = []
    if (configdata.exportType === 'exportmodule') {
        for (let i = 0; i < 5000; i++) { list.push({}) }
    }
    // 获取已选导入字段的信息// 将数据转换为sheet结构
    if (configdata.exportType === 'exportlistdata') {
        // 获取导出数据相关组件的data值
        if (configdata.zjblm) {
            const list1 = _this.ref[configdata.zjblm].data
            list = handleList(list1, moduleConfig)
        }
    }
    if (configdata.exportType === 'exportquerydata' && configdata.queryId) {
        const list1 = await incoRequest('querylist', configdata.queryId, configdata.params)
        list = handleList(list1, moduleConfig)
    }

    if (configdata.exportType !== 'exportmodule') verifyList = []

    let downloadname = '下载文件.xlsx'
    if (configdata.downloadname) downloadname = configdata.downloadname + '.xlsx'
    exportDataToExcel(columns, list, verifyList, downloadname)

    async function getVerifyList (item, zdConfig, verifyList) {
        const list = await getDMList(zdConfig)
        if (list.length > 0) {
            let verifyObj = {}
            const arr = []
            list.forEach((listItem) => { arr.push(listItem.label) })
            const labelStr = arr.join(',')
            const str = `"${labelStr}"`
            verifyObj = {
                key: item.zdm,
                dataValidation: {
                    type: 'list',
                    allowBlank: true,
                    formulae: [str]
                }
            }
            verifyList.push(verifyObj)
        }
    }
    async function getDMList (dmConfig) {
        let list = []
        if (dmConfig.dmlist && dmConfig.dmlist.length > 0) { list = dmConfig.dmlist } else if (dmConfig.dmbm && dmConfig.dm && dmConfig.mc) {
            const obj = { listBm: dmConfig.dmbm, listDm: dmConfig.dm, listMc: dmConfig.mc, whereSql: dmConfig.whereSql }
            list = await incoRequest('querylist', 'DC37EB84F52E3520E0555943CA7634DE', obj)
        }
        return list
    }

    function handleList (listdata, bm_list) {
        console.log(bm_list, 'bm_list===')
        bm_list.forEach((item) => {
            let currentData = {}
            listdata.forEach((data) => {
                const primary_key_list = item.update_primaryKeyList
                const allField = item.fieldConfig
                let flag = false
                if (Object.keys(currentData).length > 0) {
                    primary_key_list.forEach((zdfield) => {
                        if (currentData[zdfield.dcblm] == data[zdfield.dcblm]) flag = true
                    })
                }
                if (!flag) {
                    currentData = { ...data }
                } else {
                    allField.forEach((field) => {
                        data[field.dcblm] = ''
                    })
                }
            })
        })
        return listdata
    }
}

/**
 * 发送配置信息到项目websocket推送，此方法为配置平台发送数据，url为项目后台访问地址
 */
export function sendPzxxMsgToXm (apiBaseURL, str, topic = '/topic/tbpz') {
    return axiosRequest(apiBaseURL + '/inco/ht/sendMsgByWebsocket', { topic: encrypt_aes(topic), obj: encrypt_aes(str) })
}

export function getMap (name) {
    require('@/components/commonComponent/jechart/map/js/province/' + name + '.js')
}

/**
 * 获取当前路由的默认参数
 */
export function getRouterDefaultParams (_this) {
    return _this.$route.matched[0].props.default.routerProps
}
/** 以下两个方法是处理Echart 数据的方法
 * 第一个方法是处理不带children的数据
 * 第二个方法是处理带children的数据
 * @param {*} list
 * @returns
 */
export function handleEchartDataList1 (list) {
    const axisData = []
    const data = []
    if (list) {
        list.forEach((item) => {
            axisData.push(item.name)
            data.push(item.value)
        })
    }
    return { axisData, data }
}
export function handleEchartDataList2 (list) {
    const axisData = []
    const constData = []
    const data = []
    const itemName = []
    let itemLength = 0
    if (list) {
        itemLength = list[0].list.length
        list.forEach((item) => {
            axisData.push(item.name)
        })
        for (let i = 0; i < itemLength; i++) {
            data[i] = []
            itemName.push(list[0].list[i].name)
            constData.push(1)
            list.forEach((item1, index) => { data[i].push(item1.list[i].value) })
        }
    }
    return { axisData, data, constData, itemName, itemLength }
}

function computeOption () {
    const list = _this.value.list;
    const { axisData, data } = _this.commonsJs.handleEchartDataList1(list)
    let title = {}
    if (_this.configdata.eachartTitle) title = _this.commonsJs.funcEval1(_this, {}, _this.configdata.eachartTitle)
    let legend = {}
    if (_this.configdata.eachartLegend) legend = _this.commonsJs.funcEval1(_this, {}, _this.configdata.eachartLegend)
    let grid = { left: '5%', right: '5%', top: '10%', bottom: '8%', containLabel: true }
    if (_this.configdata.eachartGrid) grid = _this.commonsJs.funcEval1(_this, {}, _this.configdata.eachartGrid)
    let tooltip = { trigger: 'axis', axisPointer: { type: 'none' } }
    if (_this.configdata.eachartTooltip) tooltip = _this.commonsJs.funcEval1(_this, {}, _this.configdata.eachartTooltip)
    let toolbox = {}
    if (_this.configdata.eachartToolbox) toolbox = _this.commonsJs.funcEval1(_this, {}, _this.configdata.eachartToolbox)
    let colorlist = ['#990000', '#FFA1A1'] /// /图柱显示颜色
    const xzColor = '#FF6B00';/// /图柱选中颜色
    if (_this.configdata.eachartColor) colorlist = _this.commonsJs.funcEval1(_this, {}, _this.configdata.eachartColor)

    const option = {
        title,
        grid,
        legend,
        tooltip,
        toolbox,
        xAxis: { data: axisData, axisTick: { show: false }, axisLine: { show: true }, axisLabel: { color: '#8c8c8c' } },
        yAxis: { name: yz_name, minInterval: 1, axisTick: { show: false }, axisLine: { show: false }, splitLine: { lineStyle: { type: 'dashed' } } },
        color: tzColor,
        series: [
            {
                name: '数量',
                type: 'pictorialBar',
                barCategoryGap: '0',
                symbol: 'path://M0,10 L10,10 C5.5,10 5.5,5 5,0 C4.5,5 4.5,10 0,10 z',
                itemStyle: { opacity: 0.5 },
                emphasis: { itemStyle: { color: xzColor, opacity: 0.85 } },
                data
            }
        ]
    };
    return option
}

export function deepClone (target) {
    // 定义一个变量
    let result;
    // 如果当前需要深拷贝的是一个对象的话
    if (typeof target === 'object') {
        // 如果是一个数组的话
        if (Array.isArray(target)) {
            result = []; // 将result赋值为一个数组，并且执行遍历
            for (const i in target) {
                // 递归克隆数组中的每一项
                result.push(deepClone(target[i]));
            }
            // 判断如果当前的值是null的话；直接赋值为null
        } else if (target === null) {
            result = null;
            // 判断如果当前的值是一个RegExp对象的话，直接赋值
        } else if (target.constructor === RegExp) {
            result = target;
        } else {
            // 否则是普通对象，直接for in循环，递归赋值对象的所有值
            result = {};
            for (const i in target) {
                result[i] = deepClone(target[i]);
            }
        }
        // 如果不是对象的话，就是基本数据类型，那么直接赋值
    } else {
        result = target;
    }
    // 返回最终结果
    return result;
}
/**
 * 添加class
 * @param {*} code class代码
 * @param {*} blm 调用页面的变量名
 */
export function loadCssCode (code, blm) {
    if (!code || !blm) {
        console.log(code, 'loadCssCode 参数错误', blm)
        return
    }
    if (document.getElementById('style-' + blm)) {
        removeCssCode(blm)
    }
    // debugger
    const style = document.createElement('style');
    style.type = 'text/css';
    //   style.lang='less'
    style.rel = 'stylesheet';
    style.id = 'style-' + blm
    style.appendChild(document.createTextNode(code));
    const head = document.getElementsByTagName('head')[0];
    head.appendChild(style);
}
/**
 * 删除class
 * @param {*} blm 调用页面的变量名
 */
export function removeCssCode (blm) {
    if (!blm) {
        console.log('loadCssCode 参数错误', blm)
        return
    }
    if (document.getElementById('style-' + blm)) {
        const style = document.getElementById('style-' + blm);
        style.remove();
    }
}
export const removeLoadCssCode = removeCssCode
/**
 * vue 判断 组件是否全局注册
 * @param {*} componentName 组件名
 * @returns
 */
export function isComponentRegistered (componentName) {
    // Vue 3: 检查组件是否注册
    try {
        const instance = getCurrentInstance();
        if (instance && instance.appContext && instance.appContext.components) {
            return Boolean(instance.appContext.components[componentName]);
        }
    } catch (e) {
        // ignore
    }
    return false;
}

/**
 * 将文件大小转换为字节数
 * @param size
 * @returns {number}
 */
export function convertToBytes (size) {
    // 定义单位与字节数的映射关系
    const units = {
        B: 1,
        KB: 1024,
        MB: 1024 * 1024,
        GB: 1024 * 1024 * 1024,
        TB: 1024 * 1024 * 1024 * 1024,
        PB: 1024 * 1024 * 1024 * 1024 * 1024
    };

    // 使用正则表达式匹配数字和单位
    const match = size.match(/^(\d+(\.\d+)?)\s*([KMGTP]?B)$/i);
    if (!match) {
        throw new Error('Invalid size format');
    }
    const value = parseFloat(match[1]);
    const unit = match[3].toUpperCase();
    if (!units[unit]) {
        throw new Error('Unsupported unit');
    }
    return value * units[unit];
}

/**
 * 下载通用上传的文件
 *  @param {*} wjid 文件id
 */
export async function downloadFile (wjid, _this) {
    _this.$progress.show()
    const token = localStorage.getItem('token' + '_' + Setting.xmid);
    let jsdm = '';
    const userinfoStr = localStorage.getItem('userinfo' + '_' + Setting.xmid);
    if (userinfoStr) jsdm = JSON.parse(userinfoStr).jsdm;
    // 获取文件信息
    const res = await axios({
        url: uploadBaseURL + '/fileManagerSystem/queryFileById',
        method: 'POST',
        headers: {
            Token: 'Inco-' + token,
            RoleCode: jsdm
        },
        params: {
            wjid
        }
    })
    const wjxx = res.data
    if (!wjxx || !wjxx.id) {
        _this.$progress.hide()
        _this.$Message.error('文件不存在')
    }
    const fileSize = convertToBytes(wjxx.fileSize)
    axios({
        url: uploadBaseURL + '/fileManagerSystem/getFileStream?scjlid=' + wjid,
        method: 'GET',
        headers: {
            Token: 'Inco-' + token,
            RoleCode: jsdm
        },
        timeout: 0,
        responseType: 'blob',
        // 监听下载进度的方法，后端response需返回Content-Length
        onDownloadProgress (progress) {
            // progress对象中的loaded表示已经下载的数量，total表示总数量，这里计算出百分比。注意这里一定需要后端接口返回 Content-Length，没有的话是拿不到的
            const downProgress = Math.round((100 * progress.loaded) / fileSize);
            _this.$progress.set(downProgress)
        }
    }).then(res => {
        if (!res) {
            _this.$progress.hide()
            Message.warning('下载失败，请重试！')
        } else {
            const Blob = res.data
            let a = document.createElement('a')
            a.download = wjxx.wjxsmc;
            a.href = window.URL.createObjectURL(Blob);
            a.click()
            window.URL.revokeObjectURL(Blob)
            a = null // 设置为空，gc自动回收
            _this.$progress.hide()
        }
    })
}

/**
 * 打包下载通用上传的文件
 * @param {*} zipName 打包文件名
 * @param {*} fileArray 文件对象集合
 * 文件对象集合格式为 [{sfwjj:true, wjjmc:'文件夹1', wjjwjlist:[{sfwjj:false,wjlist:['wjid1','wjid2']}]},{sfwjj:false,wjlist:['wjid3','wjid4']}]
 */
export async function downloadFiles (zipName, fileArray, _this) {
    _this.$progress.show()
    // 获取文件集合对象中的所有文件id
    const wjids = extractWjlist(fileArray);
    // 根据wjids获取所有的文件信息
    const filesInfo = await getFilesInfo(wjids);
    // 取出所有文件信息的wjid和wjxsmc
    const filesMap = filesInfo.reduce((acc, file) => {
        acc[file.id] = file.wjxsmc;
        return acc;
    }, {});

    // 创建zip对象
    const zip = new JSZip();
    // 生成压缩包文件
    processFiles(fileArray, filesMap, zip);
    // 打包下载
    zip.generateAsync({
        type: 'blob',
        compression: 'STORE', // STORE：默认不压缩 DEFLATE：需要压缩
        compressionOptions: {
            level: 1 // 压缩等级1~9 1压缩速度最快，9最优压缩方式
        }
    }, metadata => {
        // 更新进度
        const progress = metadata.percent.toFixed(2); // 保留2位小数
        _this.$progress.set(progress)
    }).then(blob => {
        let a = document.createElement('a')
        a.download = zipName + '.zip';
        a.href = window.URL.createObjectURL(blob);
        a.click()
        window.URL.revokeObjectURL(blob)
        a = null // 设置为空，gc自动回收
        _this.$progress.hide()
    });

    // 将对象中所有的wjlist抽离出来并合并成逗号分割的字符串
    function extractWjlist (fileArray) {
        let result = [];
        function traverse (currentObj) {
            if (Array.isArray(currentObj)) {
                currentObj.forEach(item => traverse(item));
            } else if (typeof currentObj === 'object' && currentObj !== null) {
                for (const key in currentObj) {
                    if (key === 'wjlist' && Array.isArray(currentObj[key])) {
                        result = result.concat(currentObj[key]);
                    } else {
                        traverse(currentObj[key]);
                    }
                }
            }
        }
        traverse(fileArray);
        return result.join(',');
    }

    // 根据wjids获取所有的文件信息
    async function getFilesInfo (wjids) {
        const token = localStorage.getItem('token' + '_' + Setting.xmid);
        let jsdm = '';
        const userinfoStr = localStorage.getItem('userinfo' + '_' + Setting.xmid);
        if (userinfoStr) jsdm = JSON.parse(userinfoStr).jsdm;
        const res = await axios({
            url: uploadBaseURL + '/fileManagerSystem/queryFileByIds',
            method: 'POST',
            headers: {
                Token: 'Inco-' + token,
                RoleCode: jsdm
            },
            params: {
                sclj: wjids
            }
        })
        return res.data;
    }

    // 请求返回文件blob
    async function fetchBlob (fetchUrl, method = 'POST', body = null) {
        const response = await window.fetch(fetchUrl, {
            method,
            body: body ? JSON.stringify(body) : null,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                Token: 'Inco-' + localStorage.getItem('token' + '_' + Setting.xmid)
            }
        });
        const blob = await response.blob();
        return blob;
    }

    // 递归处理文件集合对象，创建文件夹和文件
    function processFiles (fileArray, filesMap, zip) {
        fileArray.forEach(item => {
            if (item.sfwjj) {
                // 创建文件夹
                const folder = zip.folder(item.wjjmc);
                // 递归处理文件夹内的内容
                processFiles(item.wjjwjlist, filesMap, folder);
            } else {
                // 添加文件
                item.wjlist.forEach(wjid => {
                    zip.file(filesMap[wjid], fetchBlob(fileUrl + wjid));
                });
            }
        });
    }
}

/**
 * 打包下载文件（根据文件url）
 * @param {*} zipName 打包文件名
 * @param {*} fileArray 文件对象集合 [{name:'文件名',url:'文件流url'}]
 */
export async function downloadFilesByUrl (zipName, fileArray, _this) {
    _this.$progress.show()
    // 创建zip对象
    const zip = new JSZip();
    // zip中放入文件
    fileArray.forEach(item => {
        zip.file(item.name, fetchBlob(item.url));
    })
    // 打包下载
    zip.generateAsync({
        type: 'blob',
        compression: 'STORE', // STORE：默认不压缩 DEFLATE：需要压缩
        compressionOptions: {
            level: 1 // 压缩等级1~9 1压缩速度最快，9最优压缩方式
        }
    }, metadata => {
        // 更新进度
        const progress = metadata.percent.toFixed(2); // 保留2位小数
        _this.$progress.set(progress)
    }).then(blob => {
        let a = document.createElement('a')
        a.download = zipName + '.zip';
        a.href = window.URL.createObjectURL(blob);
        a.click()
        window.URL.revokeObjectURL(blob)
        a = null // 设置为空，gc自动回收
        _this.$progress.hide()
    });

    // 请求返回文件blob
    async function fetchBlob (fetchUrl, method = 'POST', body = null) {
        const response = await window.fetch(fetchUrl, {
            method,
            body: body ? JSON.stringify(body) : null,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                Token: 'Inco-' + localStorage.getItem('token' + '_' + Setting.xmid)
            }
        });
        const blob = await response.blob();
        return blob;
    }
}

export function filterCommonComponent (componentType) {
    componentType = componentType.toLowerCase().replace('-', '')
    const filter = ['codeeditor', 'collection', 'commonmultiselect', 'divlayout',
        'excel_exportqd', 'excel_exportqd_multi', 'exportcomponent', 'formtable',
        'globaluploader', 'incocomponent', 'importcomponent', 'importqd',
        'janchor', 'jcheckbox', 'jechart', 'jform', 'jjsmind',
        'jimg', 'jlist', 'jmenu', 'jselect',
        'jswiper', 'jswitch', 'jtab', 'jtable',
        'jtree', 'jvideo', 'menutree', 'newpage',
        'onlyoffice', 'tableform', 'timecountdown', 'tinymceeditor',
        'uploader', 'uploadfile', 'uploadimg', 'vhtml',
        'viewfile', 'viewpdf', 'viewureport', 'vuefile',
        'weblayout', 'menu', 'submenu', 'menuitem',
        'menugroup', 'tabs', 'tabpane', 'dropdown',
        'dropdownmenu', 'dropdownitem', 'page', 'breadcrumb',
        'breadcrumbitem', 'badge', 'anchor', 'steps', 'strong',
        'step', 'form', 'formitem', 'login',
        'username', 'password', 'mobile', 'email',
        'captcha', 'submit', 'iinput', 'ibutton', 'icol', 'itable', 'iform', 'imenu', 'iselect', 'ioption', 'iprogress', 'itime',
        'radiogroup', 'radio', 'checkboxgroup', 'checkbox', 'switch',
        'table', 'tablepaste', 'select', 'treeselect',
        'city', 'autocomplete', 'slider', 'datepicker',
        'timepicker', 'cascader', 'transfer', 'inputnumber',
        'rate', 'upload', 'tagselect', 'tagselectoption', 'template',
        'colorpicker', 'alert', 'modal', 'drawer',
        'image', 'notification', 'calendar', 'tree',
        'tooltip', 'poptip', 'progress', 'result',
        'avatar', 'avatarlist', 'tag', 'carousel',
        'carouselitem', 'timeline', 'timelineitem', 'time',
        'trend', 'circle', 'affix', 'backtop',
        'spin', 'scroll', 'auth', 'countdown',
        'countup', 'numeral', 'numberinfo', 'wordcount',
        'a', 'abbr', 'acronym', 'address',
        'applet', 'area', 'article', 'aside',
        'audio', 'b', 'base', 'basefont',
        'bdi', 'bdo', 'bgsound', 'big',
        'blink', 'blockquote', 'body', 'br',
        'button', 'canvas', 'caption', 'center',
        'cite', 'code', 'col', 'colgroup',
        'command', 'content', 'data', 'datalist',
        'dd', 'del', 'details', 'dfn',
        'dialog', 'dir', 'div', 'dl',
        'dt', 'element', 'em', 'embed',
        'fieldset', 'figcaption', 'figure', 'footer',
        'form', 'h1', 'h2', 'h3',
        'h4', 'h5', 'h6', 'head',
        'header', 'hgroup', 'hr', 'html',
        'i', 'iframe', 'img', 'input',
        'ins', 'kbd', 'keygen', 'label',
        'legend', 'li', 'link', 'main',
        'map', 'mark', 'menu', 'menuitem',
        'meta', 'meter', 'nav', 'noscript',
        'object', 'ol', 'optgroup', 'option',
        'output', 'p', 'param', 'picture',
        'pre', 'progress', 'q', 'rp',
        'rt', 'ruby', 's', 'samp',
        'script', 'section', 'select', 'small',
        'source', 'span', 'strong', 'style',
        'sub', 'summary', 'sup', 'svg',
        't', 'table', 'tbody', 'td',
        'textarea', 'tfoot', 'th', 'thead',
        'time', 'title', 'tr', 'track',
        'tt', 'u', 'ul', 'v',
        'video', 'wbr', 'xmp'
    ]
    return filter.includes(componentType)
}

/**
 *
 * @param {*} item
 * @param {*} self
 * @param bxfs：组件的编写方式，有两种一种是vue模式 另外一种是js模式
 * @returns zjbxfs（组件注册方式）有三种，1、全局注册，0、局部注册，2、调用系统自带的组件（html标签、iview的组件或平台封装的组件
 */
export async function zjRegisterOne (item, self) {
    if (item.yyzjmc && item.yyzjmc.trim()) {
        const tag = item.yyzjmc.trim()
        if (filterCommonComponent(tag)) return
        item.componentType = tag
        item.lx = tag
        if (item.zjzcfs === '2') return //
        // 如果有注册方法，则通过注册方法注册组件
        if (item.registerComponentMethod && item.registerComponentMethod.trim()) {
            if (item.bxfs == 'vue') {
                if (item.zjzcfs === '1') await registerVueComponent(item.registerComponentMethod, tag, self, 'global')
                else await registerVueComponent(item.registerComponentMethod, tag, self, 'local')
            } else {
                const zjxx = funcEval1(self, {}, item.registerComponentMethod)
                // Vue 3: 使用局部注册，确保组件对象存在
                if (!self.$options.components) {
                    self.$options.components = {}
                }
                self.$options.components[tag] = zjxx
            }
        } else {
            if (item.zjzcfs === '1') await registerComponent([item.yyzjmc], self) // 全局注册
            else await localRegisterComponent([item.yyzjmc], self)
        }
    }
}
export async function zjRegisterMore (list, _this) {
    return await registerComponent(list, _this)
}
/**
 * 全局注册自定义组件
 * @param {*} list 自定义组件名列表
 */
export async function registerComponent (list1, _this) {
    if (list1 == null || list1.length === 0) return
    const list = []
    list1.forEach((item) => { if (!_this.$root.components[item]) list.push(item) })
    if (list.length > 0) {
        const zjxxList = await incoRequest('querylist', '17452882422848ec6f7e8856afdc7bcfec81928587e7b5c', { list })
        zjxxList.forEach((item) => {
            _this.$root.components[item.zjm] = item
        })
    }
    // Vue 3: 确保组件对象存在
    if (!_this.$options.components) _this.$options.components = {}

    // 获取 Vue 3 app 实例进行全局注册
    let app = null
    try {
        if (_this.$ && _this.$.appContext && _this.$.appContext.app) {
            app = _this.$.appContext.app
        } else if (_this.$root && _this.$root.$ && _this.$root.$.appContext) {
            app = _this.$root.$.appContext.app
        } else if (_this.$root && _this.$root.__vue_app__) {
            app = _this.$root.__vue_app__
        }
    } catch (e) {
        console.warn('获取 app 实例失败:', e.message)
    }

    for (const item of list1) {
        let componentInfo = _this.$root.components[item]
        // 如果组件信息未加载，等待重试（最多等待500ms）
        if (!componentInfo) {
            for (let retry = 0; retry < 5; retry++) {
                await new Promise(resolve => setTimeout(resolve, 100))
                componentInfo = _this.$root.components[item]
                if (componentInfo) break
            }
        }
        if (!componentInfo) {
            continue
        }
        if (componentInfo.bxfs && componentInfo.bxfs == 'vue') {
            await registerVueComponent(componentInfo.pzxx, item, _this, 'global') // 全局注册vue标准编写方式的组件
        } else {
            try {
                const zjxx = funcEval1(_this, {}, componentInfo.pzxx);
                if (zjxx && typeof zjxx === 'object') {
                    // 局部注册
                    // _this.$options.components[item] = zjxx;
                    // 全局注册
                    if (app && !app.component(item)) {
                        app.component(item, zjxx)
                    }
                } else {
                    console.error(`组件 ${item} 注册失败: funcEval1 返回的不是有效对象`, zjxx)
                }
            } catch (e) {
                console.error(`组件 ${item} 注册异常:`, e)
            }
        }
    }
}
/**
 * 局部注册自定义组件
 * @param {*} list 自定义组件名列表
 */
export async function localRegisterComponent (list1 = [], _this) {
    if (list1 == null || list1.length === 0) return
    const list = []
    if (!_this.$root.components) _this.$root.components = {}
    list1.forEach((item) => { if (!_this.$root.components[item]) list.push(item) })
    if (list.length > 0) {
        const zjxxList = await incoRequest('querylist', '17452882422848ec6f7e8856afdc7bcfec81928587e7b5c', { list })
        zjxxList.forEach((item) => { _this.$root.components[item.zjm] = item })
    }
    // Vue 3: 确保组件对象存在
    if (!_this.$options.components) {
        _this.$options.components = {}
    }
    // 创建一个动态组件缓存对象（如果不存在）
    if (!_this._dynamicComponents) {
        _this._dynamicComponents = {}
    }

    for (const item of list1) {
        // 判断是否已局部注册过
        if (!_this.$options.components[item]) {
            const componentInfo = _this.$root.components[item]
            if (!componentInfo) {
                console.warn(`localRegisterComponent: 组件 ${item} 信息未加载，跳过注册`)
                continue
            }
            if (componentInfo.bxfs && componentInfo.bxfs == 'vue') {
                await registerVueComponent(componentInfo.pzxx, item, _this) // 注册vue标准编写方式的组件
            } else { // 注册采用js编写的组件
                try {
                    const zjxx = funcEval1(_this, {}, componentInfo.pzxx)
                    if (zjxx && typeof zjxx === 'object') {
                        _this.$options.components[item] = zjxx
                        _this._dynamicComponents[item] = zjxx // 同时缓存到动态组件对象
                    } else {
                        console.error(`localRegisterComponent: 组件 ${item} 注册失败，funcEval1 返回的不是有效对象`)
                    }
                } catch (e) {
                    console.error(`localRegisterComponent: 组件 ${item} 注册异常:`, e)
                }
            }
        }
    }

    // 强制组件重新渲染，确保新注册的组件能够被渲染
    await _this.$nextTick()
    _this.$forceUpdate()
}

/**
 * 获取动态注册的组件对象（用于模板中的 component :is）
 * @param {*} _this 组件实例
 * @param {*} componentName 组件名
 */
export function getDynamicComponent (_this, componentName) {
    // 1. 首先从动态组件缓存中获取
    if (_this._dynamicComponents && _this._dynamicComponents[componentName]) {
        return _this._dynamicComponents[componentName]
    }
    // 2. 从 $options.components 中获取
    if (_this.$options.components && _this.$options.components[componentName]) {
        return _this.$options.components[componentName]
    }
    // 3. 返回组件名，让 Vue 尝试解析
    return componentName
}
export async function registerVueComponent (val, componentName, self, registerType = 'local') {
    if (val) {
        try {
            const componentConfig = await parseVueComponent(val, self);
            if (componentConfig) {
                safeRegisterComponent(componentName, componentConfig, self, registerType);
            }
        } catch (error) {
            console.log('code解析组件失败:', error);
            self.$Message.error('组件加载失败')
            // Vue 3: 确保组件对象存在
            if (!self.$options.components) {
                self.$options.components = {}
            }
            self.$options.components[componentName] = {
                template: '<div style="color: red; padding: 10px;">组件加载失败</div>'
            }
        }
    }
    // 转义 HTML 属性值中的 >，防止 Vue 模板编译器将属性值内的 > 误解析为标签闭合符
    // 例：<div v-if="aa.length>0"> → <div v-if="aa.length&gt;0">
    function sanitizeGtInAttrs (html) {
        return html.replace(/(\s[@:a-zA-Z][\w:-]*)\s*=\s*"([^"]*)"/g, function (match, attr, value) {
            return attr + '="' + value.replace(/>/g, '&gt;') + '"';
        });
    }
    async function parseVueComponent (componentString, self) {
        let flag = true
        const templateMatch = componentString.match(/<template>([\s\S]*)<\/template>(?![\s\S]*<\/template>)/);
        const scriptMatch = componentString.match(/<script>([\s\S]*?)<\/script>/);
        const styleBlocks = componentString.match(/<style([\s\S]*?)>([\s\S]*?)<\/style>/g);
        let template = '';
        let componentConfig = {};
        const styles = { global: '', scoped: '', less: '', lessScoped: '' };
        // console.log(templateMatch,'templateMatch')
        if (templateMatch) template = sanitizeGtInAttrs(templateMatch[1].trim());
        if (scriptMatch) {
            const scriptContent = scriptMatch[1].trim();
            const exportDefaultMatch = scriptContent.match(/export\s+default\s*({[\s\S]*})/);
            if (exportDefaultMatch) {
                try {
                    componentConfig = new Function('_this', `return ${exportDefaultMatch[1]}`)(self);
                    // 验证 data 属性
                    if (componentConfig.data && typeof componentConfig.data === 'function') {
                        const dataResult = componentConfig.data();
                        if (dataResult === undefined || typeof dataResult !== 'object') {
                            self.$Message.error('data function must return an object')
                            throw new Error('data function must return an object');
                        }
                    }
                } catch (e) {
                    flag = false;
                    self.$Message.error('解析组件配置失败')
                    console.error('解析组件配置失败:', e.message, componentString);
                }
            }
        }
        if (styleBlocks) {
            styleBlocks.forEach(styleBlock => {
                const isScoped = /scoped/.test(styleBlock);
                const isLess = /lang=["']less["']/.test(styleBlock);
                const content = styleBlock.replace(/<style[\s\S]*?>|<\/style>/g, '').trim();
                if (isLess && isScoped) {
                    styles.lessScoped += content;
                } else if (isLess) {
                    styles.less += content;
                } else if (isScoped) {
                    styles.scoped += content;
                } else {
                    styles.global += content;
                }
            });
        }
        // 普通 CSS
        let finalCss = '';

        // 处理全局样式（非 scoped、非 less）
        if (styles.global) {
            finalCss += styles.global;
        }

        // CSS scoped
        if (styles.scoped) {
            const scopedObj = applyScoped(templateMatch ? templateMatch[1] : '', styles.scoped);
            finalCss += scopedObj.scopedCss;
            template = scopedObj.scopedHtml;
        }

        // less
        if (styles.less) {
            try {
                const output = await less.render(styles.less)
                finalCss += output.css;
            } catch (lessError) {
                console.error('Less 编译失败:', lessError.message);
                self.$Message.error('Less 样式编译失败');
            }
        }

        // less scoped
        if (styles.lessScoped) {
            try {
                const output = await less.render(styles.lessScoped)
                const scopedObj = applyScoped(templateMatch ? templateMatch[1] : '', output.css);
                finalCss += scopedObj.scopedCss;
                template = scopedObj.scopedHtml;
            } catch (lessError) {
                console.error('Less scoped 编译失败:', lessError.message);
                self.$Message.error('Less scoped 样式编译失败');
            }
        }
        if (finalCss) loadCssCode(finalCss, componentName);
        if (flag) {
            try {
                const tempComponent = { template, ...componentConfig };
                return { ...tempComponent, errorCaptured (err, vm, info) { console.error('组件运行时错误:', err, info); } };// 返回包装后的安全组件
            } catch (runtimeError) {
                self.$Message.error('组件运行时验证失败')
                console.error('组件运行时验证失败:', runtimeError);
                return createErrorComponent(runtimeError.message);// 返回错误显示组件
            }
        };
        return false
    }
    function applyScoped (templateHtml, cssText) {
        const scopeId = Math.random().toString(36).substring(2, 8)
        const scopedAttr = ` data-style-${scopeId}`;
        // 给所有标签加属性 - 使用状态机正确处理引号内的 > 字符
        function applyScopedStateMachine (html, scopeId) {
            const scopedAttr = ` data-style-${scopeId}`;
            let result = '';
            let i = 0;

            while (i < html.length) {
                if (html[i] === '<') {
                    // Check for comment
                    if (html.substring(i, i + 4) === '<!--') {
                        const end = html.indexOf('-->', i);
                        if (end === -1) { result += html.substring(i); break; }
                        result += html.substring(i, end + 3);
                        i = end + 3;
                        continue;
                    }

                    const tagStart = i;
                    i++;
                    if (i >= html.length) { result += '<'; break; }

                    const isClosing = html[i] === '/';
                    if (isClosing) i++;
                    if (i >= html.length) { result += html.substring(tagStart); break; }

                    // Skip tag name
                    while (i < html.length && !/[\s/>]/.test(html[i])) {
                        i++;
                    }

                    // Find end of tag, handling quoted strings
                    let inQuote = null;
                    while (i < html.length) {
                        const c = html[i];
                        if (inQuote) {
                            i++;
                            if (c === inQuote) inQuote = null;
                        } else if (c === '"' || c === "'") {
                            inQuote = c;
                            i++;
                        } else if (c === '>') {
                            const fullTag = html.substring(tagStart, i + 1);
                            i++;
                            if (isClosing) {
                                result += fullTag;
                            } else {
                                if (fullTag.endsWith('/>')) {
                                    result += fullTag.slice(0, -2).trimEnd() + scopedAttr + '/>';
                                } else {
                                    result += fullTag.slice(0, -1) + scopedAttr + '>';
                                }
                            }
                            break;
                        } else {
                            i++;
                        }
                    }
                } else {
                    result += html[i];
                    i++;
                }
            }

            return result;
        }
        const scopedHtml = applyScopedStateMachine(templateHtml, scopeId);

        // 选择器处理，伪类/伪元素只加到元素部分
        function scopeSelector (selector, scopeId) {
            // 例如 "#codeView-test:hover" => "#codeView-test[data-style-xxxxxx]:hover"
            // 例如 "#codeView-test p::after" => "#codeView-test p[data-style-xxxxxx]::after"
            // 例如 "#codeView-test, #codeView-test p" => "#codeView-test[data-style-xxxxxx], #codeView-test p[data-style-xxxxxx]"
            return selector.split(',').map(s => {
                s = s.trim();
                // 找到第一个伪类/伪元素出现的位置
                const pseudoMatch = s.match(/(:{1,2}[a-zA-Z0-9\-\(\)]+)/);
                if (pseudoMatch) {
                    const idx = s.indexOf(pseudoMatch[0]);
                    return s.slice(0, idx) + `[data-style-${scopeId}]` + s.slice(idx);
                } else {
                    return s + `[data-style-${scopeId}]`;
                }
            }).join(', ');
        }

        // 支持 @media 嵌套
        const scopedCss = cssText.replace(/(@media[^{]+){([^{}]*{[^{}]*}[^{}]*)}/g, (match, atRule, inner) => {
            const scopedInner = inner.replace(/([^{]+){([^}]*)}/g, (m, sel, blk) => {
                return `${scopeSelector(sel, scopeId)}{${blk}}`;
            });
            return `${atRule}{${scopedInner}}`;
        }).replace(/([^{]+){([^}]*)}/g, (match, selector, block) => {
            // 跳过 @media/@keyframes/@font-face
            if (/^\s*@/.test(selector)) return match;
            return `${scopeSelector(selector, scopeId)}{${block}}`;
        });
        return { scopedHtml, scopedCss };
    }
    function safeRegisterComponent (componentName, componentDefinition, self, registerType) {
        try {
            // 尝试创建组件选项对象
            const options = typeof componentDefinition === 'function'
                ? componentDefinition.options || componentDefinition()
                : componentDefinition;
            // 基本验证
            if (options && typeof options === 'object') {
                // Vue 3: 始终进行局部注册
                if (!self.$options.components) {
                    self.$options.components = {}
                }
                self.$options.components[componentName] = componentDefinition;

                // Vue 3: 如果是全局注册，尝试注册到 app
                if (registerType === 'global') {
                    try {
                        // 正确获取 Vue 3 app 实例的方式
                        let app = null
                        // 方式1: 通过组件实例内部属性
                        if (self.$ && self.$.appContext && self.$.appContext.app) {
                            app = self.$.appContext.app
                        }
                        // 方式2: 通过根组件
                        else if (self.$root && self.$root.$ && self.$root.$.appContext) {
                            app = self.$root.$.appContext.app
                        }
                        // 方式3: 通过 __vue_app__ (Vue 3 内部属性)
                        else if (self.$root && self.$root.__vue_app__) {
                            app = self.$root.__vue_app__
                        }

                        if (app) {
                            // 检查是否已注册
                            if (!app.component(componentName)) {
                                app.component(componentName, componentDefinition)
                            } else {
                                // console.log(`组件 ${componentName} 已全局注册，跳过`)
                            }
                        }
                    } catch (e) {
                        console.warn('全局注册组件失败，已回退到局部注册:', componentName, e.message)
                    }
                }
            }
        } catch (error) {
            self.$Message.error(`组件 ${componentName} 注册失败:`)
            console.error(`组件 ${componentName} 注册失败:`, error);
            // 注册一个错误显示组件作为替代
            if (!self.$options.components) {
                self.$options.components = {}
            }
            self.$options.components[componentName] = {
                template: '<div style="color: red;">组件加载失败</div>'
            };
        }
    }
    function createErrorComponent (errorMessage) {
        return {
            template: '<div style="color: red; border: 1px solid red; padding: 10px; margin: 5px;">组件加载错误: {{message}}</div>',
            data () { return { message: errorMessage }; }
        };
    }
}
/**
 *
 * @param {*} id 为提示词中的
 * @param {*} obj
 * @returns 大模型根据提示词返回的结果
 */
export async function ai_call_prompt (id, obj = {}, modelType) {
    // 此查询id为项目名称：赢科Ai（人工智能管理）中的功能名为：提示词管理中表单中的查询表单id
    let res = await incoRequest('queryone', '1745987959793451d59f2e75b1a83f577b5511992f187', { id })
    if (res && res.tsc) {
        if (Object.keys(obj).length > 0) {
            for (const key in obj) { res.tsc = res.tsc.replace(`{{${key}}}`, obj[key]) }
        }
        // 调用后台大模型接口
        res = await incoRequest('/chatgpt/chat/send/question', null, { startMessageId: sys_guid(), kcid: '1', question: res.tsc, modelType })
        res = res.replace('```json', '').replace('```', '')
        res = res.replace(/<details[^>]*>.*?<\/details>/gs, '').trim()
        res = res.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        return { conversation_id: '', res: JSON.parse(res), datastr: res }
    } else {
        return null
    }
}
/**
 *
 * @param {*} promptId  提示词的idid
 * @param {*} obj 传递给调用大模型的参数，根据在提示词管理中配置的参数进行替换，
 * 如果不通过提示词库中取提示词，用户自己提问，直接在第一个参数填写提示词，将type设置为direct
 * 如果想要上下文进行操作，需要在obj中增加 conversation_id(根据上轮返回的会话id)
 * valueType 期望返回值的类型，默认为JSON，如果是字符串则不进行JSON.parse直接返回字符串
 * @returns
 */
export async function ai_call_dify_model (promptId, obj = {}, type = 'tscid', response_mode = 'blocking', valueType = 'JSON') {
    if (type !== 'direct' && type !== 'tscid') {
        alert('type参数错误,type名为direct  或者 tscid')
        return
    }
    let prompt = ''
    let resPrompt = null
    if (type == 'tscid') {
        resPrompt = await incoRequest('queryone', '1745987959793451d59f2e75b1a83f577b5511992f187', { id: promptId }) // 从提示词库中获取提示词信息
        if (resPrompt.cs && resPrompt.cs.trim()) {
            const params = resPrompt.cs.split(',')
            prompt = resPrompt.tsc
            params.forEach((item) => { prompt = prompt.replace(`{{${item}}}`, obj[item]) })
            // console.log(prompt, 'prompt====', resPrompt)
        }
    } else if (type == 'direct') prompt = promptId

    // 下面时请求dify的接口
    const userinfo = JSON.parse(localStorage.getItem('userinfo' + '_' + Setting.xmid));

    const host = env === 'development' ? '/deepseek/v1' : setting.difyAddress || '/deepseek/v1'
    const apikey = resPrompt.aidz || 'app-YYtYyCMoq4kpwdGVQFKP8SG6'
    const apiuri = '/chat-messages'
    const conversation_id = obj.conversation_id || sys_guid()
    const res = await axios({
        url: host + apiuri,
        method: 'POST',
        headers: { Authorization: 'Bearer ' + apikey },
        data: {
            inputs: '',
            query: prompt,
            response_mode,
            conversation_id: '',
            user: userinfo.yhdm
        }
    })
    let cldata = ''
    if (response_mode === 'streaming') {
        const lines = res.data.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                cldata += processLine(line.slice(6)); // 去掉 "data: " 前缀
            }
        }
    } else cldata = res.data.answer
    cldata = cldata.replace('```json', '').replace('```', '')
    cldata = cldata.replace(/<details[^>]*>.*?<\/details>/gs, '').trim()
    cldata = cldata.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    let dataobj = {}
    if (valueType == 'JSON') dataobj = JSON.parse(cldata)
    return { conversation_id, res: dataobj, datastr: cldata }

    function processLine (jsonStr) {
        let result = ''
        if (jsonStr) {
            const data = JSON.parse(jsonStr);
            // let conversation_id = _this.tempdata.conversation_id
            // if (!conversation_id) _this.$set(_this.tempdata, 'conversation_id', data.conversation_id)
            if (data.answer) result += data.answer;// 自动处理 Unicode 转义（如 \u597d → 好）
        }
        return result
    }
}

/**
 * 代码检查
 * "strict": true, //严格模式 参考文章（http://www.ruanyifeng.com/blog/2013/01/javascript_strict_mode.html）
    "asi": true, //允许省略分号（写上这条，规避检查出很多警告  可以去掉）
    "bitwise": true, //禁止使用位运算符，比如经常把&&写错& 规避此错误
    "noarg": true, //禁止使用.caller 和 .callee (ECMS5已经禁用了此 可以去掉)
    "eqeqeq": true, //禁止使用== 和 ！=  强制使用=== 和 ！==
    "undef": true, //禁止使用不在全局变量列表中的未定义变量
    "curly": true, //循环或者条件语句必须使用花括号包住
    "devel": true, //定义用于调试的全局变量：console,alert
    "jquery": true, //定义全局暴露的jQuery库 （可以去掉）
    "browser": true, //暴露浏览器属性的全局变量 如window document
    "evil": true, //禁止使用eval （可以去掉）
    "quotemark":true (商榷)
    "globals": {"$":true,"require":true,"FastClick":true,"Swiper"},
 * @param {代码} code
 * @returns
 */
export function validateCode (code) {
    const options = {
        esversion: 6, // 使用ES6语法
        strict: false, // 严格模式 参考文章（http://www.ruanyifeng.com/blog/2013/01/javascript_strict_mode.html）
        asi: true, // 允许省略分号（写上这条，规避检查出很多警告  可以去掉）
        bitwise: true, // 禁止使用位运算符，比如经常把&&写错& 规避此错误
        noarg: true, // 禁止使用.caller 和 .callee (ECMS5已经禁用了此 可以去掉)
        eqeqeq: false, // 禁止使用== 和 ！=  强制使用=== 和 ！==
        undef: true, // 禁止使用不在全局变量列表中的未定义变量
        curly: false, // 循环或者条件语句必须使用花括号包住
        devel: true, // 定义用于调试的全局变量：console,alert
        jquery: true, // 定义全局暴露的jQuery库 （可以去掉）
        browser: true, // 暴露浏览器属性的全局变量 如window document
        evil: false, // 禁止使用eval （可以去掉）
        // "quotemark": true,
        globals: {
            $: true,
            require: true
        }
    }

    const flag = jshint.JSHINT(code, options)
    let errorstr = ''
    if (!flag) {
        const errors = jshint.JSHINT.data().errors
        for (let i = 0; i < errors.length; i++) {
            const error = errors[i]
            errorstr += `第${error.line}行：${error.reason}\n`
        }
    }
    return { flag, error: errorstr }
}

/**
 * 放入到redis
 * @param key
 * @param value（字符串）
 * @param time (秒)
 */
export function putCache (key, value, time) {
    if (key && value) {
        const param = encrypt_aes(JSON.stringify({ key, value, time }))
        incoRequest('/inco/ht/putCacheToRedis', null, { param })
    }
}

/**
 * 从redis中获取数据
 * @param key
 */
export async function getCache (key) {
    let result = ''
    if (key) {
        const param = encrypt_aes(JSON.stringify({ key }))
        result = await incoRequest('/inco/ht/getCacheFromRedis', null, { param })
    }
    return result
}
/**
 * url:请求地址(流式接口地址)
 * @param {*} param0
 * @returns
 */
export function callAiStreaming ({ url, params, callback }) {
    url = setting.apiBaseURL + url;
    let controller = null;
    controller = new AbortController();

    fetchEventSource(url, {
        method: 'POST',
        headers: {
            Token: 'Inco-' + localStorage.getItem('token' + '_' + setting.xmid),
            'Content-Type': 'application/json' // 文本返回格式
        },
        body: JSON.stringify(params),
        signal: controller.signal,
        // openWhenHidden: true, // 在浏览器标签页隐藏时保持与服务器的EventSource连接
        onmessage (res) {
            // 操作流式数据
            callback(res)
        },
        onclose () {
            // 关闭流
            controller.abort()
        },
        onerror (error) {
            // controller?.abort()
            // // 返回流报错
            // console.log(controller)
            throw error;// 必须有return,如果没有return,则会重复请求，返回值为number则变成根据number毫秒重复请求
        }
    })
    return controller;
}

// 生成会话标识 chatCode（带历史上下文续接用）：优先用浏览器原生 UUID，不可用时回退 v4
function genChatCode () {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
    } catch (e) { /* fallthrough */ }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 由所选模型 id 反查 model_name（后端 resolveModelByName 按名称解析，空则走网关缺省路由）
function resolveModelName (opts) {
    if (!opts.selectedModelId) return '';
    const m = (opts.modelOptions || []).find(x => x.value === opts.selectedModelId);
    return (m && m.name) || '';
}

/**
 * 大模型对话发送（带历史上下文）。
 * 流式走 /sse/chat（SseEmitter，先推 chatCode 事件再推内容增量），阻塞走 /chat/ai/chat（返回答案文本）。
 * 历史上下文由服务端按 chatCode 在 t_ai_chat_log 中续接：前端生成并持续携带 startMessageId（=chatCode），
 * 清空会话即重置 chatCode 开启新上下文。
 *
 * 公用方法，不绑定具体页面：所需状态通过 opts 显式传入，需要回写的响应式状态通过回调通知调用方。
 *
 * @param {Object} opts
 * @param {string} opts.input               用户输入的问题文本（内部会 trim）
 * @param {boolean} opts.sending            当前是否正在发送（为 true 时本次调用直接返回）
 * @param {string} opts.mode                'stream'（流式 SSE） | 'block'（阻塞）
 * @param {Array}  opts.messages            消息列表（响应式数组引用，本方法向其 push 用户/助手消息）
 * @param {Object} [opts.advanced]          高级参数 { temperature, maxTokens, topP, thinking }
 * @param {string} [opts.selectedModelId]   模型主键（精确指定，优先于 modelType）
 * @param {Array}  [opts.modelOptions]      模型下拉项 [{ value, name, label }]，用于反查 model_name 作 modelType 兜底
 * @param {string} [opts.selectedKbid]      知识库ID（带上则后端按 kbid 做 RAG 检索注入 prompt）
 * @param {string} [opts.chatCode]          会话标识（续接历史上下文；空则内部生成并经 onChatCode 回写）
 * @param {Function} opts.onScroll           滚动到底回调（流式增量/完成时调用）
 * @param {Function} opts.onSending          (bool)=>void，回写「发送中」状态
 * @param {Function} opts.onInput            (string)=>void，回写输入框文本（发送后清空）
 * @param {Function} opts.onChatCode         (string)=>void，回写会话标识
 * @param {Function} opts.onStreamController (AbortController|null)=>void，回写流式中止控制器（供调用方停止/离开页面中止）
 * @returns {Object|undefined} 助手消息对象（reactive）；输入为空或正在发送时返回 undefined
 */
export function aiChatSend (opts) {
    const question = (opts.input || '').trim();
    if (!question || opts.sending) return;
    opts.onInput('');
    opts.messages.push({ role: 'user', content: question });
    // reactive：使流式 onmessage 中 msg.content += delta 走 proxy 的 set trap 触发响应式逐字渲染。
    // 否则 msg 为 push 进 reactive 数组前的原始对象引用，直接改其属性不触发更新，内容会等到 sending=false 时一次性出现。
    const assistantMsg = reactive({ role: 'assistant', content: '', reasoning: '', reasoningExpanded: true, notice: '', streaming: true, error: false, meta: null });
    opts.messages.push(assistantMsg);
    opts.onSending(true);
    // 会话标识：无则新建（阻塞模式后端不回传 chatCode，故由前端生成并持续携带以续接上下文）
    let chatCode = opts.chatCode;
    if (!chatCode) {
        chatCode = genChatCode();
        opts.onChatCode(chatCode);
    }
    opts.onScroll();

    const body = buildChatBody(opts, question, chatCode);
    if (opts.mode === 'stream') {
        callChatStream(opts, assistantMsg, body);
    } else {
        callChatBlock(opts, assistantMsg, body);
    }
    return assistantMsg;
}

// 构造 QuestionParam 请求体：question 必填；modelId=模型主键(精确指定，优先于 modelType)，
// modelType=model_name 作兜底；temperature/maxTokens/topP 留空用模型默认值；startMessageId=chatCode 续接历史上下文。
function buildChatBody (opts, question, chatCode) {
    const body = { question };
    // modelId（模型主键）精确指定模型，后端优先于 modelType；同时带 modelType(model_name) 作兜底
    if (opts.selectedModelId) body.modelId = opts.selectedModelId;
    const modelName = resolveModelName(opts);
    if (modelName) body.modelType = modelName;
    const adv = opts.advanced || {};
    const temp = parseFloat(adv.temperature);
    if (!isNaN(temp)) body.temperature = temp;
    const maxT = parseInt(adv.maxTokens, 10);
    if (!isNaN(maxT) && maxT > 0) body.maxTokens = maxT;
    const topP = parseFloat(adv.topP);
    if (!isNaN(topP)) body.topP = topP;
    // 思考过程开关（流式生效）：透传后台 thinking，false 时不返回 reasoning_content
    if (adv.thinking === false) body.thinking = false;
    if (chatCode) body.startMessageId = chatCode;
    // 知识库ID：选中则带上，后端按 kbid 从知识库切片做 RAG 检索注入 prompt；空则不检索
    if (opts.selectedKbid) body.kbid = opts.selectedKbid;
    return body;
}

// 阻塞：/chat/ai/chat —— 带历史上下文，返回 ReturnT.ok(答案文本)；
//   拦截器对 code===200 返回 content（此处即答案字符串）；code!==200 抛错（e.message 为后端 msg）
async function callChatBlock (opts, msg, body) {
    try {
        const result = await request({
            url: '/chat/ai/chat',
            method: 'post',
            data: body
        });
        msg.streaming = false;
        // 带历史上下文接口返回答案文本（字符串）；兼容对象型返回（result.content）
        msg.content = (typeof result === 'string' ? result : (result && result.content)) || '';
        // 该接口不返回计量（token/成本/耗时写入「调用日志」），meta 置空
        msg.meta = null;
    } catch (e) {
        // 拦截器已弹错误提示，这里在气泡内回显（e.message 即后端 ReturnT.msg）
        msg.streaming = false;
        msg.error = true;
        msg.content = (e && e.message) ? ('[错误] ' + e.message) : '[错误] 调用失败';
    } finally {
        opts.onSending(false);
        opts.onScroll();
    }
}

// 流式：/sse/chat —— 带历史上下文（SseEmitter）
//   chatCode 事件 —— data=会话标识（流开始前先推，客户端据此续接上下文）
//   message（默认）事件 —— data=内容增量（逐块推送）
//   complete 事件 —— data=[DONE]（流正常结束）
//   error 事件 —— data=错误文本
function callChatStream (opts, msg, body) {
    const token = localStorage.getItem('token_' + Setting.xmid);
    const controller = new AbortController();
    opts.onStreamController(controller);
    const url = Setting.apiBaseURL + '/sse/chat';
    let finished = false;

    const finish = () => {
        if (finished) return;
        finished = true;
        msg.streaming = false;
        opts.onSending(false);
        opts.onStreamController(null);
        opts.onScroll();
    };

    fetchEventSource(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Token: token ? 'Inco-' + token : '',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        openWhenHidden: true,
        async onopen (response) {
            // 容错：仅对 HTTP 错误抛出；不强制 content-type，避免代理改写头导致误判
            if (response.status >= 400) {
                throw new Error('对话流请求失败：HTTP ' + response.status);
            }
        },
        onmessage: (ev) => {
            // 会话标识：服务端先推 chatCode，前端采纳以续接上下文（前端已预生成同值，此处为兜底）
            if (ev.event === 'chatCode') {
                if (ev.data) opts.onChatCode(ev.data);
                return;
            }
            if (ev.event === 'complete') {
                finish();
                return;
            }
            if (ev.event === 'error') {
                msg.error = true;
                const errText = ev.data || '未知错误';
                msg.content = msg.content
                    ? (msg.content + '\n\n> [错误] ' + errText)
                    : ('[错误] ' + errText);
                finish();
                return;
            }
            if (ev.event === 'reasoning') {
                // 推理/思考增量：独立展示，不计入正文 content
                if (ev.data) {
                    msg.reasoning += ev.data;
                    opts.onScroll();
                }
                return;
            }
            if (ev.event === 'notice') {
                // 截断等提示（如思考耗尽 max_tokens 预算导致零正文）
                if (ev.data) msg.notice = ev.data;
                return;
            }
            // 内容增量（event 为 '' 或 'message'）
            const delta = ev.data;
            if (delta) {
                msg.content += delta;
                opts.onScroll();
            }
        },
        onclose: () => {
            // 服务端正常结束 emitter 后触发
            finish();
        },
        onerror: (err) => {
            if (!finished) {
                msg.error = true;
                if (!msg.content) {
                    msg.content = '[连接异常] ' + (err && err.message ? err.message : '网络错误，请重试');
                }
            }
            finish();
            // 抛出以阻止 fetch-event-source 自动重连
            throw err;
        }
    }).catch(() => {
        // onerror 抛出会 reject，已在上面处理；吞掉未捕获拒绝
    });
}

export function computeStyle (self, data, style = {}, styleMethod) {
    const newstyle = style ? JSON.parse(JSON.stringify(style)) : {}
    if (styleMethod) Object.assign(newstyle, funcEval1(self, data, styleMethod))
    return newstyle
}

export function computeAttrs (self, data, attrs = {}, attrsMethod) {
    const newattrs = attrs ? JSON.parse(JSON.stringify(attrs)) : {}
    if (attrsMethod) Object.assign(newattrs, funcEval1(self, data, attrsMethod))
    return newattrs
}
export function computeNewAttrs (self, params = {}, attrs, attrsMethod, dataAttrs = {}) {
    const newattrs = {}
    if (attrs && Array.isArray(attrs)) {
        if (attrs && attrs.length > 0) {
            attrs.forEach((item) => {
                if (item.key && item.key.trim() && item.label && item.label.trim()) {
                    if (item.valueType === 'number') { newattrs[item.key.trim()] = Number(item.label.trim()) } else if (item.valueType === 'boolean') {
                        if (item.label === 'true' || item.label === '1') { newattrs[item.key.trim()] = true } else { newattrs[item.key.trim()] = false }
                    } else if (item.valueType === 'string') { newattrs[item.key.trim()] = item.label.trim() || '' }
                }
            })
        }
    } else if (attrs) Object.assign(newattrs, attrs)
    if (Object.keys(dataAttrs).length > 0 && params.item && dataAttrs[params.item.blm]) Object.assign(newattrs, dataAttrs[params.item.blm])
    if (attrsMethod) Object.assign(newattrs, funcEval1(self, params, attrsMethod))
    return newattrs
}
export function computeNewStyle (self, params = {}, style, styleMethod, dataStyle = {}) {
    const newStyle = {}
    if (style && Array.isArray(style)) {
        if (style && style.length > 0) {
            style.forEach((item) => {
                if (item.key && item.key.trim() && item.label && item.label.trim()) newStyle[item.key.trim()] = item.label.trim()
            })
        }
    } else if (style) Object.assign(newStyle, style)
    if (dataStyle && params.item && dataStyle[params.item.blm]) Object.assign(newStyle, dataStyle[params.item.blm])
    if (styleMethod) Object.assign(newStyle, funcEval1(self, params, styleMethod))
    return newStyle
}
export function computeKyf (self, data, condition, item = {}, vif = {}, flag = false) {
    let returnValue = true
    if (flag) returnValue = vif[item.blm];
    if (condition) returnValue = funcEval1(self, { item, data, row: data }, condition);
    return returnValue
}
/**
 * 创建方法
 * @param {*} list1 组件中配置的初始方法列表 [{name:'方法名',func:'方法体字符串'}]
 * @param {*} registerMethods，组件中引用公共方法库中的方法变量名，多个逗号分隔
 * @param {*} self，组件this指向
 * @param {*} componentName 组件名称，用于报错提示
 */
export async function createFunction (list1 = [], registerMethods = '', self, componentName) {
    if (list1.length === 0) return
    const _this = self
    const list = JSON.parse(JSON.stringify(list1)) // 深拷贝,防止修改原数据
    if (registerMethods && registerMethods.trim()) {
        const methodsArr = registerMethods.replace(' ', '').split(',')
        const notExistMethods = []
        for (let i = 0; i < methodsArr.length; i++) {
            const item = methodsArr[i]
            if (_this.$root.functionMethods[item]) {
                list.push({ name: item, func: _this.$root.functionMethods[item] })
            } else {
                if (!_this.function[item]) notExistMethods.push(item)
            }
        }
        if (notExistMethods.length > 0) {
            const queryList = await incoRequest('querylist', 'get_tyfuncion_from_other_xm', { list: notExistMethods })
            for (let i = 0; i < queryList.length; i++) {
                const item = queryList[i]
                _this.$root.functionMethods[item.ffm] = item.fft
                list.push({ name: item.ffm, func: item.fft })
            }
        }
    }
    for (let i = 0; i < list.length; i++) {
        const item = list[i]
        try {
            if (item.name && item.func.trim()) {
                const func = eval(item.func)
                _this.function[item.name.trim()] = func
            }
        } catch { console.log('功能组件变量名:' + componentName + '-在创建方法时发生错误：createFunction', item.name) }
    }
}
/**
 * 工作流暂存
 * @param {*} _this
 * @param {*} gzlparam //传递参数param:{data-表单数据,sqlid-保存sql,lcdm-流程代码,gzlcs--工作流参数配置}
 */
export async function gzl_zc (_this, gzlparam = {}) {
    _this.$Spin.show()
    _this.$gzl({
        gzlObj: {
            type: 'bc',
            ywlcdm: gzlparam.lcdm,
            ywid: gzlparam.data.id
        },
        dataObj: {
            sqlid: gzlparam.sqlid,
            data: { ...gzlparam.data, inco_zzt: '0' }
        }
    }).then((res) => {
        _this.$Spin.hide()
        if (res.jg == '1') {
            _this.$Message.success('操作成功')
            _this.ref[_this.zjConfigdata.targetObject].query()
            _this.close()
        } else { _this.$Message.error(res.message) }
    })
}
/**
 * 工作流提交
 * @param {*} _this 表单的指针
 * @param {*} gzlparam //传递参数param:{data-表单数据,sqlid-保存sql,lcdm-流程代码,gzlcs--工作流参数配置}
 */
export async function gzl_tj (_this, gzlparam = {}) {
    _this.formValid().then(flag => {
        if (flag) {
            _this.$Spin.show()
            _this.$gzl({
                gzlObj: {
                    type: 'tj',
                    ywlcdm: gzlparam.lcdm,
                    ywid: gzlparam.data.id,
                    params: gzlparam.gzlcs
                },
                dataObj: {
                    sqlid: gzlparam.sqlid,
                    data: { ...gzlparam.data, inco_zzt: '1' }
                }
            }).then((res) => {
                _this.$Spin.hide()
                if (res.jg == '1') {
                    _this.$Message.success('操作成功')
                    _this.ref[_this.zjConfigdata.targetObject].query()
                    _this.close()
                } else { _this.$Message.error(res.message) }
            })
        }
    })
}
/**
 * 工作流删除
 * @param {*} _this 表单的指针
 * @param {*} gzlparam //传递参数param:{row-表单数据,sqlid-删除sqlid}
 */
export async function gzl_sc (_this, gzlparam = {}) {
    _this.$Modal.confirm({
        title: '提示',
        content: '您确定要删除此数据吗？',
        onOk: () => {
            _this.$Spin.show()
            _this.$gzl({
                gzlObj: { type: 'del', ywlcdm: gzlparam.row.inco_lcdm, ywid: gzlparam.row.id },
                dataObj: { sqlid: gzlparam.sqlid, data: gzlparam.row }
            }).then((res) => {
                _this.$Spin.hide()
                if (res.jg == '1') {
                    _this.$Message.success('删除成功')
                    _this.query()
                } else { _this.$Message.error(res.message) }
            })
        }
    })
}
export async function gzl_sh (_this, gzlparam = {}) {
    _this.$gzl({
        gzlObj: { type: 'sh', ywlcdm: gzlparam.row.inco_lcdm, ywid: gzlparam.row.id, dbjddm: gzlparam.row.dbjddm, gnbid: gzlparam.gnbid },
        dataObj: {
            sqlid: '1766988844307437cdd323df3555aced8a9d96873c566d',
            data: { lcdm: gzlparam.row.inco_lcdm, ywid: gzlparam.row.id }
        },
        shtgFunction: () => { _this.query() }
    })
}
export async function gzl_shxq (_this, gzlparam = {}) {
    _this.$gzl({
        gzlObj: {
            type: 'shck',
ywlcdm: gzlparam.row.inco_lcdm,
            ywid: gzlparam.row.id,
shckshowtype: 'vertical'
        },
        dataObj: {}
    })
}
/**
 * 比较两个对象并返回差异的属性名数组
 * @param {Object} obj1 - 第一个对象
 * @param {Object} obj2 - 第二个对象
 * @param {boolean} [deep=false] - 是否进行深层比较
 * @returns {string[]} 差异属性名数组
 */
export function getObjectDiff (obj1, obj2, deep = false) {
    const diffKeys = [];
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]); // 获取所有唯一键
    for (const key of allKeys) {
        const val1 = obj1[key];
        const val2 = obj2[key];
        // 处理属性不存在的情况
        if (!(key in obj1)) {
            diffKeys.push(`${key} (只在obj2中存在)`);
            continue;
        }
        if (!(key in obj2)) {
            diffKeys.push(`${key} (只在obj1中存在)`);
            continue;
        }

        // 深层比较
        if (deep && isObject(val1) && isObject(val2)) {
            const nestedDiff = getObjectDiff(val1, val2, true);
            if (nestedDiff.length > 0) {
                diffKeys.push(`${key}: {${nestedDiff.join(', ')}}`);
            }
            continue;
        }
        // 基本类型比较
        if (!deepEqual(val1, val2, deep)) {
            diffKeys.push(key);
        }
    }
    return diffKeys;
    // 判断是否为对象
    function isObject (obj) {
        return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
    }
    // 通用的相等比较
    function deepEqual (a, b, deep) {
        if (a === b) return true;
        if (!deep) return false;
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            return a.every((item, i) => deepEqual(item, b[i], true));
        }
        if (isObject(a) && isObject(b)) {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length) return false;
            return keysA.every(key => deepEqual(a[key], b[key], true));
        }
        return false;
    }
}
