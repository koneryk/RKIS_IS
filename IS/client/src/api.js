import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    timeout: 30000
});

api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        console.log('🔍 Токен из localStorage:', token ? token.substring(0, 20) + '...' : 'НЕТ ТОКЕНА');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Заголовок Authorization установлен');
        } else {
            console.log('Токен отсутствует!');
        }

        console.log('Запрос:', config.method.toUpperCase(), config.url);
        console.log('Заголовки:', config.headers);

        return config;
    },
    error => Promise.reject(error)
);

api.interceptors.response.use(
    response => {
        console.log('📥 Ответ:', response.status, response.data);
        return response;
    },
    error => {
        console.error('шибка:', error.message);
        if (error.response) {
            console.log('Статус:', error.response.status);
            console.log('Данные:', error.response.data);
        }
        return Promise.reject(error);
    }
);

export default api;