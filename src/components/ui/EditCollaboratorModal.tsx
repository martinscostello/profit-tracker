import { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import { useDialog } from '../../context/DialogContext';
import { useToast } from '../../context/ToastContext';
import type { Collaborator, Role, Permissions } from '../../types';
import { getDefaultPermissions, PermissionLabels } from '../../utils/permissions';
import { ApiService } from '../../services/ApiService';

interface EditCollaboratorModalProps {
    businessId: string;
    collaborator: Collaborator | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void; // Trigger refresh
}

export function EditCollaboratorModal({ businessId, collaborator, isOpen, onClose, onUpdate }: EditCollaboratorModalProps) {
    const { confirm } = useDialog();
    const { showToast } = useToast();
    const [role, setRole] = useState<Role>('MANAGER');
    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState<Permissions>(getDefaultPermissions('MANAGER'));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (collaborator) {
            setRole(collaborator.role);
            setName(collaborator.name);
            setPermissions(collaborator.permissions || getDefaultPermissions(collaborator.role));
        }
    }, [collaborator]);

    const handleRoleChange = (newRole: string) => {
        const r = newRole as Role;
        setRole(r);
        setPermissions(getDefaultPermissions(r)); // Reset permissions when role changes
    };

    const togglePermission = (key: keyof Permissions) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        if (!collaborator) return;
        setLoading(true);
        try {
            await ApiService.updateCollaborator(businessId, collaborator.userId, {
                name,
                role,
                permissions
            });
            onUpdate();
            onClose();
            showToast("Updated successfully", 'success');
        } catch (error) {
            console.error("Failed to update collaborator:", error);
            showToast("Failed to update.", 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !collaborator) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '1rem',
                width: '100%', maxWidth: '500px',
                maxHeight: '85vh',
                display: 'flex', flexDirection: 'column',
                position: 'relative',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', paddingBottom: '0.5rem', flexShrink: 0 }}>
                    <button
                        onClick={onClose}
                        style={{ position: 'absolute', right: '1rem', top: '1rem', border: 'none', background: 'none' }}
                    >
                        <X size={24} />
                    </button>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '4rem', height: '4rem', borderRadius: '50%',
                            backgroundColor: '#eff6ff', color: 'var(--color-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: '1.5rem', margin: '0 auto 1rem'
                        }}>
                            {collaborator.name.charAt(0).toUpperCase()}
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{collaborator.name}</h2>
                        <p style={{ color: '#64748b' }}>Edit Role & Access</p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                border: '1px solid #e2e8f0', fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Role</label>
                        <select
                            value={role}
                            onChange={(e) => handleRoleChange(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                border: '1px solid #e2e8f0', fontSize: '1rem'
                            }}
                        >
                            <option value="MANAGER">Manager</option>
                            <option value="SUPERVISOR">Supervisor</option>
                            <option value="AUDITOR">Auditor</option>
                            <option value="SALES">Sales Person</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600' }}>Permissions</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {(Object.keys(PermissionLabels) as Array<keyof Permissions>).map((key) => (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid #f1f5f9', borderRadius: '0.5rem' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: key === 'canEditCompanyProfile' ? 'bold' : 'normal', color: key === 'canEditCompanyProfile' ? 'var(--color-primary)' : 'inherit' }}>
                                        {PermissionLabels[key]}
                                    </span>
                                    <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                                        <input
                                            type="checkbox"
                                            checked={permissions[key]}
                                            onChange={() => togglePermission(key)}
                                            style={{ opacity: 0, width: 0, height: 0 }}
                                        />
                                        <span style={{
                                            position: 'absolute', cursor: 'pointer', inset: 0,
                                            backgroundColor: permissions[key] ? 'var(--color-primary)' : '#ccc',
                                            transition: '0.3s', borderRadius: '24px'
                                        }}></span>
                                        <span style={{
                                            position: 'absolute', content: '""', height: '18px', width: '18px',
                                            left: permissions[key] ? '26px' : '4px', bottom: '3px',
                                            backgroundColor: 'white', transition: '0.3s', borderRadius: '50%'
                                        }}></span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #fee2e2' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '1rem' }}>Danger Zone</h4>
                        <button
                            onClick={async () => {
                                if (await confirm({
                                    title: 'Remove Manager',
                                    message: `Are you sure you want to remove ${collaborator.name}? They will lose all access to this business.`,
                                    type: 'danger',
                                    confirmText: 'Remove Manager'
                                })) {
                                    setLoading(true);
                                    try {
                                        await ApiService.removeCollaborator(businessId, collaborator.userId);
                                        onUpdate();
                                        onClose();
                                        showToast('Manager removed', 'success');
                                    } catch (error) {
                                        console.error(error);
                                        showToast('Failed to dismiss manager.', 'error');
                                    } finally {
                                        setLoading(false);
                                    }
                                }
                            }}
                            disabled={loading}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '0.75rem',
                                backgroundColor: '#fef2f2', color: '#ef4444',
                                border: '1px solid #fee2e2', fontWeight: 'bold', fontSize: '1rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}
                        >
                            Remove Manager
                        </button>
                    </div>
                </div>

                <div style={{ padding: '1.5rem', paddingTop: '0', flexShrink: 0 }}>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        style={{
                            width: '100%', padding: '1rem', borderRadius: '0.75rem',
                            backgroundColor: 'var(--color-primary)', color: 'white',
                            border: 'none', fontWeight: 'bold', fontSize: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                    >
                        {loading ? 'Saving...' : <><Shield size={20} /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
