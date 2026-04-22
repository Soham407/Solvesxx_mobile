import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CalendarDays, Megaphone } from 'lucide-react-native';

import { ActionButton } from '../../components/shared/ActionButton';
import { FormField } from '../../components/shared/FormField';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createSocietyAnnouncement, isPreviewProfile } from '../../lib/mobileBackend';
import type { OversightTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';

type PostAnnouncementScreenProps = BottomTabScreenProps<
  OversightTabParamList,
  'OversightAnnouncements'
>;

function isValidDate(value: string) {
  if (!value.trim()) {
    return true;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

export function PostAnnouncementScreen({ navigation }: PostAnnouncementScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const queryClient = useQueryClient();
  const previewMode = isPreviewProfile(profile);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const canPost = useMemo(() => {
    if (previewMode) {
      return true;
    }

    return Boolean(profile?.societyId);
  }, [previewMode, profile?.societyId]);

  const postMutation = useMutation({
    mutationFn: async () =>
      createSocietyAnnouncement({
        title,
        description,
        eventDate,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resident', 'community-events'] });
    },
  });

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedEventDate = eventDate.trim();

    if (!trimmedTitle) {
      setMessage('Title is required.');
      return;
    }

    if (!trimmedDescription) {
      setMessage('Description is required.');
      return;
    }

    if (trimmedDescription.length < 4) {
      setMessage('Description must be at least 4 characters.');
      return;
    }

    if (!isValidDate(trimmedEventDate)) {
      setMessage('Event date must use YYYY-MM-DD format.');
      return;
    }

    if (!canPost) {
      setMessage('Your account is not linked to a society yet.');
      return;
    }

    setMessage(null);

    try {
      if (previewMode) {
        Alert.alert('Announcement posted!', 'Preview mode saved this notice locally.');
      } else {
        await postMutation.mutateAsync();
        Alert.alert('Announcement posted!');
      }

      setTitle('');
      setDescription('');
      setEventDate('');
      navigation.navigate('OversightHome');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Announcement could not be posted.');
    }
  };

  return (
    <ScreenShell
      eyebrow="Society Notices"
      title="Post Announcement"
      description="Broadcast a resident-facing notice for your society from the manager workspace."
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.copyWrap}>
            <Text selectable style={[styles.sectionTitle, { color: colors.foreground }]}>
              Compose a notice
            </Text>
            <Text selectable style={[styles.caption, { color: colors.mutedForeground }]}>
              Residents in your linked society will see this in their Community tab.
            </Text>
          </View>
          <View style={[styles.iconBadge, { backgroundColor: `${colors.primary}15` }]}>
            <Megaphone color={colors.primary} size={18} />
          </View>
        </View>

        {message ? (
          <Text
            selectable
            style={[
              styles.feedback,
              { color: message.includes('not linked') ? colors.destructive : colors.primary },
            ]}
            testID="qa_society_notice_message"
          >
            {message}
          </Text>
        ) : null}

        {!canPost ? (
          <View
            style={[
              styles.warningCard,
              { backgroundColor: `${colors.warning}14`, borderColor: `${colors.warning}30` },
            ]}
          >
            <Text selectable style={[styles.warningTitle, { color: colors.foreground }]}>
              Society link required
            </Text>
            <Text selectable style={[styles.caption, { color: colors.mutedForeground }]}>
              This manager account does not have a society mapping yet, so notices cannot be posted.
            </Text>
          </View>
        ) : null}

        <View style={styles.formGroup}>
          <FormField
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Water supply maintenance"
            autoCapitalize="sentences"
            returnKeyType="next"
            inputTestID="qa_society_notice_title"
          />

          <FormField
            label="Description / Message"
            value={description}
            onChangeText={setDescription}
            placeholder="Share the resident-facing details, timing, and expected impact."
            autoCapitalize="sentences"
            multiline
            textAlignVertical="top"
            style={styles.messageInput}
            inputTestID="qa_society_notice_description"
          />

          <View style={styles.dateHeader}>
            <CalendarDays color={colors.mutedForeground} size={16} />
            <Text selectable style={[styles.caption, { color: colors.mutedForeground }]}>
              Leave date blank to post it for today.
            </Text>
          </View>
          <FormField
            label="Event Date"
            value={eventDate}
            onChangeText={setEventDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            autoCorrect={false}
            inputTestID="qa_society_notice_date"
          />
        </View>

        <View style={styles.actionRow}>
          <ActionButton
            label={postMutation.isPending ? 'Posting...' : 'Post Announcement'}
            loading={postMutation.isPending}
            disabled={!canPost}
            onPress={() => void handleSubmit()}
            testID="qa_society_notice_submit"
          />
        </View>
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
  iconBadge: {
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 40,
  },
  feedback: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  warningCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.xs,
    padding: Spacing.base,
  },
  warningTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  formGroup: {
    gap: Spacing.base,
  },
  messageInput: {
    minHeight: 128,
    paddingTop: Spacing.base,
  },
  dateHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionRow: {
    marginTop: Spacing.sm,
  },
});
