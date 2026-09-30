import { createI18n } from 'vue-i18n';
import store from '@/store/index';

import Languages from '@/i18n/locale';

store.dispatch('admin/i18n/getLocale');

const locale = store.state.admin.i18n.locale;

const i18n = createI18n({
    legacy: false, // 使用 Composition API 模式
    locale,
    messages: Languages
});

export default i18n;
