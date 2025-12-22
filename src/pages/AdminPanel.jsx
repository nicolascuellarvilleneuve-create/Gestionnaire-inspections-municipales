import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Trash2, Users, Shield, ShieldAlert, Check } from 'lucide-react';

const AdminPanel = () => {
    const { user, getToken } = useAuth();
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'inspector' });
    const [msg, setMsg] = useState('');

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:3001/api/auth/users', {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (res.ok) setUsers(data);
        } catch {
            console.error("Failed to load users");
        }
    }, [getToken]);

    // Load Users
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchUsers();
    }, [fetchUsers]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(newUser)
            });
            const data = await res.json();
            if (res.ok) {
                setMsg(`Utilisateur ${data.user.username} créé !`);
                setNewUser({ username: '', password: '', role: 'inspector' });
                fetchUsers();
            } else {
                setMsg(`Erreur: ${data.error}`);
            }
        } catch {
            setMsg("Erreur serveur");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Supprimer cet utilisateur ?")) return;
        try {
            await fetch(`http://localhost:3001/api/auth/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            fetchUsers();
        } catch {
            alert("Erreur");
        }
    };

    if (user?.role !== 'admin') {
        return <div className="p-8 text-center text-red-500">Accès Refusé. Admin seulement.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-8 flex items-center">
                <Shield className="mr-3 text-blue-600" /> Administration Urbk
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* CREATE USER FORM */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                    <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center">
                        <UserPlus size={20} className="mr-2" /> Créer un Utilisateur
                    </h2>

                    {msg && <div className="mb-4 text-sm font-medium text-blue-600 bg-blue-50 p-2 rounded">{msg}</div>}

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Identifiant</label>
                            <input
                                type="text"
                                value={newUser.username}
                                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mot de passe</label>
                            <input
                                type="password"
                                value={newUser.password}
                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rôle</label>
                            <select
                                value={newUser.role}
                                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                className="w-full p-2 border rounded-lg bg-slate-50"
                            >
                                <option value="inspector">Inspecteur</option>
                                <option value="admin">Administrateur</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition">
                            Créer Compte
                        </button>
                    </form>
                </div>

                {/* USER LIST */}
                <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-700 flex items-center">
                            <Users size={20} className="mr-2" /> Utilisateurs Actifs
                        </h2>
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            Total: {users.length}
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {users.map(u => (
                            <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                                <div className="flex items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mr-4 ${u.role === 'admin' ? 'bg-purple-500' : 'bg-green-500'}`}>
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">{u.username}</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider flex items-center mt-1">
                                            {u.role === 'admin' ? <ShieldAlert size={12} className="mr-1 text-purple-500" /> : <Check size={12} className="mr-1 text-green-500" />}
                                            {u.role}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-slate-400 hidden sm:block">
                                        Créé le: {new Date(u.created_at).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(u.id)}
                                        className="text-slate-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50"
                                        title="Supprimer l'utilisateur"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {users.length === 0 && (
                            <div className="p-8 text-center text-slate-400 italic">Aucun utilisateur trouvé.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
