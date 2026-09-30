import React, { useState, useMemo, useEffect } from 'react';
import { 
  MOCK_COLLABORATORS, 
  MOCK_CATEGORIES, 
  MOCK_CONTRACTS, 
  MOCK_NOTIFICATIONS, 
  MOCK_INITIAL_LOCATION 
} from './data/mockData';
import { 
  Collaborator, 
  WorkContract, 
  NotificationItem, 
  LocationCoordinates, 
  ServiceStatus,
  ActiveUserProfile
} from './types';
import { Header } from './components/Header';
import { CategoryFilter } from './components/CategoryFilter';
import { SearchBar } from './components/SearchBar';
import { InteractiveMap } from './components/InteractiveMap';
import { CollaboratorCard } from './components/CollaboratorCard';
import { CollaboratorProfileModal } from './components/CollaboratorProfileModal';
import { HireModal } from './components/HireModal';
import { TrackingModal } from './components/TrackingModal';
import { PrivateChatModal } from './components/PrivateChatModal';
import { CollaboratorPortalModal } from './components/CollaboratorPortalModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { DockerArchitectureModal } from './components/DockerArchitectureModal';
import { LocationModal } from './components/LocationModal';
import { HistoryModal } from './components/HistoryModal';
import { ProfileSelectModal } from './components/ProfileSelectModal';
import { CollaboratorInboxModal } from './components/CollaboratorInboxModal';
import { TechnicianWorkspace } from './components/TechnicianWorkspace';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ShieldCheck, Compass, Sparkles, Database } from 'lucide-react';
import { api } from './services/api';
import { 
  initializeFirestoreData, 
  subscribeToCollaborators, 
  subscribeToContracts,
  saveCollaboratorToFirestore,
  saveContractToFirestore 
} from './services/firebase';

export default function App() {
  // State
  const [collaborators, setCollaborators] = useState<Collaborator[]>(MOCK_COLLABORATORS);
  const [contracts, setContracts] = useState<WorkContract[]>(MOCK_CONTRACTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const raw = localStorage.getItem('multioficios_notifications');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return MOCK_NOTIFICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('multioficios_notifications', JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);
  const [userLocation, setUserLocation] = useState<LocationCoordinates>(MOCK_INITIAL_LOCATION);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  // Sync with Firestore in real-time
  useEffect(() => {
    // Seed initial data if Firestore collection is empty
    initializeFirestoreData();

    // Subscribe to real-time Collaborators updates
    const unsubscribeColabs = subscribeToCollaborators(
      (remoteColabs, isRemote) => {
        if (remoteColabs && remoteColabs.length > 0) {
          setCollaborators(remoteColabs);
        }
        if (isRemote) {
          setIsFirebaseConnected(true);
        }
      },
      () => {
        setIsFirebaseConnected(false);
      }
    );

    // 1. Cargar contratos oficiales desde el servidor Express (fuente fiduciaria de verdad)
    api.getContracts().then((serverContracts) => {
      if (Array.isArray(serverContracts) && serverContracts.length > 0) {
        setContracts(serverContracts);
      }
    }).catch(() => {});

    // 2. Suscribirse a actualizaciones de Firestore como canal secundario
    const unsubscribeContracts = subscribeToContracts(
      (remoteContracts) => {
        if (remoteContracts && remoteContracts.length > 0) {
          setContracts((prev) => {
            const map = new Map<string, WorkContract>();
            remoteContracts.forEach((c) => map.set(c.id, c));
            prev.forEach((c) => {
              const existing = map.get(c.id);
              if (existing) {
                // Preservar estado fiduciario del servidor
                map.set(c.id, {
                  ...existing,
                  status: c.status || existing.status,
                  escrowStatus: c.escrowStatus || existing.escrowStatus,
                  paymentTransactionId: c.paymentTransactionId || existing.paymentTransactionId,
                });
              } else {
                map.set(c.id, c);
              }
            });
            return Array.from(map.values());
          });
        }
      }
    );

    return () => {
      unsubscribeColabs();
      unsubscribeContracts();
    };
  }, []);

  // Filters & View State
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>('rating');
  const [availableTodayOnly, setAvailableTodayOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [selectedColabId, setSelectedColabId] = useState<string | null>(null);

  // Modals
  const [profileModalColab, setProfileModalColab] = useState<Collaborator | null>(null);
  const [hireModalColab, setHireModalColab] = useState<Collaborator | null>(null);
  const [chatModalColab, setChatModalColab] = useState<Collaborator | null>(null);
  const [chatModalContractId, setChatModalContractId] = useState<string | undefined>(undefined);
  const [chatModalDirectChatId, setChatModalDirectChatId] = useState<string | undefined>(undefined);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState<boolean>(false);
  const [selectedContractIdForTracking, setSelectedContractIdForTracking] = useState<string | undefined>(undefined);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isColaboratorPortalOpen, setIsColaboratorPortalOpen] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const [isDockerModalOpen, setIsDockerModalOpen] = useState<boolean>(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isInboxModalOpen, setIsInboxModalOpen] = useState<boolean>(false);

  // Helper to open chat ensuring matched room ID
  const handleOpenChatWithCollaborator = (colab: Collaborator, contractId?: string, directChatId?: string) => {
    let resolvedContractId = contractId;
    if (!resolvedContractId && !directChatId) {
      const existingContract = contracts.find(
        (c) => c.collaboratorId === colab.id && c.status !== 'finalizado' && c.status !== 'cancelado'
      );
      if (existingContract) {
        resolvedContractId = existingContract.id;
      }
    }

    setChatModalColab(colab);
    setChatModalContractId(resolvedContractId);
    setChatModalDirectChatId(directChatId);
  };

  // Active User Profile (Remembers whether user is Cliente or Colaborador)
  const [activeProfile, setActiveProfile] = useState<ActiveUserProfile>(() => {
    try {
      const saved = localStorage.getItem('multioficios_active_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role) {
          if (!parsed.id) {
            parsed.id = parsed.role === 'cliente'
              ? `client-${Math.random().toString(36).substring(2, 9)}`
              : (parsed.collaboratorId || 'colab-1');
            try {
              localStorage.setItem('multioficios_active_profile', JSON.stringify(parsed));
            } catch {}
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    const defaultClientId = `client-${Math.random().toString(36).substring(2, 9)}`;
    const initialProfile: ActiveUserProfile = {
      id: defaultClientId,
      role: 'cliente',
      name: 'Cliente MultiOficios',
      phone: '+57 300 123 4567'
    };
    try {
      localStorage.setItem('multioficios_active_profile', JSON.stringify(initialProfile));
    } catch {}
    return initialProfile;
  });

  const handleSelectProfile = (newProfile: ActiveUserProfile) => {
    const targetId = newProfile.id || (newProfile.role === 'colaborador' ? (newProfile.collaboratorId || 'colab-1') : `client-${Math.random().toString(36).substring(2, 9)}`);
    const enrichedProfile: ActiveUserProfile = {
      ...newProfile,
      id: targetId,
      collaboratorId: newProfile.role === 'colaborador' ? (newProfile.collaboratorId || targetId) : undefined,
    };
    setActiveProfile(enrichedProfile);
    try {
      localStorage.setItem('multioficios_active_profile', JSON.stringify(enrichedProfile));
    } catch {
      // ignore
    }
  };

  // Calculate distance from user's current location using Haversine formula
  const collaboratorsWithCalculatedDistance = useMemo(() => {
    return collaborators.map((c) => {
      const R = 6371; // Earth's radius in km
      const dLat = ((c.location.lat - userLocation.lat) * Math.PI) / 180;
      const dLon = ((c.location.lng - userLocation.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLocation.lat * Math.PI) / 180) *
          Math.cos((c.location.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distKm = Math.round(R * dist * 10) / 10;

      return {
        ...c,
        distanciaKm: distKm,
      };
    });
  }, [collaborators, userLocation]);

  // Filtered & Sorted Collaborators
  const filteredCollaborators = useMemo(() => {
    return collaboratorsWithCalculatedDistance
      .filter((c) => {
        // Pending approval, rejected or suspended (unverified) collaborators are NOT published on the public map/catalog
        if (c.approvalStatus === 'pendiente_aprobacion' || c.approvalStatus === 'rechazado' || !c.isVerified) {
          return false;
        }

        // Distance filter
        if (c.distanciaKm > radiusKm) return false;

        // Category filter
        if (selectedCategory !== 'todos' && c.category !== selectedCategory) return false;

        // Available today filter
        if (availableTodayOnly && c.availability !== 'disponible_hoy') return false;

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = c.name.toLowerCase().includes(q);
          const matchTitle = c.specialtyTitle.toLowerCase().includes(q);
          const matchBio = c.bio.toLowerCase().includes(q);
          const matchNeighborhood = c.location.neighborhood.toLowerCase().includes(q);
          if (!matchName && !matchTitle && !matchBio && !matchNeighborhood) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'distance':
            return a.distanciaKm - b.distanciaKm;
          case 'price_asc':
            return a.dailyRate - b.dailyRate;
          case 'price_desc':
            return b.dailyRate - a.dailyRate;
          case 'experience':
            return b.yearsExperience - a.yearsExperience;
          case 'rating':
          default:
            return b.rating - a.rating;
        }
      });
  }, [collaboratorsWithCalculatedDistance, radiusKm, selectedCategory, availableTodayOnly, searchQuery, sortBy]);

  // Handler for adding a new contract
  const handleContractCreated = (newContract: WorkContract) => {
    // El contrato ya fue creado y certificado en el backend por HireModal
    setContracts((prev) => [newContract, ...prev]);
    saveContractToFirestore(newContract).catch((e) => console.warn('Guardado en Firestore:', e));

    // Add automated notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Obra Contratada con Pago en Custodia',
      message: `Contrato ${newContract.orderNumber} con ${newContract.collaboratorName} activado. Fondos retenidos bajo custodia fiduciaria.`,
      timestamp: 'Ahora',
      read: false,
      contractId: newContract.id,
      type: 'contract',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setHireModalColab(null);
    setSelectedContractIdForTracking(newContract.id);
    setIsTrackingModalOpen(true);
  };

  // Handler for updating service status
  const handleUpdateStatus = (
    contractId: string, 
    nextStatus: ServiceStatus, 
    note: string, 
    photoUrl?: string
  ) => {
    // Sincronizar con el backend Express
    api.updateContractStatus(contractId, { status: nextStatus, note, photoUrl }).catch((e) =>
      console.warn('Sync status API:', e)
    );

    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        const newUpdate = {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: nextStatus,
          note,
          photoUrl,
        };
        const updatedContract = {
          ...c,
          status: nextStatus,
          progressUpdates: [...c.progressUpdates, newUpdate],
        };
        saveContractToFirestore(updatedContract).catch((e) => console.warn('Guardado status en Firestore:', e));
        return updatedContract;
      })
    );
  };

  // Handler for releasing escrow funds (Verificado con Backend Express y Firma Fiduciaria)
  const handleReleaseEscrow = async (contractId: string) => {
    const adminToken = sessionStorage.getItem('multioficios_admin_token') || undefined;
    const clientId = activeProfile.role === 'admin' ? undefined : activeProfile.id;

    try {
      const res = await api.releaseEscrow(contractId, clientId, adminToken);
      if (res.ok && res.contract) {
        setContracts((prev) => prev.map((c) => (c.id === contractId ? res.contract : c)));
        saveContractToFirestore(res.contract).catch(() => {});

        const releasedContract = res.contract;
        setNotifications((prev) => [
          {
            id: `notif-${Date.now()}`,
            title: 'Fondos Liberados al Colaborador',
            message: `El pago de $${releasedContract.totalAmount.toLocaleString('es-CO')} ha sido dispersado exitosamente a ${releasedContract.collaboratorName}.`,
            timestamp: 'Ahora',
            read: false,
            contractId,
            type: 'payment',
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error('Error al liberar fondos en custodia:', err);
      alert(`No se pudo autorizar la liberación de fondos: ${(err as Error).message}`);
    }
  };

  // Handler for submitting customer review
  const handleSubmitReview = (contractId: string, stars: number, feedback: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return;

    setCollaborators((prev) =>
      prev.map((c) => {
        if (c.id !== contract.collaboratorId) return c;
        const newReview = {
          id: `rev-${Date.now()}`,
          clientId: contract.clientId,
          clientName: contract.clientName,
          clientAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          rating: stars,
          date: 'Hoy',
          comment: feedback,
          serviceTitle: contract.serviceType === 'jornal'
            ? 'Jornal completo'
            : (contract.serviceType === 'por_horas' || contract.serviceType === 'horas')
              ? 'Servicio por horas'
              : 'Servicio por obra',
        };
        const total = c.reviewCount + 1;
        const newAvg = Math.round(((c.rating * c.reviewCount + stars) / total) * 10) / 10;
        const updatedColab = {
          ...c,
          rating: newAvg,
          reviewCount: total,
          reviews: [newReview, ...c.reviews],
        };
        saveCollaboratorToFirestore(updatedColab).catch((e) => console.warn('Review en Firestore:', e));
        return updatedColab;
      })
    );
  };

  // Handler for registering/updating collaborator from portal (onboarding)
  const handleRegisterCollaborator = (partial: Partial<Collaborator>) => {
    const newColab: Collaborator = {
      id: `colab-${Date.now()}`,
      name: partial.name || 'Técnico Postulante',
      documentIdNumber: partial.documentIdNumber || '',
      email: partial.email || '',
      avatar: partial.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=300&auto=format&fit=crop&q=80',
      category: partial.category || 'plomeria',
      secondaryCategories: partial.secondaryCategories || [],
      specialtyTitle: partial.specialtyTitle || 'Técnico de Obra y Mantenimiento',
      rating: 5.0,
      reviewCount: 0,
      yearsExperience: partial.yearsExperience || 5,
      completedJobsCount: 0,
      isVerified: false, // Must be audited and approved by admin
      approvalStatus: partial.approvalStatus || 'pendiente_aprobacion',
      appliedAt: partial.appliedAt || 'Hoy',
      bio: partial.bio || 'Técnico profesional de oficios varios disponible para contratación.',
      dailyRate: partial.dailyRate || 130000,
      hourlyRate: partial.hourlyRate || 26000,
      availability: partial.availability || 'disponible_hoy',
      badges: partial.badges || ['ARL Riesgo III', 'En Auditoría'],
      phone: partial.phone || '+57 312 456 7890',
      location: partial.location || {
        lat: userLocation.lat + 0.005,
        lng: userLocation.lng + 0.004,
        address: 'Calle 10 sur # 45-20',
        neighborhood: userLocation.neighborhood,
        city: userLocation.city,
      },
      distanceKm: 0.8,
      certifications: partial.certifications || {
        arlRiskLevel: 'Riesgo III',
        backgroundCheckStatus: 'En revisión',
        technicalDegree: 'Técnico SENA',
        verifiedDate: '2026-03-20',
      },
      portfolio: [
        {
          id: 'port-new-1',
          title: 'Labor de Instalación y Mantenimiento',
          description: 'Obra civil entregada a satisfacción con póliza de garantía',
          imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
          category: partial.category || 'plomeria',
          completionDate: 'Marzo 2026',
        }
      ],
      reviews: [],
    };

    setCollaborators((prev) => [newColab, ...prev]);
    saveCollaboratorToFirestore(newColab).catch((e) => console.warn('Nuevo colab en Firestore:', e));
    api.syncCollaborator(newColab).catch((e) => console.warn('Sync colab en backend:', e));

    // Automatically set this device profile as the newly registered collaborator
    handleSelectProfile({
      role: 'colaborador',
      collaboratorId: newColab.id,
      name: newColab.name,
      phone: newColab.phone,
      avatar: newColab.avatar,
      specialtyTitle: newColab.specialtyTitle,
    });

    // Add alert in notifications feed for administrator attention
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Nueva Solicitud de Vinculación',
      message: `${newColab.name} ha radicado su expediente en ${newColab.location.neighborhood}. Requiere revisión y aprobación en la Consola Administrativa.`,
      timestamp: 'Ahora mismo',
      type: 'system',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Handler for administrator approving a candidate
  const handleApproveCollaborator = (colabId: string) => {
    const adminToken = sessionStorage.getItem('multioficios_admin_token') || undefined;
    api.approveCollaborator(colabId, { approvalStatus: 'aprobado', isVerified: true }, adminToken).catch((e) =>
      console.warn('Sync aprobación API:', e)
    );

    setCollaborators((prev) =>
      prev.map((c) => {
        if (c.id === colabId) {
          const approved = {
            ...c,
            approvalStatus: 'aprobado' as const,
            isVerified: true,
            badges: c.badges.filter((b) => b !== 'En Auditoría').concat(['Verificado MultiOficios']),
          };
          saveCollaboratorToFirestore(approved).catch((e) => console.warn('Aprobación en Firestore:', e));
          return approved;
        }
        return c;
      })
    );

    const target = collaborators.find((c) => c.id === colabId);
    const targetName = target ? target.name : 'El colaborador';
    const targetHood = target ? target.location.neighborhood : 'Bogotá';

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: '¡Colaborador Aprobado y Publicado!',
        message: `${targetName} ha sido aprobado por el Administrador. Su perfil y servicios ya están activos en el mapa interactivo de ${targetHood}.`,
        timestamp: 'Ahora mismo',
        type: 'system',
        read: false,
      },
      ...prev,
    ]);
  };

  // Handler for administrator rejecting a candidate
  const handleRejectCollaborator = (colabId: string) => {
    setCollaborators((prev) =>
      prev.map((c) => {
        if (c.id === colabId) {
          const rejected = {
            ...c,
            approvalStatus: 'rechazado' as const,
            isVerified: false,
          };
          saveCollaboratorToFirestore(rejected).catch((e) => console.warn('Rechazo en Firestore:', e));
          return rejected;
        }
        return c;
      })
    );

    const target = collaborators.find((c) => c.id === colabId);
    const targetName = target ? target.name : 'El técnico';

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Solicitud de Vinculación Rechazada',
        message: `La postulación de ${targetName} ha sido rechazada tras la auditoría de antecedentes y documentos.`,
        timestamp: 'Ahora mismo',
        type: 'system',
        read: false,
      },
      ...prev,
    ]);
  };

  const handleToggleVerification = (colabId: string) => {
    setCollaborators((prev) =>
      prev.map((c) => {
        if (c.id === colabId) {
          const toggled = { ...c, isVerified: !c.isVerified };
          saveCollaboratorToFirestore(toggled).catch((e) => console.warn('Toggle verificado en Firestore:', e));
          return toggled;
        }
        return c;
      })
    );
  };

  // Handler for admin updating a collaborator profile
  const handleUpdateCollaborator = (updatedColab: Collaborator) => {
    setCollaborators((prev) =>
      prev.map((c) => (c.id === updatedColab.id ? updatedColab : c))
    );
    saveCollaboratorToFirestore(updatedColab).catch((e) => console.warn('Actualización en Firestore:', e));
    api.syncCollaborator(updatedColab).catch((e) => console.warn('Sync colab update en backend:', e));

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Perfil de Colaborador Actualizado',
        message: `El administrador ha modificado y guardado los datos del perfil de ${updatedColab.name}.`,
        timestamp: 'Ahora mismo',
        type: 'system',
        read: false,
      },
      ...prev,
    ]);
  };

  // Handler for updating collaborator live availability (Disponible / En Obra / Pausado)
  const handleUpdateCollaboratorAvailability = (colabId: string, availability: Collaborator['availability']) => {
    setCollaborators((prev) =>
      prev.map((c) => {
        if (c.id === colabId) {
          const updated = { ...c, availability };
          saveCollaboratorToFirestore(updated).catch(() => {});
          return updated;
        }
        return c;
      })
    );
  };

  // Handler for generating a demo sample work request for technician testing
  const handleCreateSampleRequest = async (colabId: string) => {
    const targetColab = collaborators.find((c) => c.id === colabId) || collaborators[0];
    const clientTargetId = activeProfile?.id || `client-${Date.now().toString(36)}`;
    const clientTargetName = activeProfile?.name || 'Cliente MultiOficios';
    const clientTargetPhone = activeProfile?.phone || '+57 311 589 4432';

    const baseAmount = targetColab.dailyRate || 140000;
    const arlInsuranceFee = 12000;
    const platformProtectionFee = Math.round(baseAmount * 0.05);
    const totalAmount = baseAmount + arlInsuranceFee + platformProtectionFee;

    try {
      const paymentReceipt = await api.initiatePayment({
        method: 'pse',
        bankEntity: 'Bancolombia (Muestra)',
        amount: totalAmount,
        collaboratorId: targetColab.id,
        serviceType: 'jornal',
        unitsCount: 1,
        baseAmount,
        collaboratorDailyRate: targetColab.dailyRate,
        collaboratorHourlyRate: targetColab.hourlyRate,
        workDescription: '[Muestra de Demostración] Instalación y reparación técnica de griferías con fondos en custodia fiduciaria.',
      });

      const newContractPayload: Partial<WorkContract> = {
        orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        clientId: clientTargetId,
        clientName: clientTargetName,
        clientPhone: clientTargetPhone,
        collaboratorId: targetColab.id,
        collaboratorName: targetColab.name,
        collaboratorSpecialty: targetColab.specialtyTitle,
        collaboratorAvatar: targetColab.avatar,
        serviceType: 'jornal',
        unitsCount: 1,
        baseAmount,
        arlInsuranceFee,
        platformProtectionFee,
        totalAmount,
        status: 'fondos_en_custodia',
        workDescription: '[Muestra de Demostración] Instalación y reparación técnica de griferías con fondos en custodia fiduciaria.',
        location: {
          lat: 4.6750,
          lng: -74.0550,
          address: 'Carrera 15 # 85-30 Apto 402',
          city: 'Bogotá D.C.',
          neighborhood: 'Chicó Norte',
        },
        scheduledDate: 'Hoy',
        scheduledTime: '2:30 PM',
        paymentMethod: 'pse',
        paymentTransactionId: paymentReceipt.transactionId,
        paymentReceiptAmount: paymentReceipt.amount,
        collaboratorDailyRate: targetColab.dailyRate,
        collaboratorHourlyRate: targetColab.hourlyRate,
        isSample: true,
        escrowStatus: 'fondos_retenidos',
      };

      const res = await api.createContract(newContractPayload);
      if (res && res.contract) {
        handleContractCreated(res.contract);
      }
    } catch (e) {
      console.warn('Error al crear muestra fiduciaria en servidor:', e);
    }
  };

  const handleOpenAdmin = () => {
    setIsAdminAuthModalOpen(true);
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminAuthModalOpen(false);
    setIsAdminPanelOpen(true);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setIsAdminPanelOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans">
      {/* PWA Mobile Install Banner (if installable and not dismissed) */}
      <PWAInstallButton variant="banner" />

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Header */}
      <Header
        userLocation={userLocation}
        onChangeLocationClick={() => setIsLocationModalOpen(true)}
        onOpenContractsClick={() => setIsHistoryModalOpen(true)}
        onOpenColaboratorPortalClick={() => setIsColaboratorPortalOpen(true)}
        onOpenAdminClick={handleOpenAdmin}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenInboxModal={() => setIsInboxModalOpen(true)}
        activeProfile={activeProfile}
        isAdminAuthenticated={isAdminAuthenticated}
        activeContractsCount={contracts.filter((c) => c.status !== 'finalizado').length}
        isFirebaseConnected={isFirebaseConnected}
        notifications={notifications}
        onMarkNotificationAsRead={(id) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          );
        }}
        onSelectContractFromNotification={(contractId) => {
          setSelectedContractIdForTracking(contractId);
          setIsTrackingModalOpen(true);
        }}
      />

      {/* View Switch: If active profile is a Technician, show the dedicated Technician Workspace */}
      {activeProfile.role === 'colaborador' ? (
        <TechnicianWorkspace
          activeProfile={activeProfile}
          collaborators={collaborators}
          contracts={contracts}
          onOpenChat={(colab, contractId, directChatId) => {
            handleOpenChatWithCollaborator(colab, contractId, directChatId);
          }}
          onOpenTracking={(contractId) => {
            setSelectedContractIdForTracking(contractId);
            setIsTrackingModalOpen(true);
          }}
          onSwitchToClientMode={() => {
            handleSelectProfile({
              role: 'cliente',
              name: 'Cliente',
            });
          }}
          onUpdateAvailability={handleUpdateCollaboratorAvailability}
          onCreateSampleRequest={handleCreateSampleRequest}
        />
      ) : (
        <>
          {/* Category Tabs & Assurance Banner */}
          <CategoryFilter
            categories={MOCK_CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={(catId) => {
              setSelectedCategory(catId);
              if (catId === 'todos') {
                setSearchQuery('');
                setAvailableTodayOnly(false);
              }
            }}
          />

          {/* Search, Radius Filter, and View Mode Switches */}
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            radiusKm={radiusKm}
            onRadiusChange={setRadiusKm}
            sortBy={sortBy}
            onSortChange={setSortBy}
            availableTodayOnly={availableTodayOnly}
            onToggleAvailableToday={() => setAvailableTodayOnly(!availableTodayOnly)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            resultsCount={filteredCollaborators.length}
            onResetFilters={() => {
              setSelectedCategory('todos');
              setSearchQuery('');
              setRadiusKm(10);
              setSortBy('rating');
              setAvailableTodayOnly(false);
            }}
          />

          {/* Main Content Layout */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Split View (Default): Side-by-side Cards and Interactive Map */}
            {viewMode === 'split' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left column: Collaborators list */}
                <div className="lg:col-span-6 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                  {filteredCollaborators.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-stone-200">
                      <Compass className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                      <h3 className="font-bold text-stone-800 text-sm">No se encontraron colaboradores</h3>
                      <p className="text-xs text-stone-500 mt-1">
                        Prueba aumentando el radio de cobertura o seleccionando otra categoría.
                      </p>
                    </div>
                  ) : (
                    filteredCollaborators.map((collaborator) => (
                      <CollaboratorCard
                        key={collaborator.id}
                        collaborator={collaborator}
                        isSelected={selectedColabId === collaborator.id}
                        onSelect={() => setSelectedColabId(collaborator.id)}
                        onViewProfile={() => setProfileModalColab(collaborator)}
                        onHire={() => setHireModalColab(collaborator)}
                        onStartChat={() => handleOpenChatWithCollaborator(collaborator)}
                      />
                    ))
                  )}
                </div>

                {/* Right column: Interactive Map */}
                <div className="lg:col-span-6 sticky top-24 h-[calc(100vh-250px)] min-h-[520px]">
                  <InteractiveMap
                    userLocation={userLocation}
                    collaborators={filteredCollaborators}
                    radiusKm={radiusKm}
                    selectedCollaboratorId={selectedColabId}
                    onSelectCollaborator={(colab) => {
                      setSelectedColabId(colab.id);
                      const el = document.getElementById(`card-colab-${colab.id}`);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    onHireCollaborator={(colab) => setHireModalColab(colab)}
                  />
                </div>
              </div>
            )}

            {/* Full List View */}
            {viewMode === 'list' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCollaborators.map((collaborator) => (
                  <CollaboratorCard
                    key={collaborator.id}
                    collaborator={collaborator}
                    isSelected={selectedColabId === collaborator.id}
                    onSelect={() => setSelectedColabId(collaborator.id)}
                    onViewProfile={() => setProfileModalColab(collaborator)}
                    onHire={() => setHireModalColab(collaborator)}
                    onStartChat={() => handleOpenChatWithCollaborator(collaborator)}
                  />
                ))}
              </div>
            )}

            {/* Full Map View */}
            {viewMode === 'map' && (
              <div className="h-[calc(100vh-230px)] w-full rounded-2xl overflow-hidden shadow-xs border border-stone-200">
                <InteractiveMap
                  userLocation={userLocation}
                  collaborators={filteredCollaborators}
                  radiusKm={radiusKm}
                  selectedCollaboratorId={selectedColabId}
                  onSelectCollaborator={(colab) => {
                    setSelectedColabId(colab.id);
                    setProfileModalColab(colab);
                  }}
                  onHireCollaborator={(colab) => setHireModalColab(colab)}
                />
              </div>
            )}
          </main>
        </>
      )}

      {/* MODALS */}
      {/* 1. Collaborator Detailed Profile Modal */}
      {profileModalColab && (
        <CollaboratorProfileModal
          collaborator={profileModalColab}
          onClose={() => setProfileModalColab(null)}
          onHire={(colab) => {
            setProfileModalColab(null);
            setHireModalColab(colab);
          }}
          onStartChat={(colab) => {
            setProfileModalColab(null);
            handleOpenChatWithCollaborator(colab);
          }}
        />
      )}

      {/* 2. Hire with Escrow Modal */}
      {hireModalColab && (
        <HireModal
          collaborator={hireModalColab}
          userLocation={userLocation}
          onClose={() => setHireModalColab(null)}
          onSuccess={handleContractCreated}
          clientProfile={{
            id: activeProfile.id,
            name: activeProfile.name,
            phone: activeProfile.phone,
          }}
        />
      )}

      {/* 3. Real-time Service Tracking Modal */}
      {isTrackingModalOpen && (
        <TrackingModal
          contracts={contracts}
          selectedContractId={selectedContractIdForTracking}
          onClose={() => {
            setIsTrackingModalOpen(false);
            setSelectedContractIdForTracking(undefined);
          }}
          onUpdateStatus={handleUpdateStatus}
          onReleaseEscrow={handleReleaseEscrow}
          onSubmitReview={handleSubmitReview}
          onOpenChat={(contract) => {
            const colab = collaborators.find((c) => c.id === contract.collaboratorId);
            if (colab) {
              handleOpenChatWithCollaborator(colab, contract.id, `contract_${contract.id}`);
            }
          }}
        />
      )}

      {/* 4. Private Chat Modal (E2EE with real-time Cloud Firestore sync) */}
      {chatModalColab && (
        <PrivateChatModal
          collaborator={chatModalColab}
          contractId={chatModalContractId}
          directChatId={chatModalDirectChatId}
          activeProfile={activeProfile}
          onClose={() => {
            setChatModalColab(null);
            setChatModalContractId(undefined);
            setChatModalDirectChatId(undefined);
          }}
        />
      )}

      {/* Profile Selection & Identity Modal (Modo Cliente / Modo Técnico) */}
      {isProfileModalOpen && (
        <ProfileSelectModal
          currentProfile={activeProfile}
          collaborators={collaborators}
          onSelectProfile={handleSelectProfile}
          onOpenColaboratorRegistration={() => {
            setIsProfileModalOpen(false);
            setIsColaboratorPortalOpen(true);
          }}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      {/* Collaborator Message Inbox (For active technicians to receive customer chats) */}
      {isInboxModalOpen && (
        <CollaboratorInboxModal
          activeProfile={activeProfile}
          collaborator={
            collaborators.find((c) => c.id === activeProfile.collaboratorId) ||
            collaborators[0]
          }
          onOpenChat={(colab) => setChatModalColab(colab)}
          onClose={() => setIsInboxModalOpen(false)}
        />
      )}

      {/* 5. Colaborator Portal (Ofrecer mis servicios - Vinculación de Nuevos Colaboradores) */}
      {isColaboratorPortalOpen && (
        <CollaboratorPortalModal
          onClose={() => setIsColaboratorPortalOpen(false)}
          onRegisterCollaborator={handleRegisterCollaborator}
          onOpenAdminPanel={handleOpenAdmin}
          userLocation={userLocation}
        />
      )}

      {/* 6. Admin Panel Web */}
      {isAdminPanelOpen && (
        <AdminPanelModal
          collaborators={collaborators}
          contracts={contracts}
          onClose={() => {
            setIsAdminPanelOpen(false);
            setIsAdminAuthenticated(false);
          }}
          onLogout={handleAdminLogout}
          onToggleVerification={handleToggleVerification}
          onApproveCollaborator={handleApproveCollaborator}
          onRejectCollaborator={handleRejectCollaborator}
          onUpdateCollaborator={handleUpdateCollaborator}
        />
      )}

      {/* 7. Admin Auth Modal (Password Protection) */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminAuthSuccess}
      />

      {/* 8. Docker, Flask & Hostinger Architecture Modal */}
      {isDockerModalOpen && (
        <DockerArchitectureModal
          onClose={() => setIsDockerModalOpen(false)}
        />
      )}

      {/* 8. Location Selector Modal */}
      {isLocationModalOpen && (
        <LocationModal
          currentLocation={userLocation}
          onClose={() => setIsLocationModalOpen(false)}
          onSelectLocation={(newLocation) => setUserLocation(newLocation)}
        />
      )}

      {/* 9. History of Contracts Modal */}
      {isHistoryModalOpen && (
        <HistoryModal
          contracts={contracts}
          activeProfile={activeProfile}
          onClose={() => setIsHistoryModalOpen(false)}
          onSelectContract={(contractId) => {
            setIsHistoryModalOpen(false);
            setSelectedContractIdForTracking(contractId);
            setIsTrackingModalOpen(true);
          }}
        />
      )}
      {/* Floating PWA install button for mobile screens */}
      <PWAInstallButton variant="floating" />
    </div>
  );
}
