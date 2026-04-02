import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MessageSquareMore, Star } from 'lucide-react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { FormField } from '../../components/shared/FormField';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { BuyerTabParamList } from '../../navigation/types';
import { useBuyerStore } from '../../store/useBuyerStore';

type BuyerFeedbackScreenProps = BottomTabScreenProps<BuyerTabParamList, 'BuyerFeedback'>;

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

function formatValue(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function BuyerFeedbackScreen(_props: BuyerFeedbackScreenProps) {
  const { colors } = useAppTheme();
  const requests = useBuyerStore((state) => state.requests);
  const feedback = useBuyerStore((state) => state.feedback);
  const submitFeedback = useBuyerStore((state) => state.submitFeedback);

  const feedbackEligibleRequests = useMemo(
    () => requests.filter((request) => request.status === 'feedback_pending'),
    [requests],
  );

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    feedbackEligibleRequests[0]?.id ?? null,
  );
  const [rating, setRating] = useState<number>(4);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRequest =
    feedbackEligibleRequests.find((request) => request.id === selectedRequestId) ?? null;

  useEffect(() => {
    if (!feedbackEligibleRequests.length) {
      if (selectedRequestId !== null) {
        setSelectedRequestId(null);
      }

      return;
    }

    const hasCurrentSelection = feedbackEligibleRequests.some(
      (request) => request.id === selectedRequestId,
    );

    if (!hasCurrentSelection) {
      setSelectedRequestId(feedbackEligibleRequests[0]?.id ?? null);
    }
  }, [feedbackEligibleRequests, selectedRequestId]);

  const handleSubmit = async () => {
    if (!selectedRequestId || !selectedRequest) {
      setMessage('Select a request that is ready for buyer feedback.');
      return;
    }

    if (!note.trim()) {
      setMessage('Add a short feedback note before submitting.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await submitFeedback({
        requestId: selectedRequestId,
        rating,
        note: note.trim(),
      });

      setNote('');
      setRating(4);
      setMessage(`Feedback submitted for ${selectedRequest.requestNumber}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenShell
      eyebrow="Buyer Feedback"
      title="Delivery feedback and closure"
      description="Close the loop after dispatch by recording satisfaction, operational notes, and vendor performance from the mobile app."
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.copyWrap}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Submit feedback</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              Orders move to completed once buyer feedback is captured.
            </Text>
          </View>
          <MessageSquareMore color={colors.primary} size={22} />
        </View>
        {message ? <Text style={[styles.caption, { color: colors.primary }]}>{message}</Text> : null}

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Select request</Text>
          <View style={styles.selectorWrap}>
            {feedbackEligibleRequests.length ? (
              feedbackEligibleRequests.map((request) => {
                const isSelected = request.id === selectedRequestId;

                return (
                  <Pressable
                    key={request.id}
                    accessibilityRole="button"
                    onPress={() => setSelectedRequestId(request.id)}
                    style={[
                      styles.selectorButton,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.secondary,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.selectorLabel, { color: isSelected ? colors.primaryForeground : colors.foreground }]}>
                      {request.requestNumber}
                    </Text>
                  </Pressable>
                );
              })
            ) : (
              <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                No completed delivery is currently waiting for buyer feedback.
              </Text>
            )}
          </View>
        </View>

        {selectedRequest ? (
          <InfoCard>
            <Text style={[styles.requestTitle, { color: colors.foreground }]}>{selectedRequest.title}</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              {selectedRequest.categoryLabel} | {selectedRequest.locationName}
            </Text>
            <StatusChip label={selectedRequest.status.replace(/_/g, ' ')} tone="warning" />
          </InfoCard>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Rating</Text>
          <View style={styles.ratingRow}>
            {RATING_OPTIONS.map((value) => {
              const isSelected = value === rating;

              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  onPress={() => setRating(value)}
                  style={[
                    styles.ratingButton,
                    {
                      backgroundColor: isSelected ? colors.warning : colors.secondary,
                      borderColor: isSelected ? colors.warning : colors.border,
                    },
                  ]}
                >
                  <Star color={isSelected ? colors.warningForeground : colors.foreground} size={16} />
                  <Text style={[styles.selectorLabel, { color: isSelected ? colors.warningForeground : colors.foreground }]}>
                    {value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <FormField
          label="Feedback note"
          multiline
          onChangeText={setNote}
          placeholder="Quality, timeliness, packaging, and site coordination notes."
          style={styles.multilineField}
          textAlignVertical="top"
          value={note}
        />
        <ActionButton
          label={isSubmitting ? 'Submitting...' : 'Submit feedback'}
          loading={isSubmitting}
          disabled={!feedbackEligibleRequests.length}
          onPress={() => void handleSubmit()}
        />
      </InfoCard>

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Feedback history</Text>
        {feedback.length ? (
          feedback.map((entry) => (
            <View key={entry.id} style={styles.historyCard}>
              <View style={styles.headerRow}>
                <View style={styles.copyWrap}>
                  <Text style={[styles.requestTitle, { color: colors.foreground }]}>
                    {entry.requestNumber}
                  </Text>
                  <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                    Submitted on {formatValue(entry.submittedAt)}
                  </Text>
                </View>
                <StatusChip label={`${entry.rating} star`} tone={entry.rating >= 4 ? 'success' : 'warning'} />
              </View>
              <Text style={[styles.caption, { color: colors.foreground }]}>{entry.note}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            Submitted buyer feedback will appear here for audit and vendor follow-up.
          </Text>
        )}
      </InfoCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    justifyContent: 'space-between',
  },
  copyWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  fieldGroup: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
  },
  selectorWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  selectorButton: {
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  selectorLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
  },
  requestTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  ratingButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  multilineField: {
    minHeight: 120,
    paddingTop: Spacing.base,
  },
  historyCard: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
});
