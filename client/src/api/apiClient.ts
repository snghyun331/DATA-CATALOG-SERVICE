// apiClient.ts
import axios, { AxiosError, type AxiosInstance, type AxiosResponse } from 'axios';

const getBaseURL = () => {
  return 'http://localhost:5001/api/v1'; // 백엔드 서버 주소
};

const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error: AxiosError) => {
    console.error('API Error:', error); // 에러 로깅 추가
    return Promise.reject(error);
  },
);

export default apiClient;
