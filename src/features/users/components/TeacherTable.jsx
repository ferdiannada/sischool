import React from 'react';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Edit, Trash2, BookOpen } from 'lucide-react';

const TeacherTable = ({ users, onEdit, onDelete, onToggleStatus, selectedUsers, onSelectUser, onSelectAll }) => {
    const allSelected = users.length > 0 && selectedUsers.size === users.length;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                        checked={allSelected}
                                        onChange={(e) => onSelectAll(e.target.checked)}
                                    />
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Guru</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">NIP</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr
                                key={user.id}
                                className="hover:bg-gray-50 transition-colors group"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                        checked={selectedUsers.has(user.id)}
                                        onChange={() => onSelectUser(user.id)}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <Avatar fallback={user.name?.charAt(0) || '?'} className="h-10 w-10 bg-teal-100 text-teal-700" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 group-hover:text-teal-600 transition-colors">{user.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                    {user.nip || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button onClick={() => onToggleStatus(user.id, user.isActive)}>
                                        <Badge variant={user.isActive ? 'success' : 'secondary'} className="cursor-pointer hover:opacity-80">
                                            {user.isActive ? 'Aktif' : 'Non-Aktif'}
                                        </Badge>
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={() => onEdit(user)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                            onClick={() => onDelete(user)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div className="py-12 text-center text-gray-500">
                        <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-lg font-medium">Tidak ada guru ditemukan</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherTable;
