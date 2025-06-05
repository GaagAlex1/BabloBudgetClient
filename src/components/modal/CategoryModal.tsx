import React from 'react';
import { Modal, Form, Input, Select } from 'antd';

interface CategoryModalProps {
    visible: boolean;
    loading: boolean;
    onCreate: (data: { name: string; type: number }) => Promise<void>;
    onClose: () => void;
}

interface CategoryFormValues {
    name: string;
    type: 'Income' | 'Expense';
}

const { Option } = Select;

export const CategoryModal: React.FC<CategoryModalProps> = ({
                                                                visible,
                                                                loading,
                                                                onCreate,
                                                                onClose,
                                                            }) => {
    const [form] = Form.useForm<CategoryFormValues>();

    const handleOk = () => {
        form
            .validateFields()
            .then(async (vals) => {
                await onCreate({ name: vals.name, type: vals.type === 'Expense' ? 0 : 1 });
                form.resetFields();
                onClose();
            })
            .catch(() => {});
    };

    return (
        <Modal
            title="Добавить категорию"
            open={visible}
            onOk={handleOk}
            onCancel={() => {
                form.resetFields();
                onClose();
            }}
            okText="Создать"
            cancelText="Отмена"
            confirmLoading={loading}
            destroyOnHidden={true}
        >
            <Form<CategoryFormValues> form={form} layout="vertical" preserve={false}>
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
    );
};