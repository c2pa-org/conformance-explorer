import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrustListService } from './services/trust-list.service';
import { Certificate } from './models/certificate.model';

@Component({
  selector: 'app-trust-list',
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
      href="https://github.com/c2pa-org/conformance-public/blob/main/trust-list/C2PA-TRUST-LIST.pem" 
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
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
      <div class="p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
        <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-100">{{ cert.commonName }}</h3>
        <p class="text-slate-600 dark:text-slate-300 font-medium text-lg">{{ cert.organization }}</p>
        <button (click)="closeModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="p-6 space-y-4 overflow-y-auto">
        <div>
          <h4 class="font-semibold text-slate-700 dark:text-slate-200 mb-2">Full Subject</h4>
          <p class="text-sm text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 p-3 rounded-md font-mono break-all">{{ cert.subject }}</p>
        </div>
        <div>
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-semibold text-slate-700 dark:text-slate-200">PEM Certificate</h4>
            <button (click)="copyPem(cert.pem)" class="text-sm bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-semibold py-1 px-3 rounded-md transition-colors">
              Copy
            </button>
          </div>
          <pre class="text-xs text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/50 p-3 rounded-md overflow-x-auto"><code>{{ cert.pem }}</code></pre>
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
export class TrustListComponent {
  private trustListService = inject(TrustListService);

  certificates = this.trustListService.certificates;
  selectedOrganization = signal('');
  searchTerm = signal('');
  selectedCertificate = signal<Certificate | null>(null);

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
  }

  closeModal(): void {
    this.selectedCertificate.set(null);
  }

  copyPem(pem: string): void {
    navigator.clipboard.writeText(pem).catch(err => console.error('Failed to copy PEM:', err));
  }
}
