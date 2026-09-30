/**
 * 用户信息
 * */
export default {
    namespaced: true,
    state: {
        // 用户信息
        showSpin: false,
        spinList: []
    },
    actions: {
        /**
         * @description 设置用户数据
         * @param {Object} state vuex state
         * @param {Object} dispatch vuex dispatch
         * @param {*} info info
         */
         setSpin ({
            state,
            dispatch
        }, data) {
            return new Promise(async resolve => {
                // store 赋值
                state.showSpin = data.showSpin;
                state.spinList = data.showSpin ? data.spinList : [];

                // end
                resolve();
            })
        },
        /**
         * @description 从数据库取用户数据
         * @param {Object} state vuex state
         * @param {Object} dispatch vuex dispatch
         */
        load ({
            state,
            dispatch
        }) {
            return new Promise(async resolve => {
                // store 赋值
                state.info = await dispatch('admin/db/get', {
                    sjkName: 'sys',
                    path: 'user.info',
                    defaultValue: {},
                    user: true
                }, {
                    root: true
                });
                // end
                resolve();

                // document.cookie = "admin-token=2";
                // document.cookie = "admin-uuid=2";
            })
        }
    }
}
