/**
 * Mocked ADMIN-PORTAL screens for the landscape (1920×1080) tutorials. Every
 * export is pure and props-driven: the video owns the timeline, these own the
 * pixels. They render inside `BrowserFrame`'s 1440×620 content area.
 */
export { AdminShell, type AdminNavKey, type AdminShellProps } from './AdminShell';
export {
  DealerHeader,
  DEALER_TABS,
  DEALER_TABS_TODAY,
  type DealerHeaderProps,
  type DealerTab,
} from './DealerHeader';
export {
  CORRECTED_DATE,
  CORRECTED_LITRES,
  DsrLedger,
  dsrRows,
  type DsrColumn,
  type DsrLedgerProps,
  type DsrRow,
} from './DsrLedger';
export {
  DSR_PRODUCTS,
  DsrReceiptsDialog,
  type DsrReceiptsDialogProps,
  type ProductRow,
} from './DsrReceiptsDialog';
export {
  DsrReportCard,
  DsrSaveToast,
  DsrStaleBanner,
  DsrTab,
  DsrToolbar,
  DsrVaultRail,
  type DsrReportCardProps,
  type DsrStaleBannerProps,
  type DsrTabProps,
  type DsrToolbarProps,
} from './DsrTab';
export { GenerateCard, type GenerateCardProps, type GenerateMode } from './GenerateCard';
export {
  EmptyDay,
  MANUAL_GRIDS,
  ManualDayGrids,
  ManualGrid,
  ReviewDialog,
  VaultRail,
  type GridCode,
} from './ManualDay';
export * from './icons';
export {
  ReportDetail,
  type ReportDetailProps,
  type ReportHighlight,
} from './ReportDetail';
export {
  ReportHistory,
  SAMPLE_REPORT_ROWS,
  type ReportHistoryProps,
  type ReportHistoryRow,
} from './ReportHistory';
export { Ring, RingOverlay, type RingProps } from './Ring';
export { RunFailure, type RunFailureProps } from './RunFailure';
export { ShareDialog, type ShareDialogProps } from './ShareDialog';
export { admin, cardBrand, SAMPLE } from './tokens';
export {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminInput,
  type AdminButtonVariant,
  type AdminIntent,
} from './ui';
