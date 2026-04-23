import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Calendar, Megaphone, MapPin, Wrench, X as XIcon } from 'lucide-react-native';

import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  createResidentServiceRequest,
  fetchResidentCompanyEvents,
} from '../../lib/mobileBackend';
import type { ResidentTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';

type ResidentCommunityScreenProps = BottomTabScreenProps<
  ResidentTabParamList,
  'ResidentCommunity'
>;

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

type Priority = 'low' | 'normal' | 'high' | 'urgent';

function formatEventDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function ResidentCommunityScreen(_props: ResidentCommunityScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const queryClient = useQueryClient();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDesc, setRequestDesc] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const eventsQuery = useQuery({
    queryKey: ['resident', 'community-events', profile?.userId],
    queryFn: fetchResidentCompanyEvents,
    enabled: Boolean(profile?.userId),
  });

  const requestMutation = useMutation({
    mutationFn: () =>
      createResidentServiceRequest({
        title: requestTitle.trim(),
        description: requestDesc.trim(),
        priority,
      }),
    onSuccess: () => {
      setMessage({ text: 'Your request has been submitted successfully.', error: false });
      setRequestTitle('');
      setRequestDesc('');
      setPriority('normal');
      setShowRequestModal(false);
      queryClient.invalidateQueries({ queryKey: ['resident'] });
    },
    onError: (err: Error) => {
      setMessage({ text: err.message || 'Failed to submit request.', error: true });
    },
  });

  const handleSubmitRequest = () => {
    if (!requestTitle.trim()) {
      setMessage({ text: 'Title is required.', error: true });
      return;
    }
    if (!requestDesc.trim()) {
      setMessage({ text: 'Description is required.', error: true });
      return;
    }
    setMessage(null);
    requestMutation.mutate();
  };

  const priorityColors: Record<Priority, string> = {
    low: colors.mutedForeground,
    normal: colors.info,
    high: colors.warning,
    urgent: colors.destructive,
  };

  return (
    <ScreenShell
      eyebrow="Resident"
      title="Community"
      description="Society announcements and service requests."
    >
      <InfoCard>
        <ActionButton
          label="Raise a Service Request"
          variant="primary"
          onPress={() => {
            setMessage(null);
            setShowRequestModal(true);
          }}
        />
        {message && !showRequestModal && (
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
          <Megaphone color={colors.primary} size={16} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Society Announcements
          </Text>
        </View>

        {eventsQuery.isLoading && (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        )}

        {!eventsQuery.isLoading && (eventsQuery.data ?? []).length === 0 && (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No upcoming announcements.
          </Text>
        )}

        {(eventsQuery.data ?? []).map((event) => (
          <View
            key={event.id}
            style={[styles.eventRow, { borderBottomColor: colors.border }]}
          >
            <View style={[styles.eventIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Calendar color={colors.primary} size={18} />
            </View>
            <View style={styles.eventContent}>
              <View style={styles.eventTitleRow}>
                <Text style={[styles.eventTitle, { color: colors.foreground }]}>
                  {event.title}
                </Text>
                {event.category && (
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: `${colors.primary}15` },
                    ]}
                  >
                    <Text style={[styles.categoryText, { color: colors.primary }]}>
                      {event.category}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.eventMeta}>
                <Text style={[styles.eventDate, { color: colors.mutedForeground }]}>
                  {formatEventDate(event.eventDate)}
                </Text>
                {event.venue && (
                  <View style={styles.venueRow}>
                    <MapPin color={colors.mutedForeground} size={11} />
                    <Text style={[styles.eventDate, { color: colors.mutedForeground }]}>
                      {event.venue}
                    </Text>
                  </View>
                )}
              </View>
              {event.description && (
                <Text style={[styles.eventDesc, { color: colors.mutedForeground }]}>
                  {event.description}
                </Text>
              )}
            </View>
          </View>
        ))}
      </InfoCard>

      {/* Service Request Modal */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Wrench color={colors.warning} size={20} />
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  Raise a Request
                </Text>
              </View>
              <Pressable
                onPress={() => setShowRequestModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <XIcon color={colors.mutedForeground} size={20} />
              </Pressable>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              Describe the issue or service needed. Management will follow up.
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
              Title <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              value={requestTitle}
              onChangeText={setRequestTitle}
              placeholder="e.g. Water leakage in bathroom"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            />

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Description <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              value={requestDesc}
              onChangeText={setRequestDesc}
              placeholder="Provide more details..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              style={[
                styles.input,
                styles.textarea,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            />

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Priority</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <Pressable
                  key={p.value}
                  onPress={() => setPriority(p.value)}
                  style={[
                    styles.priorityChip,
                    {
                      backgroundColor:
                        priority === p.value
                          ? `${priorityColors[p.value]}20`
                          : colors.secondary,
                      borderColor:
                        priority === p.value ? priorityColors[p.value] : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityChipText,
                      {
                        color:
                          priority === p.value
                            ? priorityColors[p.value]
                            : colors.mutedForeground,
                      },
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <ActionButton
                label="Cancel"
                variant="secondary"
                onPress={() => setShowRequestModal(false)}
                disabled={requestMutation.isPending}
              />
              <ActionButton
                label={requestMutation.isPending ? 'Submitting...' : 'Submit'}
                variant="primary"
                onPress={handleSubmitRequest}
                disabled={requestMutation.isPending}
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
  eventRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  eventContent: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  eventTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
    flexShrink: 1,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: 3,
  },
  eventDate: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  eventDesc: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    lineHeight: 16,
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
  textarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  priorityChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  priorityChipText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
});
