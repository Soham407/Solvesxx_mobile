import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ClipboardList, ShoppingCart } from 'lucide-react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { FormField } from '../../components/shared/FormField';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { BuyerTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useBuyerStore } from '../../store/useBuyerStore';
import type { CommercePriority } from '../../types/commerce';

type BuyerRequestsScreenProps = BottomTabScreenProps<BuyerTabParamList, 'BuyerRequests'>;

const CATEGORY_OPTIONS = ['Consumables', 'Manpower', 'Maintenance', 'Equipment'] as const;
const PRIORITY_OPTIONS: CommercePriority[] = ['low', 'medium', 'high'];

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

function getStatusTone(status: string) {
  if (status === 'pending') {
    return 'warning';
  }

  if (status === 'completed') {
    return 'success';
  }

  if (status === 'indent_rejected') {
    return 'danger';
  }

  return 'info';
}

export function BuyerRequestsScreen(_props: BuyerRequestsScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const requests = useBuyerStore((state) => state.requests);
  const createRequest = useBuyerStore((state) => state.createRequest);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState(profile?.assignedLocation?.locationName ?? 'Preview Tower');
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState('');
  const [itemLabel, setItemLabel] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('units');
  const [categoryLabel, setCategoryLabel] = useState<(typeof CATEGORY_OPTIONS)[number]>('Consumables');
  const [priority, setPriority] = useState<CommercePriority>('medium');
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const orderedRequests = useMemo(
    () =>
      [...requests].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    [requests],
  );

  const handleCreateRequest = async () => {
    const parsedQuantity = Number(quantity.trim());

    if (!title.trim() || !itemLabel.trim() || !locationName.trim()) {
      setMessage('Title, location, and at least one requested item are required.');
      return;
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setMessage('Quantity must be a positive number.');
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await createRequest({
        title: title.trim(),
        description: description.trim(),
        categoryLabel,
        locationName: locationName.trim(),
        preferredDeliveryDate: preferredDeliveryDate.trim(),
        priority,
        itemLabel: itemLabel.trim(),
        quantity: parsedQuantity,
        unit: unit.trim() || 'units',
      });

      setTitle('');
      setDescription('');
      setPreferredDeliveryDate('');
      setItemLabel('');
      setQuantity('1');
      setUnit('units');
      setMessage('Buyer request created and added to the procurement queue.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenShell
      eyebrow="Buyer Requests"
      title="Create and track buyer requests"
      description="Raise new requisitions for services or materials, then watch how they move through indent, PO, dispatch, and billing milestones."
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.copyWrap}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>New request</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              The mobile form is streamlined for fast site requests without opening the full web desk.
            </Text>
          </View>
          <ShoppingCart color={colors.primary} size={22} />
        </View>
        {message ? (
          <Text style={[styles.caption, { color: colors.primary }]} testID="qa_buyer_request_message">
            {message}
          </Text>
        ) : null}

        <FormField
          inputTestID="qa_buyer_request_title"
          label="Request title"
          onChangeText={setTitle}
          placeholder="Lobby housekeeping consumables"
          value={title}
        />
        <FormField
          label="Description"
          multiline
          onChangeText={setDescription}
          placeholder="Add the service window, urgency, or operational note."
          style={styles.multilineField}
          textAlignVertical="top"
          value={description}
        />

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Category</Text>
          <View style={styles.selectorWrap}>
            {CATEGORY_OPTIONS.map((option) => {
              const isSelected = option === categoryLabel;

              return (
                <Pressable
                  testID={`qa_buyer_request_category_${option.toLowerCase()}`}
                  key={option}
                  accessibilityRole="button"
                  onPress={() => setCategoryLabel(option)}
                  style={[
                    styles.selectorButton,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.secondary,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.selectorLabel, { color: isSelected ? colors.primaryForeground : colors.foreground }]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Priority</Text>
          <View style={styles.selectorWrap}>
            {PRIORITY_OPTIONS.map((option) => {
              const isSelected = option === priority;

              return (
                <Pressable
                  testID={`qa_buyer_request_priority_${option}`}
                  key={option}
                  accessibilityRole="button"
                  onPress={() => setPriority(option)}
                  style={[
                    styles.selectorButton,
                    {
                      backgroundColor: isSelected ? colors.warning : colors.secondary,
                      borderColor: isSelected ? colors.warning : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.selectorLabel, { color: isSelected ? colors.warningForeground : colors.foreground }]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <FormField label="Location" onChangeText={setLocationName} placeholder="Preview Tower" value={locationName} />
        <FormField
          helperText="Use YYYY-MM-DD for a precise site handoff date."
          label="Preferred delivery date"
          onChangeText={setPreferredDeliveryDate}
          placeholder="2026-04-15"
          value={preferredDeliveryDate}
        />
        <FormField
          inputTestID="qa_buyer_request_item"
          label="Primary item or service"
          onChangeText={setItemLabel}
          placeholder="Floor cleaner"
          value={itemLabel}
        />
        <View style={styles.twoColumnRow}>
          <View style={styles.column}>
            <FormField keyboardType="number-pad" label="Quantity" onChangeText={setQuantity} placeholder="24" value={quantity} />
          </View>
          <View style={styles.column}>
            <FormField label="Unit" onChangeText={setUnit} placeholder="bottles" value={unit} />
          </View>
        </View>
        <ActionButton
          label={isSaving ? 'Saving...' : 'Create request'}
          loading={isSaving}
          onPress={() => void handleCreateRequest()}
          testID="qa_buyer_create_request"
        />
      </InfoCard>

      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.copyWrap}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Request pipeline</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              Status labels follow the same supply chain milestones used in the web portal.
            </Text>
          </View>
          <ClipboardList color={colors.info} size={22} />
        </View>
        {orderedRequests.length ? (
          orderedRequests.map((request, index) => (
            <View key={request.id} style={styles.requestCard} testID={`qa_buyer_request_card_${index}`}>
              <View style={styles.headerRow}>
                <View style={styles.copyWrap}>
                  <Text
                    style={[styles.requestTitle, { color: colors.foreground }]}
                    testID={`qa_buyer_request_title_${index}`}
                  >
                    {request.title}
                  </Text>
                  <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                    {request.requestNumber} | {request.categoryLabel} | {request.locationName}
                  </Text>
                </View>
                <StatusChip label={request.status.replace(/_/g, ' ')} tone={getStatusTone(request.status)} />
              </View>
              <Text style={[styles.caption, { color: colors.foreground }]}>
                Priority: {request.priority} | Preferred date: {formatValue(request.preferredDeliveryDate)}
              </Text>
              <Text style={[styles.caption, { color: colors.foreground }]}>
                Items: {request.items.map((item) => `${item.label} x${item.quantity} ${item.unit}`).join(', ')}
              </Text>
              {request.description ? (
                <Text style={[styles.caption, { color: colors.foreground }]}>{request.description}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            No requests are in the buyer pipeline yet.
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
  multilineField: {
    minHeight: 110,
    paddingTop: Spacing.base,
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
    textTransform: 'capitalize',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  column: {
    flex: 1,
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
