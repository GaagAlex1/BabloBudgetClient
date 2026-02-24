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

// Analytics enums (sent as numbers to backend)
export type TimeGrouping = 0 | 1;
export const TimeGrouping = {
  Day: 0 as TimeGrouping,
  Month: 1 as TimeGrouping,
};

export type FlowType = 0 | 1;
export const FlowType = {
  Expense: 0 as FlowType,
  Income: 1 as FlowType,
};

// Analytics response types
export interface PeriodSumResult {
    date: string;
    total: number;
}

export interface CategoryPercentageResult {
    categoryName: string;
    percentage: number;
}

