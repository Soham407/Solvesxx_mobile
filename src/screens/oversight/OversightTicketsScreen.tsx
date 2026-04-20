import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { PackageSearch, ShieldAlert } from 'lucide-react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { FormField } from '../../components/shared/FormField';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { OversightTabParamList } from '../../navigation/types';
import { useOversightStore } from '../../store/useOversightStore';
import type { OversightSeverity, OversightTicketRecord, OversightTicketType } from '../../types/oversight';

type OversightTicketsScreenProps = BottomTabScreenProps<
  OversightTabParamList,
  'OversightTickets'
>;

const TICKET_TYPE_OPTIONS: Array<{ label: string; value: OversightTicketType }> = [
  { label: 'Behavior', value: 'behavior' },
  { label: 'Quality', value: 'material_quality' },
  { label: 'Quantity', value: 'material_quantity' },
  { label: 'Return', value: 'return' },
];

const SEVERITY_OPTIONS: Array<{ label: string; value: OversightSeverity }> = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

function formatValue(value: string) {
  return new Date(value).toLocaleString([], {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

function parseNumericValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function getStatusTone(status: OversightTicketRecord['status']) {
  if (status === 'open') {
    return 'danger';
  }

  if (status === 'acknowledged') {
    return 'warning';
  }

  return 'success';
}

function getSeverityTone(severity: OversightTicketRecord['severity']) {
  if (severity === 'critical' || severity === 'high') {
    return 'danger';
  }

  if (severity === 'medium') {
    return 'warning';
  }

  return 'info';
}

function getTypeLabel(type: OversightTicketType) {
  return TICKET_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function OversightTicketsScreen(_props: OversightTicketsScreenProps) {
  const { colors } = useAppTheme();
  const tickets = useOversightStore((state) => state.tickets);
  const createTicket = useOversightStore((state) => state.createTicket);
  const setTicketStatus = useOversightStore((state) => state.setTicketStatus);

  const [ticketType, setTicketType] = useState<OversightTicketType>('behavior');
  const [severity, setSeverity] = useState<OversightSeverity>('medium');
  const [subjectName, setSubjectName] = useState('');
  const [category, setCategory] = useState('');
  const [locationName, setLocationName] = useState('');
  const [note, setNote] = useState('');
  const [evidenceUri, setEvidenceUri] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [orderedQuantity, setOrderedQuantity] = useState('');
  const [receivedQuantity, setReceivedQuantity] = useState('');
  const [returnQuantity, setReturnQuantity] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sortedTickets = useMemo(
    () =>
      [...tickets].sort((left, right) => {
        const score = { open: 0, acknowledged: 1, closed: 2 };
        const statusDelta = score[left.status] - score[right.status];

        if (statusDelta !== 0) {
          return statusDelta;
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }),
    [tickets],
  );

  const showMaterialFields = ticketType !== 'behavior';
  const showReturnField = ticketType === 'return';

  const handleCreateTicket = async () => {
    if (!subjectName.trim() || !category.trim() || !note.trim()) {
      setMessage('Subject, category, and note are required before creating a ticket.');
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const parsedOrderedQuantity = showMaterialFields ? parseNumericValue(orderedQuantity) : null;
      const parsedReceivedQuantity = showMaterialFields ? parseNumericValue(receivedQuantity) : null;
      const parsedReturnQuantity = showReturnField ? parseNumericValue(returnQuantity) : null;

      if (showMaterialFields && (parsedOrderedQuantity === null || parsedReceivedQuantity === null)) {
        setMessage('Ordered and received quantities are required for material tickets.');
        return;
      }

      if (
        showMaterialFields &&
        parsedOrderedQuantity !== null &&
        parsedReceivedQuantity !== null &&
        parsedReceivedQuantity > parsedOrderedQuantity
      ) {
        setMessage('Received quantity cannot be higher than ordered quantity in this workflow.');
        return;
      }

      if (showReturnField && parsedReturnQuantity === null) {
        setMessage('Return quantity is required when the ticket type is return.');
        return;
      }

      await createTicket({
        ticketType,
        subjectName: subjectName.trim(),
        category: category.trim(),
        severity,
        note: note.trim(),
        evidenceUri: evidenceUri.trim() || null,
        batchNumber: showMaterialFields ? batchNumber.trim() || undefined : undefined,
        orderedQuantity: parsedOrderedQuantity,
        receivedQuantity: parsedReceivedQuantity,
        returnQuantity: parsedReturnQuantity,
        locationName: locationName.trim() || null,
      });

      setSubjectName('');
      setCategory('');
      setLocationName('');
      setNote('');
      setEvidenceUri('');
      setBatchNumber('');
      setOrderedQuantity('');
      setReceivedQuantity('');
      setReturnQuantity('');
      setMessage('Issue ticket created and added to the oversight queue.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenShell
      eyebrow="Issue Desk"
      title="Behavior and material tickets"
      description="Capture guard discipline issues, damaged materials, shortages, and return exceptions directly from the oversight workflow."
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.copyWrap}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Create a new ticket</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              Use the same reporting flow for staff behavior and material discrepancy follow-up.
            </Text>
          </View>
          <ShieldAlert color={colors.destructive} size={22} />
        </View>
        {message ? (
          <Text style={[styles.caption, { color: colors.primary }]} testID="qa_oversight_tickets_message">
            {message}
          </Text>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Ticket type</Text>
          <View style={styles.selectorWrap}>
            {TICKET_TYPE_OPTIONS.map((option) => {
              const isSelected = option.value === ticketType;

              return (
                <Pressable
                  key={option.value}
                  testID={`qa_oversight_ticket_type_${option.value}`}
                  accessibilityRole="button"
                  onPress={() => setTicketType(option.value)}
                  style={[
                    styles.selectorButton,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.secondary,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectorLabel,
                      {
                        color: isSelected ? colors.primaryForeground : colors.foreground,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Severity</Text>
          <View style={styles.selectorWrap}>
            {SEVERITY_OPTIONS.map((option) => {
              const isSelected = option.value === severity;

              return (
                <Pressable
                  key={option.value}
                  testID={`qa_oversight_ticket_severity_${option.value}`}
                  accessibilityRole="button"
                  onPress={() => setSeverity(option.value)}
                  style={[
                    styles.selectorButton,
                    {
                      backgroundColor: isSelected ? colors.warning : colors.secondary,
                      borderColor: isSelected ? colors.warning : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectorLabel,
                      {
                        color: isSelected ? colors.warningForeground : colors.foreground,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <FormField
          inputTestID="qa_oversight_ticket_subject"
          label={ticketType === 'behavior' ? 'Guard or staff name' : 'Material or item name'}
          onChangeText={setSubjectName}
          placeholder={ticketType === 'behavior' ? 'Ritu Nair' : 'Lobby sanitiser refill'}
          value={subjectName}
        />
        <FormField
          inputTestID="qa_oversight_ticket_category"
          label="Category"
          onChangeText={setCategory}
          placeholder={ticketType === 'behavior' ? 'Uniform non-compliance' : 'Damaged seal'}
          value={category}
        />
        <FormField
          inputTestID="qa_oversight_ticket_location"
          label="Location"
          onChangeText={setLocationName}
          placeholder="North Gate"
          value={locationName}
        />
        <FormField
          inputTestID="qa_oversight_ticket_note"
          label="Note"
          multiline
          onChangeText={setNote}
          placeholder="Describe what happened and what needs follow-up."
          style={styles.multilineField}
          textAlignVertical="top"
          value={note}
        />
        <FormField
          inputTestID="qa_oversight_ticket_evidence"
          helperText="Optional reference while camera upload is still in a later phase."
          label="Evidence reference"
          onChangeText={setEvidenceUri}
          placeholder="photo://ticket-1"
          value={evidenceUri}
        />

        {showMaterialFields ? (
          <View style={styles.materialSection}>
            <View style={styles.headerRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Material details</Text>
              <PackageSearch color={colors.info} size={20} />
            </View>
            <FormField
              inputTestID="qa_oversight_ticket_batch_number"
              label="Batch number"
              onChangeText={setBatchNumber}
              placeholder="BATCH-AC-119"
              value={batchNumber}
            />
            <View style={styles.twoColumnRow}>
              <View style={styles.column}>
                <FormField
                  inputTestID="qa_oversight_ticket_ordered_qty"
                  keyboardType="number-pad"
                  label="Ordered qty"
                  onChangeText={setOrderedQuantity}
                  placeholder="40"
                  value={orderedQuantity}
                />
              </View>
              <View style={styles.column}>
                <FormField
                  inputTestID="qa_oversight_ticket_received_qty"
                  keyboardType="number-pad"
                  label="Received qty"
                  onChangeText={setReceivedQuantity}
                  placeholder="36"
                  value={receivedQuantity}
                />
              </View>
            </View>
            {showReturnField ? (
              <FormField
                inputTestID="qa_oversight_ticket_return_qty"
                keyboardType="number-pad"
                label="Return qty"
                onChangeText={setReturnQuantity}
                placeholder="4"
                value={returnQuantity}
              />
            ) : null}
          </View>
        ) : null}

        <ActionButton
          label={isSaving ? 'Saving...' : 'Create ticket'}
          loading={isSaving}
          onPress={() => void handleCreateTicket()}
          testID="qa_oversight_create_ticket"
        />
      </InfoCard>

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Open oversight queue</Text>
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>
          Tickets are ordered so the unresolved items stay at the top for quick follow-up.
        </Text>
        {sortedTickets.length ? (
          sortedTickets.map((ticket, index) => (
            <View key={ticket.id} style={styles.ticketCard} testID={`qa_oversight_ticket_card_${index}`}>
              <View style={styles.headerRow}>
                <View style={styles.copyWrap}>
                  <Text
                    style={[styles.ticketTitle, { color: colors.foreground }]}
                    testID={`qa_oversight_ticket_title_${index}`}
                  >
                    {ticket.subjectName}
                  </Text>
                  <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                    {getTypeLabel(ticket.ticketType)} | {ticket.category} | {formatValue(ticket.createdAt)}
                  </Text>
                </View>
                <View style={styles.ticketStatusWrap}>
                  <View testID={`qa_oversight_ticket_status_${index}`}>
                    <StatusChip label={ticket.status} tone={getStatusTone(ticket.status)} />
                  </View>
                  <StatusChip label={ticket.severity} tone={getSeverityTone(ticket.severity)} />
                </View>
              </View>
              <Text style={[styles.caption, { color: colors.foreground }]}>{ticket.note}</Text>
              {ticket.locationName ? (
                <Text style={[styles.caption, { color: colors.foreground }]}>
                  Location: {ticket.locationName}
                </Text>
              ) : null}
              {ticket.batchNumber ? (
                <Text style={[styles.caption, { color: colors.foreground }]}>
                  Batch: {ticket.batchNumber}
                </Text>
              ) : null}
              {ticket.orderedQuantity !== null || ticket.receivedQuantity !== null ? (
                <Text style={[styles.caption, { color: colors.foreground }]}>
                  Ordered: {ticket.orderedQuantity ?? '-'} | Received: {ticket.receivedQuantity ?? '-'} |
                  Shortage: {ticket.shortageQuantity ?? '-'}
                  {ticket.returnQuantity !== null ? ` | Return: ${ticket.returnQuantity}` : ''}
                </Text>
              ) : null}
              {ticket.evidenceUri ? (
                <Text style={[styles.caption, { color: colors.foreground }]}>
                  Evidence: {ticket.evidenceUri}
                </Text>
              ) : null}
              <View style={styles.actionButtonRow}>
                <ActionButton
                  label="Acknowledge"
                  variant="secondary"
                  testID={`qa_oversight_ticket_acknowledge_${index}`}
                  disabled={ticket.status !== 'open'}
                  onPress={() => {
                    void setTicketStatus(ticket.id, 'acknowledged');
                    setMessage(`Ticket acknowledged for ${ticket.subjectName}.`);
                  }}
                />
                <ActionButton
                  label="Close"
                  variant="ghost"
                  testID={`qa_oversight_ticket_close_${index}`}
                  disabled={ticket.status === 'closed'}
                  onPress={() => {
                    void setTicketStatus(ticket.id, 'closed');
                    setMessage(`Ticket closed for ${ticket.subjectName}.`);
                  }}
                />
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            No behavior or material tickets have been raised in this oversight session yet.
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
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  selectorLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
  },
  multilineField: {
    minHeight: 120,
    paddingTop: Spacing.base,
  },
  materialSection: {
    gap: Spacing.base,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  column: {
    flex: 1,
  },
  ticketCard: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  ticketTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  ticketStatusWrap: {
    gap: Spacing.sm,
  },
  actionButtonRow: {
    gap: Spacing.base,
  },
});
