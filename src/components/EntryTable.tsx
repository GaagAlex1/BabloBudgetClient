import React, { useState } from 'react';
import { Card, Table, Button, Popconfirm, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { AccountEntryDto, CreateAccountEntryRequest, CategoryDto } from '../api/types';
import { getAccountEntryById, createAccountEntry, updateAccountEntry, deleteAccountEntry, updateAccount } from '../api/api';
import EntryModal from './modal/EntryModal';
import moment from "moment";

interface EntryTableProps {
    basisSum: number,
    setBasisSum: (newBasisSum: number) => void,
    entries: AccountEntryDto[];
    loading: boolean;
    expenses: CategoryDto[];
    incomes: CategoryDto[];
    onReload: () => void;
}

export const EntryTable: React.FC<EntryTableProps> = ({
                                                          basisSum,
                                                          setBasisSum,
                                                          entries,
                                                          loading,
                                                          expenses,
                                                          incomes,
                                                          onReload,
                                                      }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [editingEntry, setEditingEntry] = useState<AccountEntryDto | null>(null);

    const openAdd = () => {
        setEditingEntry(null);
        setModalVisible(true);
    };

    const openEdit = async (id: string) => {
        try {
            const entry = await getAccountEntryById(id);
            setEditingEntry(entry);
            setModalVisible(true);
        } catch (err) {
            console.error(err);
            message.error('Не удалось получить данные записи');
        }
    };

    const handleSave = async (payload: CreateAccountEntryRequest) => {
        try {
            if (editingEntry) {
                await updateAccountEntry(editingEntry.id, payload);
                const newBasisSum = basisSum - editingEntry.sum + payload.sum;
                await updateAccount(newBasisSum);
                message.success('Запись обновлена');
            } else {
                await createAccountEntry(payload);
                const newBasisSum = basisSum + payload.sum;
                await updateAccount(newBasisSum);
                setBasisSum(newBasisSum);
                message.success('Запись создана');
            }
            setModalVisible(false);
            onReload();
        } catch (err) {
            console.error(err);
            message.error(editingEntry ? 'Не удалось обновить запись' : 'Не удалось создать запись');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const entrySum = (await getAccountEntryById(id)).sum;
            const newBasisSum = basisSum - entrySum;
            await deleteAccountEntry(id);
            await updateAccount(newBasisSum);
            setBasisSum(newBasisSum);
            message.success('Запись удалена');
            onReload();
        } catch (err) {
            console.error(err);
            message.error('Не удалось удалить запись');
        }
    };

    const columns: ColumnsType<AccountEntryDto> = [
        {
            title: 'Дата',
            dataIndex: 'dateUtc',
            key: 'dateUtc',
            render: (val) => moment(val).format('DD.MM.YYYY'),
            sorter: (a, b) => moment(a.dateUtc).unix() - moment(b.dateUtc).unix(),
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
                        title="Удалить запись?"
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
                title="Записи (AccountEntry)"
                extra={
                    <Button type="primary" onClick={openAdd}>
                        Добавить запись
                    </Button>
                }
                style={{ height: '100%' }}
            >
                <Table<AccountEntryDto>
                    dataSource={entries}
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

            <EntryModal
                visible={modalVisible}
                entry={editingEntry ?? undefined}
                expenses={expenses}
                incomes={incomes}
                onCancel={() => setModalVisible(false)}
                onSave={handleSave}
            />
        </>
    );
};