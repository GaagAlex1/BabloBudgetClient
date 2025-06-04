import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import {type RefreshResponse, type AuthRequest, type LoginResponse} from './types.ts'

const apiClient = axios.create({
    baseURL: 'http://localhost:8018',  // базовый URL вашего API
    headers: {
        'Content-Type': 'application/json',
    }
});

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const saveTokens = (tokens: { accessToken: string; refreshToken: string }): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
};

const getAccessToken = (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
};

const getRefreshToken = (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
};

const clearTokens = (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (!error.response || error.response.status !== 401) {
            return Promise.reject(error);
        }

        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            clearTokens();
            return Promise.reject(error);
        }

        try {
            const refreshResponse = await apiClient
                .post<RefreshResponse>('/refresh', {refreshToken});

            saveTokens({
                accessToken: refreshResponse.data.accessToken,
                refreshToken: refreshResponse.data.refreshToken,
            });

            const originalRequest = error.config!;
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
            return await apiClient.request(originalRequest);
        } catch (refreshError) {
            clearTokens();
            return await Promise.reject(refreshError);
        }
    }
);

export const register = async (data: AuthRequest): Promise<void> => {
    await apiClient.post('/register', data);
};

export const login = async (data: AuthRequest): Promise<void> => {
    const response: AxiosResponse<LoginResponse> = await apiClient.post<LoginResponse>(
        '/login',
        data
    );
    saveTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
    });
};

export const createAccount = async (basisSum: number): Promise<void> => {
    await apiClient.post('/account/create', null, {
        params: { basisSum },
    });
};

export const getBasisSum = async (): Promise<number> => {
    const response: AxiosResponse<number> = await apiClient.get('/account/getbasissum');
    return response.data;
};

export const updateAccount = async (newBasisSum: number): Promise<void> => {
    await apiClient.put('/account/update', null, {
        params: { newBasisSum },
    });
};

export default apiClient;