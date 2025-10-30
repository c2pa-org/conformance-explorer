import { Injectable, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, shareReplay } from 'rxjs/operators';
import { Certificate } from '../models/certificate.model';

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
    // Split by the end delimiter and filter out any empty strings
    const certBlocks = text.split('-----END CERTIFICATE-----').filter(block => block.trim() !== '');

    certBlocks.forEach((block, index) => {
      const trimmedBlock = block.trim();
      // The subject line is everything before the BEGIN delimiter
      const parts = trimmedBlock.split('-----BEGIN CERTIFICATE-----');
      if (parts.length < 2) return; // Malformed block

      const subjectLine = parts[0].trim();
      const pemBody = `-----BEGIN CERTIFICATE-----\n${parts[1].trim()}\n-----END CERTIFICATE-----`;

      const organization = this.extractSubjectPart(subjectLine, 'O');
      const commonName = this.extractSubjectPart(subjectLine, 'CN');

      if (subjectLine) {
        certificates.push({
          id: index,
          subject: subjectLine,
          organization: organization,
          commonName: commonName,
          pem: pemBody
        });
      }
    });

    return certificates;
  }

  private extractSubjectPart(subject: string, part: 'O' | 'CN'): string {
    // Regex to find 'O=' or 'CN=' followed by anything until a comma or end of string
    const regex = new RegExp(`${part}=([^,]+)`);
    const match = subject.match(regex);
    return match ? match[1].trim() : 'N/A';
  }
}