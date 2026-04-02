import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Camera, Car, UserRound } from 'lucide-react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { FormField } from '../../components/shared/FormField';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { capturePhoto } from '../../lib/media';
import type { GuardTabParamList } from '../../navigation/types';
import { useGuardStore } from '../../store/useGuardStore';
import type { GuardFrequentVisitorTemplate } from '../../types/guard';

type GuardVisitorsScreenProps = BottomTabScreenProps<GuardTabParamList, 'GuardVisitors'>;

function formatVisitorTimestamp(value: string) {
  return new Date(value).toLocaleString([], {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

const EMPTY_FORM = {
  name: '',
  phone: '',
  purpose: '',
  destination: '',
  vehicleNumber: '',
};

export function GuardVisitorsScreen(_props: GuardVisitorsScreenProps) {
  const { colors } = useAppTheme();
  const frequentVisitors = useGuardStore((state) => state.frequentVisitors);
  const visitorLog = useGuardStore((state) => state.visitorLog);
  const isOfflineMode = useGuardStore((state) => state.isOfflineMode);
  const addVisitor = useGuardStore((state) => state.addVisitor);
  const checkoutVisitor = useGuardStore((state) => state.checkoutVisitor);

  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyVisitorId, setBusyVisitorId] = useState<string | null>(null);

  const insideVisitors = useMemo(
    () => visitorLog.filter((visitor) => visitor.status === 'inside'),
    [visitorLog],
  );

  const handleUseTemplate = (template: GuardFrequentVisitorTemplate) => {
    setSelectedTemplateId(template.id);
    setForm({
      destination: template.destination,
      name: template.name,
      phone: template.phone,
      purpose: template.purpose,
      vehicleNumber: template.vehicleNumber,
    });
    setMessage(`Loaded frequent visitor template for ${template.name}.`);
  };

  const handleCapturePhoto = async () => {
    setMessage(null);

    try {
      const asset = await capturePhoto({
        cameraType: 'back',
        aspect: [3, 4],
      });

      if (!asset) {
        setMessage('Visitor photo capture was cancelled.');
        return;
      }

      setPhotoUri(asset.uri);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not capture the visitor photo.');
    }
  };

  const handleSaveVisitor = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.destination.trim() || !form.purpose.trim()) {
      setMessage('Visitor name, phone, destination, and purpose are required.');
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const result = await addVisitor({
        destination: form.destination.trim(),
        frequentVisitor: Boolean(selectedTemplateId),
        name: form.name.trim(),
        phone: form.phone.trim(),
        photoUri,
        purpose: form.purpose.trim(),
        vehicleNumber: form.vehicleNumber.trim(),
      });

      setForm(EMPTY_FORM);
      setSelectedTemplateId(null);
      setPhotoUri(null);
      setMessage(
        result.queued
          ? 'Visitor entry saved offline and queued for sync.'
          : 'Visitor logged successfully.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckout = async (id: string) => {
    setBusyVisitorId(id);
    setMessage(null);

    try {
      const result = await checkoutVisitor(id);
      setMessage(
        !result.updated
          ? 'That visitor is already checked out.'
          : result.queued
            ? 'Checkout recorded offline and queued for sync.'
            : 'Visitor checked out successfully.',
      );
    } finally {
      setBusyVisitorId(null);
    }
  };

  return (
    <ScreenShell
      eyebrow="Gate Entry"
      title="Visitor Logging"
      description="Capture walk-ins, reuse frequent visitor templates, and keep a live record of who is currently inside the premises."
      footer={
        <ActionButton
          label={isSaving ? 'Logging visitor...' : 'Log visitor entry'}
          loading={isSaving}
          onPress={() => void handleSaveVisitor()}
        />
      }
    >
      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Frequent visitors</Text>
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>
          Tap a template to prefill recurring maid, driver, and delivery entries.
        </Text>
        <View style={styles.templateWrap}>
          {frequentVisitors.map((template) => {
            const isSelected = template.id === selectedTemplateId;

            return (
              <Pressable
                key={template.id}
                onPress={() => handleUseTemplate(template)}
                style={[
                  styles.templateChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.secondary,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.templateLabel,
                    {
                      color: isSelected ? colors.primaryForeground : colors.foreground,
                    },
                  ]}
                >
                  {template.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </InfoCard>

      <InfoCard>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>New visitor entry</Text>
        <FormField
          label="Visitor name"
          onChangeText={(value) => setForm((state) => ({ ...state, name: value }))}
          placeholder="Enter full name"
          value={form.name}
        />
        <FormField
          keyboardType="phone-pad"
          label="Phone number"
          onChangeText={(value) => setForm((state) => ({ ...state, phone: value }))}
          placeholder="98765 43210"
          value={form.phone}
        />
        <FormField
          label="Purpose of visit"
          onChangeText={(value) => setForm((state) => ({ ...state, purpose: value }))}
          placeholder="Delivery, maintenance, guest visit"
          value={form.purpose}
        />
        <FormField
          label="Destination"
          onChangeText={(value) => setForm((state) => ({ ...state, destination: value }))}
          placeholder="Tower A - Flat 304"
          value={form.destination}
        />
        <FormField
          label="Vehicle number"
          onChangeText={(value) => setForm((state) => ({ ...state, vehicleNumber: value }))}
          placeholder="Optional"
          value={form.vehicleNumber}
        />

        <View style={styles.photoSection}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.secondary }]}>
              <Camera color={colors.mutedForeground} size={28} />
              <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                Capture a face photo for gate verification.
              </Text>
            </View>
          )}
          <ActionButton
            label={photoUri ? 'Retake visitor photo' : 'Capture visitor photo'}
            variant="secondary"
            onPress={() => void handleCapturePhoto()}
          />
        </View>

        {message ? <Text style={[styles.message, { color: colors.primary }]}>{message}</Text> : null}
        <StatusChip
          label={isOfflineMode ? 'Offline-safe entry logging' : 'Live entry logging'}
          tone={isOfflineMode ? 'warning' : 'info'}
        />
      </InfoCard>

      <InfoCard>
        <View style={styles.listHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Visitors currently inside</Text>
          <StatusChip label={`${insideVisitors.length} active`} tone="success" />
        </View>
        {insideVisitors.length ? (
          insideVisitors.map((visitor) => (
            <View key={visitor.id} style={[styles.visitorRow, { borderColor: colors.border }]}>
              <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                {visitor.photoUri ? (
                  <Image source={{ uri: visitor.photoUri }} style={styles.avatarImage} />
                ) : (
                  <UserRound color={colors.primary} size={18} />
                )}
              </View>
              <View style={styles.visitorCopy}>
                <Text style={[styles.visitorName, { color: colors.foreground }]}>{visitor.name}</Text>
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                  {visitor.destination} - {visitor.purpose}
                </Text>
                <View style={styles.inlineMeta}>
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{visitor.phone}</Text>
                  {visitor.vehicleNumber ? (
                    <View style={styles.inlineMeta}>
                      <Car color={colors.warning} size={14} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {visitor.vehicleNumber}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  Logged {formatVisitorTimestamp(visitor.recordedAt)}
                </Text>
              </View>
              <ActionButton
                label={busyVisitorId === visitor.id ? 'Saving...' : 'Check out'}
                variant="ghost"
                disabled={busyVisitorId === visitor.id}
                onPress={() => void handleCheckout(visitor.id)}
              />
            </View>
          ))
        ) : (
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            No active visitor entries yet. New entries will appear here as soon as they are logged.
          </Text>
        )}
      </InfoCard>
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
  templateWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  templateChip: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  templateLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
  },
  photoSection: {
    gap: Spacing.base,
  },
  photoPlaceholder: {
    alignItems: 'center',
    borderRadius: BorderRadius['2xl'],
    gap: Spacing.sm,
    justifyContent: 'center',
    minHeight: 180,
    padding: Spacing.xl,
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius['2xl'],
  },
  message: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.base,
  },
  visitorRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    borderTopWidth: 1,
    paddingTop: Spacing.base,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  visitorCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  visitorName: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  inlineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  metaText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
});
