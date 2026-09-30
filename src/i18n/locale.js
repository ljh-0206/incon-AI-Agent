// 导入自有语言包
import zhCN from './locale/zh-CN';
import enUS from './locale/en-US';

// 导入 view-ui-plus 语言包
import zhCNiView from 'view-ui-plus/dist/locale/zh-CN';
import enUSiView from 'view-ui-plus/dist/locale/en-US';

// 导入布局语言包
import layoutLocale from '@/layouts/basic-layout/i18n';

// 合并语言包
export default {
    'zh-CN': Object.assign(zhCN, zhCNiView, layoutLocale['zh-CN']),
    'en-US': Object.assign(enUS, enUSiView, layoutLocale['en-US'])
};
