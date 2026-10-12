import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Book, Award, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProfileInfoCard = ({ title, items, icon: Icon, className, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ scale: 1.02 }}
            className="h-full"
        >
            <Card className={`h-full border-none shadow-md hover:shadow-xl transition-shadow duration-300 ${className}`}>
                <CardHeader className="pb-3 border-b border-gray-50 mb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        {Icon && <Icon className="h-5 w-5 text-indigo-500" />}
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {items.map((item, index) => (
                        <div key={index}>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                {item.icon && <item.icon className="h-4 w-4 text-gray-400" />}
                                {item.label}
                            </h4>

                            {item.type === 'badge-list' ? (
                                <div className="flex flex-wrap gap-2">
                                    {item.value && item.value.length > 0 ? (
                                        item.value.map((badge, idx) => (
                                            <Badge key={idx} variant="secondary" className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100">
                                                {badge}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 text-sm italic">Belum ada data</span>
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-100">
                                    {item.value || <span className="text-gray-400 italic">Belum diset</span>}
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default ProfileInfoCard;
