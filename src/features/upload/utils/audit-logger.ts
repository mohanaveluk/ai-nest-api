// Audit logging utility
export class AuditLogger {
  static log(message: string): void {
    // Log to console or external system
    console.log(`[AUDIT] ${new Date().toISOString()} - ${message}`);
  }
}