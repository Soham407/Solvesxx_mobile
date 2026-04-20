import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Clock3, PhoneCall, ShieldAlert, Waves } from 'lucide-react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { isPreviewProfile } from '../../lib/mobileBackend';
import type { GuardTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useGuardStore } from '../../store/useGuardStore';

type GuardContactsScreenProps = BottomTabScreenProps<GuardTabParamList, 'GuardContacts'>;

function formatValue(value: string | null) {
  if (!value) {
    return 'Not yet';
  }

  return new Date(value).toLocaleString([], {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

export function GuardContactsScreen(_props: GuardContactsScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const emergencyContacts = useGuardStore((state) => state.emergencyContacts);
  const offlineQueue = useGuardStore((state) => state.offlineQueue);
  const sosEvents = useGuardStore((state) => state.sosEvents);
  const lastPatrolResetAt = useGuardStore((state) => state.lastPatrolResetAt);
  const lastSyncAt = useGuardStore((state) => state.lastSyncAt);
  const isOfflineMode = useGuardStore((state) => state.isOfflineMode);
  const resetPatrolClock = useGuardStore((state) => state.resetPatrolClock);
  const signOut = useAppStore((state) => state.signOut);
  const previewMode = isPreviewProfile(profile);
  const [message, setMessage] = useState<string | null>(null);

  const handleDial = async (phone: string) => {
    await Linking.openURL(`tel:${phone}`);
  };

  const handleResetPatrolTimer = async () => {
    setMessage(null);
    await resetPatrolClock();
    setMessage('Patrol timer reset successfully.');
  };

  return (
    <ScreenShell
      eyebrow="Support"
      title="Emergency Contacts"
      description="Keep critical contacts one tap away and quickly refresh the patrol timer during an active shift."
      footer={<ActionButton label="Sign out" variant="ghost" onPress={() => void signOut()} />}
    >
      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Patrol timer</Text>
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>
          Use this whenever you are actively moving through the site and want to refresh the inactivity timer.
        </Text>
        <View style={styles.statusWrap}>
          <StatusChip label={isOfflineMode ? 'Offline mode' : 'Live sync'} tone={isOfflineMode ? 'warning' : 'success'} />
          {previewMode ? (
            <StatusChip label={`${offlineQueue.length} queued`} tone={offlineQueue.length ? 'warning' : 'info'} />
          ) : null}
        </View>
        <View style={styles.summaryRow}>
          <Clock3 color={colors.info} size={18} />
          <Text style={[styles.summaryText, { color: colors.foreground }]}>
            Last patrol reset: {formatValue(lastPatrolResetAt)}
          </Text>
        </View>
        {message ? <Text style={[styles.caption, { color: colors.primary }]}>{message}</Text> : null}
        {previewMode ? (
          <View style={styles.summaryRow}>
            <Waves color={colors.primary} size={18} />
            <Text style={[styles.summaryText, { color: colors.foreground }]}>
              Last sync: {formatValue(lastSyncAt)}
            </Text>
          </View>
        ) : null}
        <ActionButton
          label="Reset patrol timer"
          variant="secondary"
          testID="qa_guard_contacts_reset_patrol"
          onPress={() => void handleResetPatrolTimer()}
        />
      </InfoCard>

      <InfoCard>
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick dial directory</Text>
          <StatusChip label={`${emergencyContacts.length} contacts`} tone="info" />
        </View>
        {emergencyContacts.map((contact, index) => (
          <Pressable
            key={contact.id}
            onPress={() => void handleDial(contact.phone)}
            testID={`qa_guard_contact_row_${index}`}
            style={[
              styles.contactRow,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.contactCopy}>
              <Text
                style={[styles.contactLabel, { color: colors.foreground }]}
                testID={`qa_guard_contact_label_${index}`}
              >
                {contact.label}
              </Text>
              <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                {contact.role} - {contact.description}
              </Text>
              <Text style={[styles.phoneText, { color: colors.primary }]}>{contact.phone}</Text>
            </View>
            <View style={[styles.callIcon, { backgroundColor: colors.primary }]}>
              <PhoneCall color={colors.primaryForeground} size={18} />
            </View>
          </Pressable>
        ))}
      </InfoCard>

      {previewMode ? (
        <InfoCard>
          <View style={styles.headerRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent alert context</Text>
            <StatusChip label={`${sosEvents.length} total`} tone={sosEvents.length ? 'danger' : 'default'} />
          </View>
          {sosEvents.length ? (
            sosEvents.slice(0, 3).map((event) => (
              <View key={event.id} style={[styles.alertRow, { borderColor: colors.border }]}>
                <ShieldAlert color={event.status === 'queued' ? colors.warning : colors.destructive} size={18} />
                <View style={styles.alertCopy}>
                  <Text style={[styles.alertTitle, { color: colors.foreground }]}>
                    {event.alertType === 'panic' ? 'Manual panic alert' : 'Inactivity escalation'}
                  </Text>
                  <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                    {event.note || 'No note attached'} - {formatValue(event.recordedAt)}
                  </Text>
                </View>
                <StatusChip label={event.status} tone={event.status === 'queued' ? 'warning' : 'danger'} />
              </View>
            ))
          ) : (
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              No panic or inactivity alerts have been recorded in this session yet.
            </Text>
          )}
        </InfoCard>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  statusWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryText: {
    flex: 1,
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
    lineHeight: 22,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.base,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    gap: Spacing.base,
    padding: Spacing.base,
  },
  contactCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  contactLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  phoneText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.sm,
  },
  callIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    borderTopWidth: 1,
    paddingTop: Spacing.base,
  },
  alertCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  alertTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
});
