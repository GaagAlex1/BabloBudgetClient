import React, { useEffect } from 'react';
import { Modal, Form, DatePicker, Select, InputNumber } from 'antd';
import moment from 'moment';
import type { MoneyFlowDto, CategoryDto } from '../../api/types';

const { Option, OptGroup } = Select;

interface FlowModalProps {
    visible: boolean;
    flow?: MoneyFlowDto;
    expenses: CategoryDto[];
    incomes: CategoryDto[];
    onCancel: () => void;
    onSave: (payload: {
        sum: number;
        startingDate: string;
        period: 'Daily' | 'Monthly' | 'Yearly';
        categoryId?: string;
    }) => Promise<void>;
}

interface FormValues {
    startingDate: moment.Moment;
    period: 'Daily' | 'Monthly' | 'Yearly';
    categoryId?: string;
    sum: number;
}

const FlowModal: React.FC<FlowModalProps> = ({
                                                 visible,
                                                 flow,
                                                 expenses,
                                                 incomes,
                                                 onCancel,
                                                 onSave,
                                             }) => {
    const [form] = Form.useForm<FormValues>();

    useEffect(() => {
        if (flow) {
            form.setFieldsValue({
                startingDate: moment(flow.startingDateUtc, moment.ISO_8601),
                period:
                    flow.periodDays === 1
                        ? 'Daily'
                        : flow.periodDays === 30
                            ? 'Monthly'
                            : 'Yearly',
                categoryId: flow.categoryId,
                sum: flow.sum,
            });
        } else {
            form.resetFields();
        }
    }, [flow, form]);

    const handleOk = () => {
        form
            .validateFields()
            .then(async (vals) => {
                const payload = {
                    sum: vals.sum,
                    startingDate: vals.startingDate.format('YYYY-MM-DD'),
                    period: vals.period,
                    categoryId: vals.categoryId,
                };
                await onSave(payload);
                form.resetFields();
            })
            .catch(() => {});
    };

    return (
        <Modal
            title={flow ? 'Редактировать платёж' : 'Добавить платёж'}
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            okText="Сохранить"
            cancelText="Отмена"
            destroyOnHidden={true}
        >
            <Form<FormValues> form={form} layout="vertical" preserve={false}>
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
                        placeholder="Например, 1 000.00"
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

export default FlowModal;