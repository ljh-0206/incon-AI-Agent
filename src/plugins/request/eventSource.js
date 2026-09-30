import Setting from '@/setting';
// import { EventSourcePolyfill } from 'event-source-polyfill';
import { fetchEventSource } from '@microsoft/fetch-event-source';
const Token = localStorage.getItem('token' + '_' + Setting.xmid);
export default function eventSourceFun ({ url, params, callback }) {
	url = Setting.apiBaseURL + url;
	let controller = null;
	controller = new AbortController();

	fetchEventSource(url, {
		method: 'POST',
		headers: {
			Token: Token ? 'Inco-' + Token : '',
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
	url = Setting.apiBaseURL + url;
	const eventSource = new EventSourcePolyfill(
		url,
		{
			headers: {
				Token: Token ? 'Inco-' + Token : ''
			}
		});
	eventSource.addEventListener('open', function (e) {
		console.log('open successfully')
	})
	/*
	* message：后端返回信息，格式可以和后端协商
	*/
	eventSource.addEventListener('message', function (e) {
		callback(e)
	})
	eventSource.addEventListener('error', function (err) {
		console.log(err)

		// eventSource?.close();
		if (eventSource) {
			eventSource.close();
		}
	})

	return eventSource;
}
