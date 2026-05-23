import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { SuperAdminTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useSuperAdminStore } from '../../store/useSuperAdminStore';

type SuperAdminCompaniesScreenProps = BottomTabScreenProps<SuperAdminTabParamList, 'SuperAdminCompanies'>;

function formatLastActivity(value: string) {
  if (!value) {
    return 'No recent activity';
  }

  return new Date(value).toLocaleString([], {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

export function SuperAdminCompaniesScreen({ navigation }: SuperAdminCompaniesScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const hasHydrated = useSuperAdminStore((state) => state.hasHydrated);
  const companies = useSuperAdminStore((state) => state.companies);
  const refresh = useSuperAdminStore((state) => state.refresh);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const orderedCompanies = useMemo(
    () =>
      [...companies].sort((left, right) => {
        const healthOrder = { critical: 0, warning: 1, healthy: 2 } as const;
        const byHealth = healthOrder[left.health] - healthOrder[right.health];

        if (byHealth !== 0) {
          return byHealth;
        }

        return left.companyName.localeCompare(right.companyName);
      }),
    [companies],
  );

  if (!hasHydrated) {
    return <LoadingScreen message="Loading companies..." />;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await refresh(profile);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ScreenShell
      eyebrow="Super Admin"
      title="All Companies"
      description="Monitor company health signals including footprint, active users, and latest activity windows."
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.copyWrap}>
            <Text style={[styles.heading, { color: colors.foreground }]}>Company registry</Text>
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>
              {orderedCompanies.length} companies tracked
            </Text>
          </View>
          <StatusChip
            label={orderedCompanies.some((company) => company.health === 'critical') ? 'Critical present' : 'Stable'}
            tone={orderedCompanies.some((company) => company.health === 'critical') ? 'danger' : 'success'}
          />
        </View>
        <View style={styles.actions}>
          <ActionButton
            label={isRefreshing ? 'Refreshing...' : 'Refresh company health'}
            loading={isRefreshing}
            onPress={() => void handleRefresh()}
          />
          <ActionButton
            label="Back to overview"
            variant="secondary"
            onPress={() => navigation.navigate('SuperAdminHome')}
          />
        </View>
      </InfoCard>

      {orderedCompanies.length ? (
        orderedCompanies.map((company) => (
          <InfoCard key={company.id}>
            <View style={styles.headerRow}>
              <View style={styles.copyWrap}>
                <Text style={[styles.companyName, { color: colors.foreground }]}>{company.companyName}</Text>
                <Text style={[styles.copy, { color: colors.mutedForeground }]}>Last activity: {formatLastActivity(company.lastActivityAt)}</Text>
              </View>
              <StatusChip
                label={company.health}
                tone={
                  company.health === 'critical'
                    ? 'danger'
                    : company.health === 'warning'
                      ? 'warning'
                      : 'success'
                }
              />
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Locations</Text>
              <Text style={[styles.value, { color: colors.foreground }]}>{company.locationCount}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Active users</Text>
              <Text style={[styles.value, { color: colors.foreground }]}>{company.activeUserCount}</Text>
            </View>
          </InfoCard>
        ))
      ) : (
        <InfoCard>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>No companies registered</Text>
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
  heading: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
  },
  companyName: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  copy: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  actions: {
    gap: Spacing.base,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
  },
  value: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
});
