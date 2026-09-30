/**
 * 多对话
 * */
import Setting from '@/setting';

import {
    cloneDeep
} from 'lodash';
import {
    Message
} from 'view-ui-plus';
const savedchatList = 'chatList';
export default {
    namespaced: true,
    state: {
        chatList: []
    },
    actions: {
        /**
         * @description 获取当前对话
         * */
        async getChatList ({ state, dispatch }, id) {
            if (!id) return;
            let chatList = [];
            // 持久化
            chatList = await dispatch('admin/db/get', {
                sjkName: 'sys',
                path: 'user.chatList.' + id,
                defaultValue: [],
                user: true
            }, {
                root: true
            });
            state.chatList = chatList;
        },
        /**
         * @description 添加对话
         * */
        async addChat ({ state, dispatch }, { id, chat = {} }) {
            if (!id) return;
            // store 赋值
            state.chatList.push(chat);
            // 持久化
            await dispatch('admin/db/set', {
                sjkName: 'sys',
                path: 'user.chatList.' + id,
                value: state.chatList,
                user: true
            }, {
                root: true
            });
        },
        /**
         * @description 更新当前对话
         * */
        async updateChat ({ state, dispatch }, { id, index, chat = {} }) {
            if (!id) return;

            const chatList = cloneDeep(state.chatList)
            let item = chatList[index];
            // item = Object.assign(item, chat);
            item = {
                ...item,
                ...chat
            }
            chatList[index] = item;
            // 持久化
            await dispatch('admin/db/set', {
                sjkName: 'sys',
                path: 'user.chatList.' + id,
                value: chatList,
                user: true
            }, {
                root: true
            });
            state.chatList = chatList;
        },
        /**
         * @description 清空当前对话
         * */
        async clearChatList ({ state, dispatch }, id) {
            if (!id) return;
            // 持久化
            await dispatch('admin/db/set', {
                sjkName: 'sys',
                path: 'user.chatList.' + id,
                value: [],
                user: true
            }, {
                root: true
            });
            // 清空当前对话
            state.chatList = [];
        }
    }
};
