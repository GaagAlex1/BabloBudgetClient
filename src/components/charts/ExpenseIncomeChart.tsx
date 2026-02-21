import React, { useState, useEffect } from 'react';
import { Card, Select, Space, Spin, message, InputNumber } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSumsByPeriod, getExpenseCategories, getIncomeCategories } from '../../api/api';
import { TimeGrouping, FlowType, type PeriodSumResult, type CategoryDto } from '../../api/types';

const { Option } = Select;

export const ExpenseIncomeChart: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<PeriodSumResult[]>([]);
    const [categories, setCategories] = useState<CategoryDto[]>([]);

    // Filters
    const [periodType, setPeriodType] = useState<TimeGrouping>(TimeGrouping.Day);
    const [periodsCount, setPeriodsCount] = useState<number>(30);
    const [flowType, setFlowType] = useState<FlowType>(FlowType.Expense);
    const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

    // Load categories when flowType changes
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const cats = flowType === FlowType.Expense
                    ? await getExpenseCategories()
                    : await getIncomeCategories();
                setCategories(cats);
            } catch (error) {
                message.error('Ошибка загрузки категорий');
                console.error(error);
            }
        };
        loadCategories();
    }, [flowType]);

    // Load chart data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const result = await getSumsByPeriod(periodType, periodsCount, flowType, categoryId);
                setData(result.reverse()); // reverse to show oldest first
            } catch (error) {
                message.error('Ошибка загрузки данных графика');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [periodType, periodsCount, flowType, categoryId]);

    const chartData = data.map(item => ({
        date: item.date,
        total: item.total,
    }));

    return (
        <Card
            title={`График ${flowType === FlowType.Expense ? 'расходов' : 'доходов'}`}
            style={{ marginBottom: 24 }}
        >
            <Space style={{ marginBottom: 16, width: '100%', flexWrap: 'wrap' }}>
                <span>Период:</span>
                <Select
                    value={periodType}
                    onChange={setPeriodType}
                    style={{ width: 120 }}
                >
                    <Option value={TimeGrouping.Day}>День</Option>
                    <Option value={TimeGrouping.Month}>Месяц</Option>
                </Select>

                <span>Количество периодов:</span>
                <InputNumber
                    min={1}
                    max={365}
                    value={periodsCount}
                    onChange={(val) => setPeriodsCount(val ?? 30)}
                    style={{ width: 100 }}
                />

                <span>Тип:</span>
                <Select
                    value={flowType}
                    onChange={(val) => {
                        setFlowType(val);
                        setCategoryId(undefined); // reset category when changing type
                    }}
                    style={{ width: 120 }}
                >
                    <Option value={FlowType.Expense}>Расходы</Option>
                    <Option value={FlowType.Income}>Доходы</Option>
                </Select>

                <span>Категория:</span>
                <Select
                    value={categoryId}
                    onChange={setCategoryId}
                    style={{ width: 200 }}
                    allowClear
                    placeholder="Все категории"
                >
                    {categories.map(cat => (
                        <Option key={cat.id} value={cat.id}>
                            {cat.name}
                        </Option>
                    ))}
                </Select>
            </Space>

            <Spin spinning={loading}>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke={flowType === FlowType.Expense ? "#cf1322" : "#389e0d"}
                            name={flowType === FlowType.Expense ? "Расходы" : "Доходы"}
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Spin>
        </Card>
    );
};
