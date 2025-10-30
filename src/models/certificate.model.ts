export interface Certificate {
  id: number;
  subject: string;
  organization: string;
  commonName: string;
  pem: string;
}
