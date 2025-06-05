import React, { useEffect } from 'react';
import { Modal, Form, DatePicker, Select, InputNumber } from 'antd';
import moment from 'moment';
import type { AccountEntryDto, CategoryDto, CreateAccountEntryRequest } from '../../api/types';

const { Option, OptGroup } = Select;

interface EntryModalProps {
    visible: boolean;
    entry?: AccountEntryDto;
    expenses: CategoryDto[];
    incomes: CategoryDto[];
    onCancel: () => void;
    onSave: (payload: CreateAccountEntryRequest) => Promise<void>;
}

interface FormValues {
    date: moment.Moment;
    categoryId?: string;
    sum: number;
}

const EntryModal: React.FC<EntryModalProps> = ({
                                                   visible,
                                                   entry,
                                                   expenses,
                                                   incomes,
                                                   onCancel,
                                                   onSave,
                                               }) => {
    const [form] = Form.useForm<FormValues>();

    useEffect(() => {
        if (entry) {
            form.setFieldsValue({
                date: moment(entry.dateUtc, moment.ISO_8601),
                categoryId: entry.categoryId,
                sum: entry.sum,
            });
        } else {
            form.resetFields();
        }
    }, [entry, form]);

    const handleOk = () => {
        form
            .validateFields()
            .then(async (vals) => {
                const isExpense = expenses.some((c) => c.id === vals.categoryId);
                let rawSum = vals.sum;
                if (isExpense && rawSum > 0) rawSum = -rawSum;
                const isIncome = incomes.some((c) => c.id === vals.categoryId);
                if (isIncome && rawSum < 0) rawSum = -rawSum;

                const payload: CreateAccountEntryRequest = {
                    sum: rawSum,
                    date: vals.date.format('YYYY-MM-DD'),
                    categoryId: vals.categoryId,
                };
                await onSave(payload);
                form.resetFields();
            })
            .catch(() => {});
    };

    return (
        <Modal
            title={entry ? 'Редактировать запись' : 'Добавить запись'}
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            okText="Сохранить"
            cancelText="Отмена"
            destroyOnHidden={true}
        >
            <Form<FormValues> form={form} layout="vertical" preserve={false}>
                <Form.Item
                    name="date"
                    label="Дата"
                    rules={[{ required: true, message: 'Укажите дату' }]}
                >
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item name="categoryId" label="Категория">
                    <Select allowClear placeholder="Выберите категорию">
                        <OptGroup label="Расходы">
                            {expenses.map((c) => (
                                <Option key={c.id} value={c.id}>
                                    {c.name}
                                </Option>
                            ))}
                        </OptGroup>
                        <OptGroup label="Доходы">
                            {incomes.map((c) => (
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
                        formatter={(val) =>
                            `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
                        }
                        parser={(val) => Number(val?.replace(/\s/g, ''))}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EntryModal;