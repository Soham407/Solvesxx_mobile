import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { FileText } from 'lucide-react-native';

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
import type { SupplierBillRecord, SupplierPORecord } from '../../types/commerce';

type SupplierBillingScreenProps = BottomTabScreenProps<SupplierTabParamList, 'SupplierBilling'>;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function formatValue(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getBillTone(status: SupplierBillRecord['status']) {
  if (status === 'paid') {
    return 'success';
  }

  if (status === 'approved') {
    return 'warning';
  }

  return 'info';
}

function getPaymentTone(status: SupplierBillRecord['paymentStatus']) {
  if (status === 'paid') {
    return 'success';
  }

  if (status === 'partial') {
    return 'warning';
  }

  return 'danger';
}

export function SupplierBillingScreen(_props: SupplierBillingScreenProps) {
  const { colors } = useAppTheme();
  const bills = useSupplierStore((state) => state.bills);
  const pos = useSupplierStore((state) => state.pos);
  const submitBill = useSupplierStore((state) => state.submitBill);
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [billNumber, setBillNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const eligiblePOs = useMemo(
    () => pos.filter((po) => ['acknowledged', 'dispatched', 'received'].includes(po.status)),
    [pos],
  );

  const totalBilled = useMemo(
    () => bills.reduce((sum, bill) => sum + bill.totalAmountPaise, 0),
    [bills],
  );

  useEffect(() => {
    if (!eligiblePOs.length) {
      if (selectedPoId !== null) {
        setSelectedPoId(null);
      }

      return;
    }

    const hasCurrentSelection = eligiblePOs.some((po) => po.id === selectedPoId);

    if (!hasCurrentSelection) {
      setSelectedPoId(eligiblePOs[0]?.id ?? null);
    }
  }, [eligiblePOs, selectedPoId]);

  const handleSubmitBill = async () => {
    const parsedAmount = Math.round(Number(amount.trim()) * 100);

    if (!selectedPoId || !eligiblePOs.some((po) => po.id === selectedPoId)) {
      setMessage('Select a purchase order before submitting a bill.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setMessage('Bill amount must be a valid positive rupee value.');
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await submitBill({
        poId: selectedPoId,
        billNumber,
        totalAmountPaise: parsedAmount,
        note,
      });

      setBillNumber('');
      setAmount('');
      setNote('');
      setMessage('Supplier bill submitted into the mobile billing queue.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenShell
      eyebrow="Supplier Billing"
      title="Billing submission and payout visibility"
      description="Submit PO-linked bills from mobile and keep an eye on approval and payment progression."
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.copyWrap}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Create a bill</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              Bills attach to acknowledged or dispatched purchase orders in this mobile preview.
            </Text>
          </View>
          <FileText color={colors.primary} size={22} />
        </View>
        {message ? (
          <Text style={[styles.caption, { color: colors.primary }]} testID="qa_supplier_billing_message">
            {message}
          </Text>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Select purchase order</Text>
          <View style={styles.selectorWrap}>
            {eligiblePOs.length ? (
              eligiblePOs.map((po, index) => {
                const isSelected = po.id === selectedPoId;

                return (
                  <Pressable
                    key={po.id}
                    testID={`qa_supplier_bill_select_${index}`}
                    accessibilityRole="button"
                    onPress={() => setSelectedPoId(po.id)}
                    style={[
                      styles.selectorButton,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.secondary,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.selectorLabel, { color: isSelected ? colors.primaryForeground : colors.foreground }]}>
                      {po.poNumber}
                    </Text>
                  </Pressable>
                );
              })
            ) : (
              <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                No acknowledged purchase order is ready for billing yet.
              </Text>
            )}
          </View>
        </View>

        <FormField
          helperText="Leave blank to auto-generate a bill number."
          inputTestID="qa_supplier_bill_number"
          label="Bill number"
          onChangeText={setBillNumber}
          placeholder="BILL-2026-1001"
          value={billNumber}
        />
        <FormField
          inputTestID="qa_supplier_bill_amount"
          keyboardType="decimal-pad"
          label="Bill amount (INR)"
          onChangeText={setAmount}
          placeholder="7200"
          value={amount}
        />
        <FormField
          inputTestID="qa_supplier_bill_note"
          label="Billing note"
          multiline
          onChangeText={setNote}
          placeholder="Cycle 1 manpower coverage, service gate handoff complete."
          style={styles.multilineField}
          textAlignVertical="top"
          value={note}
        />
        <ActionButton
          label={isSaving ? 'Submitting...' : 'Submit bill'}
          loading={isSaving}
          disabled={!eligiblePOs.length}
          onPress={() => void handleSubmitBill()}
          testID="qa_supplier_submit_bill"
        />
      </InfoCard>

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Billing queue</Text>
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>
          Total billed value in this mobile workspace: {currencyFormatter.format(totalBilled / 100)}.
        </Text>
        {bills.length ? (
          bills.map((bill, index) => (
            <View key={bill.id} style={styles.billCard} testID={`qa_supplier_bill_card_${index}`}>
              <View style={styles.headerRow}>
                <View style={styles.copyWrap}>
                  <Text
                    style={[styles.billTitle, { color: colors.foreground }]}
                    testID={`qa_supplier_bill_title_${index}`}
                  >
                    {bill.billNumber}
                  </Text>
                  <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                    {bill.poNumber} | Submitted on {formatValue(bill.createdAt)}
                  </Text>
                </View>
                <View style={styles.statusWrap}>
                  <StatusChip label={bill.status} tone={getBillTone(bill.status)} />
                  <StatusChip label={bill.paymentStatus} tone={getPaymentTone(bill.paymentStatus)} />
                </View>
              </View>
              <Text style={[styles.caption, { color: colors.foreground }]}>
                Amount: {currencyFormatter.format(bill.totalAmountPaise / 100)}
              </Text>
              {bill.note ? (
                <Text style={[styles.caption, { color: colors.foreground }]}>{bill.note}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            Submitted supplier bills will appear here for payment follow-up.
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
  billCard: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  billTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  statusWrap: {
    gap: Spacing.sm,
  },
});
