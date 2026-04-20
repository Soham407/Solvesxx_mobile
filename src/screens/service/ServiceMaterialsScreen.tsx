import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Package } from 'lucide-react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { FormField } from '../../components/shared/FormField';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { ServiceTabParamList } from '../../navigation/types';
import { getOrderedServiceTasks, useServiceStore } from '../../store/useServiceStore';
import type { ServiceMaterialRequest, ServiceRole } from '../../types/service';

type ServiceMaterialsScreenProps = BottomTabScreenProps<ServiceTabParamList, 'ServiceMaterials'>;

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function getRoleCopy(role: ServiceRole) {
  switch (role) {
    case 'ac_technician':
      return {
        title: 'Parts and equipment supply',
        helper: 'Request spare parts, then issue approved stock back into the open work order.',
        label: 'Part label',
      };
    case 'pest_control_technician':
      return {
        title: 'Chemical request queue',
        helper: 'Pest-control jobs can only continue once the required chemical request is approved.',
        label: 'Chemical name',
      };
    case 'delivery_boy':
      return {
        title: 'Delivery manifest',
        helper: 'Delivery roles do not raise material requests here. This tab stays focused on handoff notes and movement context.',
        label: 'Manifest item',
      };
    default:
      return {
        title: 'Supply requests',
        helper: 'Raise small supply requests and issue approved stock back into the task flow.',
        label: 'Supply item',
      };
  }
}

function getStatusTone(status: ServiceMaterialRequest['status']) {
  if (status === 'issued') {
    return 'success';
  }

  if (status === 'approved') {
    return 'info';
  }

  return 'warning';
}

export function ServiceMaterialsScreen(_props: ServiceMaterialsScreenProps) {
  const { colors } = useAppTheme();
  const role = useServiceStore((state) => state.role);
  const tasks = useServiceStore((state) => state.tasks);
  const materialRequests = useServiceStore((state) => state.materialRequests);
  const submitMaterialRequest = useServiceStore((state) => state.submitMaterialRequest);
  const markMaterialIssued = useServiceStore((state) => state.markMaterialIssued);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const roleCopy = getRoleCopy(role);
  const orderedTasks = useMemo(() => getOrderedServiceTasks(tasks), [tasks]);
  const activeTasks = useMemo(
    () =>
      orderedTasks.filter((task) => task.status !== 'completed' && task.status !== 'delivered'),
    [orderedTasks],
  );
  const orderedRequests = useMemo(
    () =>
      [...materialRequests].sort(
        (left, right) =>
          new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime(),
      ),
    [materialRequests],
  );

  useEffect(() => {
    if (!activeTasks.length) {
      if (selectedTaskId !== null) {
        setSelectedTaskId(null);
      }

      return;
    }

    const hasCurrentSelection = activeTasks.some((task) => task.id === selectedTaskId);

    if (!hasCurrentSelection) {
      setSelectedTaskId(activeTasks[0]?.id ?? null);
    }
  }, [activeTasks, selectedTaskId]);

  const handleSubmit = async () => {
    const parsedQuantity = Math.round(Number(quantity.trim()));

    if (!selectedTaskId) {
      setMessage('Select a task before sending the request.');
      return;
    }

    if (!label.trim()) {
      setMessage('Add the item label before submitting the request.');
      return;
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setMessage('Quantity must be a positive whole number.');
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const result = await submitMaterialRequest({
        taskId: selectedTaskId,
        label: label.trim(),
        quantity: parsedQuantity,
        unit: unit.trim(),
        note: note.trim(),
      });

      setMessage(
        result.submitted
          ? 'Material request submitted. Use the Home tab refresh to simulate manager approval.'
          : 'This request could not be attached to the selected task.',
      );

      if (result.submitted) {
        setLabel('');
        setQuantity('1');
        setUnit('');
        setNote('');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenShell
      eyebrow="Service Materials"
      title={roleCopy.title}
      description={roleCopy.helper}
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.copyWrap}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Material controls</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>{roleCopy.helper}</Text>
          </View>
          <Package color={colors.primary} size={22} />
        </View>
        {message ? (
          <Text style={[styles.caption, { color: colors.primary }]} testID="qa_service_materials_message">
            {message}
          </Text>
        ) : null}
      </InfoCard>

      {role !== 'delivery_boy' ? (
        <InfoCard>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>New request</Text>
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Select task</Text>
            <View style={styles.selectorWrap}>
              {activeTasks.length ? (
                activeTasks.map((task, index) => {
                  const isSelected = task.id === selectedTaskId;

                  return (
                    <Pressable
                      key={task.id}
                      testID={`qa_service_material_task_${index}`}
                      accessibilityRole="button"
                      onPress={() => setSelectedTaskId(task.id)}
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
                          { color: isSelected ? colors.primaryForeground : colors.foreground },
                        ]}
                      >
                        {task.referenceCode}
                      </Text>
                    </Pressable>
                  );
                })
              ) : (
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                  No open task is waiting for materials right now.
                </Text>
              )}
            </View>
          </View>
          <FormField
            inputTestID="qa_service_material_label"
            label={roleCopy.label}
            onChangeText={setLabel}
            placeholder={role === 'ac_technician' ? 'Compressor capacitor' : 'Rodent bait sachets'}
            value={label}
          />
          <FormField
            inputTestID="qa_service_material_quantity"
            keyboardType="number-pad"
            label="Quantity"
            onChangeText={setQuantity}
            placeholder="1"
            value={quantity}
          />
          <FormField
            inputTestID="qa_service_material_unit"
            label="Unit"
            onChangeText={setUnit}
            placeholder={role === 'service_boy' ? 'packs' : 'pcs'}
            value={unit}
          />
          <FormField
            inputTestID="qa_service_material_note"
            label="Request note"
            multiline
            onChangeText={setNote}
            placeholder="Explain why this stock is needed for the field task."
            style={styles.multilineField}
            textAlignVertical="top"
            value={note}
          />
          <ActionButton
            label={isSaving ? 'Submitting...' : 'Submit request'}
            loading={isSaving}
            disabled={!activeTasks.length}
            onPress={() => void handleSubmit()}
            testID="qa_service_submit_material_request"
          />
        </InfoCard>
      ) : null}

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {role === 'delivery_boy' ? 'Delivery task notes' : 'Request history'}
        </Text>
        {role === 'delivery_boy' ? (
          activeTasks.length ? (
            activeTasks.map((task, index) => (
              <View key={task.id} style={styles.requestCard} testID={`qa_service_delivery_note_card_${index}`}>
                <View style={styles.headerRow}>
                  <View style={styles.copyWrap}>
                    <Text
                      style={[styles.requestTitle, { color: colors.foreground }]}
                      testID={`qa_service_delivery_note_title_${index}`}
                    >
                      {task.title}
                    </Text>
                    <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                      {task.referenceCode} | {task.unitLabel ?? task.locationName}
                    </Text>
                  </View>
                  <StatusChip label={task.status.replace(/_/g, ' ')} tone="info" />
                </View>
                {task.notes ? (
                  <Text style={[styles.caption, { color: colors.foreground }]}>{task.notes}</Text>
                ) : null}
                <Text style={[styles.caption, { color: colors.foreground }]}>
                  Delivery proof {task.deliveryProofUri ? 'already captured' : 'still required'}.
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              No delivery manifest is active right now.
            </Text>
          )
        ) : orderedRequests.length ? (
          orderedRequests.map((request, index) => (
            <View key={request.id} style={styles.requestCard} testID={`qa_service_request_card_${index}`}>
              <View style={styles.headerRow}>
                <View style={styles.copyWrap}>
                  <Text
                    style={[styles.requestTitle, { color: colors.foreground }]}
                    testID={`qa_service_request_title_${index}`}
                  >
                    {request.label}
                  </Text>
                  <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                    {request.quantity} {request.unit} | Requested {formatTimestamp(request.requestedAt)}
                  </Text>
                </View>
                <View testID={`qa_service_request_status_${index}`}>
                  <StatusChip label={request.status.replace(/_/g, ' ')} tone={getStatusTone(request.status)} />
                </View>
              </View>
              {request.note ? (
                <Text style={[styles.caption, { color: colors.foreground }]}>{request.note}</Text>
              ) : null}
              <Text style={[styles.caption, { color: colors.foreground }]}>
                Type: {request.requestType}
              </Text>
              {request.status === 'approved' ? (
                <ActionButton
                  label="Mark issued"
                  variant="ghost"
                  testID={`qa_service_mark_issued_${index}`}
                  onPress={() => void markMaterialIssued(request.id)}
                />
              ) : null}
            </View>
          ))
        ) : (
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            Submitted requests will appear here once the field team starts using the materials queue.
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
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  selectorLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
  },
  multilineField: {
    minHeight: 100,
    paddingTop: Spacing.base,
  },
  requestCard: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  requestTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
});
