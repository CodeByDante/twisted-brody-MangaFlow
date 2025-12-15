import { X, Key, Trash2, Save, Settings, Shield, Lock, Unlock, Megaphone, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getUserApiKey, saveUserApiKey, deleteUserApiKey } from '../utils/apiKeyManager';
import { saveAnnouncement } from '../services/announcement';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isAdmin: boolean;
    onAdminChange: (isAdmin: boolean) => void;
}

// SHA-256 Hash for 'Loyola069012*'
const ADMIN_HASH = '8c622f58501187271067227f7fff405e1f9d630d5722bd529a4bc993cdfaa511';

export function SettingsModal({ isOpen, onClose, isAdmin, onAdminChange }: SettingsModalProps) {
    // API Key State
    const [apiKey, setApiKey] = useState('');
    const [hasUserApiKey, setHasUserApiKey] = useState(false);

    // Admin Config State
    const [passwordInput, setPasswordInput] = useState('');
    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const [error, setError] = useState('');

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
            setShowPasswordInput(false);
            setPasswordInput('');
            setError('');
        }
    }, [isOpen]);

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

    const verifyPassword = async (password: string) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex === ADMIN_HASH;
    };

    const handleAdminToggle = async () => {
        if (isAdmin) {
            // Turn off admin mode
            onAdminChange(false);
            setShowPasswordInput(false);
        } else {
            // Show password input to enable
            setShowPasswordInput(true);
        }
    };

    const handlePasswordSubmit = async () => {
        if (!passwordInput) return;

        const isValid = await verifyPassword(passwordInput);

        if (isValid) {
            onAdminChange(true);
            setShowPasswordInput(false);
            setPasswordInput('');
            setError('');
        } else {
            setError('Contraseña incorrecta');
            setPasswordInput('');
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
                                    <p className="text-xs text-gray-400">Permite editar y eliminar mangas</p>
                                </div>
                            </div>

                            <button
                                onClick={handleAdminToggle}
                                className={`w-12 h-6 rounded-full transition-colors relative ${isAdmin ? 'bg-[#bb86fc]' : 'bg-gray-700'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-200 ${isAdmin ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        {showPasswordInput && !isAdmin && (
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 animate-in slide-in-from-top-2 duration-200">
                                <label className="block text-xs font-medium text-gray-400 mb-2">Contraseña de administrador</label>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        value={passwordInput}
                                        onChange={(e) => {
                                            setPasswordInput(e.target.value);
                                            setError('');
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                                        placeholder="Ingrese contraseña..."
                                        className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#bb86fc] transition-colors"
                                    />
                                    <button
                                        onClick={handlePasswordSubmit}
                                        className="bg-[#bb86fc] hover:bg-[#9966dd] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        Activar
                                    </button>
                                </div>
                                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
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

