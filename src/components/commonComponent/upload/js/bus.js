// Vue 3 事件总线 - 使用简单的发布订阅模式
const Bus = {
    _events: {},

    $on (event, callback) {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push(callback);
        return this;
    },

    $once (event, callback) {
        const onceCallback = (...args) => {
            this.$off(event, onceCallback);
            callback.apply(this, args);
        };
        this.$on(event, onceCallback);
        return this;
    },

    $off (event, callback) {
        if (!this._events[event]) return this;
        if (!callback) {
            delete this._events[event];
        } else {
            this._events[event] = this._events[event].filter(cb => cb !== callback);
        }
        return this;
    },

    $emit (event, ...args) {
        if (this._events[event]) {
            this._events[event].forEach(callback => {
                callback.apply(this, args);
            });
        }
        return this;
    }
};

export default Bus;
