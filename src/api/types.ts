export interface AuthRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface RefreshResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export type PeriodType = 'Daily' | 'Monthly' | 'Yearly';

export type CategoryType = 'Expense' | 'Income';

export interface AccountDto {
    id: string;
    basisSum: number;
}

export interface AccountEntryDto {
    id: string;
    dateUtc: string;
    sum: number;
    categoryId?: string;
    accountId: string;
}

export interface CategoryDto {
    id: string;
    name: string;
    type: CategoryType;
    userId: string;
}

export interface MoneyFlowDto {
    id: string;
    accountId: string;
    categoryId?: string;
    startingDateUtc: string;
    periodDays: number;
    sum: number;
}

export interface CreateAccountEntryRequest {
    sum: number;
    date: string;
    categoryId?: string;
}

export interface CreateCategoryRequest {
    name: string;
    type: number
}

