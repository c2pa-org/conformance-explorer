import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, shareReplay } from 'rxjs/operators';
import { Certificate } from '../models/certificate.model';
import { X509Certificate } from '@peculiar/x509';

@Injectable({
  providedIn: 'root',
})
export class TsaTrustListService {
  private http = inject(HttpClient);
  private readonly PEM_URL = 'https://raw.githubusercontent.com/c2pa-org/conformance-public/refs/heads/main/trust-list/C2PA-TSA-TRUST-LIST.pem';

  private certificates$ = this.http.get(this.PEM_URL, { responseType: 'text' }).pipe(
    map(pemText => this.parsePemFile(pemText)),
    shareReplay(1)
  );

  certificates = toSignal(this.certificates$, { initialValue: [] as Certificate[] });

  private parsePemFile(text: string): Certificate[] {
    const certificates: Certificate[] = [];
    const certBlocks = text.split('-----END CERTIFICATE-----').filter(block => block.trim() !== '');

    certBlocks.forEach((block, index) => {
      const trimmedBlock = block.trim();
      const parts = trimmedBlock.split('-----BEGIN CERTIFICATE-----');
      if (parts.length < 2) return;

      const pemBody = `-----BEGIN CERTIFICATE-----\n${parts[1].trim()}\n-----END CERTIFICATE-----`;

      try {
        const cert = new X509Certificate(pemBody);
        const subject = cert.subject;
        const organizationField = cert.subjectName.getField('O');
        const commonNameField = cert.subjectName.getField('CN');

        const organization = Array.isArray(organizationField) ? organizationField[0] : organizationField;
        const commonName = Array.isArray(commonNameField) ? commonNameField[0] : commonNameField;

        certificates.push({
          id: index,
          subject: subject,
          organization: organization || 'N/A',
          commonName: commonName || 'N/A',
          pem: pemBody
        });
      } catch (error) {
        console.error('Failed to parse certificate:', error);
      }
    });

    return certificates;
  }
}