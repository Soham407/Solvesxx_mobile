import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { AlertCircle, Shield, Siren } from 'lucide-react-native';

import { MetricCard } from '../../components/guard/MetricCard';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { SiteSupervisorTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useSiteSupervisorStore } from '../../store/useSiteSupervisorStore';

type SiteSupervisorHomeScreenProps = BottomTabScreenProps<
  SiteSupervisorTabParamList,
  'SiteSupervisorHome'
>;

export function SiteSupervisorHomeScreen({ navigation }: SiteSupervisorHomeScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const guardsOnDuty = useSiteSupervisorStore((state) => state.guardsOnDuty);
  const openIncidents = useSiteSupervisorStore((state) => state.openIncidents);
  const incidents = useSiteSupervisorStore((state) => state.incidents);
  const isLoading = useSiteSupervisorStore((state) => state.isLoading);
  const error = useSiteSupervisorStore((state) => state.error);
  const refresh = useSiteSupervisorStore((state) => state.refresh);

  const alertsRequiringResponse = useMemo(
    () =>
      incidents.filter(
        (incident) => !incident.acknowledged && (incident.severity === 'high' || incident.severity === 'medium'),
      ).length,
    [incidents],
  );

  return (
    <ScreenShell
      eyebrow="Site Supervisor"
      title="Site Overview"
      description="Track guard coverage, review live incidents, and move escalations forward from one mobile dashboard."
    >
      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Operational summary</Text>
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>Live counts for the current shift window.</Text>
        <View style={styles.actionsRow}>
          <ActionButton
            label={isLoading ? 'Refreshing...' : 'Refresh'}
            loading={isLoading}
            onPress={() => refresh(profile)}
            variant="secondary"
          />
          <ActionButton
            label="Guard Roster"
            onPress={() => navigation.navigate('SiteSupervisorGuards')}
            variant="ghost"
          />
        </View>
        {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
      </InfoCard>

      {isLoading ? (
        <InfoCard>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>Loading site overview...</Text>
        </InfoCard>
      ) : (
        <>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCell}>
              <MetricCard
                icon={<Shield color={colors.success} size={20} />}
                label="Guards on duty"
                value={String(guardsOnDuty)}
                caption="Currently active guard coverage"
              />
            </View>
            <View style={styles.metricCell}>
              <MetricCard
                icon={<AlertCircle color={colors.warning} size={20} />}
                label="Open incidents"
                value={String(openIncidents)}
                caption="Incidents pending closure"
              />
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCell}>
              <MetricCard
                icon={<Siren color={colors.destructive} size={20} />}
                label="Needs response"
                value={String(alertsRequiringResponse)}
                caption="Medium/high alerts not acknowledged"
              />
            </View>
            <View style={styles.metricCell}>
              <InfoCard>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick actions</Text>
                <View style={styles.quickActions}>
                  <ActionButton
                    label="Open Incidents"
                    variant="secondary"
                    onPress={() => navigation.navigate('SiteSupervisorActions')}
                  />
                </View>
              </InfoCard>
            </View>
          </View>
        </>
      )}
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
  errorText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  actionsRow: {
    gap: Spacing.base,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  metricCell: {
    flex: 1,
  },
  quickActions: {
    gap: Spacing.base,
  },
});
