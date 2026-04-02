import { create } from 'zustand';

import { loadBuyerState, saveBuyerState } from '../lib/commerceStorage';
import type { AppUserProfile } from '../types/app';
import type {
  BuyerFeedbackRecord,
  BuyerInvoiceRecord,
  BuyerPersistedState,
  BuyerRequestRecord,
  CommercePriority,
} from '../types/commerce';

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createRequestNumber() {
  return `REQ-${new Date().getFullYear()}-${Math.random().toString().slice(2, 6)}`;
}

function createInvoiceNumber() {
  return `INV-${new Date().getFullYear()}-${Math.random().toString().slice(2, 6)}`;
}

function sortRequestsByCreatedAt(requests: BuyerRequestRecord[]) {
  return [...requests].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function createDefaultRequests(profile: AppUserProfile | null): BuyerRequestRecord[] {
  const locationName = profile?.assignedLocation?.locationName ?? 'Preview Tower';

  return [
    {
      id: 'buyer-request-1',
      requestNumber: 'REQ-2026-1201',
      title: 'Lobby housekeeping consumables',
      description: 'Floor cleaner, garbage liners, and surface disinfectant for the next 30 days.',
      categoryLabel: 'Consumables',
      locationName,
      preferredDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'high',
      status: 'po_dispatched',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      supplierName: 'CleanCare Supplies',
      items: [
        { id: 'item-1', label: 'Floor cleaner', quantity: 24, unit: 'bottles' },
        { id: 'item-2', label: 'Garbage liners', quantity: 60, unit: 'rolls' },
      ],
    },
    {
      id: 'buyer-request-2',
      requestNumber: 'REQ-2026-1188',
      title: 'Security shift relief manpower',
      description: 'Two additional guards for the festival weekend shift coverage.',
      categoryLabel: 'Manpower',
      locationName,
      preferredDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'medium',
      status: 'feedback_pending',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      supplierName: 'Sentinel Workforce',
      items: [{ id: 'item-3', label: 'Security guard headcount', quantity: 2, unit: 'staff' }],
    },
    {
      id: 'buyer-request-3',
      requestNumber: 'REQ-2026-1150',
      title: 'DG room maintenance toolkit',
      description: 'Urgent replenishment for the backup generator maintenance shelf.',
      categoryLabel: 'Maintenance',
      locationName,
      preferredDeliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'high',
      status: 'pending',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      supplierName: null,
      items: [{ id: 'item-4', label: 'Insulated toolkit', quantity: 1, unit: 'kit' }],
    },
  ];
}

function createDefaultInvoices(): BuyerInvoiceRecord[] {
  return [
    {
      id: 'buyer-invoice-1',
      requestId: 'buyer-request-1',
      invoiceNumber: 'INV-2026-7781',
      supplierName: 'CleanCare Supplies',
      totalAmountPaise: 485000,
      dueAmountPaise: 485000,
      status: 'sent',
      paymentStatus: 'unpaid',
      invoiceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      note: 'Awaiting buyer acknowledgement before AP handoff.',
    },
    {
      id: 'buyer-invoice-2',
      requestId: 'buyer-request-2',
      invoiceNumber: 'INV-2026-7610',
      supplierName: 'Sentinel Workforce',
      totalAmountPaise: 960000,
      dueAmountPaise: 240000,
      status: 'acknowledged',
      paymentStatus: 'partial',
      invoiceDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      note: 'First installment already released.',
    },
  ];
}

function createDefaultState(profile: AppUserProfile | null): BuyerPersistedState {
  return {
    ownerUserId: profile?.userId ?? null,
    role: 'buyer',
    requests: createDefaultRequests(profile),
    invoices: createDefaultInvoices(),
    feedback: [],
    refreshedAt: new Date().toISOString(),
  };
}

function normalizeHydratedState(
  snapshot: BuyerPersistedState | null,
  profile: AppUserProfile | null,
): BuyerPersistedState {
  const fallback = createDefaultState(profile);

  if (!snapshot || snapshot.ownerUserId !== profile?.userId) {
    return fallback;
  }

  return {
    ...fallback,
    ...snapshot,
    ownerUserId: profile?.userId ?? snapshot.ownerUserId,
  };
}

interface BuyerStore extends BuyerPersistedState {
  hasHydrated: boolean;
  bootstrap: (profile: AppUserProfile | null) => Promise<void>;
  refreshDashboard: () => Promise<void>;
  createRequest: (input: {
    title: string;
    description: string;
    categoryLabel: string;
    locationName: string;
    preferredDeliveryDate: string;
    priority: CommercePriority;
    itemLabel: string;
    quantity: number;
    unit: string;
  }) => Promise<void>;
  acknowledgeInvoice: (id: string) => Promise<void>;
  disputeInvoice: (id: string, note: string) => Promise<void>;
  submitFeedback: (input: {
    requestId: string;
    rating: number;
    note: string;
  }) => Promise<void>;
}

function buildPersistedState(state: BuyerStore): BuyerPersistedState {
  return {
    ownerUserId: state.ownerUserId,
    role: state.role,
    requests: state.requests,
    invoices: state.invoices,
    feedback: state.feedback,
    refreshedAt: state.refreshedAt,
  };
}

async function persistBuyerStore(get: () => BuyerStore) {
  await saveBuyerState(buildPersistedState(get()));
}

export const useBuyerStore = create<BuyerStore>((set, get) => ({
  ...createDefaultState(null),
  hasHydrated: false,

  bootstrap: async (profile) => {
    const storedState = await loadBuyerState();
    const hydratedState = normalizeHydratedState(storedState, profile);

    set({
      ...hydratedState,
      hasHydrated: true,
    });

    await saveBuyerState(hydratedState);
  },

  refreshDashboard: async () => {
    const targetRequestId = sortRequestsByCreatedAt(get().requests).find((request) =>
      request.status === 'po_dispatched' || request.status === 'material_received',
    )?.id;

    set((state) => ({
      refreshedAt: new Date().toISOString(),
      requests: state.requests.map((request) => {
        if (request.id !== targetRequestId) {
          return request;
        }

        if (request.status === 'po_dispatched') {
          return {
            ...request,
            status: 'material_received',
          };
        }

        if (request.status === 'material_received') {
          return {
            ...request,
            status: 'feedback_pending',
          };
        }

        return request;
      }),
    }));

    await persistBuyerStore(get);
  },

  createRequest: async (input) => {
    const quantity = Math.max(1, Math.round(input.quantity || 1));

    set((state) => ({
      refreshedAt: new Date().toISOString(),
      requests: [
        {
          id: createId('buyer-request'),
          requestNumber: createRequestNumber(),
          title: input.title,
          description: input.description || null,
          categoryLabel: input.categoryLabel,
          locationName: input.locationName,
          preferredDeliveryDate: input.preferredDeliveryDate || null,
          priority: input.priority,
          status: 'pending',
          createdAt: new Date().toISOString(),
          supplierName: null,
          items: [
            {
              id: createId('buyer-item'),
              label: input.itemLabel,
              quantity,
              unit: input.unit || 'units',
            },
          ],
        },
        ...state.requests,
      ],
    }));

    await persistBuyerStore(get);
  },

  acknowledgeInvoice: async (id) => {
    set((state) => ({
      invoices: state.invoices.map((invoice) =>
        invoice.id === id
          ? {
              ...invoice,
              status: 'acknowledged',
              note: 'Buyer acknowledged invoice for downstream AP processing.',
            }
          : invoice,
      ),
      refreshedAt: new Date().toISOString(),
    }));

    await persistBuyerStore(get);
  },

  disputeInvoice: async (id, note) => {
    const nextNote = note.trim();

    set((state) => ({
      invoices: state.invoices.map((invoice) =>
        invoice.id === id
          ? {
              ...invoice,
              status: 'disputed',
              note: nextNote || 'Buyer raised a dispute from the mobile invoice desk.',
            }
          : invoice,
      ),
      refreshedAt: new Date().toISOString(),
    }));

    await persistBuyerStore(get);
  },

  submitFeedback: async (input) => {
    const targetRequest = get().requests.find((request) => request.id === input.requestId);

    if (!targetRequest) {
      return;
    }

    set((state) => ({
      feedback: [
        {
          id: createId('buyer-feedback'),
          requestId: input.requestId,
          requestNumber: targetRequest.requestNumber,
          rating: input.rating,
          note: input.note.trim(),
          submittedAt: new Date().toISOString(),
        } satisfies BuyerFeedbackRecord,
        ...state.feedback,
      ],
      requests: state.requests.map((request) =>
        request.id === input.requestId
          ? {
              ...request,
              status: 'completed',
            }
          : request,
      ),
      invoices: state.invoices.map((invoice) =>
        invoice.requestId === input.requestId
          ? {
              ...invoice,
              paymentStatus: invoice.paymentStatus === 'unpaid' ? 'partial' : invoice.paymentStatus,
            }
          : invoice,
      ),
      refreshedAt: new Date().toISOString(),
    }));

    await persistBuyerStore(get);
  },
}));
