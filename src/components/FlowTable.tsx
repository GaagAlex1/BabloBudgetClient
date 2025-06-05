import React, { useState } from 'react';
import { Card, Table, Button, Popconfirm, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MoneyFlowDto, CategoryDto } from '../api/types';
import { getMoneyFlowById, createMoneyFlow, updateMoneyFlow, deleteMoneyFlow } from '../api/api';
import FlowModal from './modal/FlowModal';
import moment from "moment";

interface FlowTableProps {
    flows: MoneyFlowDto[];
    loading: boolean;
    expenses: CategoryDto[];
    incomes: CategoryDto[];
    onReload: () => void;
}

export const FlowTable: React.FC<FlowTableProps> = ({
                                                        flows,
                                                        loading,
                                                        expenses,
                                                        incomes,
                                                        onReload,
                                                    }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [editingFlow, setEditingFlow] = useState<MoneyFlowDto | null>(null);

    const openAdd = () => {
        setEditingFlow(null);
        setModalVisible(true);
    };

    const openEdit = async (id: string) => {
        const flow = await getMoneyFlowById(id);
        setEditingFlow(flow);
        setModalVisible(true);
    };

    const handleSave = async (payload: {
        sum: number;
        startingDate: string;
        period: 'Daily' | 'Monthly' | 'Yearly';
        categoryId?: string;
    }) => {
        if (editingFlow) {
            await updateMoneyFlow(editingFlow.id, payload);
            message.success('Регулярный платёж обновлён');
        } else {
            await createMoneyFlow(payload);
            message.success('Регулярный платёж создан');
        }
        setModalVisible(false);
        onReload();
    };

    const handleDelete = async (id: string) => {
        await deleteMoneyFlow(id);
        message.success('Регулярный платёж удалён');
        onReload();
    };

    const columns: ColumnsType<MoneyFlowDto> = [
        {
            title: 'Дата начала',
            dataIndex: 'startingDateUtc',
            key: 'startingDateUtc',
            render: (val) => moment(val).format('DD.MM.YYYY'),
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
            render: (val) =>
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
            render: (val) => {
                const cat = expenses.find((c) => c.id === val) || incomes.find((c) => c.id === val);
                return cat ? cat.name : val;
            },
            filters: [
                ...expenses.map((c) => ({ text: c.name, value: c.id })),
                ...incomes.map((c) => ({ text: c.name, value: c.id })),
            ],
            onFilter: (value, record) => record.categoryId === value,
        },
        {
            title: 'Действия',
            key: 'actions',
            width: 160,
            render: (_text, record) => (
                <Space>
                    <Button type="link" onClick={() => openEdit(record.id)}>
                        Изменить
                    </Button>
                    <Popconfirm
                        title="Удалить платёж?"
                        onConfirm={() => handleDelete(record.id)}
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
        <>
            <Card
                title="Регулярные платежи (MoneyFlow)"
                extra={
                    <Button type="primary" onClick={openAdd}>
                        Добавить платёж
                    </Button>
                }
                style={{ flex: 1, marginTop: 16 }}
            >
                <Table<MoneyFlowDto>
                    dataSource={flows}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        showSizeChanger: true,
                        pageSizeOptions: ['5', '10', '20'],
                        showTotal: (total) => `Всего ${total} записей`,
                    }}
                    scroll={{ y: 'calc(80vh - 56px)' }}
                />
            </Card>

            <FlowModal
                visible={modalVisible}
                flow={editingFlow ?? undefined}
                expenses={expenses}
                incomes={incomes}
                onCancel={() => setModalVisible(false)}
                onSave={handleSave}
            />
        </>
    );
};