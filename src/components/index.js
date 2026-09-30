/**
 * 注册全局组件 - Vue 3 插件方式
 */

import iLink from '@/components/link';
import iFrame from '@/components/frame';
import RelationGraph from 'relation-graph/vue3';

import divlayout from '@/components/commonComponent/divlayout.vue';
import vhtml from '@/components/commonComponent/vhtml';
import collection from '@/components/commonComponent/starandCollection/collection.vue';
import incocomponent from '@/components/commonComponent/incocomponent';
import newpage from '@/components/commonComponent/newpage';
import renderpage from '@/components/commonComponent/newpage/renderpage.vue';
import jselect from '@/components/commonComponent/multiSelect/jselect';
import jradio from '@/components/commonComponent/multiSelect/jradio';
import jswitch from '@/components/commonComponent/multiSelect/jswitch';
import jcheckbox from '@/components/commonComponent/multiSelect/jcheckbox';
import formtable from '@/components/commonComponent/table/formtable';
import jform from '@/components/commonComponent/form/jform';
import tableform from '@/components/commonComponent/form/tableform';
import formlist from './commonComponent/form/formlist.vue';
import jtable from '@/components/commonComponent/table/jtable';
import jtab from '@/components/commonComponent/tab/jtab';
import jlist from '@/components/commonComponent/list/jlist.vue';
import codeeditor from '@/components/codemirror';
import tinymceeditor from '@/components/commonComponent/tinymceEditor';
import jtree from '@/components/commonComponent/tree/jtree';
import jmenu from '@/components/commonComponent/menu/jmenu';
import jframe from '@/components/commonComponent/jframe/jframe';

import commonmultiselect from '@/components/commonComponent/commonmultiselect';
import newmultiselect from '@/components/commonComponent/commonmultiselect/newmultiselect.vue';

import excel_exportqd from '@/components/commonComponent/importAndExport/excel_exportqd.vue';
import importqd from '@/components/commonComponent/importAndExport/importqd.vue';
import uploader from 'vue-simple-uploader'
import GlobalUploader from '@/components/commonComponent/upload';
import uploadfile from '@/components/commonComponent/upload/uploadFile';
import uploadimg from '@/components/commonComponent/upload/uploadImg';
import viewfile from '@/components/commonComponent/viewFile/index.vue';
import excel_exportqd_multi from '@/components/commonComponent/importAndExport/excel_exportqd_multi.vue';
import viewureport from '@/components/commonComponent/ureport/viewUreport.vue';
import jechart from '@/components/commonComponent/jechart';
import onlyoffice from '@/components/commonComponent/onlyOffice';
import menutree from '@/components/commonComponent/menutree';
import jswiper from '@/components/commonComponent/swiper';
import jvideo from '@/components/commonComponent/video/jvideo';
import vuefile from '@/components/commonComponent/vuefile/index.vue';
import mindmap from '@/components/commonComponent/mindMap/index.vue';
import jwatermark from '@/components/commonComponent/watermark';
import draggable from 'vuedraggable';
import jmavonEditor from '@/components/commonComponent/markdown/jmavonEditor.vue';
import jjsmind from '@/components/commonComponent/jsmind/index.vue';
import apiChat from '@/components/aichat/apiChat';
import commonszzj from '@/components/commonComponent/commonszzj.vue';
import commonsrow from '@/components/commonComponent/commonsrow.vue';
import get_element_style from './commonComponent/get_element_style.vue';
import janchor from '@/components/commonComponent/jAnchor/index.vue';
import timecountdown from '@/components/commonComponent/timer/timecountdown.vue';
import jvueflow from '@/components/commonComponent/jvueflow/index.vue';
// 导入样式文件
import 'view-ui-plus/dist/styles/viewuiplus.css';
import 'vue-simple-uploader/dist/style.css'
import jx6flow from '@/components/commonComponent/jx6flow/index.vue';
export default {
    install (app) {
        // 填充样式
        app.component('i-link', iLink);
        app.component('i-frame', iFrame);
        app.component('RelationGraph', RelationGraph);

        // 通用组件
        app.component('divlayout', divlayout);
        app.component('collection', collection);
        app.component('incocomponent', incocomponent);
        app.component('newpage', newpage);
        app.component('renderpage', renderpage);
        app.component('vhtml', vhtml);
        app.component('jselect', jselect);
        app.component('jswitch', jswitch);
        app.component('jradio', jradio);
        app.component('jcheckbox', jcheckbox);
        app.component('formtable', formtable);
        app.component('jform', jform);
        app.component('tableform', tableform);
        app.component('formlist', formlist);
        app.component('jtable', jtable);
        app.component('jtab', jtab);
        app.component('jlist', jlist);
        app.component('jmenu', jmenu);
        app.component('codeeditor', codeeditor);
        app.component('tinymceeditor', tinymceeditor);
        app.component('jtree', jtree);
        app.component('jframe', jframe);
        app.component('commonmultiselect', commonmultiselect);
        app.component('newmultiselect', newmultiselect);
        app.component('excel_exportqd', excel_exportqd);
        app.component('importqd', importqd);
        app.component('uploader', uploader);
        app.component('GlobalUploader', GlobalUploader);
        app.component('uploadfile', uploadfile);
        app.component('uploadimg', uploadimg);
        app.component('viewfile', viewfile);
        app.component('excel_exportqd_multi', excel_exportqd_multi);
        app.component('viewureport', viewureport);
        app.component('jechart', jechart);
        app.component('onlyoffice', onlyoffice);
        app.component('menutree', menutree);
        app.component('jswiper', jswiper);
        app.component('jvideo', jvideo);
        app.component('vuefile', vuefile);
        app.component('mindmap', mindmap);
        app.component('jwatermark', jwatermark);
        app.component('draggable', draggable);
        app.component('jmavonEditor', jmavonEditor);
        app.component('jjsmind', jjsmind);
        app.component('apiChat', apiChat);
        app.component('commonszzj', commonszzj);
        app.component('commonsrow', commonsrow);
        app.component('get_element_style', get_element_style);
        app.component('janchor', janchor);
        app.component('timecountdown', timecountdown);
        app.component('jvueflow', jvueflow);
        app.component('jx6flow', jx6flow);
    }
}
