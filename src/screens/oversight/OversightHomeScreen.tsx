import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { AlertTriangle, ClipboardList, ShieldCheck, Users } from 'lucide-react-native';

import { MetricCard } from '../../components/guard/MetricCard';
import { StatusChip } from '../../components/guard/StatusChip';
import { LiveGuardBoard } from '../../components/oversight/LiveGuardBoard';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { NotificationInboxCard } from '../../components/shared/NotificationInboxCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { OversightTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useOversightStore } from '../../store/useOversightStore';

type OversightHomeScreenProps = BottomTabScreenProps<OversightTabParamList, 'OversightHome'>;

const ROLE_COPY = {
  security_supervisor: {
    eyebrow: 'Security Supervision',
    title: 'Operations Control Room',
    description:
      'Track guard movement, active alerts, and shift compliance from one mobile command view.',
  },
  society_manager: {
    eyebrow: 'Society Management',
    title: 'Site Oversight Hub',
    description:
      'Monitor staff discipline, visitor flow, and unresolved incidents across the property.',
  },
} as const;

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

export function OversightHomeScreen(_props: OversightHomeScreenProps) {
  const { colors } = useAppTheme();
  const signOut = useAppStore((state) => state.signOut);
  const role = useOversightStore((state) => state.role);
  const guards = useOversightStore((state) => state.guards);
  const alerts = useOversightStore((state) => state.alerts);
  const visitorStats = useOversightStore((state) => state.visitorStats);
  const tickets = useOversightStore((state) => state.tickets);
  const refreshedAt = useOversightStore((state) => state.refreshedAt);
  const refreshFeed = useOversightStore((state) => state.refreshFeed);
  const [message, setMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const copy = ROLE_COPY[role];
  const guardsOnDuty = useMemo(
    () => guards.filter((guard) => guard.status === 'on_duty' || guard.status === 'breach').length,
    [guards],
  );
  const activeAlerts = useMemo(
    () => alerts.filter((alert) => alert.status !== 'resolved').length,
    [alerts],
  );
  const checklistPercent = useMemo(() => {
    const total = guards.reduce((sum, guard) => sum + guard.checklistTotal, 0);
    const completed = guards.reduce((sum, guard) => sum + guard.checklistCompleted, 0);

    if (!total) {
      return 0;
    }

    return Math.round((completed / total) * 100);
  }, [guards]);
  const visitorsToday = useMemo(
    () => visitorStats.reduce((sum, gate) => sum + gate.visitorsToday, 0),
    [visitorStats],
  );
  const openTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status !== 'closed').length,
    [tickets],
  );
  const attentionItems = useMemo(
    () =>
      guards.filter(
        (guard) =>
          guard.status === 'breach' ||
          guard.status === 'offline' ||
          guard.checklistCompleted < guard.checklistTotal,
      ),
    [guards],
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setMessage(null);

    try {
      await refreshFeed();
      setMessage('Live guard feed refreshed for the latest patrol snapshot.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ScreenShell eyebrow={copy.eyebrow} title={copy.title} description={copy.description}>
      <InfoCard>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              {role === 'security_supervisor'
                ? 'Shift status is live'
                : 'Operations are visible at a glance'}
            </Text>
            <Text style={[styles.heroText, { color: colors.mutedForeground }]}>
              Last refresh: {formatValue(refreshedAt)}
            </Text>
          </View>
          <StatusChip
            label={activeAlerts ? `${activeAlerts} live alerts` : 'All clear'}
            tone={activeAlerts ? 'danger' : 'success'}
          />
        </View>
        {message ? <Text style={[styles.heroText, { color: colors.primary }]}>{message}</Text> : null}
        <View style={styles.actionGroup}>
          <ActionButton
            label={isRefreshing ? 'Refreshing...' : 'Refresh feed'}
            loading={isRefreshing}
            onPress={() => void handleRefresh()}
          />
          <ActionButton label="Sign out" variant="ghost" onPress={() => void signOut()} />
        </View>
      </InfoCard>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<Users color={colors.primary} size={20} />}
            label="Guards on site"
            value={String(guardsOnDuty)}
            caption={`${guards.length} total assigned guards`}
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<AlertTriangle color={colors.destructive} size={20} />}
            label="Open alerts"
            value={String(activeAlerts)}
            caption="Panic, inactivity, and geo-fence issues"
          />
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<ClipboardList color={colors.info} size={20} />}
            label="Checklist rate"
            value={`${checklistPercent}%`}
            caption="Completion across active guards"
          />
        </View>
        <View style={styles.metricCell}>
          <MetricCard
            icon={<ShieldCheck color={colors.warning} size={20} />}
            label="Visitors today"
            value={String(visitorsToday)}
            caption={`${openTickets} active issue tickets`}
          />
        </View>
      </View>

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Live guard location board</Text>
        <Text style={[styles.heroText, { color: colors.mutedForeground }]}>
          This approximates the active site map using the latest guard positions and patrol status.
        </Text>
        <LiveGuardBoard guards={guards} />
      </InfoCard>

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Needs attention</Text>
        {attentionItems.length ? (
          attentionItems.slice(0, 4).map((item) => (
            <View key={item.id} style={styles.alertRow}>
              <View style={styles.alertCopy}>
                <Text style={[styles.alertTitle, { color: colors.foreground }]}>{item.guardName}</Text>
                <Text style={[styles.heroText, { color: colors.mutedForeground }]}>
                  {item.assignedLocationName} - {item.checklistCompleted}/{item.checklistTotal}{' '}
                  checklist items
                </Text>
              </View>
              <StatusChip
                label={item.status.replace(/_/g, ' ')}
                tone={
                  item.status === 'on_duty'
                    ? 'success'
                    : item.status === 'offline'
                      ? 'warning'
                      : 'danger'
                }
              />
            </View>
          ))
        ) : (
          <Text style={[styles.heroText, { color: colors.mutedForeground }]}>
            Nothing critical is waiting for supervisor review right now.
          </Text>
        )}
      </InfoCard>

      <NotificationInboxCard
        title="Control-room notifications"
        description="Phase 7 previews the live alert routes that reach supervisors and managers with push delivery and fallback logic."
        actions={[
          {
            label: 'Preview SOS alert',
            route: 'sos_alert',
            variant: 'secondary',
          },
          {
            label: 'Preview inactivity alert',
            route: 'inactivity_alert',
            variant: 'ghost',
          },
          {
            label: 'Preview low stock alert',
            route: 'low_stock_alert',
            variant: 'ghost',
          },
        ]}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    flexDirection: 'row',
    gap: Spacing.base,
    justifyContent: 'space-between',
  },
  heroCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  heroTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['2xl'],
    lineHeight: 30,
  },
  heroText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  actionGroup: {
    gap: Spacing.base,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  metricCell: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
  },
  alertRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    justifyContent: 'space-between',
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
