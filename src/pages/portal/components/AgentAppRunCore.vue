<template>
  <div class="ai-agent-app-run">
    <!-- 顶栏：头像 + 名称 + 操作 -->
    <div class="run-header">
      <div class="run-title">
        <!-- 头像三态（判别复用 agent/avatarState.js，口径同广场卡 AgentCard）：
             图片 → 容器内联背景 cover；fa 图标 → <i :class>；其余/空 → 「AI」圆章 -->
        <div class="run-avatar" :style="avatarStyle">
          <i v-if="avatarState.kind === 'icon'" :class="avatarState.value"></i>
          <template v-else-if="avatarState.kind === 'disc'">AI</template>
        </div>
        <div class="run-name-area">
          <span class="run-name">{{ app.name || '智能体应用' }}</span>
          <Tag v-if="app.appType === 'workflow'" color="warning" size="small">工作流模式</Tag>
          <Tag v-else color="primary" size="small">标准模式</Tag>
        </div>
      </div>
      <div class="run-actions">
        <Button size="small" @click="newConversation" :disabled="sending">新对话</Button>
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
        <!-- 智能体消息头像：三态由本模板渲染（图片 = 圆内背景铺满 / 图标 = fa 类名 / 其余 = 「AI」圆章），
             不再硬编码机器人图标；用户侧仍为「我」字章 -->
        <div class="avatar" :class="m.role" :style="m.role === 'assistant' ? avatarStyle : null">
          <template v-if="m.role === 'assistant'">
            <i v-if="avatarState.kind === 'icon'" :class="avatarState.value"></i>
            <span v-else-if="avatarState.kind === 'disc'" class="av-disc">AI</span>
          </template>
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
              <!-- 免责声明：仅正式回答渲染（欢迎词 welcome 打标排除、错误不挂），随每条回答贴气泡底 -->
              <div v-if="m.content && !m.error && !m.welcome" class="ai-disclaimer">回答由 AI 生成，请核对关键信息</div>
            </template>
            <template v-else>
              <pre class="user-text">{{ m.content }}</pre>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 停止悬浮钮：生成中浮在消息区底缘、输入框上方（handleStop 原逻辑不动） -->
    <div v-if="sending" class="stop-float">
      <button type="button" class="stop-float-btn" @click="handleStop">
        <i class="fa-solid fa-stop"></i> 停止生成
      </button>
    </div>

    <!-- 输入区（run-composer：外层融合框，焦点金环由页面 :focus-within 承担） -->
    <div class="input-area run-composer">
      <Input
        ref="inputRef"
        v-model="input"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 5 }"
        :placeholder="sending ? '生成中...' : '输入问题'"
        :disabled="sending"
        @keydown="onKeydown"
      />
      <!-- 发送：右下角 32px 圆形图标钮（空输入禁用弱化；生成中转 ios-loading 旋转图标并禁用） -->
      <button
        type="button"
        class="send-round"
        aria-label="发送"
        :disabled="sending || !input.trim()"
        @click="handleSend"
      >
        <Icon :type="sending ? 'ios-loading' : 'ios-send'" :class="{ 'ivu-load-loop': sending }" />
      </button>
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
import { agentAppGet } from '@/api/agentApp';
import request from '@/plugins/request';
// 头像三态判定 + 图片 ID → 背景样式（与广场卡 AgentCard 同口径的唯一实现；本组件内不另写一份）
import { resolveAvatar, avatarBgStyle } from './agent/avatarState';

export default {
  name: 'AgentAppRunCore',
  props: {
    // 应用 id（去路由化核心组件由外部传入，兼容字符串 / 数字）
    appId: { type: [String, Number], default: null }
  },
  emits: ['back', 'loaded', 'load-error'],
  setup () {
    const messages = ref([]);
    const input = ref('');
    const sending = ref(false);
    return { messages, input, sending };
  },
  data () {
    return {
      app: { id: null, name: '', appType: 'standard', avatar: '', welcomeText: '', streaming: false, showReasoning: false, workflowId: null },
      loading: false,
      chatCode: null, // 标准模式会话标识（续接历史上下文）
      streamController: null,
      mdi: null,
      sys_guid_count: 0
    };
  },
  computed: {
    // 应用头像三态：取 app 行的 avatar（回退 icon 字段，口径同广场卡 AgentCard）——
    // 空 / 无值即 kind 'disc'，模板渲染「AI」两字母圆章（用户确认的默认头像）
    avatarState () {
      const a = this.app || {};
      return resolveAvatar(a.avatar || a.icon);
    },
    // 图片态内联背景：getBackgroundImage(id, true) + 纸色垫底 + cover 铺满；
    // icon / disc 态返回 null，样式走各自既有圆章规则
    avatarStyle () {
      return this.avatarState.kind === 'image'
        ? avatarBgStyle(this.commonsJs, this.avatarState.value)
        : null;
    }
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
    const id = this.appId;
    if (!id) {
      Message.error('缺少应用 id');
      this.$emit('load-error');
      return;
    }
    this.loading = true;
    try {
      this.app = await agentAppGet(id);
      this.renderWelcome();
      this.ensureKatexCss();
      this.$emit('loaded', this.app);
    } catch (e) {
      Message.error('加载应用失败');
      this.$emit('load-error');
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
      // 新开对话显示欢迎词（welcome 打标：欢迎词非正式回答，不挂免责声明）
      if (this.app.welcomeText && this.app.welcomeText.trim() && !this.messages.length) {
        this.messages.push({ role: 'assistant', content: this.app.welcomeText, welcome: true, reasoning: '', reasoningExpanded: true, notice: '', streaming: false, error: false });
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
      // 返回逻辑交由外部壳处理，核心组件不依赖路由
      this.$emit('back');
    },
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
      const token = localStorage.getItem('token_' + Setting.xmid);
      const controller = new AbortController();
      this.streamController = controller;
      const streaming = this.app.streaming;
      const showReasoning = this.app.showReasoning;
      let url = `${Setting.apiBaseURL}/ai/workflow/${this.app.workflowId}/execute/stream?testRun=false&streaming=${streaming ? 'true' : 'false'}&showReasoning=${showReasoning ? 'true' : 'false'}&input=${encodeURIComponent(question)}`;
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
  overflow: hidden; /* 图片态（内联背景 cover）裁圆 */
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
  overflow: hidden; /* 图片态（内联背景 cover）裁圆 */
  &.user { background: #19be6b; }
}
/* 智能体头像（三态由模板渲染）：icon 态 fa 图标随 40 圆放大一档；disc / 空值回退「AI」两字母
   （字体字重字距沿用原门户 ::after 口径；token 带兜底值，脱离门户壳挂载也不失字体） */
.avatar.assistant i { font-size: var(--text-lg, 18px); line-height: 1; }
.av-disc {
  font-family: var(--font-display, "Noto Serif SC", "Songti SC", Georgia, serif);
  font-weight: 700;
  font-size: var(--text-sm, 14px);
  line-height: 1;
  letter-spacing: .06em;
  text-indent: .06em;
}
.msg-main { max-width: 80%; display: flex; flex-direction: column; .user & { align-items: flex-end; } }
.msg-bubble {
  padding: 10px 14px; border-radius: 8px; font-size: 14px; line-height: 1.7; word-break: break-word;
  background: #fff; border: 1px solid #ebeef5;
  &.error { border-color: #ffd6d6; background: #fff5f5; }
}
/* 用户气泡基线：浅红底 + 红细边（门户页 :deep 会再覆盖为同调 v3 token 视觉） */
.user .msg-bubble { background: var(--c-red-100); border-color: var(--c-red-600); color: var(--c-red-700); }
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

/* 免责声明：每条有正文的 AI 回答底部，虚线发丝分割 + 弱化字（v3 token） */
.ai-disclaimer {
  margin-top: var(--s2);
  padding-top: var(--s2);
  border-top: 1px dashed rgba(153, 42, 24, .25);
  font-size: var(--text-xs);
  color: var(--c-muted);
}

.input-area { flex-shrink: 0; position: relative; display: flex; gap: 10px; align-items: flex-end; }

/* 停止悬浮钮：生成中浮于消息区底缘（完整 v3 视觉由门户页 :deep 覆盖） */
.stop-float {
  position: relative; z-index: 2; display: flex; justify-content: center;
  margin-top: -24px; pointer-events: none;
}
.stop-float-btn {
  pointer-events: auto; display: inline-flex; align-items: center; gap: var(--s2);
  height: 36px; padding: 0 var(--s4); border: 1px solid var(--c-red-600);
  border-radius: var(--r-full); background: var(--c-white); color: var(--c-red-600);
  font-family: var(--font-body); font-size: var(--text-sm); cursor: pointer;
}

/* 发送：输入框右下角 32px 圆形图标钮（absolute 锚在 .input-area 右下角内侧；门户页 :deep 再覆盖 offset/hover/disabled） */
.send-round {
  position: absolute; right: var(--s2); bottom: var(--s2); width: 32px; height: 32px;
  display: grid; place-items: center; padding: 0; border: 0; border-radius: var(--r-full);
  background: var(--c-red-600); color: var(--c-white); font-size: var(--text-base);
  cursor: pointer;
}

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
