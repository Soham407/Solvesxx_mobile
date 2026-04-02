import { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';

import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  calculateDistanceMeters,
  getCurrentLocationFix,
  requestGeoFencePermissions,
  type GeoPermissionState,
} from '../../lib/location';
import { fetchCompanyLocations } from '../../lib/profile';
import { useAppStore } from '../../store/useAppStore';

export function GeoFenceCalibrationScreen() {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);
  const completeGeoCalibration = useAppStore((state) => state.completeGeoCalibration);
  const [locations, setLocations] = useState<Array<Awaited<ReturnType<typeof fetchCompanyLocations>>[number]>>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<GeoPermissionState | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadLocations() {
      try {
        const nextLocations = await fetchCompanyLocations();
        setLocations(nextLocations);

        if (profile?.assignedLocation?.id) {
          setSelectedLocationId(profile.assignedLocation.id);
          return;
        }

        setSelectedLocationId(nextLocations[0]?.id ?? null);
      } catch (error) {
        const nextMessage =
          error instanceof Error ? error.message : 'We could not load company locations.';
        setErrorMessage(nextMessage);
      }
    }

    void loadLocations();
  }, [profile?.assignedLocation?.id]);

  const selectedLocation = useMemo(
    () =>
      locations.find((location) => location.id === selectedLocationId) ?? profile?.assignedLocation ?? null,
    [locations, profile?.assignedLocation, selectedLocationId],
  );

  const distanceFromSite =
    currentPosition &&
    selectedLocation &&
    selectedLocation.latitude != null &&
    selectedLocation.longitude != null
      ? calculateDistanceMeters(
          currentPosition.latitude,
          currentPosition.longitude,
          selectedLocation.latitude,
          selectedLocation.longitude,
        )
      : null;

  const needsBackgroundPermission = Platform.OS === 'android' || Platform.OS === 'ios';
  const canComplete =
    Boolean(permissionState?.foregroundGranted) &&
    (!needsBackgroundPermission || Boolean(permissionState?.backgroundGranted)) &&
    Boolean(currentPosition) &&
    Boolean(selectedLocation) &&
    distanceFromSite !== null &&
    distanceFromSite <= (selectedLocation?.geoFenceRadius ?? 50);

  const handleRefreshLocation = async () => {
    setIsRequestingLocation(true);
    setErrorMessage(null);

    try {
      const nextPermissions = await requestGeoFencePermissions();
      setPermissionState(nextPermissions);

      if (!nextPermissions.foregroundGranted) {
        setErrorMessage('Foreground location access is required for attendance geo-fencing.');
        return;
      }

      if (needsBackgroundPermission && !nextPermissions.backgroundGranted) {
        setErrorMessage('Background location access is required for patrol and inactivity monitoring.');
        return;
      }

      const fix = await getCurrentLocationFix();
      setCurrentPosition({
        latitude: fix.coords.latitude,
        longitude: fix.coords.longitude,
      });
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : 'We could not capture your current location.';
      setErrorMessage(nextMessage);
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedLocation || !currentPosition) {
      setErrorMessage('We need both a site and your live location before calibration can finish.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await completeGeoCalibration({
        calibratedAt: new Date().toISOString(),
        latitude: currentPosition.latitude,
        locationId: selectedLocation.id,
        locationName: selectedLocation.locationName,
        longitude: currentPosition.longitude,
        radius: selectedLocation.geoFenceRadius,
      });
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : 'We could not save the geo-fence calibration.';
      setErrorMessage(nextMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenShell
      eyebrow="Location setup"
      title="Calibrate work location"
      description="Stand at your primary work site and capture a live location fix. We use this baseline to enforce clock-in geo-fences and future background monitoring."
      footer={
        <View style={styles.footer}>
          <ActionButton
            label={currentPosition ? 'Refresh live location' : 'Grant access and locate me'}
            loading={isRequestingLocation}
            onPress={() => void handleRefreshLocation()}
          />
          <ActionButton
            label="Complete calibration"
            loading={isSaving}
            disabled={!canComplete}
            onPress={() => void handleComplete()}
          />
          {permissionState && (!permissionState.canAskAgain || !permissionState.foregroundGranted) ? (
            <ActionButton label="Open device settings" variant="ghost" onPress={() => void Linking.openSettings()} />
          ) : null}
        </View>
      }
    >
      <InfoCard>
        <View style={styles.locationHeader}>
          <MapPin color={colors.primary} size={24} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select primary work location</Text>
        </View>
        <View style={styles.locationList}>
          {locations.map((location) => {
            const isSelected = location.id === selectedLocationId;

            return (
              <Pressable
                key={location.id}
                onPress={() => setSelectedLocationId(location.id)}
                style={[
                  styles.locationChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.secondary,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.locationChipText,
                    { color: isSelected ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {location.locationName}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </InfoCard>

      <InfoCard>
        <View style={styles.locationHeader}>
          <Navigation color={colors.info} size={24} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Calibration status</Text>
        </View>
        <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
          {selectedLocation
            ? `${selectedLocation.locationName} geo-fence radius: ${selectedLocation.geoFenceRadius}m`
            : 'Choose a location to continue.'}
        </Text>
        <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
          {currentPosition
            ? `Live distance from site: ${distanceFromSite ?? '—'}m`
            : 'Live location has not been captured yet.'}
        </Text>
        {errorMessage ? <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMessage}</Text> : null}
      </InfoCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.md,
  },
  locationList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  locationChip: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  locationChipText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
  },
  statusText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  errorText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
