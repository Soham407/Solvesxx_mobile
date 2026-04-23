import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { UserPlus, Users, X as XIcon } from 'lucide-react-native';

import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  fetchResidentVisitorHistory,
  inviteResidentVisitor,
} from '../../lib/mobileBackend';
import type { ResidentTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';

type ResidentVisitorsScreenProps = BottomTabScreenProps<
  ResidentTabParamList,
  'ResidentVisitors'
>;

const VISITOR_TYPES = [
  { value: 'guest', label: 'Guest' },
  { value: 'vendor', label: 'Vendor / Delivery' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'service_staff', label: 'Service Staff' },
];

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function visitStatusLabel(entry: {
  entryTime: string | null;
  exitTime: string | null;
  approvedByResident: boolean | null;
}): { label: string; color: 'success' | 'warning' | 'danger' | 'info' } {
  if (entry.exitTime) return { label: 'Exited', color: 'info' };
  if (entry.entryTime && entry.approvedByResident === true)
    return { label: 'Inside', color: 'success' };
  if (entry.approvedByResident === false) return { label: 'Denied', color: 'danger' };
  return { label: 'Pre-approved', color: 'warning' };
}

export function ResidentVisitorsScreen(_props: ResidentVisitorsScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const queryClient = useQueryClient();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorType, setVisitorType] = useState('guest');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const historyQuery = useQuery({
    queryKey: ['resident', 'visitor-history', profile?.userId],
    queryFn: fetchResidentVisitorHistory,
    enabled: Boolean(profile?.userId),
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      inviteResidentVisitor({
        visitorName: visitorName.trim(),
        visitorType,
        phone: phone.trim() || undefined,
        purpose: purpose.trim() || undefined,
      }),
    onSuccess: async (result) => {
      if (result && result.error) {
        setMessage({ text: result.error, error: true });
        return;
      }
      setMessage({ text: `${visitorName.trim()} has been pre-approved for entry.`, error: false });
      setVisitorName('');
      setVisitorType('guest');
      setPhone('');
      setPurpose('');
      setShowInviteModal(false);
      await queryClient.invalidateQueries({ queryKey: ['resident', 'visitor-history'] });
    },
    onError: (err: Error) => {
      setMessage({ text: err.message || 'Failed to invite visitor.', error: true });
    },
  });

  const handleInvite = () => {
    if (!visitorName.trim()) {
      setMessage({ text: 'Visitor name is required.', error: true });
      return;
    }
    setMessage(null);
    inviteMutation.mutate();
  };

  const statusColors = {
    success: colors.success,
    warning: colors.warning,
    danger: colors.destructive,
    info: colors.info,
  };

  return (
    <ScreenShell
      eyebrow="Resident"
      title="My Visitors"
      description="Invite guests in advance or review your visitor history."
    >
      <InfoCard>
        <ActionButton
          label="Invite a Visitor"
          variant="primary"
          onPress={() => {
            setMessage(null);
            setShowInviteModal(true);
          }}
        />
        {message && !showInviteModal && (
          <Text
            style={[
              styles.message,
              { color: message.error ? colors.destructive : colors.success },
            ]}
          >
            {message.text}
          </Text>
        )}
      </InfoCard>

      <InfoCard>
        <View style={styles.sectionHeader}>
          <Users color={colors.primary} size={16} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Visitor History</Text>
        </View>

        {historyQuery.isLoading && (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        )}

        {!historyQuery.isLoading && (historyQuery.data ?? []).length === 0 && (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No visitors recorded yet.
          </Text>
        )}

        {(historyQuery.data ?? []).map((entry) => {
          const status = visitStatusLabel(entry);
          return (
            <View
              key={entry.id}
              style={[styles.visitorRow, { borderBottomColor: colors.border }]}
            >
              <View style={styles.visitorInfo}>
                <Text style={[styles.visitorName, { color: colors.foreground }]}>
                  {entry.visitorName}
                </Text>
                <Text style={[styles.visitorMeta, { color: colors.mutedForeground }]}>
                  {entry.visitorType?.replace('_', ' ') ?? 'Guest'}
                  {entry.purpose ? ` · ${entry.purpose}` : ''}
                </Text>
                <Text style={[styles.visitorDate, { color: colors.mutedForeground }]}>
                  {formatDate(entry.entryTime)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${statusColors[status.color]}20` },
                ]}
              >
                <Text style={[styles.statusText, { color: statusColors[status.color] }]}>
                  {status.label}
                </Text>
              </View>
            </View>
          );
        })}
      </InfoCard>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <UserPlus color={colors.primary} size={20} />
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  Invite a Visitor
                </Text>
              </View>
              <Pressable
                onPress={() => setShowInviteModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <XIcon color={colors.mutedForeground} size={20} />
              </Pressable>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              Pre-approve entry. The guard will be notified when your visitor arrives.
            </Text>

            {message && (
              <Text
                style={[
                  styles.message,
                  { color: message.error ? colors.destructive : colors.success },
                ]}
              >
                {message.text}
              </Text>
            )}

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Visitor Name <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              value={visitorName}
              onChangeText={setVisitorName}
              placeholder="Full name"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
              ]}
            />

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Visitor Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
              {VISITOR_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => setVisitorType(t.value)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor:
                        visitorType === t.value ? colors.primary : colors.secondary,
                      borderColor:
                        visitorType === t.value ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      {
                        color:
                          visitorType === t.value
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Phone (optional)
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+91"
              keyboardType="phone-pad"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
              ]}
            />

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Purpose (optional)
            </Text>
            <TextInput
              value={purpose}
              onChangeText={setPurpose}
              placeholder="Meeting, delivery..."
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
              ]}
            />

            <View style={styles.modalActions}>
              <ActionButton
                label="Cancel"
                variant="secondary"
                onPress={() => setShowInviteModal(false)}
                disabled={inviteMutation.isPending}
              />
              <ActionButton
                label={inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                variant="primary"
                onPress={handleInvite}
                disabled={inviteMutation.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loader: {
    marginVertical: Spacing.lg,
  },
  emptyText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  visitorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  visitorInfo: {
    flex: 1,
  },
  visitorName: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
  },
  visitorMeta: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  visitorDate: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  message: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
  },
  modalSubtitle: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  fieldLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  typeChipText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
});
