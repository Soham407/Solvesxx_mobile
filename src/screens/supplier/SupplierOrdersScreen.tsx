import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Truck } from 'lucide-react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { FormField } from '../../components/shared/FormField';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { SupplierTabParamList } from '../../navigation/types';
import { useSupplierStore } from '../../store/useSupplierStore';
import type { SupplierPORecord } from '../../types/commerce';

type SupplierOrdersScreenProps = BottomTabScreenProps<SupplierTabParamList, 'SupplierOrders'>;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function formatValue(value: string | null) {
  if (!value) {
    return 'Not scheduled';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getStatusTone(status: SupplierPORecord['status']) {
  if (status === 'received') {
    return 'success';
  }

  if (status === 'acknowledged') {
    return 'warning';
  }

  return 'info';
}

export function SupplierOrdersScreen(_props: SupplierOrdersScreenProps) {
  const { colors } = useAppTheme();
  const pos = useSupplierStore((state) => state.pos);
  const acknowledgePO = useSupplierStore((state) => state.acknowledgePO);
  const dispatchPO = useSupplierStore((state) => state.dispatchPO);
  const [message, setMessage] = useState<string | null>(null);
  const [vehicleDrafts, setVehicleDrafts] = useState<Record<string, string>>({});
  const [dispatchNotes, setDispatchNotes] = useState<Record<string, string>>({});
  const [deliveryNotes, setDeliveryNotes] = useState<Record<string, string>>({});
  const [challanNumbers, setChallanNumbers] = useState<Record<string, string>>({});
  const [dispatchEtas, setDispatchEtas] = useState<Record<string, string>>({});

  const orderedPOs = useMemo(
    () =>
      [...pos].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    [pos],
  );

  const handleDispatch = async (poId: string, poNumber: string) => {
    const vehicleDetails = vehicleDrafts[poId]?.trim() ?? '';
    const nextDispatchNote = dispatchNotes[poId] ?? '';
    const deliveryNote = deliveryNotes[poId]?.trim() ?? '';
    const challanNumber = challanNumbers[poId]?.trim() ?? '';
    const dispatchEta = dispatchEtas[poId]?.trim() ?? '';

    if (!vehicleDetails) {
      setMessage(`Add a vehicle number before dispatching ${poNumber}.`);
      return;
    }

    if (!deliveryNote) {
      setMessage(`Add a delivery note before dispatching ${poNumber}.`);
      return;
    }

    if (!dispatchEta) {
      setMessage(`Add an ETA before dispatching ${poNumber}.`);
      return;
    }

    try {
      const result = await dispatchPO(poId, {
        vehicleDetails,
        dispatchNotes: nextDispatchNote,
        deliveryNote,
        challanNumber,
        dispatchEta,
      });
      setMessage(
        result.updated
          ? `${poNumber} moved into dispatched status.`
          : `${poNumber} could not be dispatched from its current state.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `${poNumber} could not be dispatched.`);
    }
  };

  return (
    <ScreenShell
      eyebrow="Supplier Orders"
      title="Purchase order acknowledgement and dispatch"
      description="Acknowledge new purchase orders quickly, then attach dispatch details once the material or manpower is ready to move."
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.copyWrap}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order execution desk</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              Dispatch controls unlock after the supplier acknowledges the purchase order.
            </Text>
          </View>
          <Truck color={colors.primary} size={22} />
        </View>
        {message ? (
          <Text style={[styles.caption, { color: colors.primary }]} testID="qa_supplier_orders_message">
            {message}
          </Text>
        ) : null}
      </InfoCard>

      <InfoCard>
        {orderedPOs.length ? (
          orderedPOs.map((po, index) => (
            <View key={po.id} style={styles.poCard} testID={`qa_supplier_po_card_${index}`}>
              <View style={styles.headerRow}>
                <View style={styles.copyWrap}>
                  <Text
                    style={[styles.poTitle, { color: colors.foreground }]}
                    testID={`qa_supplier_po_title_${index}`}
                  >
                    {po.poNumber}
                  </Text>
                  <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                    {po.title} | {currencyFormatter.format(po.grandTotalPaise / 100)}
                  </Text>
                </View>
                <View testID={`qa_supplier_po_status_${index}`}>
                  <StatusChip label={po.status.replace(/_/g, ' ')} tone={getStatusTone(po.status)} />
                </View>
              </View>
              <Text style={[styles.caption, { color: colors.foreground }]}>
                Expected delivery: {formatValue(po.expectedDeliveryDate)}
              </Text>
              {po.vehicleDetails ? (
                <Text style={[styles.caption, { color: colors.foreground }]}>
                  Vehicle: {po.vehicleDetails}
                </Text>
              ) : null}
              {po.dispatchEta ? (
                <Text style={[styles.caption, { color: colors.foreground }]}>
                  ETA: {formatValue(po.dispatchEta)}
                </Text>
              ) : null}
              {po.challanNumber ? (
                <Text style={[styles.caption, { color: colors.foreground }]}>
                  Challan: {po.challanNumber}
                </Text>
              ) : null}
              {po.deliveryNote ? (
                <Text style={[styles.caption, { color: colors.foreground }]}>
                  Delivery note: {po.deliveryNote}
                </Text>
              ) : null}
              {po.dispatchNotes ? (
                <Text style={[styles.caption, { color: colors.foreground }]}>{po.dispatchNotes}</Text>
              ) : null}

              {po.status === 'sent_to_vendor' ? (
                <ActionButton
                  label="Acknowledge PO"
                  variant="secondary"
                  testID={`qa_supplier_po_acknowledge_${index}`}
                  onPress={() => {
                    void acknowledgePO(po.id).then((result) => {
                      setMessage(
                        result.updated
                          ? `${po.poNumber} acknowledged and ready for dispatch planning.`
                          : `${po.poNumber} could not be acknowledged from its current state.`,
                      );
                    });
                  }}
                />
              ) : null}

              {po.status === 'acknowledged' ? (
                <View style={styles.dispatchCard}>
                  <FormField
                    inputTestID={`qa_supplier_po_vehicle_${index}`}
                    label="Vehicle details"
                    onChangeText={(value) =>
                      setVehicleDrafts((state) => ({
                        ...state,
                        [po.id]: value,
                      }))
                    }
                    placeholder="MH 12 AB 9081"
                    value={vehicleDrafts[po.id] ?? ''}
                  />
                  <FormField
                    inputTestID={`qa_supplier_po_dispatch_note_${index}`}
                    label="Dispatch note"
                    multiline
                    onChangeText={(value) =>
                      setDispatchNotes((state) => ({
                        ...state,
                        [po.id]: value,
                      }))
                    }
                    placeholder="Crew leaves at 18:30, unloading at service gate."
                    style={styles.multilineField}
                    textAlignVertical="top"
                    value={dispatchNotes[po.id] ?? ''}
                  />
                  <FormField
                    inputTestID={`qa_supplier_po_delivery_note_${index}`}
                    label="Delivery note / crew manifest"
                    multiline
                    onChangeText={(value) =>
                      setDeliveryNotes((state) => ({
                        ...state,
                        [po.id]: value,
                      }))
                    }
                    placeholder="Driver, helper, and handoff details for the receiving desk."
                    style={styles.multilineField}
                    textAlignVertical="top"
                    value={deliveryNotes[po.id] ?? ''}
                  />
                  <FormField
                    inputTestID={`qa_supplier_po_challan_${index}`}
                    label="Challan number"
                    onChangeText={(value) =>
                      setChallanNumbers((state) => ({
                        ...state,
                        [po.id]: value,
                      }))
                    }
                    placeholder="CH-2026-0041"
                    value={challanNumbers[po.id] ?? ''}
                  />
                  <FormField
                    inputTestID={`qa_supplier_po_eta_${index}`}
                    label="ETA"
                    onChangeText={(value) =>
                      setDispatchEtas((state) => ({
                        ...state,
                        [po.id]: value,
                      }))
                    }
                    placeholder="2026-05-25 18:30"
                    value={dispatchEtas[po.id] ?? ''}
                  />
                  <ActionButton
                    label="Dispatch PO"
                    variant="ghost"
                    testID={`qa_supplier_po_dispatch_${index}`}
                    onPress={() => void handleDispatch(po.id, po.poNumber)}
                  />
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            No purchase orders are active in the supplier mobile workspace yet.
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
  poCard: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  poTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  dispatchCard: {
    gap: Spacing.base,
  },
  multilineField: {
    minHeight: 100,
    paddingTop: Spacing.base,
  },
});
