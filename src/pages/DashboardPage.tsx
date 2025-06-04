// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import {
    Card,
    Statistic,
    Space,
    Button,
    Modal,
    Form,
    InputNumber,
    message,
    Spin,
    Typography,
    Table,
} from 'antd';
import moment from 'moment';
import { getBasisSum, updateAccount, createAccount } from '../api/api';
import type { ColumnsType } from 'antd/es/table';
import type { AccountEntryDto, MoneyFlowDto } from '../api/types';

const { Title } = Typography;

const Dashboard: React.FC = () => {
    const [basisSum, setBasisSum] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [form] = Form.useForm<{ basisSum: number }>();

    const [entries] = useState<AccountEntryDto[]>([
        {
            id: 'entry-1',
            dateUtc: '2025-06-01T00:00:00Z',
            sum: 2500.0,
            categoryId: 'cat-1',
            accountId: 'account-1234',
        },
        {
            id: 'entry-2',
            dateUtc: '2025-06-02T00:00:00Z',
            sum: -150.75,
            categoryId: 'cat-2',
            accountId: 'account-1234',
        },
        {
            id: 'entry-3',
            dateUtc: '2025-06-03T00:00:00Z',
            sum: 500.0,
            categoryId: 'cat-1',
            accountId: 'account-1234',
        },
    ]);

    const [moneyFlows] = useState<MoneyFlowDto[]>([
        {
            id: 'flow-1',
            accountId: 'account-1234',
            categoryId: 'cat-3',
            startingDateUtc: '2025-05-01T00:00:00Z',
            periodDays: 30,
            sum: 1000.0,
        },
        {
            id: 'flow-2',
            accountId: 'account-1234',
            categoryId: 'cat-4',
            startingDateUtc: '2025-06-01T00:00:00Z',
            periodDays: 365,
            sum: 12000.0,
        },
    ]);

    useEffect(() => {
        getBasisSum()
            .then((sum) => {
                setBasisSum(sum);
            })
            .catch((err) => {
                console.error('Не удалось получить basisSum:', err);
                setBasisSum(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const openModal = () => {
        form.setFieldsValue({ basisSum: basisSum ?? 0 });
        setModalVisible(true);
    };
    const handleCancel = () => {
        setModalVisible(false);
    };
    const handleSave = () => {
        form
            .validateFields()
            .then((values) => {
                const newSum = values.basisSum;
                setLoading(true);
                const callApi = basisSum === null ? createAccount : updateAccount;
                callApi(newSum)
                    .then(() => {
                        setBasisSum(newSum);
                        setModalVisible(false);
                        void message.success(
                            basisSum === null ? 'Счёт успешно создан' : 'Счёт успешно обновлён'
                        );
                    })
                    .catch((err) => {
                        void message.error('Не удалось сохранить счёт', err);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            })
            .catch(() => {
                // Валидация не прошла
            });
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
            render: (val: string) => val,
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
            title: 'Период (дн.)',
            dataIndex: 'periodDays',
            key: 'periodDays',
            align: 'center',
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
            render: (val: string) => val,
        },
    ];

    return (
        <Spin spinning={loading} tip="Загрузка..." style={{ minHeight: '100vh' }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh' }}>

                <div style={{ padding: 24 }}>
                    <Title level={2}>BabloBudget</Title>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flex: 1,
                        boxSizing: 'border-box',
                        padding: '0 24px 24px',
                    }}
                >

                    <div
                        style={{
                            width: '30%',
                            display: 'flex',
                            flexDirection: 'column',
                            paddingRight: 12,
                            boxSizing: 'border-box',
                        }}
                    >

                        <div style={{ height: '10%', paddingBottom: 12, boxSizing: 'border-box' }}>
                            <Card style={{ height: '100%' }}>
                                <Space
                                    style={{ width: '100%', justifyContent: 'space-between' }}
                                    align="start"
                                >
                                    <Statistic
                                        title="Текущий баланс"
                                        value={basisSum ?? 0}
                                        precision={2}
                                        valueStyle={{
                                            color: (basisSum ?? 0) < 0 ? '#cf1322' : '#389e0d',
                                        }}
                                        suffix="₽"
                                    />
                                    <Button type="primary" onClick={openModal}>
                                        {basisSum === null ? 'Создать счёт' : 'Редактировать счёт'}
                                    </Button>
                                </Space>
                            </Card>
                        </div>

                        <div style={{ height: '90%', boxSizing: 'border-box' }}>
                            <Card title="Записи" style={{ height: '100%' }}>
                                <Table<AccountEntryDto>
                                    dataSource={entries}
                                    columns={entryColumns}
                                    rowKey="id"
                                    pagination={{ defaultPageSize: 15 }}
                                    scroll={{ y: 'calc(100% - 56px)' }}
                                />
                            </Card>
                        </div>
                    </div>

                    <div style={{ width: '70%', paddingLeft: 12, boxSizing: 'border-box' }}>
                        <Card title="Регулярные платежи" style={{ height: '100%' }}>
                            <Table<MoneyFlowDto>
                                dataSource={moneyFlows}
                                columns={flowColumns}
                                rowKey="id"
                                pagination={{ defaultPageSize: 15 }}
                                scroll={{ y: 'calc(100% - 56px)' }}
                            />
                        </Card>
                    </div>
                </div>

                <Modal
                    title={basisSum === null ? 'Создать счёт' : 'Редактировать счёт'}
                    open={modalVisible}
                    onOk={handleSave}
                    onCancel={handleCancel}
                    okText="Сохранить"
                    cancelText="Отмена"
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="basisSum"
                            label="Начальная сумма"
                            rules={[{ required: true, message: 'Введите сумму' }]}
                        >
                            <InputNumber<number>
                                style={{ width: '100%' }}
                                min={0}
                                step={0.01}
                                formatter={(val) =>
                                    `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
                                }
                                parser={(val) => Number(val?.replace(/\s/g, ''))}
                                placeholder="Введите начальную сумму"
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </Spin>
    );
};

export default Dashboard;
