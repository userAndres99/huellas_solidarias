import axios from 'axios';
window.axios = axios;

// enviar cookies 
axios.defaults.withCredentials = true;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

import './echo';