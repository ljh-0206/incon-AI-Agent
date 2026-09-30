/**
 * 工作流组件调用
 * Vue 3 版本
 */
import { createApp, h } from 'vue';
import gzlComponent from './index.vue';
import { useSharedApp } from '@/plugins/shared/sharedApp';

const gzl = (obj) => {
    return new Promise((resolve, reject) => {
        const el = document.createElement('div');
        const app = createApp({
            render () {
                return h(gzlComponent, {
                    onResolve: (result) => {
                        resolve(result);
                        app.unmount();
                        if (el.parentNode) {
                            el.parentNode.removeChild(el);
                        }
                    },
                    onReject: (error) => {
                        reject(error);
                        app.unmount();
                        if (el.parentNode) {
                            el.parentNode.removeChild(el);
                        }
                    }
                });
            }
        });
        // 一行注入所有全局属性
        useSharedApp(app);
        const gzlDom = app.mount(el);
        document.body.appendChild(el);

        console.log(obj, 'gzlObj');

        if (obj.gzlObj && obj.gzlObj.ywlcdm && obj.gzlObj.ywid) {
            // 工作流data
            // type:'bc=保存、tj=提交、ch=撤回、del=删除、sh=审核，zclsh=自己处理审核，shck=审核情况查看，不传默认：bc',
            // ywlcdm:'业务流程代码（必须传）',
            // ywid:'业务ID（必须传）',ywmc:'业务名称',
            // params:[{'bldm':value,'blz':value}],
            // dbjddm:'待办节点代码（sh时需传）',
            // shzt: '审核状态，tg=通过、btg=不通过，zclsh时必须传'
            // bhjd: '驳回到的节点代码，zclsh不通过时传递'
            // shyj: '审核意见，zclsh时传递'
            gzlDom.gzlObj = { ...gzlDom.gzlObj, ...obj.gzlObj };
            // 工作流审核通过后执行的方法（审核时使用）
            gzlDom.shtgFunction = obj.shtgFunction;
            // 业务data
            // sqlid:'通用map的SQLID',
            // data:{}
            gzlDom.gnbid = obj.gnbid;
            gzlDom.dataObj = { ...gzlDom.dataObj, ...obj.dataObj };

            // 判断工作量类型，调用执行不同的工作流方法
            let res;
            switch (obj.gzlObj.type) {
                case 'bc':
                    res = gzlDom.bctj('0');
                    break;
                case 'tj':
                    res = gzlDom.bctj('1');
                    break;
                case 'ch':
                    res = gzlDom.ch();
                    break;
                case 'del':
                    res = gzlDom.del();
                    break;
                case 'sh':
                    gzlDom.sh();
                    break;
                case 'zclsh':
                    res = gzlDom.saveZclSh();
                    break;
                case 'shck':
                    gzlDom.shck();
                    break;
                default:
                    res = gzlDom.bctj('0');
                    break;
            }
            return res;
        }
    });
}
export default gzl;
