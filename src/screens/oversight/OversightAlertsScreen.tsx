import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ShieldAlert, Siren } from 'lucide-react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { OversightTabParamList } from '../../navigation/types';
import { useOversightStore } from '../../store/useOversightStore';

type OversightAlertsScreenProps = BottomTabScreenProps<OversightTabParamList, 'OversightAlerts'>;

function formatValue(value: string) {
  return new Date(value).toLocaleString([], {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

export function OversightAlertsScreen(_props: OversightAlertsScreenProps) {
  const { colors } = useAppTheme();
  const alerts = useOversightStore((state) => state.alerts);
  const acknowledgeAlert = useOversightStore((state) => state.acknowledgeAlert);
  const resolveAlert = useOversightStore((state) => state.resolveAlert);
  const [message, setMessage] = useState<string | null>(null);

  const orderedAlerts = useMemo(
    () =>
      [...alerts].sort((left, right) => {
        const score = { active: 0, acknowledged: 1, resolved: 2 };
        return score[left.status] - score[right.status];
      }),
    [alerts],
  );
  const activeCount = alerts.filter((alert) => alert.status === 'active').length;

  return (
    <ScreenShell
      eyebrow="Alert Centre"
      title="Panic Log Feed"
      description="Review active panic, inactivity, and geo-fence incidents, then acknowledge or resolve them from the mobile control flow."
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.copyWrap}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Incident pulse</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              {activeCount} active incident{activeCount === 1 ? '' : 's'} need attention.
            </Text>
          </View>
          <StatusChip
            label={activeCount ? 'Escalated' : 'Stable'}
            tone={activeCount ? 'danger' : 'success'}
          />
        </View>
        {message ? <Text style={[styles.caption, { color: colors.primary }]}>{message}</Text> : null}
      </InfoCard>

      {orderedAlerts.length ? (
        orderedAlerts.map((alert) => (
          <InfoCard key={alert.id}>
            <View style={styles.headerRow}>
              <View style={styles.copyWrap}>
                <Text style={[styles.alertTitle, { color: colors.foreground }]}>
                  {alert.guardName} - {alert.locationName}
                </Text>
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                  {alert.note} - {formatValue(alert.createdAt)}
                </Text>
              </View>
              <StatusChip
                label={alert.status}
                tone={
                  alert.status === 'active'
                    ? 'danger'
                    : alert.status === 'acknowledged'
                      ? 'warning'
                      : 'success'
                }
              />
            </View>
            <View style={styles.metaRow}>
              <StatusChip
                label={alert.alertType.replace(/_/g, ' ')}
                tone={alert.alertType === 'panic' ? 'danger' : 'warning'}
              />
              <View style={styles.iconRow}>
                {alert.alertType === 'panic' ? (
                  <Siren color={colors.destructive} size={18} />
                ) : (
                  <ShieldAlert color={colors.warning} size={18} />
                )}
                <Text style={[styles.caption, { color: colors.foreground }]}>
                  Guard code path is ready for supervisor acknowledgement.
                </Text>
              </View>
            </View>
            <View style={styles.actionRow}>
              <ActionButton
                label="Acknowledge"
                variant="secondary"
                disabled={alert.status !== 'active'}
                onPress={() => {
                  void acknowledgeAlert(alert.id);
                  setMessage(`Alert acknowledged for ${alert.guardName}.`);
                }}
              />
              <ActionButton
                label="Resolve"
                variant="ghost"
                disabled={alert.status === 'resolved'}
                onPress={() => {
                  void resolveAlert(alert.id);
                  setMessage(`Alert resolved for ${alert.guardName}.`);
                }}
              />
            </View>
          </InfoCard>
        ))
      ) : (
        <InfoCard>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>No incidents in the log</Text>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            Fresh panic, inactivity, and geo-fence alerts will surface here as soon as the oversight feed receives them.
          </Text>
        </InfoCard>
      )}
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
  alertTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  metaRow: {
    gap: Spacing.base,
  },
  iconRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionRow: {
    gap: Spacing.base,
  },
});
