import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroInformationCircle, heroCog, heroCheckCircle } from '@ng-icons/heroicons/outline';
import { DataService } from './services/data.service';
import { Product } from './models/product.model';

type SortKey = 'conformanceDateDesc' | 'conformanceDateAsc' | 'creationDateDesc' | 'creationDateAsc';

@Component({
  selector: 'app-product-list',
  template: `<!-- Details Modal -->
@if (selectedProduct()) {
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" (click)="closeModal()">
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
      <div class="p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
        <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-100">{{ selectedProduct()?.vendorName }}</h3>
        <p class="text-slate-600 dark:text-slate-300 font-medium text-lg">{{ selectedProduct()?.productName }}</p>
        @if (selectedProduct()?.organizationalUnit) {
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ selectedProduct()?.organizationalUnit }}</p>
        }
        <div class="mt-2">
          <span
            class="text-xs font-semibold px-2 py-1 rounded-full"
            [ngClass]="{
              'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200': selectedProduct()?.status === 'conformant',
              'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200': selectedProduct()?.status === 'revoked',
              'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200': selectedProduct()?.status !== 'conformant' && selectedProduct()?.status !== 'revoked'
            }">
            {{ formatStatus(selectedProduct()?.status ?? '') }}
          </span>
        </div>
        <button (click)="closeModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <h4 class="font-semibold text-slate-700 dark:text-slate-200 mb-2">Product Information</h4>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt class="font-medium text-slate-500 dark:text-slate-400">Product Type</dt>
            <dd class="text-slate-800 dark:text-slate-200">{{ selectedProduct()?.productType }}</dd>
            <dt class="font-medium text-slate-500 dark:text-slate-400">Spec Version(s)</dt>
            <dd class="text-slate-800 dark:text-slate-200"><span class="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-2 py-1 rounded-md">{{ selectedProduct()?.specVersions.join(', ') }}</span></dd>
            <dt class="font-medium text-slate-500 dark:text-slate-400">Assurance Level</dt>
            <dd class="text-slate-800 dark:text-slate-200">
              @if (selectedProduct()?.assuranceLevelValue; as level) {
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1">
                    @for (i of [1, 2, 3, 4]; track i) {
                      <span class="h-2 w-2 rounded-full"
                            [ngClass]="getAssuranceDotClass(level, i - 1)"></span>
                    }
                  </div>
                  <span>{{ selectedProduct()?.assuranceLevel }}</span>
                </div>
              } @else {
                <span>{{ selectedProduct()?.assuranceLevel }}</span>
              }
            </dd>
            <dt class="font-medium text-slate-500 dark:text-slate-400">Min. Version</dt>
            <dd class="text-slate-800 dark:text-slate-200">{{ selectedProduct()?.productVersion }}</dd>
          </dl>
        </div>
        <div>
          <h4 class="font-semibold text-slate-700 dark:text-slate-200 mb-2">Supported Media Types & Formats</h4>
          <div class="flex flex-col md:flex-row gap-4">
            <!-- Generation Box -->
            <div class="flex-1 bg-slate-100 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div class="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">
                <ng-icon name="heroCog" class="text-slate-400 dark:text-slate-500"></ng-icon>
                <h5>Generation</h5>
              </div>
              @if (selectedProduct()?.generationMediaTypes && selectedProduct()?.generationMediaTypes.length > 0) {
                <div class="space-y-3 pt-1">
                  @for (mediaType of selectedProduct()?.generationMediaTypes; track mediaType) {
                    <div>
                      <p class="font-medium text-slate-600 dark:text-slate-400 capitalize">{{mediaType}}</p>
                      <div class="flex flex-wrap gap-2 mt-1">
                        @for(format of selectedProduct()?.generationFormats[mediaType]; track format) {
                          <span class="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-mono font-medium px-2 py-1 rounded-full">{{ format }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-sm text-slate-500 dark:text-slate-400">None supported for Generation.</p>
              }
            </div>

            <!-- Validation Box -->
            <div class="flex-1 bg-slate-100 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div class="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">
                <ng-icon name="heroCheckCircle" class="text-slate-400 dark:text-slate-500"></ng-icon>
                <h5>Validation</h5>
              </div>
              @if (selectedProduct()?.validationMediaTypes && selectedProduct()?.validationMediaTypes.length > 0) {
                <div class="space-y-3 pt-1">
                  @for (mediaType of selectedProduct()?.validationMediaTypes; track mediaType) {
                    <div>
                      <p class="font-medium text-slate-600 dark:text-slate-400 capitalize">{{mediaType}}</p>
                      <div class="flex flex-wrap gap-2 mt-1">
                        @for(format of selectedProduct()?.validationFormats[mediaType]; track format) {
                          <span class="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-mono font-medium px-2 py-1 rounded-full">{{ format }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-sm text-slate-500 dark:text-slate-400">None supported for Validation.</p>
              }
            </div>
          </div>
        </div>
        <div>
          <h4 class="font-semibold text-slate-700 dark:text-slate-200 mb-2">Record Information</h4>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt class="font-medium text-slate-500 dark:text-slate-400">Record ID</dt>
            <dd class="text-slate-800 dark:text-slate-200 font-mono break-words">{{ selectedProduct()?.recordId }}</dd>
            <dt class="font-medium text-slate-500 dark:text-slate-400">Creation Date</dt>
            <dd class="text-slate-800 dark:text-slate-200">{{ selectedProduct()?.creationDate | date:'fullDate' }}</dd>
            <dt class="font-medium text-slate-500 dark:text-slate-400">Conformance Date</dt>
            <dd class="text-slate-800 dark:text-slate-200">{{ selectedProduct()?.conformanceDate | date:'fullDate' }}</dd>
            <dt class="font-medium text-slate-500 dark:text-slate-400">Last Modified Date</dt>
            <dd class="text-slate-800 dark:text-slate-200">{{ selectedProduct()?.lastModification | date:'fullDate' }}</dd>
          </dl>
        </div>
      </div>
      <div class="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-right rounded-b-lg sticky bottom-0">
        <button (click)="closeModal()" class="bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors duration-200">
          Close
        </button>
      </div>
    </div>
  </div>
}
<div class="space-y-6">
  <!-- Cr Pin Disclaimer -->
  <div class="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex items-center gap-4">
    <div class="flex-shrink-0">
      <svg width="64" height="64" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-12 h-12">
        <g clip-path="url(#cr-pin-clip0_8_7)">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M0 64C0 28.6538 28.6538 0 64 0C99.3462 0 128 28.6538 128 64V128H64C28.6538 128 0 99.3462 0 64Z" fill="white"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M116.907 64V116.907H64C34.7805 116.907 11.0933 93.2195 11.0933 64C11.0933 34.7805 34.7805 11.0933 64 11.0933C93.2195 11.0933 116.907 34.7805 116.907 64ZM0 64C0 28.6538 28.6538 0 64 0C99.3462 0 128 28.6538 128 64V128H64C28.6538 128 0 99.3462 0 64ZM36.137 88.5681C39.7005 90.7799 43.8477 91.8858 48.5786 91.8858C52.3879 91.8858 55.8285 91.1178 58.9005 89.5818C61.9725 87.9844 64.4915 85.834 66.4576 83.1306C68.4237 80.3658 69.7447 77.2631 70.4205 73.8225H58.7162C57.9175 76.1572 56.6272 78.0004 54.8455 79.3521C53.1251 80.7038 51.0362 81.3796 48.5786 81.3796C46.121 81.3796 44.0013 80.7959 42.2195 79.6286C40.4378 78.3998 39.0247 76.7102 37.9802 74.5598C36.9971 72.4094 36.5056 69.921 36.5056 67.0948C36.5056 64.2686 36.9971 61.7802 37.9802 59.6298C39.0247 57.4794 40.4378 55.8206 42.2195 54.6532C44.0013 53.4244 46.121 52.81 48.5786 52.81C50.9133 52.81 52.9408 53.4551 54.6611 54.7453C56.3815 55.9742 57.6717 57.6945 58.5319 59.9063H70.3283C69.2224 54.7454 66.7341 50.5367 62.8634 47.2804C58.9927 43.9626 54.2311 42.3037 48.5786 42.3037C43.8477 42.3037 39.7005 43.4404 36.137 45.7137C32.6349 47.9255 29.9008 50.9361 27.9347 54.7453C26.0301 58.4932 25.0778 62.6097 25.0778 67.0948C25.0778 71.5799 26.0301 75.7271 27.9347 79.5364C29.9008 83.2842 32.6349 86.2948 36.137 88.5681ZM86.1403 43.594H75.0811V90.5956H86.6011V66.081C86.6011 61.7188 87.7684 58.5546 90.1031 56.5886C91.0862 55.667 92.2535 54.9911 93.6052 54.561C95.0183 54.131 96.7387 53.9159 98.7662 53.9159H101.715V43.041H98.8583C93.2059 43.041 88.9665 44.915 86.1403 48.6628V43.594Z" fill="black"/>
        </g>
        <defs>
        <clipPath id="cr-pin-clip0_8_7">
        <rect width="128" height="128" fill="white"/>
        </clipPath>
        </defs>
      </svg>
    </div>
    <p class="text-sm font-semibold text-blue-900 dark:text-blue-100">
      Only the products listed here are eligible to use the "Content Credentials" branding and the "Cr" pin.
    </p>
  </div>
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
      Showing <span class="font-semibold text-slate-700 dark:text-slate-200">{{ filteredProducts().length }}</span> of <span class="font-semibold text-slate-700 dark:text-slate-200">{{ products().length }}</span> products.
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
    @for (product of filteredProducts(); track product.recordId) {
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-shadow duration-200" [attr.data-record-id]="product.recordId">
        <div class="flex-grow">
          <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">{{ product.productName }}</h2>
          <p class="text-slate-600 dark:text-slate-300 font-medium">{{ product.vendorName }}</p>
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ product.organizationalUnit }}</p>
          <div class="mt-2">
            <span
              class="text-xs font-semibold px-2 py-1 rounded-full"
              [ngClass]="{
                'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200': product.status === 'conformant',
                'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200': product.status === 'revoked',
                'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200': product.status !== 'conformant' && product.status !== 'revoked'
              }">
              {{ formatStatus(product.status) }}
            </span>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="font-semibold text-slate-600 dark:text-slate-300">Product Type:</span>
            <span class="text-slate-700 dark:text-slate-200">{{ product.productType }}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold text-slate-600 dark:text-slate-300">Assurance:</span>
            <div class="flex items-center gap-2">
              @if (product.assuranceLevelValue; as level) {
                <div class="flex items-center gap-1">
                  @for (i of [1, 2, 3, 4]; track i) {
                    <span class="h-2 w-2 rounded-full"
                          [ngClass]="getAssuranceDotClass(level, i - 1)"></span>
                  }
                </div>
              }
              <span class="text-slate-700 dark:text-slate-200">{{ product.assuranceLevel }}</span>
            </div>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold text-slate-600 dark:text-slate-300">Conformance:</span>
            <span class="text-slate-700 dark:text-slate-200">{{ product.conformanceDate | date:'longDate' }}</span>
          </div>
        </div>
        <div class="mt-4">
          <button (click)="selectProduct(product)" class="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-md transition-colors duration-200">
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
  providers: [provideIcons({ heroInformationCircle, heroCog, heroCheckCircle })],
})
export class ProductListComponent {
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
  selectedProduct = signal<Product | null>(null);

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

      return vendorMatch && productTypeMatch && assuranceLevelMatch && mediaTypesMatch && formatsMatch && searchTermMatch && statusMatch;
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
  selectProduct(product: Product): void {
    this.selectedProduct.set(product);
  }

  closeModal(): void {
    this.selectedProduct.set(null);
  }

  getAssuranceDotClass(level: number, index: number): string {
    const colors = ['bg-amber-500', 'bg-lime-500', 'bg-green-600', 'bg-green-800'];
    if (index < level) {
      return colors[level - 1];
    }
    return 'bg-slate-300 dark:bg-slate-600';
  }
}
