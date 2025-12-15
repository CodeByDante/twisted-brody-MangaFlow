import { X, Key, Trash2, Save, Settings, Shield, Lock, Unlock, Megaphone, Clock, LogOut, UserPlus, UserMinus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getUserApiKey, saveUserApiKey, deleteUserApiKey } from '../utils/apiKeyManager';
import { saveAnnouncement } from '../services/announcement';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { isUserAdmin, addAdminEmail, removeAdminEmail, getAllowedEmails } from '../services/admin';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isAdmin: boolean;
    onAdminChange: (isAdmin: boolean) => void;
}

// SHA-256 Hash for 'Loyola069012*'


export function SettingsModal({ isOpen, onClose, isAdmin, onAdminChange }: SettingsModalProps) {
    // API Key State
    const [apiKey, setApiKey] = useState('');
    const [hasUserApiKey, setHasUserApiKey] = useState(false);

    // Admin Config State
    const [isLoadingAuth, setIsLoadingAuth] = useState(false);
    const [authError, setAuthError] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [adminEmails, setAdminEmails] = useState<string[]>([]);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

    // Announcement State
    const [announcementText, setAnnouncementText] = useState('');
    const [durationValue, setDurationValue] = useState(24);
    const [durationUnit, setDurationUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>('hours');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            // API Key init
            const userKey = getUserApiKey();
            if (userKey) {
                setApiKey(userKey);
                setHasUserApiKey(true);
            } else {
                setApiKey('');
                setHasUserApiKey(false);
            }

            // Admin init
            setAuthError('');
            setEmailInput('');
            setPasswordInput('');

            // Check current auth status
            const user = auth.currentUser;
            if (user) {
                setCurrentUserEmail(user.email);
                if (isAdmin) {
                    loadAdminEmails();
                }
            } else {
                if (isAdmin) {
                    // If stored state is admin but no firebase user, logout
                    onAdminChange(false);
                }
            }
        }
    }, [isOpen]);

    const loadAdminEmails = async () => {
        const emails = await getAllowedEmails();
        setAdminEmails(emails);
    };

    const handleSaveApiKey = () => {
        if (!apiKey.trim()) {
            alert('Por favor ingresa una API válida');
            return;
        }
        saveUserApiKey(apiKey.trim());
        setHasUserApiKey(true);
        alert('API guardada exitosamente.');
    };

    const handleDeleteApiKey = () => {
        if (window.confirm('¿Eliminar tu API personal?')) {
            deleteUserApiKey();
            setApiKey('');
            setHasUserApiKey(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoadingAuth(true);
        setAuthError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const email = result.user.email;

            if (!email) {
                throw new Error('No se pudo obtener el email.');
            }

            const hasPermission = await isUserAdmin(email);

            if (hasPermission) {
                onAdminChange(true);
                setCurrentUserEmail(email);
                await loadAdminEmails();
            } else {
                await signOut(auth); // Logout immediately if not allowed
                setAuthError('Este correo no tiene permisos de administrador.');
                onAdminChange(false);
            }
        } catch (error: any) {
            console.error('Login error:', error);
            setAuthError(error.message || 'Error al iniciar sesión.');
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const handleEmailLogin = async () => {
        if (!emailInput || !passwordInput) {
            setAuthError('Por favor ingresa correo y contraseña.');
            return;
        }

        setIsLoadingAuth(true);
        setAuthError('');
        try {
            const result = await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
            const email = result.user.email;

            if (!email) {
                throw new Error('No se pudo obtener el email.');
            }

            const hasPermission = await isUserAdmin(email);

            if (hasPermission) {
                onAdminChange(true);
                setCurrentUserEmail(email);
                await loadAdminEmails();
            } else {
                await signOut(auth); // Logout immediately if not allowed
                setAuthError('Este correo no tiene permisos de administrador.');
                onAdminChange(false);
            }
        } catch (error: any) {
            console.error('Login error:', error);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
                setAuthError('Cuenta no encontrada o contraseña incorrecta. Si es tu primera vez, usa "Registrarse".');
            } else {
                setAuthError(error.message || 'Error al iniciar sesión.');
            }
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const handleRegister = async () => {
        if (!emailInput || !passwordInput) {
            setAuthError('Ingresa un correo y contraseña para registrarte.');
            return;
        }

        setIsLoadingAuth(true);
        setAuthError('');
        try {
            // 1. Create User
            const result = await createUserWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
            const email = result.user.email;

            if (!email) throw new Error('Error al obtener email.');

            // 2. Verify if Allowed
            const hasPermission = await isUserAdmin(email);

            if (hasPermission) {
                onAdminChange(true);
                setCurrentUserEmail(email);
                await loadAdminEmails();
                alert('Cuenta creada y verificada exitosamente.');
            } else {
                // If not allowed, delete/logout immediately 
                // (Deleting user requires re-auth usually, so we just sign out for now to block access)
                await signOut(auth);
                setAuthError('Cuenta creada, pero tu correo NO está autorizado como administrador.');
                onAdminChange(false);
            }

        } catch (error: any) {
            console.error('Register error:', error);
            if (error.code === 'auth/email-already-in-use') {
                setAuthError('Este correo ya está registrado. Intenta "Ingresar".');
            } else if (error.code === 'auth/weak-password') {
                setAuthError('La contraseña debe tener al menos 6 caracteres.');
            } else {
                setAuthError(error.message || 'Error al registrar.');
            }
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            onAdminChange(false);
            setCurrentUserEmail(null);
            setAdminEmails([]);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleAddAdmin = async () => {
        if (!newAdminEmail.trim()) return;
        try {
            await addAdminEmail(newAdminEmail.trim());
            setNewAdminEmail('');
            await loadAdminEmails();
            alert('Administrador añadido correctamente.');
        } catch (error: any) {
            alert('Error al añadir: ' + error.message);
        }
    };

    const handleRemoveAdmin = async (email: string) => {
        if (!window.confirm(`¿Seguro que quieres eliminar a ${email}?`)) return;
        try {
            await removeAdminEmail(email);
            await loadAdminEmails();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    const handlePublishAnnouncement = async () => {
        if (!announcementText.trim()) {
            alert('El texto del anuncio no puede estar vacío');
            return;
        }

        let durationMs = 0;
        if (durationUnit === 'seconds') durationMs = durationValue * 1000;
        if (durationUnit === 'minutes') durationMs = durationValue * 60 * 1000;
        if (durationUnit === 'hours') durationMs = durationValue * 60 * 60 * 1000;
        if (durationUnit === 'days') durationMs = durationValue * 24 * 60 * 60 * 1000;

        try {
            await saveAnnouncement(announcementText, durationMs);
            alert('Anuncio publicado exitosamente');
            setAnnouncementText('');
            onClose();
        } catch (err) {
            console.error(err);
            alert('Error al publicar el anuncio');
        }
    };

    const handleDeleteAnnouncement = async () => {
        try {
            await saveAnnouncement('', null);
            setAnnouncementText('');
            setShowDeleteConfirm(false);
        } catch (e) {
            console.error(e);
            alert('Error al eliminar');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-[#121212] rounded-2xl border border-gray-800 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#bb86fc]/10 rounded-lg text-[#bb86fc]">
                            <Settings className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Ajustes</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">

                    {/* Admin Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isAdmin ? 'bg-green-500/10 text-green-500' : 'bg-gray-800 text-gray-400'}`}>
                                    {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="tex-sm font-semibold text-white">Modo Administrador</h3>
                                    <p className="text-xs text-gray-400">
                                        {isAdmin ? `Conectado como ${currentUserEmail}` : 'Requiere acceso autorizado'}
                                    </p>
                                </div>
                            </div>

                            {isAdmin && (
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                                    title="Cerrar Sessión"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {!isAdmin ? (
                            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 animate-in slide-in-from-top-2 duration-200 text-center">
                                <p className="text-sm text-gray-400 mb-4">Inicia sesión con una cuenta autorizada.</p>

                                {/* Email/Password Form */}
                                <div className="space-y-3 mb-4">
                                    <input
                                        type="email"
                                        placeholder="Correo electrónico"
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
                                        className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#bb86fc]"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Contraseña"
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                                        className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#bb86fc]"
                                    />
                                    <button
                                        onClick={handleEmailLogin}
                                        disabled={isLoadingAuth}
                                        className="w-full bg-[#bb86fc] text-white hover:bg-[#9966dd] py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-70"
                                    >
                                        {isLoadingAuth ? 'Verificando...' : 'Ingresar'}
                                    </button>

                                    <button
                                        onClick={handleRegister}
                                        disabled={isLoadingAuth}
                                        className="w-full bg-transparent border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50"
                                    >
                                        ¿Primera vez? Crear cuenta
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 my-4">
                                    <div className="h-px bg-gray-800 flex-1" />
                                    <span className="text-xs text-gray-500">O usa Google</span>
                                    <div className="h-px bg-gray-800 flex-1" />
                                </div>

                                <button
                                    onClick={handleGoogleLogin}
                                    disabled={isLoadingAuth}
                                    className="w-full bg-white text-gray-900 hover:bg-gray-100 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                                >
                                    {isLoadingAuth ? (
                                        <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                    )}
                                    Iniciar con Google
                                </button>
                                {authError && <p className="text-red-500 text-xs mt-3 bg-red-500/10 p-2 rounded border border-red-500/20">{authError}</p>}
                            </div>
                        ) : (
                            // MANAGE ADMINS SECTION (Only visible to admins)
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 space-y-4">
                                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-[#bb86fc]" />
                                    Gestión de Administradores
                                </h4>

                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="nuevo_admin@gmail.com"
                                        value={newAdminEmail}
                                        onChange={(e) => setNewAdminEmail(e.target.value)}
                                        className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#bb86fc]"
                                    />
                                    <button
                                        onClick={handleAddAdmin}
                                        disabled={!newAdminEmail.trim()}
                                        className="bg-[#bb86fc]/20 hover:bg-[#bb86fc]/30 text-[#bb86fc] p-2 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <UserPlus className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                    {adminEmails.map(email => (
                                        <div key={email} className="flex items-center justify-between bg-black/30 p-2 rounded-lg border border-gray-800/50">
                                            <span className="text-xs text-gray-300 truncate">{email}</span>
                                            {/* Don't allow removing yourself or hardcoded owners (though owners are protected in service, UI feedback is nice) */}
                                            <button
                                                onClick={() => handleRemoveAdmin(email)}
                                                className="text-gray-500 hover:text-red-400 p-1 hover:bg-white/5 rounded transition-colors"
                                                title="Eliminar admin"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    {isAdmin && (
                        <>
                            <div className="h-px bg-gray-800" />
                            <section className="space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                        <Megaphone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="tex-sm font-semibold text-white">Publicar Anuncio</h3>
                                        <p className="text-xs text-gray-400">Visible para todos los usuarios</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <textarea
                                        value={announcementText}
                                        onChange={(e) => setAnnouncementText(e.target.value)}
                                        placeholder="Escribe el mensaje del anuncio..."
                                        className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#bb86fc] min-h-[100px] resize-none"
                                    />

                                    <div className="flex gap-3">
                                        <div className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <input
                                                type="number"
                                                min="1"
                                                value={durationValue}
                                                onChange={(e) => setDurationValue(Number(e.target.value))}
                                                className="bg-transparent text-white text-sm w-full focus:outline-none"
                                            />
                                        </div>
                                        <select
                                            value={durationUnit}
                                            onChange={(e) => setDurationUnit(e.target.value as any)}
                                            className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#bb86fc]"
                                        >
                                            <option value="seconds">Segundos</option>
                                            <option value="minutes">Minutos</option>
                                            <option value="hours">Horas</option>
                                            <option value="days">Días</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="px-4 py-2.5 rounded-lg font-semibold text-sm bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                            title="Eliminar anuncio"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handlePublishAnnouncement}
                                            className="flex-1 bg-gradient-to-r from-[#bb86fc] to-[#9966dd] hover:from-[#9966dd] hover:to-[#7744cc] text-white py-2.5 rounded-lg font-semibold text-sm transition-all shadow-lg shadow-[#bb86fc]/20"
                                        >
                                            Publicar Anuncio
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}

                    <div className="h-px bg-gray-800" />

                    {/* API Config Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Key className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="tex-sm font-semibold text-white">Configuración de API</h3>
                                <p className="text-xs text-gray-400">Gestiona tu clave personal de ImgBB</p>
                            </div>
                        </div>

                        {hasUserApiKey && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                <p className="text-green-400 text-xs font-medium flex items-center gap-2">
                                    <Shield className="w-3 h-3" />
                                    API personal activa
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Pega tu API Key de ImgBB aquí..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#bb86fc] focus:ring-1 focus:ring-[#bb86fc] transition-all font-mono"
                            />
                            <p className="text-xs text-gray-500">
                                Obtén tu API key gratuitamente en <a href="https://api.imgbb.com/" target="_blank" rel="noopener noreferrer" className="text-[#bb86fc] hover:underline">api.imgbb.com</a>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            {hasUserApiKey && (
                                <button
                                    onClick={handleDeleteApiKey}
                                    className="flex-1 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-500 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar
                                </button>
                            )}
                            <button
                                onClick={handleSaveApiKey}
                                disabled={!apiKey.trim()}
                                className="flex-1 bg-[#1a1a1a] border border-gray-700 hover:border-[#bb86fc] hover:text-[#bb86fc] disabled:opacity-50 disabled:hover:border-gray-700 disabled:hover:text-gray-500 text-gray-300 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 group"
                            >
                                <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Guardar Cambios
                            </button>
                        </div>
                    </section>
                </div>

                {/* Confirm Delete Overlay */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
                        <div className="bg-[#1a1a1a] border border-gray-700 w-full max-w-sm rounded-xl shadow-2xl p-6 transform scale-100 animate-in zoom-in-95 duration-200">
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">¿Eliminar anuncio?</h3>
                                    <p className="text-sm text-gray-400">
                                        Esta acción eliminará el anuncio actual inmediatamente. No se puede deshacer.
                                    </p>
                                </div>
                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleDeleteAnnouncement}
                                        className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

