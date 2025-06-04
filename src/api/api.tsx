import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import {
    type RefreshResponse,
    type AuthRequest,
    type LoginResponse,
    type AccountEntryDto,
    type CreateAccountEntryRequest, type MoneyFlowDto, type CategoryDto, type CreateCategoryRequest
} from './types.ts'

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

export const createAccountEntry = async (
    data: CreateAccountEntryRequest & { id?: string }
): Promise<AccountEntryDto> => {
    const response: AxiosResponse<AccountEntryDto> = await apiClient.post('/accountentry/create', data);
    return response.data;
};

export const getAccountEntries = async (): Promise<AccountEntryDto[]> => {
    const response: AxiosResponse<AccountEntryDto[]> = await apiClient.get('/accountentry/getall');
    return response.data;
};

export const getAccountEntryById = async (id: string): Promise<AccountEntryDto> => {
    const response: AxiosResponse<AccountEntryDto> = await apiClient.get('/accountentry/getbyid', {
        params: { accountEntryId: id },
    });
    return response.data;
};

export const updateAccountEntry = async (
    id: string,
    data: CreateAccountEntryRequest
): Promise<void> => {
    await apiClient.put('/accountentry/update', data, { params: { accountEntryId: id } });
};

export const deleteAccountEntry = async (id: string): Promise<void> => {
    await apiClient.delete('/accountentry/delete', { params: { accountEntryId: id } });
};

export const createMoneyFlow = async (
    data: Omit<MoneyFlowDto, 'id' | 'accountId' | 'periodDays' | 'startingDateUtc'>
): Promise<MoneyFlowDto> => {
    const response: AxiosResponse<MoneyFlowDto> = await apiClient.post('/moneyflow/create', data);
    return response.data;
};

export const getMoneyFlows = async (): Promise<MoneyFlowDto[]> => {
    const response: AxiosResponse<MoneyFlowDto[]> = await apiClient.get('/moneyflow/getall');
    return response.data;
};

export const getMoneyFlowById = async (id: string): Promise<MoneyFlowDto> => {
    const response: AxiosResponse<MoneyFlowDto> = await apiClient.get('/moneyflow/getbyid', {
        params: { moneyFlowId: id },
    });
    return response.data;
};

export const updateMoneyFlow = async (
    id: string,
    data: Omit<MoneyFlowDto, 'id' | 'accountId' | 'periodDays' | 'startingDateUtc'>
): Promise<void> => {
    await apiClient.put('/moneyflow/update', data, { params: { moneyFlowId: id } });
};

export const deleteMoneyFlow = async (id: string): Promise<void> => {
    await apiClient.delete('/moneyflow/delete', { params: { moneyFlowId: id } });
};

export const createCategory = async (
    data: CreateCategoryRequest
): Promise<CategoryDto> => {
    const response: AxiosResponse<CategoryDto> = await apiClient.post(
        '/category/create',
        data
    );
    return response.data;
};

export const getIncomeCategories = async (): Promise<CategoryDto[]> => {
    const response: AxiosResponse<CategoryDto[]> = await apiClient.get(
        '/category/getincome'
    );
    return response.data;
};

export const getExpenseCategories = async (): Promise<CategoryDto[]> => {
    const response: AxiosResponse<CategoryDto[]> = await apiClient.get(
        '/category/getexpense'
    );
    return response.data;
};

export default apiClient;