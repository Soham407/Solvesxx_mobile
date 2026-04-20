import { useQuery } from '@tanstack/react-query';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Download, Landmark, ReceiptText } from 'lucide-react-native';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../../components/shared/ActionButton';
import { InfoCard } from '../../components/shared/InfoCard';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { Spacing } from '../../constants/spacing';
import { FontFamily, FontSize } from '../../constants/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { fetchHrmsPayslips } from '../../lib/hrms';
import type { HRMSTabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';

type HrmsPayslipsScreenProps = BottomTabScreenProps<
  HRMSTabParamList,
  'HRMSPayslips'
>;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function formatMonthLabel(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export function HrmsPayslipsScreen(_props: HrmsPayslipsScreenProps) {
  const { colors } = useAppTheme();
  const profile = useAppStore((state) => state.profile);

  const payslipsQuery = useQuery({
    queryKey: ['hrms', 'payslips', profile?.employeeId],
    queryFn: () => fetchHrmsPayslips(profile),
    enabled: Boolean(profile),
  });

  return (
    <ScreenShell
      eyebrow="HRMS payroll"
      title="Payslips and salary view"
      description="Review the latest 12 salary cycles, spot deduction changes quickly, and open the PDF when payroll exports provide a file URL."
    >
      <InfoCard>
        <View style={styles.headerRow}>
          <Landmark color={colors.success} size={22} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Payroll summary</Text>
        </View>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>
          Earnings: Basic, HRA, Special Allowance, and Overtime.
        </Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>
          Deductions: PF, PT, ESIC, TDS, and other payroll adjustments.
        </Text>
      </InfoCard>

      <InfoCard>
        <View style={styles.headerRow}>
          <ReceiptText color={colors.info} size={22} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Last 12 months</Text>
        </View>
        {payslipsQuery.data?.length ? (
          payslipsQuery.data.map((item, index) => (
            <View
              key={item.id}
              style={[styles.payslipRow, { borderColor: colors.border }]}
              testID={`qa_hrms_payslip_row_${index}`}
            >
              <View style={styles.summaryRow}>
                <View style={styles.summaryCopy}>
                  <Text
                    style={[styles.payslipTitle, { color: colors.foreground }]}
                    testID={`qa_hrms_payslip_title_${index}`}
                  >
                    {formatMonthLabel(item.payPeriodTo)}
                  </Text>
                  <Text style={[styles.copy, { color: colors.mutedForeground }]}>
                    {item.payslipNumber} | {item.paymentStatus ?? 'pending'}
                  </Text>
                </View>
                <Text style={[styles.netSalary, { color: colors.foreground }]}>
                  {currencyFormatter.format(item.netSalary)}
                </Text>
              </View>

              <View style={styles.breakdownGrid}>
                <Text style={[styles.breakdownText, { color: colors.mutedForeground }]}>
                  Basic: {currencyFormatter.format(item.basicSalary ?? 0)}
                </Text>
                <Text style={[styles.breakdownText, { color: colors.mutedForeground }]}>
                  HRA: {currencyFormatter.format(item.hra ?? 0)}
                </Text>
                <Text style={[styles.breakdownText, { color: colors.mutedForeground }]}>
                  Special: {currencyFormatter.format(item.specialAllowance ?? 0)}
                </Text>
                <Text style={[styles.breakdownText, { color: colors.mutedForeground }]}>
                  OT: {currencyFormatter.format(item.overtimeAmount ?? 0)}
                </Text>
                <Text style={[styles.breakdownText, { color: colors.mutedForeground }]}>
                  PF: {currencyFormatter.format(item.pfEmployee ?? 0)}
                </Text>
                <Text style={[styles.breakdownText, { color: colors.mutedForeground }]}>
                  PT: {currencyFormatter.format(item.professionalTax ?? 0)}
                </Text>
              </View>

              <ActionButton
                label={item.pdfUrl ? 'Open PDF payslip' : 'PDF pending backend URL'}
                variant={item.pdfUrl ? 'primary' : 'ghost'}
                disabled={!item.pdfUrl}
                onPress={() => {
                  if (item.pdfUrl) {
                    void Linking.openURL(item.pdfUrl);
                  }
                }}
              />
            </View>
          ))
        ) : (
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>
            No payslips are available yet for this employee.
          </Text>
        )}
      </InfoCard>

      <InfoCard>
        <View style={styles.headerRow}>
          <Download color={colors.warning} size={22} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Download note</Text>
        </View>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>
          The current schema exposes payroll numbers directly. PDF downloads activate automatically
          as soon as payroll export URLs are attached to the mobile response path.
        </Text>
      </InfoCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cardTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.md,
  },
  copy: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  payslipRow: {
    borderTopWidth: 1,
    gap: Spacing.base,
    paddingTop: Spacing.base,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.base,
  },
  summaryCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  payslipTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  netSalary: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  breakdownText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
  },
});
