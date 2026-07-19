import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    backgroundColor: "#ffffff",
    color: "#1e293b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 4,
  },
  headerLeft: { color: "#ffffff" },
  logo: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  tagline: { fontSize: 9, color: "#94a3b8", marginTop: 2 },
  headerRight: { color: "#ffffff", textAlign: "right" },
  invoiceTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  vatNo: { fontSize: 8, color: "#94a3b8", marginTop: 2 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  metaGrid: { flexDirection: "row", gap: 8 },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 8, color: "#94a3b8" },
  metaValue: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 1 },
  divider: { borderBottom: "1px solid #e2e8f0", marginVertical: 12 },
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    color: "#ffffff",
    padding: "6 8",
    borderRadius: 3,
  },
  tableRow: {
    flexDirection: "row",
    padding: "8 8",
    borderBottom: "1px solid #f1f5f9",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: "8 8",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #f1f5f9",
  },
  tableTotalRow: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    padding: "8 8",
    borderRadius: 3,
    marginTop: 2,
  },
  colDescription: { flex: 3 },
  colAmount: { flex: 1, textAlign: "right" },
  headerText: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 9 },
  totalText: { color: "#ffffff", fontFamily: "Helvetica-Bold" },
  qrSection: {
    marginTop: 16,
    padding: 12,
    border: "1px dashed #cbd5e1",
    borderRadius: 4,
    backgroundColor: "#f8fafc",
  },
  qrImage: { width: 90, height: 90 },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
    borderTop: "1px solid #e2e8f0",
    paddingTop: 8,
  },
});

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-SA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface InvoicePDFProps {
  invoice: {
    id: string;
    zatcaUUID: string | null;
    zatcaQrCode: string | null;
    gross_amount: number;
    vat_amount: number;
    total_amount: number;
    status: string;
    created_at: Date;
    due_date: Date | null;
  };
  company: {
    name_ar: string;
    cr_number: string | null;
  };
  placement: {
    candidate_submission: {
      full_name: string;
      current_title: string | null;
    };
  };
  qrImageBase64?: string;
}

export function InvoicePDF({ invoice, company, placement, qrImageBase64 }: InvoicePDFProps) {
  const platformVatNumber = process.env.PLATFORM_VAT_NUMBER ?? "300000000000003";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>TalentRadar</Text>
            <Text style={styles.tagline}>منصة صيد المواهب — B2B Recruitment Platform</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>Tax Invoice / فاتورة ضريبية</Text>
            <Text style={styles.vatNo}>VAT Reg: {platformVatNumber}</Text>
          </View>
        </View>

        {/* Invoice meta */}
        <View style={styles.section}>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Invoice No / رقم الفاتورة</Text>
              <Text style={styles.metaValue}>{invoice.zatcaUUID ?? invoice.id}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Issue Date / تاريخ الإصدار</Text>
              <Text style={styles.metaValue}>{formatDate(invoice.created_at)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Due Date / تاريخ الاستحقاق</Text>
              <Text style={styles.metaValue}>{formatDate(invoice.due_date)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bill to */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To / فاتورة إلى</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11 }}>{company.name_ar}</Text>
          {company.cr_number && (
            <Text style={{ color: "#64748b", marginTop: 2 }}>CR / السجل التجاري: {company.cr_number}</Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* Line items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Items / بنود الفاتورة</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colDescription, styles.headerText]}>Description / الوصف</Text>
              <Text style={[styles.colAmount, styles.headerText]}>Amount SAR / المبلغ</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.colDescription}>
                Recruitment Service — {placement.candidate_submission.full_name}
                {placement.candidate_submission.current_title
                  ? ` — ${placement.candidate_submission.current_title}`
                  : ""}
              </Text>
              <Text style={styles.colAmount}>{invoice.gross_amount.toLocaleString()}</Text>
            </View>

            <View style={styles.tableRowAlt}>
              <Text style={[styles.colDescription, { color: "#64748b" }]}>
                VAT 15% / ضريبة القيمة المضافة (15%)
              </Text>
              <Text style={[styles.colAmount, { color: "#64748b" }]}>{invoice.vat_amount.toLocaleString()}</Text>
            </View>

            <View style={styles.tableTotalRow}>
              <Text style={[styles.colDescription, styles.totalText]}>Total / الإجمالي شامل الضريبة</Text>
              <Text style={[styles.colAmount, styles.totalText]}>{invoice.total_amount.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* ZATCA QR */}
        {invoice.zatcaUUID && (
          <View style={styles.qrSection}>
            <Text style={styles.sectionTitle}>ZATCA e-Invoice QR Code</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#64748b", marginBottom: 2 }}>
                  Invoice UUID: {invoice.zatcaUUID}
                </Text>
                <Text style={{ color: "#94a3b8", fontSize: 8, marginTop: 4 }}>
                  This invoice is generated in compliance with ZATCA Phase 2 requirements.
                </Text>
              </View>
              {qrImageBase64 && (
                // eslint-disable-next-line jsx-a11y/alt-text
                <View>
                  {/* @ts-expect-error react-pdf Image accepts src as string */}
                  <image src={`data:image/png;base64,${qrImageBase64}`} style={styles.qrImage} />
                </View>
              )}
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          TalentRadar — منصة صيد المواهب | talent-radar-gamma.vercel.app | Generated automatically
        </Text>
      </Page>
    </Document>
  );
}
