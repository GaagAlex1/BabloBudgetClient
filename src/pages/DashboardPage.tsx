import React, { useEffect, useState } from 'react';
import {
    Card,
    Statistic,
    Space,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    DatePicker,
    Select,
    message,
    Spin,
    Typography,
    Table,
    Popconfirm,
} from 'antd';
import moment from 'moment';
import type { ColumnsType } from 'antd/es/table';

import {
    getBasisSum,
    createAccount,
    updateAccount,
    getAccountEntries,
    getAccountEntryById,
    createAccountEntry,
    updateAccountEntry,
    deleteAccountEntry,
    getMoneyFlows,
    getMoneyFlowById,
    createMoneyFlow,
    updateMoneyFlow,
    deleteMoneyFlow,
    getIncomeCategories,
    getExpenseCategories,
    createCategory,
} from '../api/api';

import type {
    AccountEntryDto,
    CreateAccountEntryRequest,
    MoneyFlowDto,
    CategoryDto,
} from '../api/types';

const { Title } = Typography;
const { Option, OptGroup } = Select;

interface EntryFormValues {
    sum: number;
    date: moment.Moment;
    categoryId?: string;
}

interface FlowFormValues {
    sum: number;
    startingDate: moment.Moment;
    period: 'Daily' | 'Monthly' | 'Yearly';
    categoryId?: string;
}

interface CategoryFormValues {
    name: string;
    type: 'Income' | 'Expense';
}

const Dashboard: React.FC = () => {
    const [basisSum, setBasisSum] = useState<number | null>(null);
    const [loadingAccount, setLoadingAccount] = useState<boolean>(true);
    const [accountModalVisible, setAccountModalVisible] = useState<boolean>(false);
    const [accountForm] = Form.useForm<{ basisSum: number }>();

    const [expenseCategories, setExpenseCategories] = useState<CategoryDto[]>([]);
    const [incomeCategories, setIncomeCategories] = useState<CategoryDto[]>([]);
    const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState<boolean>(false);
    const [categoryForm] = Form.useForm<CategoryFormValues>();

    const [entries, setEntries] = useState<AccountEntryDto[]>([]);
    const [loadingEntries, setLoadingEntries] = useState<boolean>(false);
    const [entryModalVisible, setEntryModalVisible] = useState<boolean>(false);
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [entryForm] = Form.useForm<EntryFormValues>();

    const [moneyFlows, setMoneyFlows] = useState<MoneyFlowDto[]>([]);
    const [loadingFlows, setLoadingFlows] = useState<boolean>(false);
    const [flowModalVisible, setFlowModalVisible] = useState<boolean>(false);
    const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
    const [flowForm] = Form.useForm<FlowFormValues>();

    useEffect(() => {
        loadAccount();
        loadCategories();
        loadEntries();
        loadFlows();
    }, []);

    const loadAccount = () => {
        setLoadingAccount(true);
        getBasisSum()
            .then((sum) => {
                setBasisSum(sum);
            })
            .catch((err) => {
                console.error('Не удалось получить basisSum:', err);
                setBasisSum(null);
                void message.error('Не удалось загрузить счёт');
            })
            .finally(() => setLoadingAccount(false));
    };

    const openAccountModal = () => {
        accountForm.setFieldsValue({ basisSum: basisSum ?? 0 });
        setAccountModalVisible(true);
    };

    const handleAccountSave = () => {
        accountForm
            .validateFields()
            .then((values) => {
                const newSum = values.basisSum;
                setLoadingAccount(true);
                const callApi = basisSum === null ? createAccount : updateAccount;
                callApi(newSum)
                    .then(() => {
                        setBasisSum(newSum);
                        setAccountModalVisible(false);
                        void message.success(basisSum === null ? 'Счёт создан' : 'Счёт обновлён');
                    })
                    .catch((err) => {
                        console.error('Ошибка при сохранении счёта:', err);
                        void message.error('Не удалось сохранить счёт');
                    })
                    .finally(() => setLoadingAccount(false));
            })
            .catch(() => {});
    };

    const loadCategories = () => {
        setLoadingCategories(true);
        Promise.all([getExpenseCategories(), getIncomeCategories()])
            .then(([expenses, incomes]) => {
                setExpenseCategories(expenses);
                setIncomeCategories(incomes);
            })
            .catch((err) => {
                console.error('Ошибка при загрузке категорий:', err);
                void message.error('Не удалось загрузить категории');
            })
            .finally(() => setLoadingCategories(false));
    };

    const handleCategorySave = () => {
        categoryForm
            .validateFields()
            .then((values) => {
                setLoadingCategories(true);
                createCategory({
                    name: values.name,
                    type: values.type === 'Expense' ? 0 : 1,
                })
                    .then(() => {
                        void message.success('Категория создана');
                        setCategoryModalVisible(false);
                        categoryForm.resetFields();
                        loadCategories();
                    })
                    .catch((err) => {
                        console.error('Ошибка при создании категории:', err);
                        void message.error('Не удалось создать категорию');
                    })
                    .finally(() => setLoadingCategories(false));
            })
            .catch(() => {});
    };

    const loadEntries = () => {
        setLoadingEntries(true);
        getAccountEntries()
            .then((items) => setEntries(items))
            .catch((err) => {
                console.error('Ошибка при загрузке записей:', err);
                void message.error('Не удалось загрузить записи');
            })
            .finally(() => setLoadingEntries(false));
    };

    const openAddEntryModal = () => {
        setEditingEntryId(null);
        entryForm.resetFields();
        setEntryModalVisible(true);
    };

    const openEditEntryModal = (id: string) => {
        setEditingEntryId(id);
        setEntryModalVisible(true);
        entryForm.resetFields();
        getAccountEntryById(id)
            .then((entry) => {
                entryForm.setFieldsValue({
                    sum: entry.sum,
                    date: moment(entry.dateUtc, moment.ISO_8601),
                    categoryId: entry.categoryId,
                });
            })
            .catch((err) => {
                console.error('Не удалось загрузить запись для редактирования:', err);
                void message.error('Не удалось получить данные записи');
            });
    };

    const handleEntrySave = () => {
        entryForm
            .validateFields()
            .then((values) => {
                const payload: CreateAccountEntryRequest = {
                    sum: values.sum,
                    date: values.date.format('YYYY-MM-DD'),
                    categoryId: values.categoryId,
                };
                setLoadingEntries(true);
                if (editingEntryId) {
                    updateAccountEntry(editingEntryId, payload)
                        .then(() => {
                            void message.success('Запись обновлена');
                            setEntryModalVisible(false);
                            loadEntries();
                        })
                        .catch((err) => {
                            console.error('Ошибка при обновлении записи:', err);
                            void message.error('Не удалось обновить запись');
                        })
                        .finally(() => setLoadingEntries(false));
                } else {
                    createAccountEntry(payload)
                        .then(() => {
                            void message.success('Запись создана');
                            setEntryModalVisible(false);
                            loadEntries();
                        })
                        .catch((err) => {
                            console.error('Ошибка при создании записи:', err);
                            void message.error('Не удалось создать запись');
                        })
                        .finally(() => setLoadingEntries(false));
                }
            })
            .catch(() => {});
    };

    const handleDeleteEntry = (id: string) => {
        setLoadingEntries(true);
        deleteAccountEntry(id)
            .then(() => {
                void message.success('Запись удалена');
                loadEntries();
            })
            .catch((err) => {
                console.error('Ошибка при удалении записи:', err);
                void message.error('Не удалось удалить запись');
            })
            .finally(() => setLoadingEntries(false));
    };

    const loadFlows = () => {
        setLoadingFlows(true);
        getMoneyFlows()
            .then((flows) => setMoneyFlows(flows))
            .catch((err) => {
                console.error('Ошибка при загрузке платежей:', err);
                void message.error('Не удалось загрузить регулярные платежи');
            })
            .finally(() => setLoadingFlows(false));
    };

    const openAddFlowModal = () => {
        setEditingFlowId(null);
        flowForm.resetFields();
        setFlowModalVisible(true);
    };

    const openEditFlowModal = (id: string) => {
        setEditingFlowId(id);
        setFlowModalVisible(true);
        flowForm.resetFields();
        getMoneyFlowById(id)
            .then((flow) => {
                flowForm.setFieldsValue({
                    sum: flow.sum,
                    startingDate: moment(flow.startingDateUtc, moment.ISO_8601),
                    period:
                        flow.periodDays === 1
                            ? 'Daily'
                            : flow.periodDays === 30
                                ? 'Monthly'
                                : 'Yearly',
                    categoryId: flow.categoryId,
                });
            })
            .catch((err) => {
                console.error('Не удалось загрузить платёж для редактирования:', err);
                void message.error('Не удалось получить данные платежа');
            });
    };

    const handleFlowSave = () => {
        flowForm
            .validateFields()
            .then((values) => {
                const payload = {
                    sum: values.sum,
                    startingDate: values.startingDate.format('YYYY-MM-DD'),
                    period: values.period,
                    categoryId: values.categoryId,
                };
                setLoadingFlows(true);
                if (editingFlowId) {
                    updateMoneyFlow(editingFlowId, payload)
                        .then(() => {
                            void message.success('Регулярный платёж обновлён');
                            setFlowModalVisible(false);
                            loadFlows();
                        })
                        .catch((err) => {
                            console.error('Ошибка при обновлении платежа:', err);
                            void message.error('Не удалось обновить платёж');
                        })
                        .finally(() => setLoadingFlows(false));
                } else {
                    createMoneyFlow(payload)
                        .then(() => {
                            void message.success('Регулярный платёж создан');
                            setFlowModalVisible(false);
                            loadFlows();
                        })
                        .catch((err) => {
                            console.error('Ошибка при создании платежа:', err);
                            void message.error('Не удалось создать платёж');
                        })
                        .finally(() => setLoadingFlows(false));
                }
            })
            .catch(() => {});
    };

    const handleDeleteFlow = (id: string) => {
        setLoadingFlows(true);
        deleteMoneyFlow(id)
            .then(() => {
                void message.success('Регулярный платёж удалён');
                loadFlows();
            })
            .catch((err) => {
                console.error('Ошибка при удалении платежа:', err);
                void message.error('Не удалось удалить платёж');
            })
            .finally(() => setLoadingFlows(false));
    };

    const entryColumns: ColumnsType<AccountEntryDto> = [
        {
            title: 'Дата',
            dataIndex: 'dateUtc',
            key: 'dateUtc',
            render: (val: string) => moment(val).format('DD.MM.YYYY'),
            sorter: (a, b) => moment(a.dateUtc).unix() - moment(b.dateUtc).unix(),
        },
        {
            title: 'Сумма (₽)',
            dataIndex: 'sum',
            key: 'sum',
            align: 'right',
            render: (val: number) =>
                val.toLocaleString('ru-RU', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }),
            sorter: (a, b) => a.sum - b.sum,
        },
        {
            title: 'Категория',
            dataIndex: 'categoryId',
            key: 'categoryId',
            render: (val: string) => {
                const cat =
                    expenseCategories.find((c) => c.id === val) ||
                    incomeCategories.find((c) => c.id === val);
                return cat ? cat.name : val;
            },
            filters: [
                ...expenseCategories.map((c) => ({ text: c.name, value: c.id })),
                ...incomeCategories.map((c) => ({ text: c.name, value: c.id })),
            ],
            onFilter: (value, record) => record.categoryId === value,
        },
        {
            title: 'Действия',
            key: 'actions',
            width: 160,
            render: (_text, record) => (
                <Space>
                    <Button type="link" onClick={() => openEditEntryModal(record.id)}>
                        Изменить
                    </Button>
                    <Popconfirm
                        title="Удалить запись?"
                        onConfirm={() => handleDeleteEntry(record.id)}
                        okText="Да"
                        cancelText="Нет"
                    >
                        <Button type="link" danger>
                            Удалить
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const flowColumns: ColumnsType<MoneyFlowDto> = [
        {
            title: 'Дата начала',
            dataIndex: 'startingDateUtc',
            key: 'startingDateUtc',
            render: (val: string) => moment(val).format('DD.MM.YYYY'),
            sorter: (a, b) =>
                moment(a.startingDateUtc).unix() - moment(b.startingDateUtc).unix(),
        },
        {
            title: 'Период',
            dataIndex: 'periodDays',
            key: 'periodDays',
            align: 'center',
            render: (_val, record) => {
                if (record.periodDays === 1) return 'Daily';
                if (record.periodDays === 30) return 'Monthly';
                if (record.periodDays === 365) return 'Yearly';
                return record.periodDays + ' дн.';
            },
            sorter: (a, b) => a.periodDays - b.periodDays,
        },
        {
            title: 'Сумма (₽)',
            dataIndex: 'sum',
            key: 'sum',
            align: 'right',
            render: (val: number) =>
                val.toLocaleString('ru-RU', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }),
            sorter: (a, b) => a.sum - b.sum,
        },
        {
            title: 'Категория',
            dataIndex: 'categoryId',
            key: 'categoryId',
            render: (val: string) => {
                const cat =
                    expenseCategories.find((c) => c.id === val) ||
                    incomeCategories.find((c) => c.id === val);
                return cat ? cat.name : val;
            },
            filters: [
                ...expenseCategories.map((c) => ({ text: c.name, value: c.id })),
                ...incomeCategories.map((c) => ({ text: c.name, value: c.id })),
            ],
            onFilter: (value, record) => record.categoryId === value,
        },
        {
            title: 'Действия',
            key: 'actions',
            width: 160,
            render: (_text, record) => (
                <Space>
                    <Button type="link" onClick={() => openEditFlowModal(record.id)}>
                        Изменить
                    </Button>
                    <Popconfirm
                        title="Удалить платёж?"
                        onConfirm={() => handleDeleteFlow(record.id)}
                        okText="Да"
                        cancelText="Нет"
                    >
                        <Button type="link" danger>
                            Удалить
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Spin
            spinning={loadingAccount || loadingEntries || loadingFlows || loadingCategories}
            tip="Загрузка..."
            style={{ minHeight: '100vh' }}
        >
            <div style={{ padding: 24, background: '#f0f2f5', height: '100vh', boxSizing: 'border-box' }}>
                <Title level={2} style={{ marginBottom: 16 }}>BabloBudget</Title>

                <div style={{ marginBottom: 16 }}>
                    <Button type="dashed" onClick={() => setCategoryModalVisible(true)}>
                        Добавить категорию
                    </Button>
                </div>

                <div style={{ display: 'flex', height: 'calc(100% - 64px)' }}>
                    <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: '0 0 20%', marginBottom: 16 }}>
                            <Card style={{ height: '100%' }}>
                                <Space style={{ width: '100%', justifyContent: 'space-between' }} align="center">
                                    <Statistic
                                        title="Текущий баланс"
                                        value={basisSum ?? 0}
                                        precision={2}
                                        valueStyle={{ color: (basisSum ?? 0) < 0 ? '#cf1322' : '#389e0d' }}
                                        suffix="₽"
                                    />
                                    <Button type="primary" onClick={openAccountModal}>
                                        {basisSum === null ? 'Создать счёт' : 'Редактировать счёт'}
                                    </Button>
                                </Space>
                            </Card>
                        </div>

                        <div style={{ flex: 1 }}>
                            <Card
                                title="Записи (AccountEntry)"
                                extra={
                                    <Button type="primary" onClick={() => openAddEntryModal()}>
                                        Добавить запись
                                    </Button>
                                }
                                style={{ height: '100%' }}
                            >
                                <Table<AccountEntryDto>
                                    dataSource={entries}
                                    columns={entryColumns}
                                    rowKey="id"
                                    loading={loadingEntries}
                                    pagination={{
                                        pageSize: 5,
                                        showSizeChanger: true,
                                        pageSizeOptions: ['5', '10', '20'],
                                        showTotal: (total) => `Всего ${total} записей`,
                                    }}
                                />
                            </Card>
                        </div>
                    </div>

                    <div style={{ width: '50%', paddingLeft: 16, boxSizing: 'border-box' }}>
                        <Card
                            title="Регулярные платежи (MoneyFlow)"
                            extra={
                                <Button type="primary" onClick={() => openAddFlowModal()}>
                                    Добавить платёж
                                </Button>
                            }
                            style={{ height: '100%' }}
                        >
                            <Table<MoneyFlowDto>
                                dataSource={moneyFlows}
                                columns={flowColumns}
                                rowKey="id"
                                loading={loadingFlows}
                                pagination={{
                                    pageSize: 5,
                                    showSizeChanger: true,
                                    pageSizeOptions: ['5', '10', '20'],
                                    showTotal: (total) => `Всего ${total} записей`,
                                }}
                                scroll={{ y: 'calc(100vh * 0.6 - 56px)' }}
                            />
                        </Card>
                    </div>
                </div>

                <Modal
                    title={basisSum === null ? 'Создать счёт' : 'Редактировать счёт'}
                    open={accountModalVisible}
                    onOk={handleAccountSave}
                    onCancel={() => setAccountModalVisible(false)}
                    okText="Сохранить"
                    cancelText="Отмена"
                    destroyOnHidden={true}
                >
                    <Form form={accountForm} layout="vertical">
                        <Form.Item
                            name="basisSum"
                            label="Начальная сумма"
                            rules={[{ required: true, message: 'Введите сумму' }]}
                        >
                            <InputNumber<number>
                                style={{ width: '100%' }}
                                min={0}
                                step={0.01}
                                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                                parser={(val) => Number(val?.replace(/\s/g, ''))}
                                placeholder="Введите начальную сумму"
                            />
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title={editingEntryId ? 'Редактировать запись' : 'Добавить запись'}
                    open={entryModalVisible}
                    onOk={handleEntrySave}
                    onCancel={() => setEntryModalVisible(false)}
                    okText="Сохранить"
                    cancelText="Отмена"
                    destroyOnHidden={true}
                >
                    <Form<EntryFormValues> form={entryForm} layout="vertical" preserve={false}>
                        <Form.Item
                            name="date"
                            label="Дата"
                            rules={[{ required: true, message: 'Укажите дату' }]}
                        >
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item name="categoryId" label="Категория">
                            <Select
                                allowClear
                                placeholder="Выберите категорию"
                                loading={loadingCategories}
                            >
                                <OptGroup label="Расходы">
                                    {expenseCategories.map((c) => (
                                        <Option key={c.id} value={c.id}>
                                            {c.name}
                                        </Option>
                                    ))}
                                </OptGroup>
                                <OptGroup label="Доходы">
                                    {incomeCategories.map((c) => (
                                        <Option key={c.id} value={c.id}>
                                            {c.name}
                                        </Option>
                                    ))}
                                </OptGroup>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="sum"
                            label="Сумма (₽)"
                            rules={[
                                { required: true, message: 'Укажите сумму' },
                                { type: 'number', message: 'Сумма должна быть числом' },
                            ]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                placeholder="Например, 1 500.00"
                                step={0.01}
                                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                                parser={(val) => Number(val?.replace(/\s/g, ''))}
                            />
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title={editingFlowId ? 'Редактировать платёж' : 'Добавить платёж'}
                    open={flowModalVisible}
                    onOk={handleFlowSave}
                    onCancel={() => setFlowModalVisible(false)}
                    okText="Сохранить"
                    cancelText="Отмена"
                    destroyOnHidden={true}
                >
                    <Form<FlowFormValues> form={flowForm} layout="vertical" preserve={false}>
                        <Form.Item
                            name="startingDate"
                            label="Дата начала"
                            rules={[{ required: true, message: 'Укажите дату начала' }]}
                        >
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            name="period"
                            label="Период"
                            rules={[{ required: true, message: 'Выберите период' }]}
                        >
                            <Select placeholder="Выберите период">
                                <Option value="Daily">Daily</Option>
                                <Option value="Monthly">Monthly</Option>
                                <Option value="Yearly">Yearly</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item name="categoryId" label="Категория">
                            <Select
                                allowClear
                                placeholder="Выберите категорию"
                                loading={loadingCategories}
                            >
                                <OptGroup label="Расходы">
                                    {expenseCategories.map((c) => (
                                        <Option key={c.id} value={c.id}>
                                            {c.name}
                                        </Option>
                                    ))}
                                </OptGroup>
                                <OptGroup label="Доходы">
                                    {incomeCategories.map((c) => (
                                        <Option key={c.id} value={c.id}>
                                            {c.name}
                                        </Option>
                                    ))}
                                </OptGroup>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="sum"
                            label="Сумма (₽)"
                            rules={[
                                { required: true, message: 'Укажите сумму' },
                                { type: 'number', message: 'Сумма должна быть числом' },
                            ]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                placeholder="Например, 1 000.00"
                                step={0.01}
                                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                                parser={(val) => Number(val?.replace(/\s/g, ''))}
                            />
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title="Добавить категорию"
                    open={categoryModalVisible}
                    onOk={handleCategorySave}
                    onCancel={() => {
                        setCategoryModalVisible(false);
                        categoryForm.resetFields();
                    }}
                    okText="Создать"
                    cancelText="Отмена"
                    destroyOnHidden={true}
                >
                    <Form<CategoryFormValues> form={categoryForm} layout="vertical" preserve={false}>
                        <Form.Item
                            name="name"
                            label="Название категории"
                            rules={[{ required: true, message: 'Введите название' }]}
                        >
                            <Input placeholder="Например, «Продукты»" />
                        </Form.Item>

                        <Form.Item
                            name="type"
                            label="Тип"
                            rules={[{ required: true, message: 'Выберите тип' }]}
                        >
                            <Select placeholder="Expense или Income">
                                <Option value="Expense">Expense</Option>
                                <Option value="Income">Income</Option>
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </Spin>
    );
};

export default Dashboard;
