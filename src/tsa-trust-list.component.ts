import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TsaTrustListService } from './services/tsa-trust-list.service';
import { Certificate } from './models/certificate.model';
import { X509Certificate, SubjectKeyIdentifierExtension, AuthorityKeyIdentifierExtension } from '@peculiar/x509';

@Component({
  selector: 'app-tsa-trust-list',
  template: `<div class="space-y-6">
  <!-- Filter Section -->
  <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Filter by Organization -->
      <div>
        <label for="organization-filter" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Filter by Organization</label>
        <select 
          id="organization-filter"
          [ngModel]="selectedOrganization()"
          (ngModelChange)="onOrganizationChange($event)"
          class="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-slate-400 focus:ring focus:ring-slate-300 focus:ring-opacity-50 text-sm py-2 px-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200">
          <option value="">All Organizations</option>
          @for (org of organizations(); track org) {
            <option [value]="org">{{ org }}</option>
          }
        </select>
      </div>
      <!-- Search by Name/Subject -->
      <div>
        <label for="search-filter" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Search by Name/Subject</label>
        <input 
          type="text"
          id="search-filter"
          placeholder="Enter common name or subject..."
          [ngModel]="searchTerm()"
          (ngModelChange)="onSearchTermChange($event)"
          class="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-slate-400 focus:ring focus:ring-slate-300 focus:ring-opacity-50 text-sm py-2 px-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
        />
      </div>
    </div>
    <div class="text-sm text-slate-600 dark:text-slate-400 text-right mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
      Showing <span class="font-semibold text-slate-700 dark:text-slate-200">{{ filteredCertificates().length }}</span> of <span class="font-semibold text-slate-700 dark:text-slate-200">{{ certificates().length }}</span> certificates.
    </div>
  </div>

  <!-- Certificates Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    @for (cert of filteredCertificates(); track cert.id) {
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-shadow duration-200">
        <div class="flex-grow">
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">{{ cert.commonName }}</h2>
          <p class="text-slate-600 dark:text-slate-300 font-medium text-sm">{{ cert.organization }}</p>
        </div>
        <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button (click)="selectCertificate(cert)" class="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-md transition-colors duration-200 text-sm">
            View Certificate
          </button>
        </div>
      </div>
    } @empty {
      <div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <p class="text-slate-500 dark:text-slate-400">No certificates match the current filters.</p>
      </div>
    }
  </div>

  <!-- Data Source Link -->
  <div class="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
    Retrieved from the
    <a 
      href="https://github.com/c2pa-org/conformance-public/blob/main/trust-list/C2PA-TSA-TRUST-LIST.pem" 
      target="_blank" 
      rel="noopener noreferrer" 
      class="font-medium underline hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
      C2PA <code class="font-mono">conformance-public</code> repository
    </a>.
  </div>
</div>

<!-- Details Modal -->
@if (selectedCertificate()) {
  @let cert = selectedCertificate()!;
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" (click)="closeModal()">
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
      <div class="p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
        <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-100">{{ cert.commonName }}</h3>
        <p class="text-slate-600 dark:text-slate-300 font-medium text-lg">{{ cert.organization }}</p>
        <button (click)="closeModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="p-6 space-y-4 overflow-y-auto">
        <!-- Decoded Certificate Details -->
        @if (decodedCertificate()) {
          @let decoded = decodedCertificate()!;
          <div class="space-y-4">
            <h4 class="font-semibold text-slate-700 dark:text-slate-200">Decoded Certificate Details</h4>
            
            @if (decoded.error) {
              <p class="text-red-500">{{ decoded.error }}</p>
            } @else {
              <div class="space-y-4 text-sm">
                <!-- Subject Information -->
                <div class="space-y-2">
                  <h5 class="font-semibold text-slate-600 dark:text-slate-300">Subject Information</h5>
                  <div class="bg-slate-100 dark:bg-slate-700 p-3 rounded-md space-y-2">
                    <div>
                      <p class="font-mono break-all"><strong>Subject:</strong> {{ decoded.subject }}</p>
                    </div>
                    <div>
                      <p class="font-mono break-all"><strong>Subject Key Identifier:</strong> {{ decoded.subjectKeyIdentifier }}</p>
                    </div>
                  </div>
                </div>

                <!-- Issuer Information -->
                <div class="space-y-2">
                  <h5 class="font-semibold text-slate-600 dark:text-slate-300">Issuer Information</h5>
                  <div class="bg-slate-100 dark:bg-slate-700 p-3 rounded-md space-y-2">
                    <div>
                      <p class="font-mono break-all"><strong>Issuer:</strong> {{ decoded.issuer }}</p>
                    </div>
                    <div>
                      <p class="font-mono break-all"><strong>Authority Key Identifier:</strong> {{ decoded.authorityKeyIdentifier }}</p>
                    </div>
                  </div>
                </div>

                <!-- Certificate Details -->
                <div class="space-y-2">
                  <h5 class="font-semibold text-slate-600 dark:text-slate-300">Certificate Details</h5>
                  <div class="bg-slate-100 dark:bg-slate-700 p-3 rounded-md space-y-2">
                    <div>
                      <p class="font-mono break-all"><strong>Serial Number:</strong> {{ decoded.serialNumber }}</p>
                    </div>
                    <div>
                      <p class="font-mono"><strong>Validity:</strong><br>
                        Not Before: {{ decoded.validity.notBefore | date:'medium' }}<br>
                        Not After: {{ decoded.validity.notAfter | date:'medium' }}
                      </p>
                    </div>
                    <div>
                      <p class="font-mono"><strong>Fingerprints:</strong></p>
                    </div>
                    <div>
                      <p class="font-mono break-all"><strong>SHA-1:</strong> {{ decoded.fingerprints.sha1 }}</p>
                    </div>
                    <div>
                      <p class="font-mono break-all"><strong>SHA-256:</strong> {{ decoded.fingerprints.sha256 }}</p>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <div>
          <h4 class="font-semibold text-slate-700 dark:text-slate-200 mb-2">PEM Certificate</h4>
          <pre class="text-xs text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/50 p-3 rounded-md overflow-x-auto"><code>{{ cert.pem }}</code></pre>
          <div class="flex justify-end items-center mt-2">
            <div class="flex gap-2">
              <button (click)="copyPem(cert.pem)" class="text-sm bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-semibold py-1 px-3 rounded-md transition-colors">
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-right rounded-b-lg sticky bottom-0">
        <button (click)="closeModal()" class="bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors duration-200">
          Close
        </button>
      </div>
    </div>
  </div>
}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class TsaTrustListComponent {
  private tsaTrustListService = inject(TsaTrustListService);

  certificates = this.tsaTrustListService.certificates;
  selectedOrganization = signal('');
  searchTerm = signal('');
  selectedCertificate = signal<Certificate | null>(null);
  decodedCertificate = signal<any | null>(null);

  organizations = computed(() => {
    const orgs = this.certificates().map(c => c.organization);
    // Fix: Explicitly type sort callback parameters to resolve 'unknown' type error.
    return [...new Set(orgs)].sort((a: string, b: string) => a.localeCompare(b));
  });

  filteredCertificates = computed(() => {
    const org = this.selectedOrganization();
    const term = this.searchTerm().toLowerCase();

    let filtered = this.certificates();

    if (org) {
      filtered = filtered.filter(cert => cert.organization === org);
    }

    if (term) {
      filtered = filtered.filter(cert => 
        cert.commonName.toLowerCase().includes(term) ||
        cert.subject.toLowerCase().includes(term)
      );
    }

    return filtered;
  });
  
  onOrganizationChange(org: string): void {
    this.selectedOrganization.set(org);
  }

  onSearchTermChange(term: string): void {
    this.searchTerm.set(term);
  }

  selectCertificate(certificate: Certificate): void {
    this.selectedCertificate.set(certificate);
    this.decodedCertificate.set(null);
    this.decodeCertificate(certificate.pem);
  }

  closeModal(): void {
    this.selectedCertificate.set(null);
    this.decodedCertificate.set(null);
  }

  copyPem(pem: string): void {
    navigator.clipboard.writeText(pem).catch(err => console.error('Failed to copy PEM:', err));
  }

  private arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private reorderDn(dn: string): string {
    const parts = dn.split(',').map(s => s.trim());
    const order = ['CN', 'O', 'OU'];
    const ordered: (string | undefined)[] = new Array(order.length);
    const remaining: string[] = [];

    for (const p of parts) {
        const key = p.split('=')[0];
        const index = order.indexOf(key);
        if (index !== -1) {
            ordered[index] = p;
        } else {
            remaining.push(p);
        }
    }

    return ordered.filter(Boolean).concat(remaining).join(', ');
  }

  async decodeCertificate(pem: string) {
    try {
      const cert = new X509Certificate(pem);

      const subjectKeyIdentifierExt = cert.extensions.find(ext => ext instanceof SubjectKeyIdentifierExtension) as SubjectKeyIdentifierExtension | undefined;
      const subjectKeyIdentifier = subjectKeyIdentifierExt ? this.arrayBufferToHex(subjectKeyIdentifierExt.value) : 'N/A';

      const authorityKeyIdentifierExt = cert.extensions.find(ext => ext instanceof AuthorityKeyIdentifierExtension) as AuthorityKeyIdentifierExtension | undefined;
      const authorityKeyIdentifier = authorityKeyIdentifierExt ? this.arrayBufferToHex(authorityKeyIdentifierExt.value) : 'N/A';

      const sha1Thumbprint = await cert.getThumbprint('SHA-1');
      const sha256Thumbprint = await cert.getThumbprint('SHA-256');

      this.decodedCertificate.set({
        subject: this.reorderDn(cert.subject),
        issuer: this.reorderDn(cert.issuer),
        serialNumber: cert.serialNumber,
        subjectKeyIdentifier,
        authorityKeyIdentifier,
        fingerprints: {
          sha1: this.arrayBufferToHex(sha1Thumbprint),
          sha256: this.arrayBufferToHex(sha256Thumbprint),
        },
        validity: {
          notBefore: cert.notBefore,
          notAfter: cert.notAfter,
        },
      });
    } catch (error) {
      console.error('Failed to decode certificate:', error);
      this.decodedCertificate.set({ error: 'Failed to decode certificate.' });
    }
  }
}
