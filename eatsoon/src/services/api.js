import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:8000'; // 실제 서버 URL로 변경

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 음식 아이템 관련 API
export const foodItemsAPI = {
  // 음식 아이템 목록 조회
  getAll: () => api.get('/api/food-items'),
  
  // 음식 아이템 생성
  create: (data) => api.post('/api/food-items', data),
  
  // 음식 아이템 수정
  update: (id, data) => api.put(`/api/food-items/${id}`, data),
  
  // 음식 아이템 삭제
  delete: (id) => api.delete(`/api/food-items/${id}`),
};

export default api;