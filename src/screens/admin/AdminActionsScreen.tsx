import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusChip } from '../../components/guard/StatusChip';
import { ActionButton } from '../../components/shared/ActionButton';
import { FormField } from '../../components/shared/FormField';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAdminStore } from '../../store/useAdminStore';

function formatLastLogin(value: string | null) {
  if (!value) {
    return 'Never logged in';
  }

  return new Date(value).toLocaleString([], {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function AdminActionsScreen() {
  const { colors } = useAppTheme();
  const users = useAdminStore((state) => state.users);
  const searchQuery = useAdminStore((state) => state.searchQuery);
  const isLoading = useAdminStore((state) => state.isLoading);
  const setSearchQuery = useAdminStore((state) => state.setSearchQuery);
  const deactivateUser = useAdminStore((state) => state.deactivateUser);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    if (!normalized) {
      return users;
    }

    return users.filter((user) => {
      const haystack = [user.fullName, user.email, user.role].join(' ').toLowerCase();
      return haystack.includes(normalized);
    });
  }, [searchQuery, users]);

  const selectedUser = useMemo(
    () => filteredUsers.find((user) => user.id === selectedUserId) ?? null,
    [filteredUsers, selectedUserId],
  );

  const handleDeactivate = async (userId: string) => {
    setBusyUserId(userId);

    try {
      await deactivateUser(userId);
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <ScreenShell
      eyebrow="Admin"
      title="User Management"
      description="Search user accounts, inspect recent access activity, and deactivate users who should no longer have access."
    >
      <InfoCard>
        <FormField
          label="Search users"
          onChangeText={setSearchQuery}
          placeholder="Search by name, role, or email"
          value={searchQuery}
        />
      </InfoCard>

      {isLoading ? (
        <InfoCard>
          <Text style={[styles.helperText, { color: colors.mutedForeground }]}>Loading users...</Text>
        </InfoCard>
      ) : null}

      {filteredUsers.length === 0 ? (
        <InfoCard>
          <Text style={[styles.emptyState, { color: colors.mutedForeground }]}>No users found</Text>
        </InfoCard>
      ) : (
        filteredUsers.map((user) => (
          <InfoCard key={user.id}>
            <Pressable onPress={() => setSelectedUserId(user.id)} style={styles.userHeader}>
              <View style={styles.copyWrap}>
                <Text style={[styles.userName, { color: colors.foreground }]}>{user.fullName}</Text>
                <Text style={[styles.helperText, { color: colors.mutedForeground }]}>Role: {user.role}</Text>
                <Text style={[styles.helperText, { color: colors.mutedForeground }]}>Last login: {formatLastLogin(user.lastLogin)}</Text>
              </View>
              <StatusChip label={user.isActive ? 'active' : 'inactive'} tone={user.isActive ? 'success' : 'default'} />
            </Pressable>

            {selectedUser?.id === user.id ? (
              <View style={styles.detailPanel}>
                <Text style={[styles.detailLine, { color: colors.foreground }]}>Name: {selectedUser.fullName}</Text>
                <Text style={[styles.detailLine, { color: colors.foreground }]}>Email: {selectedUser.email}</Text>
                <Text style={[styles.detailLine, { color: colors.foreground }]}>Role: {selectedUser.role}</Text>
                <Text style={[styles.detailLine, { color: colors.foreground }]}>Last login: {formatLastLogin(selectedUser.lastLogin)}</Text>
              </View>
            ) : null}

            <ActionButton
              disabled={!user.isActive}
              label={user.isActive ? 'Deactivate user' : 'Already inactive'}
              loading={busyUserId === user.id}
              onPress={() => void handleDeactivate(user.id)}
              variant={user.isActive ? 'danger' : 'secondary'}
            />
          </InfoCard>
        ))
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  userHeader: {
    flexDirection: 'row',
    gap: Spacing.base,
    justifyContent: 'space-between',
  },
  copyWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  userName: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  helperText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  emptyState: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
  },
  detailPanel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
    paddingTop: Spacing.base,
  },
  detailLine: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
