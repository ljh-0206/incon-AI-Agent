<template>
  <div class="ai-agent-app-run">
    <!-- 顶栏：头像 + 名称 + 操作 -->
    <div class="run-header">
      <div class="run-title">
        <div class="run-avatar"><i :class="app.avatar || 'fa-solid fa-robot'"></i></div>
        <div class="run-name-area">
          <span class="run-name">{{ app.name || '智能体应用' }}</span>
          <Tag v-if="app.appType === 'workflow'" color="warning" size="small">工作流模式</Tag>
          <Tag v-else color="primary" size="small">标准模式</Tag>
        </div>
      </div>
      <div class="run-actions">
        <Button size="small" @click="newConversation" :disabled="sending">新对话</Button>
        <Button size="small" @click="openHistory" :disabled="sending"><i class="fa-solid fa-clock-rotate-left"></i> 历史</Button>
        <Button size="small" @click="back">返回</Button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div ref="msgBox" class="msg-box">
      <div v-if="!messages.length" class="empty-tip">
        <i class="fa-solid fa-comments" style="font-size:44px;color:#c5c8ce"></i>
        <p>开始与「{{ app.name || '智能体' }}」对话</p>
      </div>
      <div v-for="(m, i) in messages" :key="i" :class="['msg-item', m.role]">
        <div class="avatar" :class="m.role">
          <i v-if="m.role === 'assistant'" :class="app.avatar || 'fa-solid fa-robot'"></i>
          <span v-else>我</span>
        </div>
        <div class="msg-main">
          <div :class="['msg-bubble', { error: m.error }]">
            <template v-if="m.role === 'assistant'">
              <!-- 思考过程（可折叠） -->
              <div v-if="m.reasoning" class="reasoning-block">
                <div class="reasoning-summary" @click="toggleReasoning(i)">
                  <i class="fa-solid fa-lightbulb"></i> 思考过程
                  <span class="reasoning-toggle-hint">{{ m.reasoningExpanded ? '收起' : '展开' }}</span>
                </div>
                <div v-if="m.reasoningExpanded" class="reasoning-content">{{ m.reasoning }}<span v-if="m.streaming && !m.content" class="cursor-blink inline"></span></div>
              </div>
              <!-- 正文（markdown） -->
              <div v-if="m.content" class="markdown-body" v-html="renderMd(m.content)"></div>
              <span v-if="m.streaming && !m.content && !m.reasoning" class="cursor-blink"></span>
              <span v-if="m.streaming && m.content" class="cursor-blink inline"></span>
              <div v-if="m.notice" class="notice-text"><i class="fa-solid fa-circle-exclamation"></i> {{ m.notice }}</div>
            </template>
            <template v-else>
              <pre class="user-text">{{ m.content }}</pre>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="input-area">
      <Input
        ref="inputRef"
        v-model="input"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 6 }"
        :placeholder="sending ? '生成中...' : '输入问题，Enter 发送，Shift+Enter 换行'"
        :disabled="sending"
        @keydown="onKeydown"
      />
      <div class="input-actions">
        <Button v-if="sending" type="error" ghost @click="handleStop"><i class="fa-solid fa-stop"></i> 停止</Button>
        <Button type="primary" :loading="sending" :disabled="!input.trim()" @click="handleSend">
          {{ sending ? '生成中' : '发送' }}
        </Button>
      </div>
    </div>

    <!-- 历史会话抽屉 -->
    <Drawer v-model="historyDrawer" title="历史对话" placement="left" :transfer="false" width="320">
      <div class="history-panel">
        <div v-if="historyLoading" class="history-empty">加载中...</div>
        <template v-else>
          <div v-if="!historyList.length" class="history-empty">暂无历史对话</div>
          <div
            v-for="item in historyList"
            :key="item.chatcode"
            :class="['history-item', { active: item.chatcode === activeChatCode }]"
            @click="selectSession(item)"
          >
            <div class="history-title">{{ item.question || '（无内容）' }}</div>
            <div class="history-time">{{ formatTime(item.lasttime) }}</div>
            <i class="fa-solid fa-trash-can history-del" @click.stop="deleteSession(item)"></i>
          </div>
        </template>
      </div>
    </Drawer>
  </div>
</template>

<script>
import { Message } from 'view-ui-plus';
import { reactive, ref, nextTick } from 'vue';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import mila from 'markdown-it-link-attributes';
import mdKatex from '@traptitech/markdown-it-katex';
import Setting from '@/setting';
import { agentAppGet } from '@/api/agentApp';
import request from '@/plugins/request';

export default {
  name: 'AiAgentAppRun',
  setup () {
    const messages = ref([]);
    const input = ref('');
    const sending = ref(false);
    return { messages, input, sending };
  },
  data () {
    return {
      app: { id: null, name: '', appType: 'standard', avatar: 'fa-solid fa-robot', welcomeText: '', streaming: false, showReasoning: false, workflowId: null },
      loading: false,
      chatCode: null, // 标准模式会话标识（续接历史上下文）
      streamController: null,
      mdi: null,
      sys_guid_count: 0,
      historyDrawer: false,
      historyList: [],
      historyLoading: false,
      activeChatCode: null
    };
  },
  created () {
    const _this = this;
    this.mdi = new MarkdownIt({
      html: false,
      linkify: true,
      breaks: true,
      highlight (code, language) {
        const validLang = !!(language && hljs.getLanguage(language));
        try {
          const html = validLang ? hljs.highlight(code, { language }).value : hljs.highlightAuto(code).value;
          return `<pre class="code-block-wrapper"><code class="hljs code-block-body">${html}</code></pre>`;
        } catch (e) {
          return `<pre class="code-block-wrapper"><code class="hljs code-block-body">${_this.escapeHtml(code)}</code></pre>`;
        }
      }
    });
    this.mdi.use(mila, { attrs: { target: '_blank', rel: 'noopener' } });
    this.mdi.use(mdKatex, { blockClass: 'katexmath-block', errorColor: '#cc0000' });
  },
  async mounted () {
    const id = this.$route.params.id;
    if (!id) {
      Message.error('缺少应用 id');
      return;
    }
    this.loading = true;
    try {
      this.app = await agentAppGet(id);
      this.renderWelcome();
      this.ensureKatexCss();
    } catch (e) {
      Message.error('加载应用失败');
    } finally {
      this.loading = false;
    }
  },
  beforeUnmount () {
    if (this.streamController) {
      this.streamController.abort();
      this.streamController = null;
    }
  },
  methods: {
    // ========== 渲染 ==========
    renderMd (text) {
      if (!text) return '';
      try { return this.mdi.render(this.maybeWrapJson(text)); } catch (e) { return this.escapeHtml(text); }
    },
    // 检测纯 JSON 文本（AI 返回的裸 JSON 或工作流 finalOutput 对象序列化串），
    // 包裹为 ```json 代码块以走 hljs 语法高亮，避免被 markdown 段落打散丢失缩进。
    // 流式期间 content 可能是不完整 JSON：按「以 { 或 [ 开头」判定即包裹（保持等宽对齐），完成后重新 pretty-print。
    maybeWrapJson (text) {
      if (!text) return text;
      const t = text.trim();
      if (!t) return text;
      if (t.charAt(0) === '{' || t.charAt(0) === '[') {
        try {
          const parsed = JSON.parse(t);
          // 完整 JSON：pretty-print 后高亮
          return '```json\n' + (typeof parsed === 'string' ? t : JSON.stringify(parsed, null, 2)) + '\n```';
        } catch (e) {
          // 流式不完整 JSON：仍作为代码块渲染，保留缩进与等宽，避免段落打散
          return '```json\n' + t + '\n```';
        }
      }
      return text;
    },
    escapeHtml (s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },
    scrollToBottom () {
      nextTick(() => {
        const box = this.$refs.msgBox;
        if (box) box.scrollTop = box.scrollHeight;
      });
    },
    toggleReasoning (i) {
      const m = this.messages[i];
      if (m) m.reasoningExpanded = !m.reasoningExpanded;
    },
    renderWelcome () {
      // 新开对话显示欢迎词
      if (this.app.welcomeText && this.app.welcomeText.trim() && !this.messages.length) {
        this.messages.push({ role: 'assistant', content: this.app.welcomeText, reasoning: '', reasoningExpanded: true, notice: '', streaming: false, error: false });
      }
    },
    ensureKatexCss () {
      if (document.getElementById('agent-run-katex-css')) return;
      const link = document.createElement('link');
      link.id = 'agent-run-katex-css';
      link.rel = 'stylesheet';
      link.href = (Setting.routerBase || '/') + 'static/katex/katex.min.css';
      document.head.appendChild(link);
    },

    // ========== 交互 ==========
    back () {
      // 按来源页返回：推荐管理页进入则回推荐管理页，否则回应用列表
      const from = this.$route.query.from;
      if (from === 'recommend') {
        this.$router.push({ name: 'ai-agent-app-recommend' });
      } else {
        this.$router.push({ name: 'ai-agent-app' });
      }
    },

    // ========== 历史会话 ==========
    openHistory () {
      this.historyDrawer = true;
      this.loadHistoryList();
    },
    async loadHistoryList () {
      if (!this.app.id) return;
      this.historyLoading = true;
      try {
        const list = await request({ url: '/chatLog/sessions', method: 'get', params: { appid: this.app.id } });
        // MyBatis resultType=Map 默认按数据库列名返回（Oracle 大写），统一转小写供模板取值
        this.historyList = (Array.isArray(list) ? list : []).map(it => {
          const o = {};
          Object.keys(it).forEach(k => { o[k.toLowerCase()] = it[k]; });
          return o;
        });
      } catch (e) {
        Message.error('加载历史对话失败');
      } finally {
        this.historyLoading = false;
      }
    },
    selectSession (item) {
      if (this.sending) return;
      this.historyDrawer = false;
      this.chatCode = item.chatcode;
      this.activeChatCode = item.chatcode;
      this.loadSessionMessages(item.chatcode);
    },
    async loadSessionMessages (chatcode) {
      try {
        const list = await request({ url: '/chatLog/list', method: 'get', params: { chatcode } });
        const arr = Array.isArray(list) ? list : [];
        this.messages = [];
        arr.forEach(it => {
          if (it.question) this.messages.push({ role: 'user', content: it.question });
          if (it.answer) this.messages.push({ role: 'assistant', content: it.answer, reasoning: '', reasoningExpanded: false, notice: '', streaming: false, error: false });
        });
        if (!this.messages.length) this.renderWelcome();
        this.scrollToBottom();
      } catch (e) {
        Message.error('加载会话内容失败');
      }
    },
    deleteSession (item) {
      this.$Modal.confirm({
        title: '确认删除',
        content: '确定删除该历史对话吗？删除后不可恢复。',
        onOk: async () => {
          try {
            await request({ url: '/chatLog/deleteSession', method: 'post', data: { chatcode: item.chatcode } });
            if (item.chatcode === this.activeChatCode) this.newConversation();
            this.loadHistoryList();
          } catch (e) {
            Message.error('删除失败');
          }
        }
      });
    },
    formatTime (t) {
      if (!t && t !== 0) return '';
      // 数字时间戳（Oracle Date 经 Jackson 可能序列化为毫秒数）
      if (typeof t === 'number') {
        const d = new Date(t);
        const p = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
      }
      // 字符串：去 T、截到分钟
      return String(t).replace('T', ' ').slice(0, 16);
    },
    // 生成会话标识（工作流模式由前端生成，标准模式由后端回传），仅作 chatlog 分组键
    genChatCode () {
      const s = 'xxxxxxxxxxxx4xxx'.replace(/x/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
      return s + Date.now().toString(36);
    },
    // 工作流对话落 chatlog（智能体统一落库，与标准模式共用历史源）
    async saveWorkflowLog (question, answer) {
      try {
        await request({
          url: `/ai/agent-app/${this.app.id}/chat/log`,
          method: 'post',
          data: { chatcode: this.chatCode, question, answer: answer || '' }
        });
      } catch (e) { /* 落库失败不影响对话展示 */ }
    },
    newConversation () {
      if (this.sending) return;
      this.messages = [];
      this.chatCode = null;
      this.activeChatCode = null;
      this.renderWelcome();
    },
    onKeydown (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        this.handleSend();
      }
    },
    handleStop () {
      if (this.streamController) {
        this.streamController.abort();
        this.streamController = null;
      }
      const last = this.messages[this.messages.length - 1];
      if (last && last.role === 'assistant' && last.streaming) {
        last.streaming = false;
        if (!last.content) { last.content = '[已停止]'; last.error = true; }
      }
      this.sending = false;
    },

    // ========== 发送 ==========
    handleSend () {
      const question = (this.input || '').trim();
      if (!question || this.sending) return;
      this.input = '';
      this.messages.push({ role: 'user', content: question });
      const assistantMsg = reactive({ role: 'assistant', content: '', reasoning: '', reasoningExpanded: true, notice: '', streaming: true, error: false });
      this.messages.push(assistantMsg);
      this.sending = true;
      this.scrollToBottom();

      if (this.app.appType === 'workflow') {
        this.sendWorkflow(assistantMsg, question);
      } else {
        this.sendStandard(assistantMsg, question);
      }
    },

    // 标准模式：委托后端 /ai/agent-app/{id}/chat(/stream)，事件同 /sse/chat
    sendStandard (msg, question) {
      if (this.app.streaming) {
        this.callStandardStream(msg, question);
      } else {
        this.callStandardBlock(msg, question);
      }
    },
    callStandardBlock (msg, question) {
      const body = { question };
      if (this.chatCode) body.startMessageId = this.chatCode;
      request({ url: `/ai/agent-app/${this.app.id}/chat`, method: 'post', data: body })
        .then(result => {
          msg.streaming = false;
          msg.content = (typeof result === 'string' ? result : (result && result.content)) || '';
        })
        .catch(e => {
          msg.streaming = false; msg.error = true;
          msg.content = '[错误] ' + ((e && e.message) || '调用失败');
        })
        .finally(() => {
          this.sending = false;
          this.scrollToBottom();
        });
    },
    callStandardStream (msg, question) {
      const token = localStorage.getItem('token_' + Setting.xmid);
      const controller = new AbortController();
      this.streamController = controller;
      const body = { question };
      if (this.chatCode) body.startMessageId = this.chatCode;
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        msg.streaming = false;
        this.sending = false;
        this.streamController = null;
        this.scrollToBottom();
      };
      fetchEventSource(Setting.apiBaseURL + `/ai/agent-app/${this.app.id}/chat/stream`, {
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
          if (response.status >= 400) throw new Error('对话流请求失败：HTTP ' + response.status);
        },
        onmessage: (ev) => {
          if (ev.event === 'chatCode') {
            if (ev.data) this.chatCode = ev.data;
            return;
          }
          if (ev.event === 'complete') { finish(); return; }
          if (ev.event === 'error') {
            msg.error = true;
            const errText = ev.data || '未知错误';
            msg.content = msg.content ? (msg.content + '\n\n> [错误] ' + errText) : ('[错误] ' + errText);
            finish();
            return;
          }
          if (ev.event === 'reasoning') {
            if (ev.data) { msg.reasoning += ev.data; this.scrollToBottom(); }
            return;
          }
          if (ev.event === 'notice') {
            if (ev.data) msg.notice = ev.data;
            return;
          }
          // 默认 message 事件 = 正文增量
          if (ev.data) { msg.content += ev.data; this.scrollToBottom(); }
        },
        onclose: () => finish(),
        onerror: (err) => {
          if (!finished) {
            msg.error = true;
            if (!msg.content) msg.content = '[连接异常] ' + ((err && err.message) || '网络错误');
          }
          finish();
          throw err; // 停止自动重连，避免重复触发工作流
        }
      }).catch(() => {});
    },

    // 工作流模式：委托 /ai/workflow/{workflowId}/execute/stream，事件 output_delta/reasoning_delta/complete/error
    sendWorkflow (msg, question) {
      if (!this.chatCode) this.chatCode = this.genChatCode(); // 首轮生成会话标识，续轮保持（多轮落同一 chatcode）
      const token = localStorage.getItem('token_' + Setting.xmid);
      const controller = new AbortController();
      this.streamController = controller;
      const streaming = this.app.streaming;
      const showReasoning = this.app.showReasoning;
      let url = `${Setting.apiBaseURL}/ai/workflow/${this.app.workflowId}/execute/stream?testRun=false&streaming=${streaming ? 'true' : 'false'}&showReasoning=${showReasoning ? 'true' : 'false'}&input=${encodeURIComponent(question)}&chatcode=${encodeURIComponent(this.chatCode)}`;
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        msg.streaming = false;
        this.sending = false;
        this.streamController = null;
        this.scrollToBottom();
      };
      fetchEventSource(url, {
        headers: token ? { Token: 'Inco-' + token } : {},
        signal: controller.signal,
        onmessage: (ev) => {
          if (ev.event === 'output_delta') {
            try { const e = JSON.parse(ev.data); if (e.delta) { msg.content += e.delta; this.scrollToBottom(); } } catch (err) {}
            return;
          }
          if (ev.event === 'reasoning_delta') {
            try { const e = JSON.parse(ev.data); if (e.reasoning) { msg.reasoning += e.reasoning; this.scrollToBottom(); } } catch (err) {}
            return;
          }
          if (ev.event === 'complete') {
            try { const e = JSON.parse(ev.data); if (e.finalOutput && !msg.content) { msg.content = typeof e.finalOutput === 'string' ? e.finalOutput : JSON.stringify(e.finalOutput, null, 2); } } catch (err) {}
            finish();
            this.saveWorkflowLog(question, msg.content); // 智能体统一落库 chatlog
            return;
          }
          if (ev.event === 'error') {
            msg.error = true;
            let errText = '未知错误';
            try { const e = JSON.parse(ev.data); errText = e.error || errText; } catch (err) { errText = ev.data || errText; }
            msg.content = msg.content ? (msg.content + '\n\n> [错误] ' + errText) : ('[错误] ' + errText);
            finish();
            return;
          }
          // 其它事件（start/node_start/node_complete/node_error）忽略，不干扰对话气泡
        },
        onclose: () => finish(),
        onerror: (err) => {
          if (!finished) {
            msg.error = true;
            if (!msg.content) msg.content = '[连接异常] ' + ((err && err.message) || '网络错误');
          }
          finish();
          throw err;
        }
      }).catch(() => {});
    }
  }
};
</script>

<style lang="less" scoped>
.ai-agent-app-run {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #fff;
  padding: 12px 16px;
}
.run-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #efefef;
  flex-shrink: 0;
}
.run-title { display: flex; align-items: center; gap: 10px; }
.run-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.run-name-area { display: flex; align-items: center; gap: 8px; }
.run-name { font-size: 16px; font-weight: 600; color: #17233d; }
.run-actions { display: flex; gap: 8px; }

.msg-box {
  flex: 1; min-height: 0; overflow-y: auto;
  padding: 12px 4px; border: 1px solid #efefef; border-radius: 8px;
  background: #f7f8fa; margin: 12px 0;
}
.empty-tip { text-align: center; color: #808695; padding: 60px 0; p { margin: 8px 0 0; font-size: 14px; } }
.msg-item { display: flex; gap: 10px; margin: 12px 10px; &.user { flex-direction: row-reverse; } }
.avatar {
  flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 14px; color: #fff;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  &.user { background: #19be6b; }
}
.msg-main { max-width: 80%; display: flex; flex-direction: column; .user & { align-items: flex-end; } }
.msg-bubble {
  padding: 10px 14px; border-radius: 8px; font-size: 14px; line-height: 1.7; word-break: break-word;
  background: #fff; border: 1px solid #ebeef5;
  &.error { border-color: #ffd6d6; background: #fff5f5; }
}
.user .msg-bubble { background: #e8f7ed; border-color: #d6efe0; }
.user-text { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: inherit; font-size: 14px; }

.cursor-blink {
  display: inline-block; width: 7px; height: 16px; vertical-align: middle; background: #6366f1;
  animation: agent-blink 1s step-end infinite;
  &.inline { margin-left: 2px; }
}
@keyframes agent-blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }

.reasoning-block {
  margin-bottom: 8px; border: 1px dashed #f0c674; border-radius: 6px; background: #fffdf5; overflow: hidden;
}
.reasoning-summary {
  display: flex; align-items: center; gap: 6px; padding: 8px 12px; font-size: 13px; font-weight: 600;
  color: #b7791f; cursor: pointer; user-select: none;
  i { color: #f59e0b; }
  .reasoning-toggle-hint { margin-left: auto; color: #b0b3b8; font-weight: 400; font-size: 12px; }
}
.reasoning-content {
  padding: 8px 12px; font-size: 13px; line-height: 1.6; color: #7a8088;
  white-space: pre-wrap; word-break: break-word; border-top: 1px solid #f0e6c8;
}
.notice-text { margin-top: 6px; font-size: 12px; color: #ed9b2e; }

.input-area { flex-shrink: 0; display: flex; gap: 10px; align-items: flex-end; }
.input-actions { display: flex; flex-direction: column; gap: 6px; }

/* markdown 渲染（v-html 子元素，需非 scoped 覆盖） */
:deep(.markdown-body) {
  font-size: 14px; line-height: 1.7; color: #17233d;
  p { margin: 6px 0; }
  ul, ol { padding-left: 22px; margin: 6px 0; }
  li { margin: 2px 0; }
  h1, h2, h3, h4 { margin: 12px 0 6px; font-weight: 600; }
  blockquote { margin: 6px 0; padding: 4px 12px; border-left: 3px solid #ddd; color: #5c6b77; background: #fafafa; }
  a { color: #2d8cf0; }
  table { border-collapse: collapse; margin: 8px 0; }
  th, td { border: 1px solid #e0e0e0; padding: 6px 10px; }
  th { background: #f5f7fa; }
  pre.code-block-wrapper { margin: 8px 0; border-radius: 4px; overflow: hidden; border: 1px solid #eaecef; }
  code.code-block-body { display: block; padding: 10px 12px; font-size: 13px; line-height: 1.5; overflow-x: auto; }
  code:not(.hljs) { padding: 1px 5px; border-radius: 3px; background: #f1f3f5; font-size: 13px; }
  .katexmath-block { margin: 8px 0; padding: 10px; border-radius: 4px; background: #f6f8fa; overflow-x: auto; }
}

/* 历史会话抽屉 */
.history-panel { padding: 0 4px; }
.history-empty { text-align: center; color: #808695; padding: 40px 0; font-size: 13px; }
.history-item {
  position: relative; padding: 10px 12px; border-radius: 8px; cursor: pointer;
  margin-bottom: 6px; border: 1px solid transparent;
  transition: background .2s, border-color .2s;
  &:hover { background: #f5f7fa; }
  &.active { background: #eef2ff; border-color: #c7d2fe; }
  &:hover .history-del { opacity: 1; }
}
.history-title {
  font-size: 13px; color: #17233d; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; word-break: break-word; padding-right: 18px;
}
.history-time { margin-top: 4px; font-size: 12px; color: #b0b3b8; }
.history-del {
  position: absolute; top: 10px; right: 10px; opacity: 0;
  color: #c0c4cc; font-size: 13px; transition: opacity .2s, color .2s;
  &:hover { color: #ed4014; }
}
</style>
