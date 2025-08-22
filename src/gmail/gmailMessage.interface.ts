export interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  invoiceNumber?: string;
  attachments?: {
    filename: string;
    data: Buffer;
  }[];
}