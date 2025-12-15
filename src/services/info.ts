import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const SETTINGS_COLLECTION = 'settings';
const INFO_DOC = 'info';

export interface InfoData {
    content: string;
    updatedAt: string;
}

const DEFAULT_CONTENT = `
## ¿Qué es esta página?
Esta es una plataforma dedicada a la visualización y gestión de mangas de manera fluida y moderna.
Nuestra misión es ofrecer la mejor experiencia de lectura posible, con una interfaz limpia y herramientas potentes.

## Características
- Lectura fluida y optimizada.
- Modo administrador para gestión de contenido.
- Descargas en múltiples formatos (ZIP, PDF).
- Integración con Telegram.

## Contacto
Para reportar errores o sugerir mejoras, puedes contactarnos a través de nuestras redes sociales.
`;

export async function getInfo(): Promise<InfoData | null> {
    const docRef = doc(db, SETTINGS_COLLECTION, INFO_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as InfoData;
    }
    return null;
}

export async function saveInfo(content: string): Promise<void> {
    const docRef = doc(db, SETTINGS_COLLECTION, INFO_DOC);
    const data: InfoData = {
        content,
        updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, data);
}

export function subscribeToInfo(callback: (data: InfoData | null) => void) {
    const docRef = doc(db, SETTINGS_COLLECTION, INFO_DOC);
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data() as InfoData);
        } else {
            callback({ content: DEFAULT_CONTENT, updatedAt: new Date().toISOString() });
        }
    });
}
