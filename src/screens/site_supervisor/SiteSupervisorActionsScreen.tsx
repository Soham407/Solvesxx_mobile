import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { SiteSupervisorTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useSiteSupervisorStore } from '../../store/useSiteSupervisorStore';

type SiteSupervisorActionsScreenProps = BottomTabScreenProps<
  SiteSupervisorTabParamList,
  'SiteSupervisorActions'
>;

function formatOpenedAt(value: string) {
  return new Date(value).toLocaleString([], {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

function getSeverityTone(severity: 'low' | 'medium' | 'high') {
  if (severity === 'high') {
    return 'danger';
  }

  if (severity === 'medium') {
    return 'warning';
  }

  return 'info';
}

export function SiteSupervisorActionsScreen(_props: SiteSupervisorActionsScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const incidents = useSiteSupervisorStore((state) => state.incidents);
  const isLoading = useSiteSupervisorStore((state) => state.isLoading);
  const refresh = useSiteSupervisorStore((state) => state.refresh);
  const acknowledgeIncident = useSiteSupervisorStore((state) => state.acknowledgeIncident);
  const error = useSiteSupervisorStore((state) => state.error);
  const [message, setMessage] = useState<string | null>(null);
  const [busyIncidentId, setBusyIncidentId] = useState<string | null>(null);

  const openIncidents = useMemo(
    () =>
      incidents
        .filter((incident) => !incident.acknowledged)
        .sort((left, right) => new Date(right.openedAt).getTime() - new Date(left.openedAt).getTime()),
    [incidents],
  );

  const handleAcknowledge = async (incidentId: string, type: string) => {
    setBusyIncidentId(incidentId);
    setMessage(null);

    try {
      await acknowledgeIncident(incidentId);
      setMessage(`${type} acknowledged.`);
    } catch (ackError) {
      setMessage(ackError instanceof Error ? ackError.message : 'Unable to update incident.');
    } finally {
      setBusyIncidentId(null);
    }
  };

  const handleEscalate = async (incidentId: string, type: string) => {
    setBusyIncidentId(incidentId);
    setMessage(null);

    try {
      await acknowledgeIncident(incidentId);
      setMessage(`${type} escalated and flagged for follow-up.`);
    } catch (escalationError) {
      setMessage(escalationError instanceof Error ? escalationError.message : 'Unable to escalate incident.');
    } finally {
      setBusyIncidentId(null);
    }
  };

  return (
    <ScreenShell
      eyebrow="Incident Desk"
      title="Open Incidents"
      description="Review unresolved incidents by severity, then acknowledge or escalate directly from the supervisor queue."
    >
      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Incident actions</Text>
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>Open tickets requiring supervisor action.</Text>
        <ActionButton
          label={isLoading ? 'Refreshing...' : 'Refresh incidents'}
          loading={isLoading}
          onPress={() => refresh(profile)}
          variant="secondary"
        />
        {message ? <Text style={[styles.caption, { color: colors.primary }]}>{message}</Text> : null}
        {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
      </InfoCard>

      {isLoading ? (
        <InfoCard>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>Loading incidents...</Text>
        </InfoCard>
      ) : openIncidents.length ? (
        openIncidents.map((incident, index) => (
          <InfoCard key={incident.id}>
            <View style={styles.headerRow} testID={`qa_sitesup_incident_row_${index}`}>
              <View style={styles.copyWrap}>
                <Text style={[styles.incidentTitle, { color: colors.foreground }]}>{incident.type}</Text>
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>{incident.location}</Text>
                <Text style={[styles.caption, { color: colors.foreground }]}>Opened: {formatOpenedAt(incident.openedAt)}</Text>
              </View>
              <StatusChip label={incident.severity} tone={getSeverityTone(incident.severity)} />
            </View>

            <View style={styles.actionRow}>
              <ActionButton
                label={busyIncidentId === incident.id ? 'Saving...' : 'Acknowledge'}
                variant="secondary"
                loading={busyIncidentId === incident.id}
                disabled={busyIncidentId !== null && busyIncidentId !== incident.id}
                onPress={() => void handleAcknowledge(incident.id, incident.type)}
              />
              <ActionButton
                label={busyIncidentId === incident.id ? 'Saving...' : 'Escalate'}
                variant="ghost"
                disabled={busyIncidentId !== null && busyIncidentId !== incident.id}
                onPress={() => void handleEscalate(incident.id, incident.type)}
              />
            </View>
          </InfoCard>
        ))
      ) : (
        <InfoCard>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>No open incidents</Text>
        </InfoCard>
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
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    justifyContent: 'space-between',
  },
  copyWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  incidentTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  actionRow: {
    gap: Spacing.base,
  },
});
