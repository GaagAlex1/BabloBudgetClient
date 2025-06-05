import React, { useEffect, useState } from 'react';
import { Button, Spin, Typography, message } from 'antd';

import { AccountSection } from '../components/AccountSection';
import { CategoryModal } from '../components/modal/CategoryModal';
import { EntryTable } from '../components/EntryTable';
import { FlowTable } from '../components/FlowTable';

import {
    getBasisSum,
    createAccount,
    updateAccount,
    getAccountEntries,
    getMoneyFlows,
    getIncomeCategories,
    getExpenseCategories,
    createCategory,
} from '../api/api';

import type { AccountEntryDto, MoneyFlowDto, CategoryDto } from '../api/types';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
    const [basisSum, setBasisSum] = useState<number | null>(null);
    const [loadingAccount, setLoadingAccount] = useState<boolean>(true);

    const [expenseCategories, setExpenseCategories] = useState<CategoryDto[]>([]);
    const [incomeCategories, setIncomeCategories] = useState<CategoryDto[]>([]);
    const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState<boolean>(false);

    const [entries, setEntries] = useState<AccountEntryDto[]>([]);
    const [loadingEntries, setLoadingEntries] = useState<boolean>(false);

    const [moneyFlows, setMoneyFlows] = useState<MoneyFlowDto[]>([]);
    const [loadingFlows, setLoadingFlows] = useState<boolean>(false);

    useEffect(() => {
        const bootstrap = () => {
            loadAccount();
            loadCategories();
            loadEntries();
            loadFlows();
        };
        bootstrap();
    }, []);

    const loadAccount = () => {
        setLoadingAccount(true);
        getBasisSum()
            .then((sum) => {
                setBasisSum(sum);
            })
            .catch((err) => {
                console.error('Ошибка загрузки счёта:', err);
                setBasisSum(null);
                void message.error('Не удалось загрузить счёт');
            })
            .finally(() => {
                setLoadingAccount(false);
            });
    };

    const handleAccountSave = async (newSum: number): Promise<void> => {
        setLoadingAccount(true);
        const action = basisSum === null ? createAccount : updateAccount;
        try {
            try {
                await action(newSum);
                setBasisSum(newSum);
                message.success(basisSum === null ? 'Счёт создан' : 'Счёт обновлён');
            } catch (err) {
                console.error('Ошибка при сохранении счёта:', err);
                message.error('Не удалось сохранить счёт');
            }
        } finally {
            setLoadingAccount(false);
        }
    };

    const loadCategories = () => {
        setLoadingCategories(true);
        Promise.all([getExpenseCategories(), getIncomeCategories()])
            .then(([expenses, incomes]) => {
                setExpenseCategories(expenses);
                setIncomeCategories(incomes);
            })
            .catch((err) => {
                console.error('Ошибка загрузки категорий:', err);
                void message.error('Не удалось загрузить категории');
            })
            .finally(() => {
                setLoadingCategories(false);
            });
    };

    const handleCategoryCreate = async (data: { name: string; type: number }): Promise<void> => {
        setLoadingCategories(true);
        createCategory(data)
            .then(() => {
                void message.success('Категория создана');
                loadCategories();
            })
            .catch((err) => {
                console.error('Ошибка при создании категории:', err);
                void message.error('Не удалось создать категорию');
            })
            .finally(() => {
                setLoadingCategories(false);
            });
    };

    const loadEntries = () => {
        setLoadingEntries(true);
        getAccountEntries()
            .then((list) => {
                setEntries(list);
            })
            .catch((err) => {
                console.error('Ошибка загрузки записей:', err);
                void message.error('Не удалось загрузить записи');
            })
            .finally(() => {
                setLoadingEntries(false);
            });
    };

    const loadFlows = () => {
        setLoadingFlows(true);
        getMoneyFlows()
            .then((list) => {
                setMoneyFlows(list);
            })
            .catch((err) => {
                console.error('Ошибка загрузки платежей:', err);
                void message.error('Не удалось загрузить регулярные платежи');
            })
            .finally(() => {
                setLoadingFlows(false);
            });
    };

    return (
        <Spin
            spinning={loadingAccount || loadingCategories || loadingEntries || loadingFlows}
            tip="Загрузка..."
            style={{ minHeight: '100vh' }}
        >
            <div
                style={{
                    padding: 24,
                    background: '#f0f2f5',
                    height: '100vh',
                    boxSizing: 'border-box',
                }}
            >
                <Title level={2} style={{ marginBottom: 16 }}>
                    BabloBudget
                </Title>

                <div style={{ marginBottom: 16 }}>
                    <Button type="dashed" onClick={() => setCategoryModalVisible(true)}>
                        Добавить категорию
                    </Button>
                </div>

                <div style={{ display: 'flex', height: 'calc(100% - 64px)' }}>
                    <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                        <AccountSection
                            basisSum={basisSum}
                            loading={loadingAccount}
                            onSave={handleAccountSave}
                        />

                        <FlowTable
                            flows={moneyFlows}
                            loading={loadingFlows}
                            expenses={expenseCategories}
                            incomes={incomeCategories}
                            onReload={loadFlows}
                        />
                    </div>

                    <div style={{ width: '50%', paddingLeft: 16, boxSizing: 'border-box' }}>
                        <EntryTable
                            entries={entries}
                            loading={loadingEntries}
                            expenses={expenseCategories}
                            incomes={incomeCategories}
                            onReload={loadEntries}
                        />
                    </div>
                </div>

                <CategoryModal
                    visible={categoryModalVisible}
                    loading={loadingCategories}
                    onCreate={handleCategoryCreate}
                    onClose={() => setCategoryModalVisible(false)}
                />
            </div>
        </Spin>
    );
};

export default DashboardPage;
