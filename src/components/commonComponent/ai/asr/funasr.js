/*
 * 语音识别
 */

// let arr = ["2pass", "online", "offline"]
const initConfig = {
    mode: '2pass',
    onToTextSuccess: (text) => {},
    stop: () => { },
    record: () => { }
}

let isRec = false
const file_ext = ''

async function __FunAsr (win) {
    let sampleBuf = new Int16Array();
    let wave = null
    let _transitionend = true
    await import('@/components/commonComponent/ai/asr/js/recorder-core.js');
    await import('@/components/commonComponent/ai/asr/js/wav.js')
    await import('@/components/commonComponent/ai/asr/js/pcm.js')
    await import('@/components/commonComponent/ai/asr/js/waveaview.js')

    const WebSocketConnectMethod = function (config) { // 定义socket连接方法类
        let speechSokt;
        let connKeeperID;

        const msgHandle = config.msgHandle;
        const stateHandle = config.stateHandle;
        const url = config.url;
        const itn = config.itn;
        const mode = initConfig.mode;
        const hotwords = config.hotwords;

        this.wsStart = function () {
            const Uri = url; // "wss://111.205.137.58:5821/wss/" //设置wss asr online接口地址 如 wss://X.X.X.X:port/wss/
            if (Uri.match(/wss:\S*|ws:\S*/)) {
                console.log('Uri' + Uri);
            } else {
                alert('请检查wss地址正确性');
                return 0;
            }

            if ('WebSocket' in window) {
                speechSokt = new WebSocket(Uri); // 定义socket连接对象
                speechSokt.onopen = function (e) { onOpen(e); }; // 定义响应函数
                speechSokt.onclose = function (e) {
                    console.log('onclose ws!');
                    // speechSokt.close();
                    onClose(e);
                };
                speechSokt.onmessage = function (e) { onMessage(e); };
                speechSokt.onerror = function (e) { onError(e); };
                return 1;
            } else {
                alert('当前浏览器不支持 WebSocket');
                return 0;
            }
        };

        // 定义停止与发送函数
        this.wsStop = function () {
            if (speechSokt != undefined) {
                console.log('stop ws!');
                speechSokt.close();
            }
        };

        this.wsSend = function (oneData) {
            if (speechSokt == undefined) return;
            if (speechSokt.readyState === 1) { // 0:CONNECTING, 1:OPEN, 2:CLOSING, 3:CLOSED
                speechSokt.send(oneData);
            }
        };

        // SOCEKT连接中的消息与状态响应
        function onOpen (e) {
            // 发送json
            const chunk_size = new Array(5, 10, 5);
            const request = {
                chunk_size,
                wav_name: 'h5',
                is_speaking: true,
                chunk_interval: 10,
                itn,
                mode: initConfig.mode
            };
            if (initConfig.mode == 'offline') {
                request.wav_format = file_ext;
                if (file_ext == 'wav') {
                    request.wav_format = 'PCM';
                    request.audio_fs = file_sample_rate;
                }
            }

            if (hotwords != null) {
                request.hotwords = hotwords;
            }

            console.log(JSON.stringify(request));
            speechSokt.send(JSON.stringify(request));
            console.log('连接成功');
            stateHandle(0);
        }

        function onClose (e) {
            stateHandle(1);
        }

        function onMessage (e) {
            const data = JSON.parse(e.data)
            if (data.stamp_sents && data.stamp_sents.length > 0) {
                document.querySelector('.record_container .rocord_text').innerText = data.text
                msgHandle(data.text, e);
            }
        }

        function onError (e) {
            console.log(e);
            stateHandle(2);
        }
    }

    function clear () {
    //    var varArea=document.getElementById('varArea');
    //    varArea.value="";
    //    rec_text="";
    //    offline_text="";
    }

    function fu_max_value (arr) {
        // 假设arr是一个大数组，我们不应该一次性计算所有元素的最大值，而是分批处理。
        const chunkSize = 1000; // 每次处理的元素数量
        let maxValue = arr.length > 0 ? arr.slice(0, chunkSize).reduce((a, b) => Math.max(a, b)) : 0;

// 分批处理剩余的元素
        for (let i = chunkSize; i < arr.length; i += chunkSize) {
            const chunkMax = arr.slice(i, i + chunkSize).reduce((a, b) => Math.max(a, b));
            maxValue = Math.max(maxValue, chunkMax);
        }

         return maxValue;
    }

    function recProcess (buffer, powerLevel, bufferDuration, bufferSampleRate, newBufferIdx, asyncEnd) {
        if (isRec === true) {
            const data_48k = buffer[buffer.length - 1];
            const array_48k = new Array(data_48k);
            const data_16k = Recorder.SampleData(array_48k, bufferSampleRate, 16000).data;

            wave.input(buffer[buffer.length - 1].map(e => e * 5), powerLevel, bufferSampleRate);
            const max_value = fu_max_value(buffer[buffer.length - 1].map(e => e * 5))
            const hsl = Math.abs(max_value % 360)
            if (_transitionend) {
                  document.querySelector('.record_container .recwave').style.backgroundColor = 'hsl(' + hsl + ',100%,50%,40%)'
                  _transitionend = false
            }
            if (Math.abs(max_value) > 800) {
                document.querySelector('.record_container').style.animation = 'none'
                requestAnimationFrame(function () {
                    document.querySelector('.record_container').style.animation = 'hide 3s forwards';
                });
            }
            sampleBuf = Int16Array.from([...sampleBuf, ...data_16k]);
            const chunk_size = 960; // for asr chunk_size [5, 10, 5]
            while (sampleBuf.length >= chunk_size) {
                const sendBuf = sampleBuf.slice(0, chunk_size);
                sampleBuf = sampleBuf.slice(chunk_size, sampleBuf.length);
                wsconnecter.wsSend(sendBuf);
            }
        }
    }

// 录音; 定义录音对象,wav格式
const rec = Recorder({
    type: 'pcm',
    bitRate: 16,
    sampleRate: 16000,
    onProcess: recProcess
});
// 封装彩虹文字样式

 const font_style = `
    .neon {
      font-size: 8em;
      text-align: center;
      font-family: 'Arial', sans-serif;
      color: #000;
      position: relative;
    }

    .neon::after {
      content: attr(data-content);
      position: absolute;
      top: 0;
      left: 0;
      overflow: hidden;
      color: #000;
      animation: glow 1.5s infinite alternate ease-in-out;
    }

    @keyframes glow {
      0% {
        text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #fff, 0 0 40px #ff00de, 0 0 70px #ff00de, 0 0 80px #ff00de, 0 0 100px #ff00de, 0 0 150px #ff00de;
      }
      100% {
        text-shadow: 0 0 20px #fff, 0 0 30px #fff, 0 0 40px #ff00de, 0 0 50px #ff00de, 0 0 60px #ff00de, 0 0 70px #ff00de, 0 0 80px #ff00de, 0 0 100px #ff00de;
      }
    }
  `;

         // 将样式添加到样式元素中

         // 如果需要，也可以给 div 元素添加 data-content 属性
         // neonText.setAttribute('data-content', neonText.textContent);

    function getJsonMessage (text, jsonMsg) {
        const rectxt = '' + JSON.parse(jsonMsg.data).text;
        const asrmodel = JSON.parse(jsonMsg.data).mode;
        const is_final = JSON.parse(jsonMsg.data).is_final;
        const timestamp = JSON.parse(jsonMsg.data).timestamp;
        console.log(rectxt);
    }

// 连接状态响应
    function getConnState (connState) {
        console.log(connState);
    }

    function getUseITN () {
       // 逆文本标准化(ITN):  true false
        return true;
    }
    function getHotwords () {
         const val = 'varchar2';
         console.log('hotwords=' + val);
         const items = val.split(/[(\r\n)\r\n]+/); // split by \r\n
         const jsonresult = {};
         const regexNum = /^[0-9]*$/; // test number
         for (const item of items) {
             const result = item.split(' ');
             if (result.length >= 2 && regexNum.test(result[result.length - 1])) {
                 let wordstr = '';
                 for (let i = 0; i < result.length - 1; i++) { wordstr = wordstr + result[i] + ' '; }

                 jsonresult[wordstr.trim()] = parseInt(result[result.length - 1]);
             }
         }
         console.log('jsonresult=' + JSON.stringify(jsonresult));
         return JSON.stringify(jsonresult);
     }

    let wsconnecter
    FunAsr.init = function (config) {
        const def = {
            msgHandle: getJsonMessage,
            stateHandle: getConnState,
            // url:'ws://43.227.254.14:58089',
            url: 'wss://www.funasr.com:10096',
            ...config
        }
        wsconnecter = new WebSocketConnectMethod({
            ...def,
            hotwords: getHotwords(),
            itn: getUseITN(),
            mode: initConfig.mode
        });
    }
    FunAsr.start = function () {
        // 清除显示
        clear();
        // 控件状态更新
        console.log('mode' + initConfig.mode == 'offline');

        // 启动连接
        const ret = wsconnecter.wsStart();
        // 1 is ok, 0 is error
        if (ret == 1) {
            // isRec = true;
            return 1;
        } else return 0;
    }
    FunAsr.record = function () {
        rec.open(function () {
            rec.start();
            console.log('开始');
            let record_container = document.querySelector('.record_container')
            const _record_container_style = {
                    animation: 'hide 3s forwards',
                     'pointer-events': 'none',
                     position: 'absolute',
                     'z-index': '9999',
                    width: '100%',
                    height: '300px',
                    bottom: ' 0px',
                    display: 'flex',
                    'flex-direction': 'column',
                    'align-items': 'center',
                    top: '50%',
                    gap: '8px'

            }
            const rocord_view_style = {
                width: '100px',
                height: '100px',
                transition: 'background-color 0.5s ease',
                'background-color': ' #2fbda466',
                'border-radius': ' 50%',
                'box-shadow': ' 0 0 10px #2fbda4ee,  0 0 10px #2fbda499,    0 0 20px #2fbda466'
            }
            const rocord_text_style = {
                width: 'fit-content',
                height: '30px',
                padding: '5px 15px',
                transition: 'background-color 0.5s ease',
                'background-color': ' #2fbda466',
                'border-radius': ' 50px',
                'box-shadow': ' 0 0 10px #2fbda4ee,  0 0 10px #2fbda499,    0 0 20px #2fbda466'
            }
            if (!record_container) {
                 record_container = document.createElement('div');
                 record_container.classList.add('record_container')
                 const rocord_view = document.createElement('div')
                       rocord_view.classList.add('recwave')
                 for (var property in _record_container_style) {
                    if (record_container.style.hasOwnProperty(property)) {
                        record_container.style[property] = _record_container_style[property];
                    }
                 }
                 for (var property in rocord_view_style) {
                    if (rocord_view.style.hasOwnProperty(property)) {
                        rocord_view.style[property] = rocord_view_style[property];
                    }
                 }
                 rocord_view.addEventListener('transitionend', function (event) {
                      console.log('rocord_view')
                      _transitionend = true
                 });
                record_container.appendChild(rocord_view)

                document.styleSheets[0].insertRule(`
                        .rainbow-text {
                          background: linear-gradient(to right, rgb(194, 11, 239), rgb(0, 9, 128), cyan, lime, rgb(0, 174, 255));
                          -webkit-background-clip: text;
                          -webkit-text-fill-color: transparent;
                          font-size:18px;
                          font-weight: bold;
                        }
                `)
                document.styleSheets[0].insertRule(`
                            @keyframes hide {
                              0% {
                                opacity: 1;
                              }
                              80% {
                                opacity: 1;
                              }
                              100% {
                                opacity: 0;
                              }
                            }
                `)

                const rocord_text = document.createElement('div');
                    rocord_text.classList.add('rocord_text')
                    rocord_text.classList.add('rainbow-text')
                    record_container.appendChild(rocord_text)
                for (var property in rocord_text_style) {
                    if (rocord_text.style.hasOwnProperty(property)) {
                        rocord_text.style[property] = rocord_text_style[property];
                    }
                }
            }
            document.querySelector('body').appendChild(record_container)
            document.querySelector('.record_container')
          /*  requestAnimationFrame(  (a)=>{
                if (document.querySelector(".record_container").style.opacity == 0) {
                    debugger
                    document.querySelector(".record_container").style.display='none'
                }
            }) */

            record_container.style.height
            wave = Recorder.WaveView({ elem: '.record_container .recwave' })
        });
    }
    FunAsr.setRocordText = function (text) {
        document.querySelector('.record_container .rocord_text').innerText = text
    },
    FunAsr.stop = function () {
        const chunk_size = new Array(5, 10, 5);
        const request = {
            chunk_size,
            wav_name: 'h5',
            is_speaking: false,
            chunk_interval: 10,
            mode: initConfig.mode
        };
        console.log(request);
        if (sampleBuf.length > 0) {
            wsconnecter.wsSend(sampleBuf);
            console.log('sampleBuf.length' + sampleBuf.length);
            sampleBuf = new Int16Array();
        }
        wsconnecter.wsSend(JSON.stringify(request));
        // 控件状态更新
        isRec = false;

        if (initConfig.mode != 'offline') {
            // wait 3s for asr result
            setTimeout(function () {
                console.log('call stop ws!');
                wsconnecter.wsStop();
            }, 3000);
            rec.stop(function (blob, duration) {
                const audioBlob = Recorder.pcm2wav({ sampleRate: 16000, bitRate: 16, blob },
                    function (theblob, duration) {
                  /*      console.log(theblob);
                        var audio_record = document.getElementById('audio_record');
                        audio_record.src =  (window.URL||webkitURL).createObjectURL(theblob);
                        audio_record.controls=true; */
                        // audio_record.play();

                    }, function (msg) {
                        console.log(msg);
                    }
                );
            }, function (errMsg) {
                console.log('errMsg: ' + errMsg);
            });
        }
        // 停止连接
    }
    return FunAsr
}
/*
* {
*   url:'',
*   msg:'',
*   state:''
*
* }
*
* */
function FunAsr (config, rollback) {
    const funAsrPromise = __FunAsr();
    funAsrPromise.then(e => {
        e.init(config)
        rollback(e)
    })
}

export const initFunAsr = function (config = {}) {
    Object.assign(initConfig, config)
    FunAsr({
        msgHandle: (text) => {
            initConfig.onToTextSuccess(text)
        }
    }, (e) => {
        console.log('语音识别组件已加装');
        initConfig.stop = e.stop
        initConfig.record = e.record
        e.start()
    })
}

export const recordState = function (flag) {
    isRec = flag;
    if (isRec) initConfig.record()
}
export const stopFunAsr = function () {
    initConfig.stop()
}
