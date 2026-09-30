import { Spin, Message } from 'view-ui-plus';
import Setting from '@/setting'; // url地址
import axios from 'axios';
export function exportFile (url, param, fileName, _this) {
    _this.$progress.show()
    axios({
        url: Setting.apiBaseURL + url,
        method: 'POST',
        headers: {
            Token: 'Inco-' + localStorage.getItem('token' + '_' + Setting.xmid),
            RoleCode: _this.info.jsdm
        },
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
