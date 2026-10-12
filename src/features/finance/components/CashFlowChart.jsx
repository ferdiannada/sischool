import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { BarChart2, MoreVertical } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 10 } }
};

/**
 * CashFlowChart - Bar chart showing monthly income and expenses
 */
const CashFlowChart = ({ data, onViewDetails, isMounted }) => {
    return (
        <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="h-full p-6 shadow-xl shadow-gray-100/50 border-gray-100 rounded-2xl bg-white overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-emerald-600" />
                            Arus Kas Sekolah
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Pemasukan & Pengeluaran 6 bulan terakhir</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={onViewDetails} className="hidden md:flex text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                            Lihat Detail
                        </Button>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 w-full min-h-[300px]">
                    {isMounted && data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={data}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                barGap={8}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickFormatter={(value) => `Rp${value / 1000000}jt`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(236, 253, 245, 0.5)' }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        padding: '12px'
                                    }}
                                    formatter={(value) => new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        maximumFractionDigits: 0
                                    }).format(value)}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    wrapperStyle={{ paddingBottom: '20px' }}
                                />
                                <Bar
                                    name="Pemasukan"
                                    dataKey="pemasukan"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                    barSize={20}
                                />
                                <Bar
                                    name="Pengeluaran"
                                    dataKey="pengeluaran"
                                    fill="#f59e0b"
                                    radius={[4, 4, 0, 0]}
                                    barSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <BarChart2 className="w-16 h-16 opacity-20 mb-4" />
                            <p>Belum ada data arus kas bulan ini</p>
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
};

export default CashFlowChart;
