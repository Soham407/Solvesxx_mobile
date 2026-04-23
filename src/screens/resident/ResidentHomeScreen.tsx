import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { BellRing, Clock3, DoorOpen } from 'lucide-react-native';

import { MetricCard } from '../../components/guard/MetricCard';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { PreviewModeBanner } from '../../components/shared/PreviewModeBanner';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { fetchResidentPendingVisitors, isPreviewProfile } from '../../lib/mobileBackend';
import type { ResidentTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useGuardStore } from '../../store/useGuardStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useResidentPresenceStore } from '../../store/useResidentPresenceStore';

type ResidentHomeScreenProps = BottomTabScreenProps<ResidentTabParamList, 'ResidentHome'>;

function formatTime(value: string | null) {
  if (!value) {
    return 'No pending approvals';
  }

  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ResidentHomeScreen({ navigation }: ResidentHomeScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const signOut = useAppStore((state) => state.signOut);
  const previewVisitorLog = useGuardStore((state) => state.visitorLog);
  const inbox = useNotificationStore((state) => state.inbox);
  const activeResidents = useResidentPresenceStore((state) => state.members);
  const hasLiveSync = useResidentPresenceStore((state) => state.hasLiveSync);
  const firstName = profile?.fullName?.split(' ')[0] ?? 'Resident';
  const previewMode = isPreviewProfile(profile);

  const visitorsQuery = useQuery({
    queryKey: ['resident', 'pending-visitors', profile?.userId],
    queryFn: fetchResidentPendingVisitors,
    enabled: Boolean(profile?.userId) && !previewMode,
    refetchInterval: hasLiveSync ? false : 30000,
  });

  const pendingVisitors = useMemo(
    () =>
      (previewMode
        ? previewVisitorLog.map((visitor) => ({
            approvalDeadlineAt: visitor.approvalDeadlineAt,
            approvalStatus: visitor.approvalStatus,
            isFrequentVisitor: visitor.frequentVisitor,
          }))
        : visitorsQuery.data ?? []
      ).filter((visitor) => visitor.approvalStatus === 'pending'),
    [previewMode, previewVisitorLog, visitorsQuery.data],
  );
  const nextDeadline = pendingVisitors
    .map((visitor) => visitor.approvalDeadlineAt)
    .filter((value): value is string => Boolean(value))
    .sort()[0] ?? null;
  const frequentVisitors = useMemo(
    () =>
      (previewMode
        ? previewVisitorLog.map((visitor) => ({
            isFrequentVisitor: visitor.frequentVisitor,
          }))
        : visitorsQuery.data ?? []
      ).filter((visitor) => visitor.isFrequentVisitor).length,
    [previewMode, previewVisitorLog, visitorsQuery.data],
  );

  const totalInboxCount = previewMode ? previewVisitorLog.length : (visitorsQuery.data?.length ?? 0);
  const unreadAlerts = inbox.filter((entry) => entry.readAt === null).length;

  return (
    <ScreenShell
      eyebrow="Resident Access"
      title={`Welcome back, ${firstName}`}
      description="Handle gate approvals quickly and keep track of important updates from your society."
    >
      {previewMode ? (
        <PreviewModeBanner description="This resident session is running in preview/test mode. Visitor and notification data may come from preview state instead of live backend records." />
      ) : null}

      <InfoCard>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>
          Visitors waiting at your gate
        </Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>
          Review new entries, approve expected guests, and deny anything unfamiliar from one place.
        </Text>
        <View style={styles.actionGroup}>
          <ActionButton
            label="Review visitor approvals"
            testID="qa_resident_open_approvals"
            onPress={() => navigation.navigate('ResidentApprovals')}
          />
          <ActionButton
            label="Open alerts and updates"
            variant="secondary"
            testID="qa_resident_open_alerts"
            onPress={() => navigation.navigate('ResidentNotifications')}
          />
        </View>
      </InfoCard>

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Live household sync</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>
          {hasLiveSync
            ? activeResidents.length
              ? `${activeResidents.map((resident) => resident.fullName).join(', ')} ${
                  activeResidents.length === 1 ? 'is' : 'are'
                } also online for this flat.`
              : 'Live updates are connected. You are the only active resident right now.'
            : 'Live updates reconnect automatically when your resident session is online.'}
        </Text>
      </InfoCard>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<DoorOpen color={colors.primary} size={20} />}
            label="Waiting approvals"
            value={String(pendingVisitors.length)}
            caption="Visitors currently waiting at the gate"
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<Clock3 color={colors.warning} size={20} />}
            label="Next deadline"
            value={formatTime(nextDeadline)}
            caption="Earliest visitor waiting on your answer"
          />
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<BellRing color={colors.info} size={20} />}
            label="Unread alerts"
            value={String(unreadAlerts)}
            caption="Updates you have not opened yet"
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<DoorOpen color={colors.success} size={20} />}
            label="Trusted visitors"
            value={String(frequentVisitors)}
            caption="People you marked for faster repeat decisions"
          />
        </View>
      </View>

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>
          Sign out when you finish testing this resident account.
        </Text>
        <ActionButton
          label="Sign out"
          variant="ghost"
          testID="qa_resident_sign_out"
          onPress={() => void signOut()}
        />
      </InfoCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heroTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['2xl'],
    lineHeight: 30,
  },
  copy: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  actionGroup: {
    gap: Spacing.base,
  },
  sectionTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  metricCell: {
    flex: 1,
  },
});
