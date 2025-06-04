import React, { useState } from 'react';
import { Card, Tabs, Form, Input, Button, message } from 'antd';
import { register, login } from '../api/api';
import { type AuthRequest } from '../api/types';
import { useNavigate } from 'react-router-dom';

const { TabPane } = Tabs;

const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

    const [loginForm] = Form.useForm();
    const [registerForm] = Form.useForm();

    const navigate = useNavigate();

    const onFinish = (values: AuthRequest, mode: 'login' | 'register') => {
        setLoading(true);
        const apiCall = mode === 'login' ? login : register;

        apiCall(values)
            .then(() => {
                if (mode === 'login') {
                    navigate('/dashboard');
                    return message.success('Вы успешно вошли в систему');
                } else {
                    setActiveTab('login');
                    registerForm.resetFields();
                    return message.success('Регистрация прошла успешно');
                }
            })
            .catch((err: unknown) => {
                console.error(err);
                if (mode === 'login') {
                    return message.error('Ошибка входа. Проверьте e-mail и пароль.');
                } else {
                    return message.error('Ошибка регистрации. Попробуйте снова.');
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const onTabChange = (key: string) => {
        setActiveTab(key as 'login' | 'register');
        if (key === 'login') {
            registerForm.resetFields();
        } else {
            loginForm.resetFields();
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f0f2f5',
            }}
        >
            <Card style={{ width: 360, padding: '24px' }} variant='borderless' hoverable>
                <Tabs activeKey={activeTab} onChange={onTabChange} centered>
                    <TabPane tab="Войти" key="login">
                        <Form
                            form={loginForm}
                            name="loginForm"
                            layout="vertical"
                            onFinish={(values) => onFinish(values as AuthRequest, 'login')}
                        >
                            <Form.Item
                                label="E-mail"
                                name="email"
                                rules={[
                                    { required: true, message: 'Пожалуйста, введите e-mail' },
                                    { type: 'email', message: 'Введите корректный e-mail' },
                                ]}
                            >
                                <Input placeholder="user@example.com" />
                            </Form.Item>

                            <Form.Item
                                label="Пароль"
                                name="password"
                                rules={[{ required: true, message: 'Пожалуйста, введите пароль' }]}
                            >
                                <Input.Password placeholder="Ваш пароль" />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    loading={loading}
                                >
                                    Войти
                                </Button>
                            </Form.Item>
                        </Form>
                    </TabPane>

                    <TabPane tab="Регистрация" key="register">
                        <Form
                            form={registerForm}
                            name="registerForm"
                            layout="vertical"
                            onFinish={(values) => onFinish(values as AuthRequest, 'register')}
                        >
                            <Form.Item
                                label="E-mail"
                                name="email"
                                rules={[
                                    { required: true, message: 'Пожалуйста, введите e-mail' },
                                    { type: 'email', message: 'Введите корректный e-mail' },
                                ]}
                            >
                                <Input placeholder="user@example.com" />
                            </Form.Item>

                            <Form.Item
                                label="Пароль"
                                name="password"
                                rules={[
                                    { required: true, message: 'Пожалуйста, введите пароль' },
                                    {
                                        min: 6,
                                        message: 'Пароль должен быть не менее 6 символов',
                                    },
                                ]}
                            >
                                <Input.Password placeholder="Ваш пароль" />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    loading={loading}
                                >
                                    Зарегистрироваться
                                </Button>
                            </Form.Item>
                        </Form>
                    </TabPane>
                </Tabs>
            </Card>
        </div>
    );
};

export default Auth;
