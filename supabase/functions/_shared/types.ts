// ============================================================
// Tipe bersama Edge Functions konsultasi.
// ============================================================

export type Role = 'admin_konsultasi' | 'konsultan' | 'reviewer';

export const ROLES: Role[] = ['admin_konsultasi', 'konsultan', 'reviewer'];

export interface StaffContext {
  /** Email hasil verifikasi JWT (auth.getUser) — bukan dari body. */
  email: string;
  /** Role dari tabel consultation_staff_roles — bukan dari body. */
  role: Role;
}

/** Kredensial tiket pemohon: nomor publik + secret (hanya hash disimpan). */
export interface TicketCredential {
  nomor: string;
  secret: string;
}

export interface AuditEvent {
  aktor: string;
  aktorJenis: 'pemohon' | 'staf' | 'sistem';
  aksi: string;
  ticketId?: string | null;
  detail?: Record<string, unknown>;
}

export interface RateResult {
  allowed: boolean;
  retry_after?: number;
  sisa?: number;
}
