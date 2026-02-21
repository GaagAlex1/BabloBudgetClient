import React, { useState, useEffect } from 'react';
import { Card, Select, Space, Spin, message, InputNumber } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getCategoryPercentages } from '../../api/api';
import { TimeGrouping, FlowType, type CategoryPercentageResult } from '../../api/types';

const { Option } = Select;

// Colors for pie chart segments
const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82CA9D', '#FFC658', '#FF6B9D', '#C23531', '#2F4554',
    '#61A0A8', '#D48265', '#91C7AE', '#749F83', '#CA8622'
];

export const CategoryPieChart: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<CategoryPercentageResult[]>([]);

    // Filters
    const [periodType, setPeriodType] = useState<TimeGrouping>(TimeGrouping.Month);
    const [periodsCount, setPeriodsCount] = useState<number>(1);
    const [flowType, setFlowType] = useState<FlowType>(FlowType.Expense);

    // Load chart data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const result = await getCategoryPercentages(periodType, periodsCount, flowType);
                setData(result);
            } catch (error) {
                message.error('Ошибка загрузки данных диаграммы');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [periodType, periodsCount, flowType]);

    const chartData = data.map(item => ({
        name: item.categoryName,
        value: item.percentage,
    }));

    const renderCustomLabel = (entry: any) => {
        return `${entry.name}: ${entry.value.toFixed(1)}%`;
    };

    return (
        <Card
            title={`Распределение ${flowType === FlowType.Expense ? 'расходов' : 'доходов'} по категориям`}
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
                    onChange={(val) => setPeriodsCount(val ?? 1)}
                    style={{ width: 100 }}
                />

                <span>Тип:</span>
                <Select
                    value={flowType}
                    onChange={setFlowType}
                    style={{ width: 120 }}
                >
                    <Option value={FlowType.Expense}>Расходы</Option>
                    <Option value={FlowType.Income}>Доходы</Option>
                </Select>
            </Space>

            <Spin spinning={loading}>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomLabel}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                        Нет данных для отображения
                    </div>
                )}
            </Spin>
        </Card>
    );
};
