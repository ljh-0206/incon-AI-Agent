<template>
  <div class="ai-agent-app-chat">
    <!-- 顶栏：头像 + 名称 -->
    <div class="run-header">
      <div class="run-title">
        <div class="run-avatar"><i :class="app.avatar || 'fa-solid fa-robot'"></i></div>
        <div class="run-name-area">
          <span class="run-name">{{ app.name || '智能体应用' }}</span>
          <!-- <Tag v-if="app.appType === 'workflow'" color="warning" size="small">工作流模式</Tag>
          <Tag v-else color="primary" size="small">标准模式</Tag> -->
        </div>
      </div>
      <div class="run-actions">
        <Button size="small" @click="newConversation" :disabled="sending">新对话</Button>
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
import { agentAppOpenInfo, agentAppOpenRun, agentAppOpenStreamUrl } from '@/api/agentAppOpen';

export default {
  name: 'AiAgentAppChat',
  setup () {
    const messages = ref([]);
    const input = ref('');
    const sending = ref(false);
    return { messages, input, sending };
  },
  data () {
    return {
      app: { id: null, name: '', appType: 'standard', avatar: 'fa-solid fa-robot', welcomeText: '', streaming: false, showReasoning: false },
      appKey: '',
      loading: false,
      chatCode: null, // 会话标识（续接历史上下文）
      streamController: null,
      mdi: null
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
    const appId = this.$route.query.appId;
    const key = this.$route.query.key;
    if (!appId || !key) {
      Message.error('链接无效：缺少应用标识或密钥');
      return;
    }
    this.appKey = key;
    this.loading = true;
    try {
      const info = await agentAppOpenInfo(appId, key);
      if (info) this.app = { ...this.app, ...info };
      this.renderWelcome();
      this.ensureKatexCss();
    } catch (e) {
      Message.error('加载应用失败或密钥无效');
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
    maybeWrapJson (text) {
      if (!text) return text;
      const t = text.trim();
      if (!t) return text;
      if (t.charAt(0) === '{' || t.charAt(0) === '[') {
        try {
          const parsed = JSON.parse(t);
          return '```json\n' + (typeof parsed === 'string' ? t : JSON.stringify(parsed, null, 2)) + '\n```';
        } catch (e) {
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
      if (this.app.welcomeText && this.app.welcomeText.trim() && !this.messages.length) {
        this.messages.push({ role: 'assistant', content: this.app.welcomeText, reasoning: '', reasoningExpanded: true, notice: '', streaming: false, error: false });
      }
    },
    ensureKatexCss () {
      if (document.getElementById('agent-chat-katex-css')) return;
      const link = document.createElement('link');
      link.id = 'agent-chat-katex-css';
      link.rel = 'stylesheet';
      link.href = (Setting.routerBase || '/') + 'static/katex/katex.min.css';
      document.head.appendChild(link);
    },

    // ========== 交互 ==========
    newConversation () {
      if (this.sending) return;
      this.messages = [];
      this.chatCode = null;
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
    // 对外通道统一聊天协议：标准模式与工作流模式均由 OpenApiController 适配为
    // chatCode / message / reasoning / notice / complete / error，此处单一消费。
    handleSend () {
      const question = (this.input || '').trim();
      if (!question || this.sending) return;
      this.input = '';
      this.messages.push({ role: 'user', content: question });
      const assistantMsg = reactive({ role: 'assistant', content: '', reasoning: '', reasoningExpanded: true, notice: '', streaming: true, error: false });
      this.messages.push(assistantMsg);
      this.sending = true;
      this.scrollToBottom();

      if (this.app.streaming) {
        this.callStream(assistantMsg, question);
      } else {
        this.callBlock(assistantMsg, question);
      }
    },
    callBlock (msg, question) {
      const body = { question };
      if (this.chatCode) body.startMessageId = this.chatCode;
      agentAppOpenRun(this.app.id, this.appKey, body)
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
    callStream (msg, question) {
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
      fetchEventSource(agentAppOpenStreamUrl(this.app.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.appKey,
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
          throw err; // 停止自动重连
        }
      }).catch(() => {});
    }
  }
};
</script>

<style lang="less" scoped>
.ai-agent-app-chat {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  background: #fff;
  padding: 12px 16px;
  box-sizing: border-box;
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
</style>
