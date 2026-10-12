import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Edit, Trash2 } from 'lucide-react';

const StudentTable = ({
    users,
    onEdit,
    onDelete,
    onToggleStatus,
    selectedUsers,
    onSelectUser,
    onSelectAll
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <Table>
                <TableHeader className="bg-gray-50">
                    <TableRow>
                        <TableHead className="w-12 text-center">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                checked={users.length > 0 && selectedUsers?.size === users.length}
                                onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                            />
                        </TableHead>
                        <TableHead>Siswa</TableHead>
                        <TableHead>Kontak</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Bergabung</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow
                            key={user.id}
                            className={`hover:bg-violet-50/30 transition-colors ${selectedUsers?.has(user.id) ? 'bg-violet-50' : ''}`}
                        >
                            <TableCell className="text-center">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                    checked={selectedUsers?.has(user.id)}
                                    onChange={() => onSelectUser && onSelectUser(user.id)}
                                />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-4">
                                    <Avatar fallback={user.name?.charAt(0) || '?'} className="bg-violet-100 text-violet-600" />
                                    <div>
                                        <p className="font-semibold text-gray-900">{user.name}</p>
                                        <p className="text-xs text-gray-500">CIS: {user.id.substring(0, 8)}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-700">{user.email}</span>
                                    {user.phone && <span className="text-xs text-gray-400">{user.phone}</span>}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={user.isActive ? 'success' : 'secondary'}
                                    className="cursor-pointer"
                                    onClick={() => onToggleStatus && onToggleStatus(user)}
                                >
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-gray-500 text-sm">
                                {new Date(user.createdAt).toLocaleDateString('id-ID', {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                })}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                                        onClick={() => onEdit(user)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => onDelete(user)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {users.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                Tidak ada data siswa yang ditemukan.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default StudentTable;
