import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import { Badge } from '../../../../components/ui/Badge';
import { Avatar } from '../../../../components/ui/Avatar';
import { Button } from '../../../../components/ui/Button';
import { Edit, Trash2 } from 'lucide-react';

const getRoleBadgeVariant = (role) => {
    const variants = {
        admin: 'role-admin',
        guru: 'role-guru',
        siswa: 'role-siswa',
        wali_kelas: 'info',
        ketua_kelas: 'success',
        wali_murid: 'warning',
        tu: 'secondary',
    };
    return variants[role] || 'secondary';
};

const UserTable = ({
    users,
    selectedUsers = new Set(),
    onSelectUser,
    onSelectAll,
    onEdit,
    onDelete,
    onToggleStatus,
    extraHeaders,
    renderExtraCells,
    showSelection = false
}) => {
    const handleSelectAllChange = (e) => {
        if (onSelectAll) {
            onSelectAll(e.target.checked);
        }
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {showSelection && (
                        <TableHead className="w-12">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                checked={users.length > 0 && selectedUsers.size === users.length}
                                onChange={handleSelectAllChange}
                            />
                        </TableHead>
                    )}
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    {extraHeaders}
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id} className={selectedUsers.has(user.id) ? 'bg-primary-50' : ''}>
                        {showSelection && (
                            <TableCell>
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    checked={selectedUsers.has(user.id)}
                                    onChange={() => onSelectUser(user.id)}
                                />
                            </TableCell>
                        )}
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar fallback={user.name?.charAt(0) || '?'} />
                                <div>
                                    <p className="font-medium text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                    {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-wrap gap-1">
                                {user.roles && user.roles.length > 0 ? (
                                    user.roles.map(role => (
                                        <Badge key={role} variant={getRoleBadgeVariant(role)} className="capitalize">
                                            {role.replace('_', ' ')}
                                        </Badge>
                                    ))
                                ) : (
                                    <Badge variant="outline">No Role</Badge>
                                )}
                            </div>
                        </TableCell>

                        {renderExtraCells && renderExtraCells(user)}

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
                            {new Date(user.createdAt).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onEdit(user)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
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
                        <TableCell colSpan={showSelection ? 7 + (React.Children.count(extraHeaders)) : 6 + (React.Children.count(extraHeaders))} className="h-24 text-center text-gray-500">
                            Tidak ada user ditemukan.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default UserTable;
