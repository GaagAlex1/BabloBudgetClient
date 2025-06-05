import React, { useState } from 'react';
import { Card, Statistic, Space, Button, Modal, Form, InputNumber } from 'antd';

interface AccountSectionProps {
    basisSum: number | null;
    loading: boolean;
    onSave: (newSum: number) => Promise<void>;
}

export const AccountSection: React.FC<AccountSectionProps> = ({ basisSum, loading, onSave }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm<{ basisSum: number }>();

    const openModal = () => {
        form.setFieldsValue({ basisSum: basisSum ?? 0 });
        setModalVisible(true);
    };

    const handleSave = () => {
        form
            .validateFields()
            .then(async (vals) => {
                await onSave(vals.basisSum);
                setModalVisible(false);
            })
            .catch(() => {});
    };

    return (
        <>
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
                        <Button type="primary" onClick={openModal}>
                            {basisSum === null ? 'Создать счёт' : 'Редактировать счёт'}
                        </Button>
                    </Space>
                </Card>
            </div>

            <Modal
                title={basisSum === null ? 'Создать счёт' : 'Редактировать счёт'}
                open={modalVisible}
                onOk={handleSave}
                onCancel={() => setModalVisible(false)}
                okText="Сохранить"
                cancelText="Отмена"
                confirmLoading={loading}
                destroyOnHidden={true}
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
                            formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                            parser={(val) => Number(val?.replace(/\s/g, ''))}
                            placeholder="Введите начальную сумму"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};