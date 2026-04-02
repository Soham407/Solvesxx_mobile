import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { PackageCheck } from 'lucide-react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { SupplierTabParamList } from '../../navigation/types';
import { useSupplierStore } from '../../store/useSupplierStore';
import type { SupplierIndentRecord } from '../../types/commerce';

type SupplierIndentsScreenProps = BottomTabScreenProps<SupplierTabParamList, 'SupplierIndents'>;

function formatValue(value: string | null) {
  if (!value) {
    return 'Flexible';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getStatusTone(status: SupplierIndentRecord['status']) {
  if (status === 'indent_rejected') {
    return 'danger';
  }

  if (status === 'bill_generated') {
    return 'success';
  }

  if (status === 'indent_forwarded') {
    return 'warning';
  }

  return 'info';
}

export function SupplierIndentsScreen(_props: SupplierIndentsScreenProps) {
  const { colors } = useAppTheme();
  const indents = useSupplierStore((state) => state.indents);
  const respondToIndent = useSupplierStore((state) => state.respondToIndent);
  const [message, setMessage] = useState<string | null>(null);

  const sortedIndents = useMemo(
    () =>
      [...indents].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    [indents],
  );

  return (
    <ScreenShell
      eyebrow="Supplier Indents"
      title="Indent review and response"
      description="Accept routed requests that you can fulfill, or reject them early so the buyer workflow does not stall."
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.copyWrap}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Incoming indent queue</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              Accepting an indent creates the supplier purchase order workflow in this mobile preview.
            </Text>
          </View>
          <PackageCheck color={colors.primary} size={22} />
        </View>
        {message ? <Text style={[styles.caption, { color: colors.primary }]}>{message}</Text> : null}
      </InfoCard>

      <InfoCard>
        {sortedIndents.length ? (
          sortedIndents.map((indent) => (
            <View key={indent.id} style={styles.indentCard}>
              <View style={styles.headerRow}>
                <View style={styles.copyWrap}>
                  <Text style={[styles.indentTitle, { color: colors.foreground }]}>{indent.title}</Text>
                  <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                    {indent.requestNumber} | {indent.categoryLabel} | {indent.locationName}
                  </Text>
                </View>
                <StatusChip label={indent.status.replace(/_/g, ' ')} tone={getStatusTone(indent.status)} />
              </View>
              <Text style={[styles.caption, { color: colors.foreground }]}>
                Preferred delivery: {formatValue(indent.preferredDeliveryDate)}
              </Text>
              <Text style={[styles.caption, { color: colors.foreground }]}>
                Scope: {indent.itemSummary}
              </Text>
              {indent.status === 'indent_forwarded' ? (
                <View style={styles.actionGroup}>
                  <ActionButton
                    label="Accept indent"
                    variant="secondary"
                    onPress={() => {
                      void respondToIndent(indent.id, 'accept');
                      setMessage(`${indent.requestNumber} accepted and moved to PO generation.`);
                    }}
                  />
                  <ActionButton
                    label="Reject indent"
                    variant="ghost"
                    onPress={() => {
                      void respondToIndent(indent.id, 'reject');
                      setMessage(`${indent.requestNumber} rejected from the supplier desk.`);
                    }}
                  />
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            No indents are waiting in the supplier inbox right now.
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
  indentCard: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  indentTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  actionGroup: {
    gap: Spacing.base,
  },
});
