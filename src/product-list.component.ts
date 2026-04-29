import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroInformationCircle, heroCog, heroCheckCircle, heroSquare2Stack } from '@ng-icons/heroicons/outline';
import { DataService } from './services/data.service';
import { Product, GroupedProduct } from './models/product.model';

type SortKey = 'conformanceDateDesc' | 'conformanceDateAsc' | 'creationDateDesc' | 'creationDateAsc';

@Component({
  selector: 'app-product-list',
  template: `<!-- Details Modal -->
@if (selectedGroup()) {
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" (click)="closeModal()">
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
      <div class="p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
        <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-100">{{ selectedGroup()?.vendorName }}</h3>
        <p class="text-slate-600 dark:text-slate-300 font-medium text-lg">{{ selectedGroup()?.productName }}</p>
        @if (selectedGroup()?.organizationalUnit) {
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ selectedGroup()?.organizationalUnit }}</p>
        }
        <div class="mt-2 flex items-center gap-2">
            <span class="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded">{{ selectedGroup()?.distinguishedName }}</span>
        </div>
        <button (click)="closeModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <div class="flex-grow overflow-y-auto p-6 space-y-8">
        @for (product of selectedGroup()?.records; track product.recordId) {
          <div class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div class="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-4">
              <div class="flex flex-col">
                <span class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Record ID</span>
                <span class="text-sm font-mono text-slate-700 dark:text-slate-300">{{ product.recordId }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span
                  class="text-xs font-semibold px-2 py-1 rounded-full"
                  [ngClass]="{
                    'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200': product.status === 'conformant',
                    'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200': product.status === 'revoked',
                    'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200': product.status !== 'conformant' && product.status !== 'revoked'
                  }">
                  {{ formatStatus(product.status) }}
                </span>
                <span class="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded-md">{{ product.productType }}</span>
              </div>
            </div>
            
            <div class="p-4 space-y-6">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <h5 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Version & Specs</h5>
                  <dl class="space-y-1 text-sm">
                    <div class="flex justify-between">
                      <dt class="text-slate-500 dark:text-slate-400">Min. Version:</dt>
                      <dd class="text-slate-800 dark:text-slate-200 font-medium">{{ product.productVersion }}</dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-slate-500 dark:text-slate-400">Spec Version(s):</dt>
                      <dd class="text-slate-800 dark:text-slate-200 font-medium">{{ product.specVersions.join(', ') }}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h5 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Assurance</h5>
                  <div class="flex items-center gap-2">
                    @if (product.assuranceLevelValue; as level) {
                      <div class="flex items-center gap-1">
                        @for (i of [1, 2, 3, 4]; track i) {
                          <span class="h-2 w-2 rounded-full"
                                [ngClass]="getAssuranceDotClass(level, i - 1)"></span>
                        }
                      </div>
                      <span class="text-sm text-slate-800 dark:text-slate-200 font-medium">{{ product.assuranceLevel }}</span>
                    } @else {
                      <span class="text-sm text-slate-800 dark:text-slate-200 font-medium">{{ product.assuranceLevel }}</span>
                    }
                  </div>
                </div>

                <div>
                  <h5 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Dates</h5>
                  <dl class="space-y-1 text-sm">
                    <div class="flex justify-between">
                      <dt class="text-slate-500 dark:text-slate-400">Conformance:</dt>
                      <dd class="text-slate-800 dark:text-slate-200 font-medium">{{ product.conformanceDate | date:'shortDate' }}</dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-slate-500 dark:text-slate-400">Created:</dt>
                      <dd class="text-slate-800 dark:text-slate-200 font-medium">{{ product.creationDate | date:'shortDate' }}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div>
                <h5 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Media Types & Formats</h5>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Generation Box -->
                  <div class="bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div class="flex items-center gap-2 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">
                      <ng-icon name="heroCog" class="text-slate-400"></ng-icon>
                      <span>Generation</span>
                    </div>
                    @if (product.generationMediaTypes && product.generationMediaTypes.length > 0) {
                      <div class="space-y-3">
                        @for (mediaType of product.generationMediaTypes; track mediaType) {
                          <div>
                            <p class="text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">{{mediaType}}</p>
                            <div class="flex flex-wrap gap-1.5 mt-1">
                              @for(format of product.generationFormats[mediaType]; track format) {
                                <span class="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{{ format }}</span>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-2">No generation support</p>
                    }
                  </div>

                  <!-- Validation Box -->
                  <div class="bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div class="flex items-center gap-2 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">
                      <ng-icon name="heroCheckCircle" class="text-slate-400"></ng-icon>
                      <span>Validation</span>
                    </div>
                    @if (product.validationMediaTypes && product.validationMediaTypes.length > 0) {
                      <div class="space-y-3">
                        @for (mediaType of product.validationMediaTypes; track mediaType) {
                          <div>
                            <p class="text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">{{mediaType}}</p>
                            <div class="flex flex-wrap gap-1.5 mt-1">
                              @for(format of product.validationFormats[mediaType]; track format) {
                                <span class="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{{ format }}</span>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-2">No validation support</p>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <div class="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-right rounded-b-lg sticky bottom-0 z-10">
        <button (click)="closeModal()" class="bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-semibold py-2 px-6 rounded-md shadow-sm transition-colors duration-200">
          Close
        </button>
      </div>
    </div>
  </div>
}
<div class="space-y-6">

  <!-- Filters Section -->
  <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
    <div class="mb-4">
        <label for="product-search" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Search</label>
        <input 
          type="text"
          id="product-search"
          placeholder="Search anything..."
          [ngModel]="searchTerm()"
          (ngModelChange)="onSearchTermChange($event)"
          class="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-slate-400 focus:ring focus:ring-slate-300 focus:ring-opacity-50 text-sm py-2 px-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
        />
      </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Filter by Vendor -->
      <div>
        <label for="vendor" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Vendor</label>
        <select 
          id="vendor" 
          [ngModel]="selectedVendor()" 
          (ngModelChange)="onVendorChange($event)"
          class="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-slate-400 focus:ring focus:ring-slate-300 focus:ring-opacity-50 text-sm py-2 px-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200">
          <option value="">All Vendors</option>
          @for (vendor of vendors(); track vendor) {
            <option [value]="vendor">{{ vendor }}</option>
          }
        </select>
      </div>
      <!-- Filter by Product Type -->
      <div>
        <label for="product-type" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Product Type</label>
        <select 
          id="product-type" 
          [ngModel]="selectedProductType()" 
          (ngModelChange)="onProductTypeChange($event)"
          class="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-slate-400 focus:ring focus:ring-slate-300 focus:ring-opacity-50 text-sm py-2 px-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200">
          <option value="">All Types</option>
          @for (type of productTypes(); track type) {
            <option [value]="type">{{ type }}</option>
          }
        </select>
      </div>
      <!-- Filter by Assurance Level -->
      <div>
        <label for="assurance-level" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Assurance Level</label>
        <select 
          id="assurance-level" 
          [ngModel]="selectedAssuranceLevel()" 
          (ngModelChange)="onAssuranceLevelChange($event)"
          class="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-slate-400 focus:ring focus:ring-slate-300 focus:ring-opacity-50 text-sm py-2 px-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200">
          <option value="">All Levels</option>
          @for (level of assuranceLevels(); track level) {
            <option [value]="level">{{ level }}</option>
          }
        </select>
      </div>
      <!-- Filter by Status -->
      <div>
        <label for="status" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
        <select
          id="status"
          [ngModel]="selectedStatus()"
          (ngModelChange)="onStatusChange($event)"
          class="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-slate-400 focus:ring focus:ring-slate-300 focus:ring-opacity-50 text-sm py-2 px-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200">
          <option value="">All Statuses</option>
          @for (status of statuses(); track status) {
            <option [value]="status">{{ formatStatus(status) }}</option>
          }
        </select>
      </div>
    </div>
    <!-- Reset Button -->
    <div class="mt-4 flex justify-end">
        <button 
          (click)="resetFilters()"
          class="w-full sm:w-auto bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors duration-200 text-sm disabled:bg-slate-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 disabled:cursor-not-allowed"
          [disabled]="!isAnyFilterActive()">
          Reset Filters
        </button>
    </div>
    <!-- Media Type Filters -->
    <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Media Types (select all that apply)</label>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            @for (mediaType of mediaTypesForDisplay; track mediaType.key) {
            <div class="flex items-center">
                <input 
                type="checkbox" 
                [id]="'media-type-' + mediaType.key" 
                [checked]="selectedMediaTypes().has(mediaType.key)"
                (change)="onMediaTypeChange(mediaType.key, $event)"
                class="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600 focus:ring-slate-500">
                <label [for]="'media-type-' + mediaType.key" class="ml-2 text-sm text-slate-600 dark:text-slate-400">{{ mediaType.label }}</label>
            </div>
            }
        </div>
    </div>

    <!-- Contextual File Format Filters -->
    @if (selectedMediaTypes().size > 0) {
      <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">File Formats (shows formats that match <span class="font-bold">any</span> selected type)</label>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            @for (format of availableFileFormats(); track format) {
            <div class="flex items-center">
                <input 
                type="checkbox" 
                [id]="'format-' + format"
                [checked]="selectedFormats().has(format)"
                (change)="onFormatChange(format, $event)"
                class="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600 focus:ring-slate-500">
                <label [for]="'format-' + format" class="ml-2 text-sm text-slate-600 dark:text-slate-400 font-mono">{{ format }}</label>
            </div>
            }
        </div>
      </div>
    }

  </div>

  <!-- Results Count & Sorting -->
  <div class="flex justify-between items-center my-4">
    <div class="text-sm text-slate-600 dark:text-slate-400">
      Showing <span class="font-semibold text-slate-700 dark:text-slate-200">{{ groupedProducts().length }}</span> products (from <span class="font-semibold text-slate-700 dark:text-slate-200">{{ filteredProducts().length }}</span> matching records).
    </div>
    <div class="flex items-center">
        <label for="sort-order" class="text-sm font-medium text-slate-700 dark:text-slate-300 mr-2 whitespace-nowrap">Sort results by</label>
        <select 
            id="sort-order"
            [ngModel]="sortOrder()"
            (ngModelChange)="onSortOrderChange($event)"
            class="block rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-slate-400 focus:ring focus:ring-slate-300 focus:ring-opacity-50 text-sm py-2 px-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200">
            <option value="conformanceDateDesc">Conformance Date (Newest)</option>
            <option value="conformanceDateAsc">Conformance Date (Oldest)</option>
            <option value="creationDateDesc">Application Date (Newest)</option>
            <option value="creationDateAsc">Application Date (Oldest)</option>
        </select>
    </div>
  </div>


  <!-- Results Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    @for (group of groupedProducts(); track group.distinguishedName) {
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-shadow duration-200">
        <div class="flex-grow">
          <div class="flex justify-between items-start gap-4">
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{{ group.productName }}</h2>
            @if (group.records.length > 1) {
              <div class="flex items-center whitespace-nowrap shrink-0 gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-1 rounded-full border border-blue-100 dark:border-blue-800/50">
                <ng-icon name="heroSquare2Stack"></ng-icon>
                <span>{{ group.records.length }} RECORDS</span>
              </div>
            }
          </div>
          <p class="text-slate-600 dark:text-slate-300 font-medium mt-1">{{ group.vendorName }}</p>
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ group.organizationalUnit }}</p>
          
          <div class="mt-3 flex flex-wrap gap-2">
            @for (status of group.statuses; track status) {
              <span
                class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                [ngClass]="{
                  'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200': status === 'conformant',
                  'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200': status === 'revoked',
                  'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200': status !== 'conformant' && status !== 'revoked'
                }">
                {{ formatStatus(status) }}
              </span>
            }
          </div>
        </div>
        
        <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2 text-sm">
          <div class="flex justify-between items-center">
            <span class="font-semibold text-slate-600 dark:text-slate-300">Type(s):</span>
            <span class="text-slate-700 dark:text-slate-200 text-xs">{{ group.productTypes.join(', ') }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-semibold text-slate-600 dark:text-slate-300">Assurance:</span>
            <div class="flex items-center gap-2">
              @if (group.assuranceLevelValue; as level) {
                <div class="flex items-center gap-1">
                  @for (i of [1, 2, 3, 4]; track i) {
                    <span class="h-2 w-2 rounded-full"
                          [ngClass]="getAssuranceDotClass(level, i - 1)"></span>
                  }
                </div>
              }
              <span class="text-slate-700 dark:text-slate-200 text-xs">{{ group.assuranceLevel }}</span>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-semibold text-slate-600 dark:text-slate-300">Latest Conformance:</span>
            <span class="text-slate-700 dark:text-slate-200 text-xs">{{ group.latestConformanceDate | date:'longDate' }}</span>
          </div>
        </div>
        
        <div class="mt-4">
          <button (click)="selectGroup(group)" class="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-md transition-colors duration-200">
            View Details
          </button>
        </div>
      </div>
    } @empty {
      <div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <p class="text-slate-500 dark:text-slate-400">No products match the selected filters.</p>
      </div>
    }
  </div>

  <!-- Data Source Link -->
  <div class="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
    Retrieved from the
    <a 
      href="https://github.com/c2pa-org/conformance-public/blob/main/conforming-products/conforming-products-list.json" 
      target="_blank" 
      rel="noopener noreferrer" 
      class="font-medium underline hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
      C2PA <code class="font-mono">conformance-public</code> repository
    </a>.
  </div>
</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent, NgIcon],
  providers: [provideIcons({ heroInformationCircle, heroCog, heroCheckCircle, heroSquare2Stack })],
})
export class ProductListComponent implements OnInit {
  private dataService = inject(DataService);

  // Raw data signals
  products = this.dataService.products;

  // Filter signals
  selectedVendor = signal('');
  selectedProductType = signal('');
  selectedAssuranceLevel = signal('');
  searchTerm = signal('');
  sortOrder = signal<SortKey>('conformanceDateDesc');
  selectedMediaTypes = signal<Set<string>>(new Set());
  selectedFormats = signal<Set<string>>(new Set());
  selectedStatus = signal('');

  // Modal signal
  selectedGroup = signal<GroupedProduct | null>(null);

  private platformId = inject(PLATFORM_ID);

  // URL DN filter signals
  urlCn = signal('');
  urlO = signal('');
  urlC = signal('');
  urlOu = signal('');

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Use a robust URL parsing method that checks the full href
      const url = new URL(window.location.href);
      // Check standard search params first, fallback to hash params if present
      const getParam = (key: string) => {
        return url.searchParams.get(key) || new URLSearchParams(url.hash.split('?')[1] || '').get(key);
      };

      const query = getParam('q');
      if (query) this.searchTerm.set(query);
      
      const cn = getParam('cn');
      if (cn) this.urlCn.set(cn.toLowerCase());

      const o = getParam('o');
      if (o) this.urlO.set(o.toLowerCase());

      const ou = getParam('ou');
      if (ou) this.urlOu.set(ou.toLowerCase());

      const c = getParam('c');
      if (c) this.urlC.set(c.toLowerCase());
    }
  }

  // This effect clears the file format selections when no media types are selected.
  private clearFormatsEffect = effect(() => {
    if (this.selectedMediaTypes().size === 0) {
      this.selectedFormats.set(new Set());
    }
  });

  // A list of all possible media types for the filter UI.
  public readonly mediaTypesForDisplay = [
    { key: 'image', label: 'Image' },
    { key: 'video', label: 'Video' },
    { key: 'audio', label: 'Audio' },
    { key: 'documents', label: 'Documents' },
    { key: 'fonts', label: 'Fonts' },
    { key: 'mlModel', label: 'ML Model' },
  ];

  // Derived (computed) signals for UI elements and filtering
  vendors = computed(() => {
    const vendorNames = this.products().map(p => p.vendorName);
    // Fix: Explicitly type sort callback parameters to resolve 'unknown' type error.
    return [...new Set(vendorNames)].sort((a: string, b: string) => a.localeCompare(b));
  });

  productTypes = computed(() => {
    const types = this.products().map(p => p.productType);
    return [...new Set(types)].sort();
  });

  assuranceLevels = computed(() => {
    const levels = this.products().map(p => p.assuranceLevel);
    // Fix: Explicitly type sort callback parameters to resolve 'unknown' type error.
    return [...new Set(levels)].sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }));
  });

  statuses = computed(() => {
    const statuses = this.products().map(p => p.status);
    return [...new Set(statuses)].sort();
  });
  
  // This computed signal dynamically generates the list of available file formats
  // based on the currently selected media types, ensuring only relevant formats are shown.
  availableFileFormats = computed(() => {
    const selectedMedia = this.selectedMediaTypes();
    if (selectedMedia.size === 0) {
      return [];
    }
    const formats = new Set<string>();
    this.products().forEach(product => {
      for (const mediaType of selectedMedia) {
        if (product.formatsByMediaType[mediaType]) {
          product.formatsByMediaType[mediaType].forEach(format => formats.add(format));
        }
      }
    });
    return Array.from(formats).sort();
  });

  filteredProducts = computed(() => {
    const vendor = this.selectedVendor();
    const type = this.selectedProductType();
    const level = this.selectedAssuranceLevel();
    const mediaTypes = this.selectedMediaTypes();
    const formats = this.selectedFormats();
    const sort = this.sortOrder();
    const term = this.searchTerm().toLowerCase();
    const status = this.selectedStatus();

    // Get DN filters
    const cnFilter = this.urlCn();
    const oFilter = this.urlO();
    const ouFilter = this.urlOu();
    const cFilter = this.urlC();

    const filtered = this.products().filter(p => {
      const vendorMatch = vendor === '' || p.vendorName === vendor;
      const productTypeMatch = type === '' || p.productType === type;
      const assuranceLevelMatch = level === '' || p.assuranceLevel === level;
      const statusMatch = status === '' || p.status === status;
      
      const mediaTypesMatch = mediaTypes.size === 0 || p.supportedMediaTypes.some(mt => mediaTypes.has(mt));
      
      const formatsMatch = formats.size === 0 || p.supportedFileFormats.some(f => formats.has(f));

      const searchTermMatch = term === '' || 
        Object.values(p).some(val => 
          typeof val === 'string' && val.toLowerCase().includes(term)
        ) ||
        p.supportedMediaTypes.some(type => type.toLowerCase().includes(term)) ||
        p.supportedFileFormats.some(format => format.toLowerCase().includes(term));

      // DN filters matching (CN maps to productName, O maps to vendorName, OU maps to organizationalUnit)
      const cnMatch = !cnFilter || p.productName.toLowerCase().includes(cnFilter);
      const oMatch = !oFilter || p.vendorName.toLowerCase().includes(oFilter);
      const ouMatch = !ouFilter || p.organizationalUnit.toLowerCase().includes(ouFilter);
      
      // C mapping matches against the DN string directly since it's not a separate property
      const cMatch = !cFilter || p.distinguishedName.toLowerCase().includes(`c=${cFilter}`);

      return vendorMatch && productTypeMatch && assuranceLevelMatch && mediaTypesMatch && formatsMatch && searchTermMatch && statusMatch && cnMatch && oMatch && ouMatch && cMatch;
    });

    // Sort the filtered results
    return filtered.sort((a, b) => {
      switch (sort) {
        case 'conformanceDateDesc':
          return new Date(b.conformanceDate).getTime() - new Date(a.conformanceDate).getTime();
        case 'conformanceDateAsc':
          return new Date(a.conformanceDate).getTime() - new Date(b.conformanceDate).getTime();
        case 'creationDateDesc':
          return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
        case 'creationDateAsc':
          return new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime();
        default:
            return 0;
      }
    });
  });

  groupedProducts = computed(() => {
    const products = this.filteredProducts();
    const groups = new Map<string, Product[]>();
    
    products.forEach(p => {
      const dn = p.distinguishedName;
      if (!groups.has(dn)) {
        groups.set(dn, []);
      }
      groups.get(dn)!.push(p);
    });
    
    return Array.from(groups.entries()).map(([dn, records]) => {
      // Sort records by conformanceDate (newest first)
      records.sort((a, b) => new Date(b.conformanceDate).getTime() - new Date(a.conformanceDate).getTime());
      const first = records[0];
      return {
        distinguishedName: dn,
        vendorName: first.vendorName,
        productName: first.productName,
        organizationalUnit: first.organizationalUnit,
        records: records,
        latestConformanceDate: first.conformanceDate, // The first record is now the latest due to sorting
        statuses: [...new Set(records.map(p => p.status))],
        productTypes: [...new Set(records.map(p => p.productType))],
        assuranceLevel: first.assuranceLevel,
        assuranceLevelValue: first.assuranceLevelValue,
      } as GroupedProduct;
    });  });

  isAnyFilterActive = computed(() => {
    return this.selectedVendor() !== '' || 
           this.selectedProductType() !== '' || 
           this.selectedAssuranceLevel() !== '' || 
           this.selectedMediaTypes().size > 0 ||
           this.selectedFormats().size > 0 ||
           this.searchTerm() !== '';
  });

  // Event handlers
  onVendorChange(value: string): void {
    this.selectedVendor.set(value);
  }

  onProductTypeChange(value: string): void {
    this.selectedProductType.set(value);
  }

  onAssuranceLevelChange(value: string): void {
    this.selectedAssuranceLevel.set(value);
  }

  onStatusChange(value: string): void {
    this.selectedStatus.set(value);
  }

  onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
  }

  onSortOrderChange(value: SortKey): void {
    this.sortOrder.set(value);
  }

  onMediaTypeChange(mediaType: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedMediaTypes.update(currentSet => {
      const newSet = new Set(currentSet);
      if (isChecked) {
        newSet.add(mediaType);
      } else {
        newSet.delete(mediaType);
      }
      return newSet;
    });
  }

  onFormatChange(format: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedFormats.update(currentSet => {
        const newSet = new Set(currentSet);
        if (isChecked) {
            newSet.add(format);
        } else {
            newSet.delete(format);
        }
        return newSet;
    });
  }

  resetFilters(): void {
    this.selectedVendor.set('');
    this.selectedProductType.set('');
    this.selectedAssuranceLevel.set('');
    this.selectedStatus.set('');
    this.searchTerm.set('');
    this.sortOrder.set('conformanceDateDesc');
    this.selectedMediaTypes.set(new Set());
    this.selectedFormats.set(new Set());
  }

  formatStatus(status: string): string {
    if (!status) {
      return '';
    }
    return status
      .split('_')
      .map(word => {
        if (word.toLowerCase() === 'eol') {
          return 'EOL';
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' - ');
  }

  // Modal logic
  selectGroup(group: GroupedProduct): void {
    this.selectedGroup.set(group);
  }

  closeModal(): void {
    this.selectedGroup.set(null);
  }

  getAssuranceDotClass(level: number, index: number): string {
    const colors = ['bg-amber-500', 'bg-lime-500', 'bg-green-600', 'bg-green-800'];
    if (index < level) {
      return colors[level - 1];
    }
    return 'bg-slate-300 dark:bg-slate-600';
  }
}