import low from 'lowdb';
import LocalStorage from 'lowdb/adapters/LocalStorage';
import Setting from '@/setting';

const adapter = new LocalStorage('admin' + '_' + Setting.xmid);
const db = low(adapter);

db.defaults({
    sys: {},
    defaultdb: {}
}).write();

export default db;
