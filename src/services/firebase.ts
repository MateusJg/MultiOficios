import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  setLogLevel,
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  onSnapshot,
  writeBatch,
  type Firestore
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Collaborator, WorkContract, ChatMessage } from '../types';
import { MOCK_COLLABORATORS, MOCK_CONTRACTS } from '../data/mockData';

// Suppress internal Firestore connection retry logs to prevent polluting console
try {
  setLogLevel('silent');
} catch {
  // ignore
}

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with robust fallback and auto long-polling for proxies/iframes/mobile
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId || '(default)');
} catch {
  try {
    firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
  } catch {
    firestoreInstance = getFirestore(app);
  }
}
export const db = firestoreInstance;

const COLLABORATORS_COLLECTION = 'collaborators';
const CONTRACTS_COLLECTION = 'contracts';

/**
 * Recursively cleans an object to remove undefined values, ensuring 100% Firestore compatibility.
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) {
      continue;
    }
    if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      cleaned[key] = cleanFirestoreData(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

/**
 * Initializes Firestore with base collaborators if collection is empty
 */
export async function initializeFirestoreData(): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }
    const colRef = collection(db, COLLABORATORS_COLLECTION);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 2500)
    );
    const snapshot = await Promise.race([getDocs(colRef), timeoutPromise]);
    
    if (snapshot && snapshot.empty) {
      const batch = writeBatch(db);
      for (const colab of MOCK_COLLABORATORS) {
        const docRef = doc(db, COLLABORATORS_COLLECTION, colab.id);
        batch.set(docRef, colab);
      }
      await batch.commit();
    }
  } catch {
    // Graceful offline fallback: app functions 100% locally with mock data
  }
}

function getMergedCollaborators(base: Collaborator[]): Collaborator[] {
  try {
    const localRaw = localStorage.getItem('multioficios_custom_colabs');
    if (!localRaw) return base;
    const localMap: Record<string, Collaborator> = JSON.parse(localRaw);
    const result = [...base];
    for (const id in localMap) {
      const idx = result.findIndex((c) => c.id === id);
      if (idx >= 0) {
        result[idx] = localMap[id];
      } else {
        result.unshift(localMap[id]);
      }
    }
    return result;
  } catch {
    return base;
  }
}

function getLocalContracts(): WorkContract[] {
  try {
    const localRaw = localStorage.getItem('multioficios_contracts');
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    return MOCK_CONTRACTS;
  } catch {
    return MOCK_CONTRACTS;
  }
}

/**
 * Subscribes to real-time updates for collaborators (local-first with Firestore sync)
 */
export function subscribeToCollaborators(
  onData: (collaborators: Collaborator[]) => void,
  onError?: (error: Error) => void
) {
  // Always immediately emit cached/local data first
  onData(getMergedCollaborators(MOCK_COLLABORATORS));

  try {
    const colRef = collection(db, COLLABORATORS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as Collaborator));
          onData(getMergedCollaborators(items));
        }
      },
      (err) => {
        // Fallback to local data on connection error without breaking the app
        if (onError) onError(err);
        onData(getMergedCollaborators(MOCK_COLLABORATORS));
      }
    );
  } catch (err) {
    if (onError && err instanceof Error) onError(err);
    return () => {};
  }
}

/**
 * Saves or updates a collaborator in Firestore, with LocalStorage fallback
 */
export async function saveCollaboratorToFirestore(colab: Collaborator): Promise<void> {
  // Always save locally so no user action is ever lost
  try {
    const localRaw = localStorage.getItem('multioficios_custom_colabs');
    const existing = localRaw ? JSON.parse(localRaw) : {};
    existing[colab.id] = colab;
    localStorage.setItem('multioficios_custom_colabs', JSON.stringify(existing));
  } catch {
    // localStorage optional
  }

  try {
    const cleaned = cleanFirestoreData(colab);
    const docRef = doc(db, COLLABORATORS_COLLECTION, colab.id);
    await setDoc(docRef, cleaned, { merge: true });
  } catch {
    // Gracefully stored in local storage
  }
}

/**
 * Subscribes to real-time updates for contracts (local-first with Firestore sync)
 */
export function subscribeToContracts(
  onData: (contracts: WorkContract[]) => void,
  onError?: (error: Error) => void
) {
  // Always immediately emit local contracts first
  onData(getLocalContracts());

  try {
    const colRef = collection(db, CONTRACTS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as WorkContract));
          onData(items);
        }
      },
      (err) => {
        if (onError) onError(err);
        onData(getLocalContracts());
      }
    );
  } catch (err) {
    if (onError && err instanceof Error) onError(err);
    return () => {};
  }
}

/**
 * Saves a new contract or updates status in Firestore, with LocalStorage backup
 */
export async function saveContractToFirestore(contract: WorkContract): Promise<void> {
  // Always backup locally
  try {
    const localRaw = localStorage.getItem('multioficios_contracts');
    const existing: WorkContract[] = localRaw ? JSON.parse(localRaw) : [];
    const index = existing.findIndex((c) => c.id === contract.id);
    if (index >= 0) {
      existing[index] = contract;
    } else {
      existing.unshift(contract);
    }
    localStorage.setItem('multioficios_contracts', JSON.stringify(existing));
  } catch {
    // localStorage optional
  }

  try {
    const cleaned = cleanFirestoreData(contract);
    const docRef = doc(db, CONTRACTS_COLLECTION, contract.id);
    await setDoc(docRef, cleaned, { merge: true });
  } catch {
    // Gracefully saved locally
  }
}

export interface ChatSummary {
  chatId: string;
  collaboratorId: string;
  lastMessage: string;
  lastMessageTime: string;
  lastSenderRole: string;
  lastSenderName: string;
  updatedAt: number;
  clientAlias?: string;
  lastReadByTechnicianAt?: number;
}

/**
 * Returns the timestamp when the technician last read a specific chat
 */
export function getChatLastReadAt(chatId: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem('multioficios_chats_read');
    if (raw) {
      const map: Record<string, number> = JSON.parse(raw);
      return map[chatId] || 0;
    }
  } catch {
    // ignore
  }
  return 0;
}

/**
 * Checks whether a chat room has an unread incoming message from a client
 */
export function isChatUnreadForTechnician(chat: ChatSummary): boolean {
  if (!chat || !chat.lastMessage) return false;
  // If technician sent the last message, it's not unread for them
  if (chat.lastSenderRole === 'colaborador') return false;

  const localRead = getChatLastReadAt(chat.chatId);
  const lastRead = Math.max(localRead, chat.lastReadByTechnicianAt || 0);

  // Unread if the client's message was received after the last read timestamp
  return (chat.updatedAt || 0) > lastRead;
}

/**
 * Marks a chat as read by the technician, storing the timestamp locally and in Firestore
 */
export async function markChatAsRead(chatId: string): Promise<void> {
  const now = Date.now();

  // 1. LocalStorage
  try {
    const raw = localStorage.getItem('multioficios_chats_read');
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    map[chatId] = now;
    localStorage.setItem('multioficios_chats_read', JSON.stringify(map));
  } catch {
    // ignore
  }

  // 2. Update local summary
  try {
    const rawSummary = localStorage.getItem('multioficios_chats_summary');
    if (rawSummary) {
      const summaries: Record<string, ChatSummary> = JSON.parse(rawSummary);
      if (summaries[chatId]) {
        summaries[chatId].lastReadByTechnicianAt = now;
        localStorage.setItem('multioficios_chats_summary', JSON.stringify(summaries));
      }
    }
  } catch {
    // ignore
  }

  // 3. Broadcast across tabs and window
  try {
    chatBroadcastChannel?.postMessage({
      type: 'CHAT_READ',
      chatId,
      readAt: now,
    });
  } catch {
    // ignore
  }

  try {
    window.dispatchEvent(
      new CustomEvent('multioficios_chat_read', {
        detail: { chatId, readAt: now },
      })
    );
  } catch {
    // ignore
  }

  // 4. Persist to Firestore
  try {
    const chatDoc = doc(db, 'chats', chatId);
    await setDoc(chatDoc, cleanFirestoreData({ lastReadByTechnicianAt: now }), { merge: true });
  } catch (err) {
    console.warn('Error sincronizando estado de leído en Firestore:', err);
  }
}

// Global broadcast channel for instant 0ms latency across browser tabs/windows
const chatBroadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('multioficios_chat_bus')
  : null;

export interface ClientAliasParams {
  chatId?: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
}

/**
 * Retrieves the custom alias set for a client or chat room
 */
export function getClientAlias(target: string | ClientAliasParams): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('multioficios_chat_aliases');
    if (!raw) return undefined;
    const aliases: Record<string, string> = JSON.parse(raw);

    if (typeof target === 'string') {
      if (aliases[target]) return aliases[target];
      if (aliases[target.toLowerCase()]) return aliases[target.toLowerCase()];
      return undefined;
    }

    if (target.chatId && aliases[target.chatId]) return aliases[target.chatId];
    if (target.clientId && aliases[target.clientId]) return aliases[target.clientId];
    if (target.clientName) {
      const cleanName = target.clientName.trim().toLowerCase();
      if (aliases[cleanName]) return aliases[cleanName];
      if (aliases[target.clientName.trim()]) return aliases[target.clientName.trim()];
    }
    if (target.clientPhone && aliases[target.clientPhone.trim()]) return aliases[target.clientPhone.trim()];
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * Retrieves the custom alias set for a chat room
 */
export function getChatClientAlias(chatId: string): string | undefined {
  return getClientAlias(chatId);
}

/**
 * Updates or assigns a client alias across multiple keys (chatId, clientId, clientName, phone)
 */
export async function updateChatClientAlias(
  target: string | ClientAliasParams,
  alias: string
): Promise<void> {
  const trimmed = alias.trim();
  const keysToUpdate: string[] = [];

  if (typeof target === 'string') {
    keysToUpdate.push(target);
    if (target.includes(' ')) {
      keysToUpdate.push(target.toLowerCase());
    }
  } else {
    if (target.chatId) keysToUpdate.push(target.chatId);
    if (target.clientId) keysToUpdate.push(target.clientId);
    if (target.clientName) {
      keysToUpdate.push(target.clientName.trim());
      keysToUpdate.push(target.clientName.trim().toLowerCase());
    }
    if (target.clientPhone) keysToUpdate.push(target.clientPhone.trim());
  }

  // 1. Update local aliases storage
  try {
    const raw = localStorage.getItem('multioficios_chat_aliases');
    const aliases: Record<string, string> = raw ? JSON.parse(raw) : {};
    keysToUpdate.forEach((k) => {
      if (trimmed) {
        aliases[k] = trimmed;
      } else {
        delete aliases[k];
      }
    });
    localStorage.setItem('multioficios_chat_aliases', JSON.stringify(aliases));
  } catch {
    // ignore
  }

  // 2. Update local chat summaries
  try {
    const raw = localStorage.getItem('multioficios_chats_summary');
    if (raw) {
      const summaries: Record<string, ChatSummary> = JSON.parse(raw);
      let changed = false;
      Object.values(summaries).forEach((s) => {
        const matches = keysToUpdate.some(
          (k) => s.chatId === k || s.lastSenderName?.toLowerCase() === k.toLowerCase()
        );
        if (matches) {
          s.clientAlias = trimmed || undefined;
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('multioficios_chats_summary', JSON.stringify(summaries));
      }
    }
  } catch {
    // ignore
  }

  // 3. Broadcast across tabs and within window
  const primaryId = typeof target === 'string' ? target : (target.chatId || target.clientName || '');
  try {
    chatBroadcastChannel?.postMessage({
      type: 'ALIAS_UPDATED',
      chatId: primaryId,
      alias: trimmed,
      keys: keysToUpdate,
    });
  } catch {
    // ignore
  }

  try {
    window.dispatchEvent(
      new CustomEvent('multioficios_alias_updated', {
        detail: { chatId: primaryId, alias: trimmed, keys: keysToUpdate },
      })
    );
  } catch {
    // ignore
  }

  // 4. Persist to Firestore if chatId is available
  const chatId = typeof target === 'string' ? target : target.chatId;
  if (chatId) {
    try {
      const chatDoc = doc(db, 'chats', chatId);
      await setDoc(chatDoc, cleanFirestoreData({ clientAlias: trimmed || null }), { merge: true });
    } catch (err) {
      console.warn('Error sincronizando alias en Firestore:', err);
    }
  }
}

/**
 * Retrieves all stored chat summaries from LocalStorage for immediate UI loading
 */
function getLocalChatSummaries(collaboratorId?: string): ChatSummary[] {
  if (typeof window === 'undefined') return [];
  const list: ChatSummary[] = [];
  try {
    const rawAliases = localStorage.getItem('multioficios_chat_aliases');
    const aliases: Record<string, string> = rawAliases ? JSON.parse(rawAliases) : {};

    const rawRead = localStorage.getItem('multioficios_chats_read');
    const readMap: Record<string, number> = rawRead ? JSON.parse(rawRead) : {};

    const raw = localStorage.getItem('multioficios_chats_summary');
    if (raw) {
      const parsed: Record<string, ChatSummary> = JSON.parse(raw);
      Object.values(parsed).forEach((s) => {
        if (!collaboratorId || s.collaboratorId === collaboratorId || s.chatId.includes(collaboratorId)) {
          list.push({
            ...s,
            clientAlias: aliases[s.chatId] || s.clientAlias,
            lastReadByTechnicianAt: Math.max(readMap[s.chatId] || 0, s.lastReadByTechnicianAt || 0),
          });
        }
      });
    }

    // Also inspect direct chat keys (multioficios_chat_*) in case summary wasn't indexed
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('multioficios_chat_')) {
        const cId = key.replace('multioficios_chat_', '');
        if (!list.some((s) => s.chatId === cId)) {
          if (!collaboratorId || cId.includes(collaboratorId)) {
            const rawMsgs = localStorage.getItem(key);
            if (rawMsgs) {
              const msgs: ChatMessage[] = JSON.parse(rawMsgs);
              if (msgs.length > 0) {
                const last = msgs[msgs.length - 1];
                list.push({
                  chatId: cId,
                  collaboratorId: last.collaboratorId || collaboratorId || '',
                  lastMessage: last.text,
                  lastMessageTime: last.timestamp,
                  lastSenderRole: last.senderRole,
                  lastSenderName: last.senderName,
                  updatedAt: last.createdAt || Date.now(),
                  clientAlias: aliases[cId],
                  lastReadByTechnicianAt: readMap[cId] || 0,
                });
              }
            }
          }
        }
      }
    }
  } catch {
    // ignore
  }

  list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return list;
}

/**
 * Subscribes to real-time chat messages for a specific conversation/channel
 */
export function subscribeToChatMessages(
  chatId: string,
  onData: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void
) {
  const storageKey = `multioficios_chat_${chatId}`;

  // Helper to load and emit local messages
  const emitLocal = () => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed: ChatMessage[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onData(parsed);
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [];
  };

  // 1. Emit cached messages immediately (0ms latency)
  emitLocal();

  // 2. Listen to BroadcastChannel across browser tabs/windows
  const handleBroadcast = (event: MessageEvent) => {
    if (event.data && event.data.type === 'NEW_MESSAGE' && event.data.chatId === chatId) {
      emitLocal();
    }
  };
  chatBroadcastChannel?.addEventListener('message', handleBroadcast);

  // 3. Listen to window storage event (across tabs) & custom event (same window)
  const handleStorage = (e: StorageEvent) => {
    if (e.key === storageKey) {
      emitLocal();
    }
  };
  window.addEventListener('storage', handleStorage);

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<{ chatId: string; message: ChatMessage }>;
    if (custom.detail && custom.detail.chatId === chatId) {
      emitLocal();
    }
  };
  window.addEventListener('multioficios_new_message', handleCustomEvent);

  // 4. Subscribe to Google Cloud Firestore real-time snapshot
  let unsubscribeFirestore = () => {};
  try {
    const messagesCol = collection(db, 'chats', chatId, 'messages');
    unsubscribeFirestore = onSnapshot(
      messagesCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteItems: ChatMessage[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          } as ChatMessage));

          remoteItems.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

          // Merge with any unsynced local messages
          try {
            const localRaw = localStorage.getItem(storageKey);
            const localItems: ChatMessage[] = localRaw ? JSON.parse(localRaw) : [];
            const mergedMap = new Map<string, ChatMessage>();
            localItems.forEach((m) => mergedMap.set(m.id, m));
            remoteItems.forEach((m) => mergedMap.set(m.id, m));
            const merged = Array.from(mergedMap.values()).sort(
              (a, b) => (a.createdAt || 0) - (b.createdAt || 0)
            );
            localStorage.setItem(storageKey, JSON.stringify(merged));
            onData(merged);
          } catch {
            onData(remoteItems);
          }
        } else {
          // If Firestore is empty for this chat, emit local cache or empty array
          try {
            const localRaw = localStorage.getItem(storageKey);
            const localItems: ChatMessage[] = localRaw ? JSON.parse(localRaw) : [];
            onData(localItems);
          } catch {
            onData([]);
          }
        }
      },
      (err) => {
        if (onError) onError(err);
      }
    );
  } catch (err) {
    if (onError && err instanceof Error) onError(err);
  }

  return () => {
    chatBroadcastChannel?.removeEventListener('message', handleBroadcast);
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('multioficios_new_message', handleCustomEvent);
    unsubscribeFirestore();
  };
}

/**
 * Sends a chat message to Firestore, LocalStorage, and broadcasts to other tabs/devices
 */
export async function sendChatMessageToFirestore(
  chatId: string,
  message: ChatMessage
): Promise<void> {
  const storageKey = `multioficios_chat_${chatId}`;
  
  // 1. Backup locally in message history
  try {
    const localRaw = localStorage.getItem(storageKey);
    const existing: ChatMessage[] = localRaw ? JSON.parse(localRaw) : [];
    if (!existing.some((m) => m.id === message.id)) {
      existing.push(message);
      localStorage.setItem(storageKey, JSON.stringify(existing));
    }
  } catch {
    // ignore
  }

  // 2. Update local chat summaries index for instant inbox availability
  try {
    const summaryRaw = localStorage.getItem('multioficios_chats_summary');
    const summaries: Record<string, ChatSummary> = summaryRaw ? JSON.parse(summaryRaw) : {};
    summaries[chatId] = {
      chatId,
      collaboratorId: message.collaboratorId || '',
      lastMessage: message.text,
      lastMessageTime: message.timestamp,
      lastSenderRole: message.senderRole,
      lastSenderName: message.senderName,
      updatedAt: Date.now(),
    };
    localStorage.setItem('multioficios_chats_summary', JSON.stringify(summaries));
  } catch {
    // ignore
  }

  // 3. Broadcast across tabs and within the same window immediately
  try {
    chatBroadcastChannel?.postMessage({
      type: 'NEW_MESSAGE',
      chatId,
      message,
    });
  } catch {
    // ignore
  }

  try {
    window.dispatchEvent(
      new CustomEvent('multioficios_new_message', {
        detail: { chatId, message },
      })
    );
  } catch {
    // ignore
  }

  // 4. Save to Google Cloud Firestore (Async) with strict undefined sanitization
  try {
    const existingAlias = getChatClientAlias(chatId) || message.clientAlias;
    const cleanedMsg = cleanFirestoreData({
      ...message,
      clientAlias: existingAlias,
      createdAt: message.createdAt || Date.now(),
    });
    const msgDoc = doc(db, 'chats', chatId, 'messages', message.id);
    await setDoc(msgDoc, cleanedMsg);

    const chatDoc = doc(db, 'chats', chatId);
    const cleanedSummary = cleanFirestoreData({
      chatId,
      collaboratorId: message.collaboratorId || '',
      lastMessage: message.text,
      lastMessageTime: message.timestamp,
      lastSenderRole: message.senderRole,
      lastSenderName: message.senderName,
      updatedAt: Date.now(),
      clientAlias: existingAlias || null,
    });
    await setDoc(chatDoc, cleanedSummary, { merge: true });
  } catch (err) {
    console.warn('Mensaje respaldado localmente (sincronizando con Firestore):', err);
  }
}

/**
 * Subscribes to chat list for a collaborator (Local-First + Firestore Cloud Sync)
 */
export function subscribeToCollaboratorChats(
  collaboratorId: string,
  onData: (chats: ChatSummary[]) => void
) {
  // Helper to read and emit local summaries immediately
  const emitLocal = () => {
    const local = getLocalChatSummaries(collaboratorId);
    onData(local);
    return local;
  };

  // 1. Immediately emit local data on mount (0ms latency)
  emitLocal();

  // 2. Listen to BroadcastChannel and window events for immediate updates
  const handleBroadcast = () => {
    emitLocal();
  };
  chatBroadcastChannel?.addEventListener('message', handleBroadcast);

  const handleCustomEvent = () => {
    emitLocal();
  };
  window.addEventListener('multioficios_new_message', handleCustomEvent);
  window.addEventListener('multioficios_alias_updated', handleCustomEvent);
  window.addEventListener('multioficios_chat_read', handleCustomEvent);

  const handleStorage = (e: StorageEvent) => {
    if (
      e.key === 'multioficios_chats_summary' || 
      e.key === 'multioficios_chat_aliases' || 
      e.key === 'multioficios_chats_read' || 
      (e.key && e.key.includes(collaboratorId))
    ) {
      emitLocal();
    }
  };
  window.addEventListener('storage', handleStorage);

  // 3. Subscribe to Firestore chats collection
  let unsubscribeFirestore = () => {};
  try {
    const chatsCol = collection(db, 'chats');
    unsubscribeFirestore = onSnapshot(chatsCol, (snapshot) => {
      const rawAliases = localStorage.getItem('multioficios_chat_aliases');
      const aliases: Record<string, string> = rawAliases ? JSON.parse(rawAliases) : {};
      const rawRead = localStorage.getItem('multioficios_chats_read');
      const readMap: Record<string, number> = rawRead ? JSON.parse(rawRead) : {};

      const list: ChatSummary[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as ChatSummary;
        if (data.collaboratorId === collaboratorId || d.id.includes(collaboratorId)) {
          // If Firestore has a newer lastReadByTechnicianAt, sync to local cache
          if (data.lastReadByTechnicianAt && (!readMap[d.id] || data.lastReadByTechnicianAt > readMap[d.id])) {
            readMap[d.id] = data.lastReadByTechnicianAt;
          }
          list.push({
            ...data,
            chatId: d.id,
            clientAlias: aliases[d.id] || data.clientAlias,
            lastReadByTechnicianAt: Math.max(readMap[d.id] || 0, data.lastReadByTechnicianAt || 0),
          });
        }
      });

      // Save updated readMap if any remote reads arrived
      try {
        localStorage.setItem('multioficios_chats_read', JSON.stringify(readMap));
      } catch {
        // ignore
      }

      // Merge with local summaries
      const local = getLocalChatSummaries(collaboratorId);
      const mergedMap = new Map<string, ChatSummary>();
      local.forEach((s) => mergedMap.set(s.chatId, s));
      list.forEach((s) => mergedMap.set(s.chatId, s));
      const merged = Array.from(mergedMap.values()).sort(
        (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
      );

      // Cache updated summaries
      try {
        const existingRaw = localStorage.getItem('multioficios_chats_summary');
        const existing: Record<string, ChatSummary> = existingRaw ? JSON.parse(existingRaw) : {};
        merged.forEach((s) => {
          existing[s.chatId] = s;
        });
        localStorage.setItem('multioficios_chats_summary', JSON.stringify(existing));
      } catch {
        // ignore
      }

      onData(merged);
    }, (err) => {
      console.warn('Suscripción Firestore de chats en modo local:', err);
    });
  } catch {
    // Handled by local fallback
  }

  return () => {
    chatBroadcastChannel?.removeEventListener('message', handleBroadcast);
    window.removeEventListener('multioficios_new_message', handleCustomEvent);
    window.removeEventListener('multioficios_alias_updated', handleCustomEvent);
    window.removeEventListener('multioficios_chat_read', handleCustomEvent);
    window.removeEventListener('storage', handleStorage);
    unsubscribeFirestore();
  };
}
