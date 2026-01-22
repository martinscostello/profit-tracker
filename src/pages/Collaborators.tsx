import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Layout } from '../components/layout/Layout';
import { EditCollaboratorModal } from '../components/ui/EditCollaboratorModal';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, UserPlus, Shield, User } from 'lucide-react';
import { InviteModal } from '../components/ui/InviteModal';

import { usePermissions } from '../hooks/usePermissions';

export function Collaborators() {
    const navigate = useNavigate();
    const { business } = useData();
    const { currentUser } = useAuth();
    const { can } = usePermissions();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [selectedCollaborator, setSelectedCollaborator] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // For managing collaborators, we look at permissions

    const collaborators = business.collaborators || [];

    const handleCollaboratorClick = (member: any) => {
        // Permission Check:
        if (!can('canManageCollaborators')) return;

        // Logic:
        // 1. Cannot edit Owner
        if (member.role === 'OWNER') return;

        // 2. Cannot edit self (handled elsewhere or by omission)
        if (member.userId === currentUser?.id) return;

        // 3. Manager/Partner Access check 
        // If I am not the owner, I can't edit someone with my own level of access usually,
        // but user specifically said: "if a manager has the permission to 'edit collaborator' 
        // that manager can edit the role and access of other managers except the owner"

        setSelectedCollaborator(member);
        setIsEditOpen(true);
    };

    const handleUpdateComplete = async () => {
        // Trigger a sync to pull fresh data
        // For now, assume syncDataNow pulls updates or we rely on the upcoming Live Mode
        // Do nothing manually; onSnapshot will pick up the changes from Firestore automatically.
        // await syncDataNow(); // Removed to prevent race conditions with real-time listener
    };

    return (
        <Layout disablePadding>
            <div style={{
                padding: 0, // Reset padding for full height control
                height: '100vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden', // Prevent body scroll
                paddingTop: 'calc(env(safe-area-inset-top))' // Keep safe area
            }}>
                {/* Fixed Header */}
                <div style={{
                    padding: '1.5rem',
                    paddingBottom: '1rem',
                    backgroundColor: 'var(--color-bg)', // Opaque background
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button
                                onClick={() => navigate(-1)}
                                style={{ background: 'none', border: 'none', padding: 0, marginRight: '1rem', color: 'var(--color-text)' }}
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Company Managers</h1>
                        </div>
                        {can('canManageCollaborators') && (
                            <button
                                onClick={() => setIsInviteOpen(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    backgroundColor: 'var(--color-primary)', color: 'white',
                                    border: 'none', padding: '0.5rem 1rem', borderRadius: '2rem',
                                    fontWeight: '600', fontSize: '0.875rem'
                                }}
                            >
                                <UserPlus size={16} />
                                Invite
                            </button>
                        )}
                    </div>
                </div>

                {/* Scrollable List */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0 1.5rem 6rem 1.5rem', // Content padding + Bottom nav space
                }}>
                    {collaborators.length === 0 ? (
                        <div style={{
                            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem'
                        }}>
                            <div style={{
                                width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: '#f1f5f9',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
                            }}>
                                <UserPlus size={32} color="#94a3b8" />
                            </div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-text)' }}>No Managers Yet</h3>
                            <p style={{ fontSize: '0.875rem' }}>Invite active partners to help manage sales and inventory.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {collaborators.map((member) => (
                                <div
                                    key={member.userId}
                                    onClick={() => handleCollaboratorClick(member)}
                                    style={{
                                        padding: '1rem',
                                        backgroundColor: 'var(--color-surface)',
                                        borderRadius: '1rem',
                                        border: '1px solid var(--color-border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        cursor: can('canManageCollaborators') && member.role !== 'OWNER' && member.userId !== currentUser?.id ? 'pointer' : 'default'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '3rem', height: '3rem', borderRadius: '50%',
                                            backgroundColor: member.role === 'OWNER' ? '#f3e8ff' : '#eff6ff',
                                            color: member.role === 'OWNER' ? '#9333ea' : '#3b82f6',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 'bold', fontSize: '1.25rem'
                                        }}>
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{member.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                {member.role === 'OWNER' ? <Shield size={12} /> : <User size={12} />}
                                                {member.role}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '0.75rem', fontWeight: '600',
                                        padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                        backgroundColor: member.status === 'ACTIVE' ? '#dcfce7' : '#fff7ed',
                                        color: member.status === 'ACTIVE' ? '#166534' : '#c2410c'
                                    }}>
                                        {member.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <InviteModal
                    isOpen={isInviteOpen}
                    onClose={() => setIsInviteOpen(false)}
                />

                <EditCollaboratorModal
                    businessId={business.id}
                    collaborator={selectedCollaborator}
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onUpdate={handleUpdateComplete}
                />
            </div>
        </Layout>
    );
}
