import React from 'react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { MoreVertical, Wallet, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 10 } }
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

/**
 * PaymentMethodsChart - Pie chart showing payment method distribution
 */
const PaymentMethodsChart = ({ data, isMounted }) => (
    <motion.div variants={itemVariants}>
        <Card className="h-full p-6 shadow-xl shadow-gray-100/50 border-gray-100 rounded-2xl bg-white overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-blue-500" />
                    Metode Bayar
                </h3>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 relative min-h-[250px] flex items-center justify-center">
                {isMounted && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={90}
                                paddingAngle={4}
                                dataKey="value"
                                cornerRadius={6}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Legend
                                layout="horizontal"
                                verticalAlign="bottom"
                                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                                iconType="circle"
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center text-gray-400">
                        <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>Belum ada data metode pembayaran</p>
                    </div>
                )}

                {data.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                        <div className="text-center">
                            <div className="bg-blue-50 p-2 rounded-full inline-block mb-1">
                                <Wallet className="w-4 h-4 text-blue-500" />
                            </div>
                            <p className="text-xs font-semibold text-gray-500">Metode</p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    </motion.div>
);

export default PaymentMethodsChart;
