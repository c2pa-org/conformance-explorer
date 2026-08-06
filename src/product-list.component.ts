import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroInformationCircle, heroCog, heroCheckCircle, heroSquare2Stack } from '@ng-icons/heroicons/outline';
import { DataService } from './services/data.service';
import { Product, GroupedProduct } from './models/product.model';

type SortKey = 'conformanceDateDesc' | 'conformanceDateAsc' | 'creationDateDesc' | 'creationDateAsc' | 'companyAsc' | 'companyDesc';

@Component({
  selector: 'app-product-list',
  template: `<!-- Details Modal -->
@if (selectedGroup()) {
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" (click)="closeModal()">
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
      <div class="p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
        <div class="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-100">{{ selectedGroup()?.vendorName }}</h3>
            <p class="text-slate-600 dark:text-slate-300 font-medium text-lg">{{ selectedGroup()?.productName }}</p>
            @if (selectedGroup()?.organizationalUnit) {
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ selectedGroup()?.organizationalUnit }}</p>
            }
          </div>
          @if (selectedGroup()?.infoURL; as infoUrl) {
            <a [href]="infoUrl" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg text-xs font-bold transition-colors border border-blue-200 dark:border-blue-800">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              <span>Product Documentation</span>
            </a>
          }
        </div>
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
                <button
                  (click)="copyRecordJson(product)"
                  [title]="copiedRecordId() === product.recordId ? 'JSON Copied!' : 'Copy Conforming Product List Record JSON'"
                  class="text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5 shadow-sm">
                  <svg class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  <span>{{ copiedRecordId() === product.recordId ? 'Copied Record JSON!' : 'Copy Record JSON' }}</span>
                </button>
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
            
            <div class="p-4 space-y-5">
              <!-- Product Info URL Section (Always Present) -->
              <div class="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2 text-xs">
                <div class="flex items-center gap-1.5 shrink-0">
                  <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                  <span class="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product Info URL:</span>
                </div>
                <div>
                  @if (product.infoURL; as link) {
                    <a [href]="link" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline font-medium break-all flex items-center gap-1">
                      <span>{{ link }}</span>
                      <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                  } @else {
                    <span class="text-slate-400 dark:text-slate-500 italic font-medium">None provided</span>
                  }
                </div>
              </div>

              <!-- Specification Standards & Security Governance -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h5 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <span>Specification & Standards Governance</span>
                  </h5>
                  <dl class="space-y-1.5 text-xs">
                    <div class="flex justify-between gap-4">
                      <dt class="text-slate-500 dark:text-slate-400">Supported C2PA Spec(s):</dt>
                      <dd class="text-slate-800 dark:text-slate-200 font-semibold">{{ product.specVersions.join(', ') }}</dd>
                    </div>
                    <div class="flex justify-between gap-4">
                      <dt class="text-slate-500 dark:text-slate-400">Conformance Program Version:</dt>
                      <dd class="text-slate-800 dark:text-slate-200 font-semibold">{{ product.conformanceProgramVersion }}</dd>
                    </div>
                    <div class="flex justify-between gap-4">
                      <dt class="text-slate-500 dark:text-slate-400">Minimum Eligible Product Version:</dt>
                      <dd class="text-slate-800 dark:text-slate-200 font-semibold font-mono">{{ product.productVersion }}</dd>
                    </div>
                  </dl>
                </div>

                <div class="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h5 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                    <span>Security Assurance & Attestation</span>
                  </h5>
                  <dl class="space-y-1.5 text-xs">
                    <div class="flex justify-between gap-4">
                      <dt class="text-slate-500 dark:text-slate-400">Max Assurance Level:</dt>
                      <dd class="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                        @if (product.assuranceLevelValue; as level) {
                          <div class="flex items-center gap-1">
                            @for (i of [1, 2, 3, 4]; track i) {
                              <span class="h-2 w-2 rounded-full" [ngClass]="getAssuranceDotClass(level, i - 1)"></span>
                            }
                          </div>
                        }
                        <span>{{ product.assuranceLevel }}</span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <!-- Domain Card 2: Supported Media Containers & Streams -->
              <div>
                <h5 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">Supported Media Containers & Streams</h5>
                
                <!-- Compressed Manifest Support Bar -->
                <div class="mb-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs">
                  <span class="font-medium text-slate-600 dark:text-slate-400">Supports Compressed Manifests:</span>
                  <span class="font-bold">
                    @if (product.supportsCompressedManifests === true) {
                      <span class="text-green-700 dark:text-green-400">Yes</span>
                    } @else if (product.supportsCompressedManifests === false) {
                      <span class="text-slate-700 dark:text-slate-300">No</span>
                    } @else {
                      <span class="text-slate-400 dark:text-slate-500 italic">N/A</span>
                    }
                  </span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Claim Generation Containers -->
                  <div class="bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div class="flex items-center gap-2 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">
                      <ng-icon name="heroCog" class="text-slate-400"></ng-icon>
                      <span>Claim Generation Containers</span>
                    </div>
                    @if (product.generationMediaTypes && product.generationMediaTypes.length > 0) {
                      <div class="space-y-3">
                        @for (mediaType of product.generationMediaTypes; track mediaType) {
                          <div>
                            <p class="text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">{{ formatMediaType(mediaType) }}</p>
                            <div class="flex flex-wrap gap-1.5 mt-1">
                              @for(format of product.generationFormats[mediaType]; track format) {
                                <span class="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{{ formatFileFormat(format) }}</span>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-2">No generation support</p>
                    }
                  </div>

                  <!-- Claim Validation Containers -->
                  <div class="bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div class="flex items-center gap-2 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">
                      <ng-icon name="heroCheckCircle" class="text-slate-400"></ng-icon>
                      <span>Claim Validation Containers</span>
                    </div>
                    @if (product.validationMediaTypes && product.validationMediaTypes.length > 0) {
                      <div class="space-y-3">
                        @for (mediaType of product.validationMediaTypes; track mediaType) {
                          <div>
                            <p class="text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">{{ formatMediaType(mediaType) }}</p>
                            <div class="flex flex-wrap gap-1.5 mt-1">
                              @for(format of product.validationFormats[mediaType]; track format) {
                                <span class="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{{ formatFileFormat(format) }}</span>
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

                <!-- Live Video Streaming Section (if supported) -->
                @if (product.liveVideo?.supported) {
                  <div class="mt-3 bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                    <div class="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span class="font-bold uppercase text-[11px] text-slate-600 dark:text-slate-400 tracking-wider">Live Video Streaming</span>
                      <span class="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full">Supported</span>
                    </div>
                    <div class="space-y-2 pt-1">
                      @for (encap of product.liveVideo?.encapsulations; track encap.type) {
                        <div class="flex flex-wrap justify-between items-center gap-2 bg-white dark:bg-slate-800/80 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                          <span class="font-bold text-slate-700 dark:text-slate-200">{{ encap.type }}</span>
                          <div class="flex items-center gap-1.5">
                            @if (encap.generation) { <span class="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">Generation</span> }
                            @if (encap.validation) { <span class="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full">Validation</span> }
                          </div>
                          <div class="w-full text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                            Signing Methods: <span class="font-mono text-slate-700 dark:text-slate-300">{{ encap.methods.join(', ') }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Domain Card 3: Disallowed Inception & Transformation Signals (if present) -->
              @if (hasDisallowedSignals(product)) {
                <div class="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h5 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>🚫</span>
                    <span>Disallowed Inception & Transformation Signals</span>
                  </h5>
                  <div class="flex flex-wrap gap-2">
                    @for (signal of getDisallowedSignalsList(product); track signal) {
                      <span class="bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/50">
                        {{ formatSignalName(signal) }}
                      </span>
                    }
                  </div>
                </div>
              }

              <!-- Domain Card 4: Record Lifecycle & Audit Trail -->
              <div class="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <h5 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>Record Lifecycle & Audit Trail</span>
                </h5>
                <dl class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <dt class="text-slate-500 dark:text-slate-400">Conformance Date:</dt>
                    <dd class="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{{ product.conformanceDate | date:'shortDate' }}</dd>
                  </div>
                  <div>
                    <dt class="text-slate-500 dark:text-slate-400">Creation Date:</dt>
                    <dd class="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{{ product.creationDate | date:'shortDate' }}</dd>
                  </div>
                  <div>
                    <dt class="text-slate-500 dark:text-slate-400">Last Modified Date:</dt>
                    <dd class="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{{ product.lastModification | date:'shortDate' }}</dd>
                  </div>
                </dl>
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
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
      <!-- Filter by Spec Version -->
      <div>
        <label for="spec-version" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Spec Version</label>
        <select
          id="spec-version"
          [ngModel]="selectedSpecVersion()"
          (ngModelChange)="onSpecVersionChange($event)"
          class="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-slate-400 focus:ring focus:ring-slate-300 focus:ring-opacity-50 text-sm py-2 px-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200">
          <option value="">All Spec Versions</option>
          @for (version of specVersionsOptions(); track version) {
            <option [value]="version">{{ version }}</option>
          }
        </select>
      </div>
      <!-- Filter by Program Version -->
      <div>
        <label for="program-version" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Program Version</label>
        <select
          id="program-version"
          [ngModel]="selectedProgramVersion()"
          (ngModelChange)="onProgramVersionChange($event)"
          class="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-slate-400 focus:ring focus:ring-slate-300 focus:ring-opacity-50 text-sm py-2 px-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200">
       <option value="">All Program Versions</option>
          @for (version of programVersionsOptions(); track version) {
            <option [value]="version">{{ version }}</option>
          }
        </select>
      </div>
    </div>

    <!-- Generation Media Type Filters -->
    <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Generation Media Types (select all that apply)</label>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            @for (mediaType of mediaTypesForDisplay; track mediaType.key) {
            <div class="flex items-center">
                <input 
                type="checkbox" 
                [id]="'gen-media-type-' + mediaType.key" 
                [checked]="selectedGenerationMediaTypes().has(mediaType.key)"
                (change)="onGenerationMediaTypeChange(mediaType.key, $event)"
                class="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600 focus:ring-slate-500">
                <label [for]="'gen-media-type-' + mediaType.key" class="ml-2 text-sm text-slate-600 dark:text-slate-400">{{ mediaType.label }}</label>
            </div>
            }
        </div>

        <!-- Generation Container Formats Subsection -->
        @if (availableGenerationFileFormats().length > 0) {
          <div class="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Generation Container Formats <span class="text-slate-400 dark:text-slate-500">(shows formats that match <span class="font-bold">any</span> selected generation type)</span>
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                @for (format of availableGenerationFileFormats(); track format) {
                <div class="flex items-center">
                    <input 
                    type="checkbox" 
                    [id]="'gen-format-' + format"
                    [checked]="selectedGenerationFormats().has(format)"
                    (change)="onGenerationFormatChange(format, $event)"
                    class="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600 focus:ring-slate-500">
                    <label [for]="'gen-format-' + format" class="ml-2 text-xs text-slate-600 dark:text-slate-400 font-mono">{{ formatFileFormat(format) }}</label>
                </div>
                }
            </div>
          </div>
        }

        <!-- Live Video Generation Sub-section -->
        @if (selectedGenerationMediaTypes().has('liveVideo')) {
          <div class="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Live Video Generation Streaming Details
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Container Encapsulation:</span>
                <div class="flex flex-wrap gap-x-4 gap-y-2">
                  @for (encap of schemaLiveVideoEncapsulations; track encap) {
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        [id]="'gen-live-encap-' + encap"
                        [checked]="selectedGenerationLiveEncapsulations().has(encap)"
                        (change)="onGenerationLiveEncapChange(encap, $event)"
                        class="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600 focus:ring-slate-500">
                      <label [for]="'gen-live-encap-' + encap" class="ml-2 text-xs text-slate-600 dark:text-slate-400 font-mono">{{ encap }}</label>
                    </div>
                  }
                </div>
              </div>

              <div>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Signing Method:</span>
                <div class="flex flex-wrap gap-x-4 gap-y-2">
                  @for (method of schemaLiveVideoSigningMethods; track method) {
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        [id]="'gen-live-method-' + method"
                        [checked]="selectedGenerationLiveSigningMethods().has(method)"
                        (change)="onGenerationLiveSigningMethodChange(method, $event)"
                        class="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600 focus:ring-slate-500">
                      <label [for]="'gen-live-method-' + method" class="ml-2 text-xs text-slate-600 dark:text-slate-400 font-mono">{{ method }}</label>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }
    </div>

    <!-- Validation Media Type Filters -->
    <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Validation Media Types (select all that apply)</label>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            @for (mediaType of mediaTypesForDisplay; track mediaType.key) {
            <div class="flex items-center">
                <input 
                type="checkbox" 
                [id]="'val-media-type-' + mediaType.key" 
                [checked]="selectedValidationMediaTypes().has(mediaType.key)"
                (change)="onValidationMediaTypeChange(mediaType.key, $event)"
                class="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600 focus:ring-slate-500">
                <label [for]="'val-media-type-' + mediaType.key" class="ml-2 text-sm text-slate-600 dark:text-slate-400">{{ mediaType.label }}</label>
            </div>
            }
        </div>

        <!-- Validation Container Formats Subsection -->
        @if (availableValidationFileFormats().length > 0) {
          <div class="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Validation Container Formats <span class="text-slate-400 dark:text-slate-500">(shows formats that match <span class="font-bold">any</span> selected validation type)</span>
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                @for (format of availableValidationFileFormats(); track format) {
                <div class="flex items-center">
                    <input 
                    type="checkbox" 
                    [id]="'val-format-' + format"
                    [checked]="selectedValidationFormats().has(format)"
                    (change)="onValidationFormatChange(format, $event)"
                    class="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600 focus:ring-slate-500">
                    <label [for]="'val-format-' + format" class="ml-2 text-xs text-slate-600 dark:text-slate-400 font-mono">{{ formatFileFormat(format) }}</label>
                </div>
                }
            </div>
          </div>
        }

        <!-- Live Video Validation Sub-section -->
        @if (selectedValidationMediaTypes().has('liveVideo')) {
          <div class="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Live Video Validation Streaming Details
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Container Encapsulation:</span>
                <div class="flex flex-wrap gap-x-4 gap-y-2">
                  @for (encap of schemaLiveVideoEncapsulations; track encap) {
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        [id]="'val-live-encap-' + encap"
                        [checked]="selectedValidationLiveEncapsulations().has(encap)"
                        (change)="onValidationLiveEncapChange(encap, $event)"
                        class="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600 focus:ring-slate-500">
                      <label [for]="'val-live-encap-' + encap" class="ml-2 text-xs text-slate-600 dark:text-slate-400 font-mono">{{ encap }}</label>
                    </div>
                  }
                </div>
              </div>

              <div>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Signing Method:</span>
                <div class="flex flex-wrap gap-x-4 gap-y-2">
                  @for (method of schemaLiveVideoSigningMethods; track method) {
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        [id]="'val-live-method-' + method"
                        [checked]="selectedValidationLiveSigningMethods().has(method)"
                        (change)="onValidationLiveSigningMethodChange(method, $event)"
                        class="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-slate-600 dark:bg-slate-700 dark:checked:bg-slate-600 focus:ring-slate-500">
                      <label [for]="'val-live-method-' + method" class="ml-2 text-xs text-slate-600 dark:text-slate-400 font-mono">{{ method }}</label>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }
    </div>

    <!-- Reset Button below all filters -->
    <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
        <button 
          (click)="resetFilters()"
          class="w-full sm:w-auto bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors duration-200 text-sm disabled:bg-slate-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 disabled:cursor-not-allowed"
          [disabled]="!isAnyFilterActive()">
          Reset Filters
        </button>
  </div>

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
            <option value="companyAsc">Company Name (A-Z)</option>
            <option value="companyDesc">Company Name (Z-A)</option>
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
          @if (group.organizationalUnit) {
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ group.organizationalUnit }}</p>
          }
          @if (group.infoURL; as link) {
            <a [href]="link" target="_blank" rel="noopener noreferrer" (click)="$event.stopPropagation()" class="inline-flex items-center gap-1 mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              <span>Product Info</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
          }
          
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
            @if (group.supportsLiveVideo) {
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 002-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                <span>Live Video</span>
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
  imports: [CommonModule, FormsModule, NgIconComponent],
  providers: [provideIcons({ heroInformationCircle, heroCog, heroCheckCircle, heroSquare2Stack })],
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
  selectedGenerationMediaTypes = signal<Set<string>>(new Set());
  selectedValidationMediaTypes = signal<Set<string>>(new Set());
  selectedGenerationFormats = signal<Set<string>>(new Set());
  selectedValidationFormats = signal<Set<string>>(new Set());
  selectedStatus = signal('');
  selectedSpecVersion = signal('');
  selectedProgramVersion = signal('');
  selectedGenerationLiveEncapsulations = signal<Set<string>>(new Set());
  selectedGenerationLiveSigningMethods = signal<Set<string>>(new Set());
  selectedValidationLiveEncapsulations = signal<Set<string>>(new Set());
  selectedValidationLiveSigningMethods = signal<Set<string>>(new Set());

  public readonly schemaLiveVideoEncapsulations = ['fMP4', 'CMAF'];
  public readonly schemaLiveVideoSigningMethods = ['per-segment', 'verifiable-segment-info'];

  // Modal signal
  selectedGroup = signal<GroupedProduct | null>(null);

  private platformId = inject(PLATFORM_ID);

  private urlParamsProcessed = false;

  // A reactive effect that parses the URL parameters once products have loaded,
  // matching values case-insensitively to corresponding dropdown options or directing them to Search.
  private resolveUrlParamsEffect = effect(() => {
    const productsList = this.products();
    if (productsList.length === 0 || this.urlParamsProcessed) return;

    if (isPlatformBrowser(this.platformId)) {
      const url = new URL(window.location.href);
      const getParam = (key: string) => {
        return url.searchParams.get(key) || new URLSearchParams(url.hash.split('?')[1] || '').get(key);
      };

      // 1. Map 'o' (Organization) -> selectedVendor (case-insensitively)
      const o = getParam('o');
      if (o) {
        const matchedVendor = this.vendors().find(v => v.toLowerCase() === o.toLowerCase());
        if (matchedVendor) this.selectedVendor.set(matchedVendor);
      }

      // 2. Map 'type' -> selectedProductType
      const type = getParam('type');
      if (type) {
        const matchedType = this.productTypes().find(t => t.toLowerCase() === type.toLowerCase());
        if (matchedType) this.selectedProductType.set(matchedType);
      }

      // 3. Map 'status' -> selectedStatus
      const status = getParam('status');
      if (status) {
        const matchedStatus = this.statuses().find(s => s.toLowerCase() === status.toLowerCase());
        if (matchedStatus) this.selectedStatus.set(matchedStatus);
      }

      // 4. Map 'assurance' -> selectedAssuranceLevel (Supports both "Level 2" and just "2")
      const assurance = getParam('assurance');
      if (assurance) {
        const cleanAssurance = assurance.toLowerCase().startsWith('level') ? assurance : `level ${assurance}`;
        const matchedLevel = this.assuranceLevels().find(l => l.toLowerCase() === cleanAssurance.toLowerCase());
        if (matchedLevel) this.selectedAssuranceLevel.set(matchedLevel);
      }

      // 5. Direct all specific X.509 fields (cn, ou, c) and generic search (q) -> main Search Term
      const q = getParam('q');
      const cn = getParam('cn');
      const ou = getParam('ou');
      const c = getParam('c');

      const searchParts = [];
      if (q) searchParts.push(q);
      if (cn) searchParts.push(cn);
      if (ou) searchParts.push(ou);
      if (c) searchParts.push(c);

      if (searchParts.length > 0) {
        this.searchTerm.set(searchParts.join(' '));
      }

      this.urlParamsProcessed = true;
    }
  });

  // These effects clear the file format selections when no corresponding media types are selected.
  private clearGenerationFormatsEffect = effect(() => {
    if (this.selectedGenerationMediaTypes().size === 0) {
      this.selectedGenerationFormats.set(new Set());
    }
  });

  private clearValidationFormatsEffect = effect(() => {
    if (this.selectedValidationMediaTypes().size === 0) {
      this.selectedValidationFormats.set(new Set());
    }
  });

  private clearGenerationLiveVideoEffect = effect(() => {
    if (!this.selectedGenerationMediaTypes().has('liveVideo')) {
      this.selectedGenerationLiveEncapsulations.set(new Set());
      this.selectedGenerationLiveSigningMethods.set(new Set());
    }
  });

  private clearValidationLiveVideoEffect = effect(() => {
    if (!this.selectedValidationMediaTypes().has('liveVideo')) {
      this.selectedValidationLiveEncapsulations.set(new Set());
      this.selectedValidationLiveSigningMethods.set(new Set());
    }
  });

  // A list of all possible media types for the filter UI.
  public readonly mediaTypesForDisplay = [
    { key: 'image', label: 'Image' },
    { key: 'video', label: 'Video' },
    { key: 'liveVideo', label: 'Live Video' },
    { key: 'audio', label: 'Audio' },
    { key: 'textHtml', label: 'HTML Text' },
    { key: 'textUnstructured', label: 'Unstructured Text' },
    { key: 'textStructured', label: 'Structured Text' },
    { key: 'documents', label: 'Documents' },
    { key: 'fonts', label: 'Fonts' },
    { key: 'mlModel', label: 'ML Model' },
  ];

  // Derived signals for UI elements and filtering
  vendors = computed(() => {
    const vendorNames = this.products().map(p => p.vendorName);
    return [...new Set(vendorNames)].sort((a: string, b: string) => a.localeCompare(b));
  });

  // Schema-defined enum options for filters
  productTypes = signal<string[]>(['Generator', 'Validator']);
  assuranceLevels = signal<string[]>(['Level 1', 'Level 2']);
  statuses = signal<string[]>(['conformant', 'revoked', 'revoked_eol', 'revoked_vulnerability']);
  specVersionsOptions = signal<string[]>(['2.2', '2.4']);
  programVersionsOptions = signal<string[]>(['0.1', '0.2']);

  // Schema-defined container formats & MIME types per media type
  private readonly schemaFormatsByMediaType: Record<string, string[]> = {
    image: [
      'image/jpeg',
      'image/jxl',
      'image/png',
      'image/svg+xml',
      'image/gif',
      'image/x-adobe-dng',
      'image/tiff',
      'image/webp',
      'image/heic',
      'image/heic-sequence',
      'image/heif',
      'image/heif-sequence',
      'image/avif',
      'image/x-tiff-based',
      'image/x-riff-based',
    ],
    video: [
      'video/x-msvideo',
      'video/mp4',
      'video/quicktime',
      'video/x-bmff-based',
      'video/x-riff-based',
    ],
    audio: [
      'audio/flac',
      'audio/MPA',
      'audio/mpeg',
      'audio/wav',
      'audio/aac',
      'audio/mp4',
      'audio/x-riff-based',
    ],
    textHtml: [
      'text/html',
    ],
    textUnstructured: [
      'text/csv',
      'text/tab-separated-values',
      'text/plain',
    ],
    textStructured: [
      'text/markdown',
      'text/xml',
      'application/xml',
      'application/xhtml+xml',
    ],
    documents: [
      'application/pdf',
      'application/epub+zip',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation',
      'application/vnd.oasis.opendocument.graphics',
      'application/oxps',
      'application/x-zip-based',
    ],
    fonts: [
      'font/otf',
    ],
    mlModel: [
      'jax',
      'keras',
      'ml_net',
      'mxnet',
      'onnx',
      'openvivo.parameter',
      'openvivo.topology',
      'pytorch',
      'tensorflow',
      'numpy',
      'protobuf',
      'pickle',
      'savedmodel',
    ],
  };

  availableGenerationFileFormats = computed(() => {
    const genMedia = this.selectedGenerationMediaTypes();
    if (genMedia.size === 0) {
      return [];
    }
    const formats = new Set<string>();
    for (const mediaType of genMedia) {
      const schemaFormats = this.schemaFormatsByMediaType[mediaType];
      if (schemaFormats) {
        schemaFormats.forEach(format => formats.add(format));
      }
    }
    return Array.from(formats).sort();
  });

  availableValidationFileFormats = computed(() => {
    const valMedia = this.selectedValidationMediaTypes();
    if (valMedia.size === 0) {
      return [];
    }
    const formats = new Set<string>();
    for (const mediaType of valMedia) {
      const schemaFormats = this.schemaFormatsByMediaType[mediaType];
      if (schemaFormats) {
        schemaFormats.forEach(format => formats.add(format));
      }
    }
    return Array.from(formats).sort();
  });

  filteredProducts = computed(() => {
    const vendor = this.selectedVendor();
    const type = this.selectedProductType();
    const level = this.selectedAssuranceLevel();
    const specVer = this.selectedSpecVersion();
    const progVer = this.selectedProgramVersion();
    const genMediaTypes = this.selectedGenerationMediaTypes();
    const valMediaTypes = this.selectedValidationMediaTypes();
    const genFormats = this.selectedGenerationFormats();
    const valFormats = this.selectedValidationFormats();
    const sort = this.sortOrder();
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.selectedStatus();

    const genLiveEncaps = this.selectedGenerationLiveEncapsulations();
    const genLiveMethods = this.selectedGenerationLiveSigningMethods();
    const valLiveEncaps = this.selectedValidationLiveEncapsulations();
    const valLiveMethods = this.selectedValidationLiveSigningMethods();

    const genMediaArr = genMediaTypes.size > 0 ? Array.from(genMediaTypes) : [];
    const valMediaArr = valMediaTypes.size > 0 ? Array.from(valMediaTypes) : [];
    const words = term.length > 0 ? term.split(/\s+/).filter(Boolean) : [];

    const filtered = this.products().filter(p => {
      // 1. Scalar exact-match filters (short-circuiting early)
      if (vendor !== '' && p.vendorName !== vendor) return false;
      if (type !== '' && p.productType !== type) return false;
      if (level !== '' && p.assuranceLevel !== level) return false;
      if (status !== '' && p.status !== status) return false;
      if (specVer !== '' && !p.specVersions?.includes(specVer)) return false;
      if (progVer !== '' && p.conformanceProgramVersion !== progVer) return false;

      // 2. Generation & Validation Media Types
      if (genMediaTypes.size > 0 && !p.generationMediaTypes.some(mt => genMediaTypes.has(mt))) return false;
      if (valMediaTypes.size > 0 && !p.validationMediaTypes.some(mt => valMediaTypes.has(mt))) return false;

      // 3. Container Formats
      if (genFormats.size > 0 && !genMediaArr.some(mt => p.generationFormats[mt]?.some(f => genFormats.has(f)))) return false;
      if (valFormats.size > 0 && !valMediaArr.some(mt => p.validationFormats[mt]?.some(f => valFormats.has(f)))) return false;

      // 4. Live Video Streaming Sub-filters
      if (genLiveEncaps.size > 0 && !(p.liveVideo?.supported && p.liveVideo.encapsulations?.some(e => e.generation && genLiveEncaps.has(e.type)))) return false;
      if (genLiveMethods.size > 0 && !(p.liveVideo?.supported && p.liveVideo.encapsulations?.some(e => e.generation && e.methods?.some(m => genLiveMethods.has(m))))) return false;
      if (valLiveEncaps.size > 0 && !(p.liveVideo?.supported && p.liveVideo.encapsulations?.some(e => e.validation && valLiveEncaps.has(e.type)))) return false;
      if (valLiveMethods.size > 0 && !(p.liveVideo?.supported && p.liveVideo.encapsulations?.some(e => e.validation && e.methods?.some(m => valLiveMethods.has(m))))) return false;

      // 5. Pre-indexed search blob check (O(N*W) simple string search)
      if (words.length > 0) {
        for (let i = 0; i < words.length; i++) {
          if (!p.searchBlob.includes(words[i])) return false;
        }
      }

      return true;
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
        case 'companyAsc':
          return a.vendorName.localeCompare(b.vendorName) || a.productName.localeCompare(b.productName);
        case 'companyDesc':
          return b.vendorName.localeCompare(a.vendorName) || a.productName.localeCompare(b.productName);
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
    
    const mappedGroups = Array.from(groups.entries()).map(([dn, records]) => {
      // Sort records by conformanceDate (newest first)
      records.sort((a, b) => new Date(b.conformanceDate).getTime() - new Date(a.conformanceDate).getTime());
      const first = records[0];
      return {
        distinguishedName: dn,
        vendorName: first.vendorName,
        productName: first.productName,
        organizationalUnit: first.organizationalUnit,
        infoURL: first.infoURL || records.find(r => r.infoURL)?.infoURL,
        records: records,
        latestConformanceDate: first.conformanceDate, // The first record is now the latest due to sorting
        statuses: [...new Set(records.map(p => p.status))],
        productTypes: [...new Set(records.map(p => p.productType))],
        assuranceLevel: first.assuranceLevel,
        assuranceLevelValue: first.assuranceLevelValue,
        supportsLiveVideo: records.some(r => r.liveVideo?.supported === true),
      } as GroupedProduct;
    });

    const sort = this.sortOrder();
    return mappedGroups.sort((a, b) => {
      switch (sort) {
        case 'conformanceDateDesc':
          return new Date(b.latestConformanceDate).getTime() - new Date(a.latestConformanceDate).getTime();
        case 'conformanceDateAsc':
          return new Date(a.latestConformanceDate).getTime() - new Date(b.latestConformanceDate).getTime();
        case 'companyAsc':
          return a.vendorName.localeCompare(b.vendorName) || a.productName.localeCompare(b.productName);
        case 'companyDesc':
          return b.vendorName.localeCompare(a.vendorName) || a.productName.localeCompare(b.productName);
        default:
          return 0;
      }
    });
  });

  isAnyFilterActive = computed(() => {
    return this.selectedVendor() !== '' || 
           this.selectedProductType() !== '' || 
           this.selectedAssuranceLevel() !== '' || 
           this.selectedStatus() !== '' ||
           this.selectedSpecVersion() !== '' ||
           this.selectedProgramVersion() !== '' ||
           this.selectedGenerationMediaTypes().size > 0 ||
           this.selectedValidationMediaTypes().size > 0 ||
           this.selectedGenerationFormats().size > 0 ||
           this.selectedValidationFormats().size > 0 ||
           this.selectedGenerationLiveEncapsulations().size > 0 ||
           this.selectedGenerationLiveSigningMethods().size > 0 ||
           this.selectedValidationLiveEncapsulations().size > 0 ||
           this.selectedValidationLiveSigningMethods().size > 0 ||
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

  onSpecVersionChange(value: string): void {
    this.selectedSpecVersion.set(value);
  }

  onProgramVersionChange(value: string): void {
    this.selectedProgramVersion.set(value);
  }

  onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
  }

  onSortOrderChange(value: SortKey): void {
    this.sortOrder.set(value);
  }

  onGenerationMediaTypeChange(mediaType: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedGenerationMediaTypes.update(currentSet => {
      const newSet = new Set(currentSet);
      if (isChecked) {
        newSet.add(mediaType);
      } else {
        newSet.delete(mediaType);
      }
      return newSet;
    });
  }

  onValidationMediaTypeChange(mediaType: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedValidationMediaTypes.update(currentSet => {
      const newSet = new Set(currentSet);
      if (isChecked) {
        newSet.add(mediaType);
      } else {
        newSet.delete(mediaType);
      }
      return newSet;
    });
  }

  onGenerationFormatChange(format: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedGenerationFormats.update(currentSet => {
        const newSet = new Set(currentSet);
        if (isChecked) {
            newSet.add(format);
        } else {
            newSet.delete(format);
        }
        return newSet;
    });
  }

  onValidationFormatChange(format: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedValidationFormats.update(currentSet => {
        const newSet = new Set(currentSet);
        if (isChecked) {
            newSet.add(format);
        } else {
            newSet.delete(format);
        }
        return newSet;
    });
  }

  onGenerationLiveEncapChange(encap: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedGenerationLiveEncapsulations.update(current => {
      const set = new Set(current);
      if (isChecked) set.add(encap); else set.delete(encap);
      return set;
    });
  }

  onGenerationLiveSigningMethodChange(method: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedGenerationLiveSigningMethods.update(current => {
      const set = new Set(current);
      if (isChecked) set.add(method); else set.delete(method);
      return set;
    });
  }

  onValidationLiveEncapChange(encap: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedValidationLiveEncapsulations.update(current => {
      const set = new Set(current);
      if (isChecked) set.add(encap); else set.delete(encap);
      return set;
    });
  }

  onValidationLiveSigningMethodChange(method: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedValidationLiveSigningMethods.update(current => {
      const set = new Set(current);
      if (isChecked) set.add(method); else set.delete(method);
      return set;
    });
  }

  resetFilters(): void {
    this.selectedVendor.set('');
    this.selectedProductType.set('');
    this.selectedAssuranceLevel.set('');
    this.selectedStatus.set('');
    this.selectedSpecVersion.set('');
    this.selectedProgramVersion.set('');
    this.searchTerm.set('');
    this.sortOrder.set('conformanceDateDesc');
    this.selectedGenerationMediaTypes.set(new Set());
    this.selectedValidationMediaTypes.set(new Set());
    this.selectedGenerationFormats.set(new Set());
    this.selectedValidationFormats.set(new Set());
    this.selectedGenerationLiveEncapsulations.set(new Set());
    this.selectedGenerationLiveSigningMethods.set(new Set());
    this.selectedValidationLiveEncapsulations.set(new Set());
    this.selectedValidationLiveSigningMethods.set(new Set());
  }

  private readonly statusCache = new Map<string, string>();
  private readonly mediaTypeCache = new Map<string, string>();
  private readonly signalNameCache = new Map<string, string>();
  private readonly fileFormatCache = new Map<string, string>();

  formatStatus(status: string): string {
    if (!status) {
      return '';
    }
    let cached = this.statusCache.get(status);
    if (cached !== undefined) return cached;
    cached = status
      .split('_')
      .map(word => {
        if (word.toLowerCase() === 'eol') {
          return 'EOL';
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' - ');
    this.statusCache.set(status, cached);
    return cached;
  }

  formatMediaType(mediaType: string): string {
    let cached = this.mediaTypeCache.get(mediaType);
    if (cached !== undefined) return cached;
    const labels: Record<string, string> = {
      image: 'Image',
      video: 'Video',
      liveVideo: 'Live Video',
      audio: 'Audio',
      textHtml: 'HTML Text',
      textUnstructured: 'Unstructured Text',
      textStructured: 'Structured Text',
      documents: 'Documents',
      fonts: 'Fonts',
      mlModel: 'ML Model',
    };
    cached = labels[mediaType] || mediaType;
    this.mediaTypeCache.set(mediaType, cached);
    return cached;
  }

  hasDisallowedSignals(product: Product): boolean {
    if (!product.disallowedSignals) return false;
    const inc = product.disallowedSignals.inception || [];
    const trans = product.disallowedSignals.transformation || [];
    return inc.length > 0 || trans.length > 0;
  }

  getDisallowedSignalsList(product: Product): string[] {
    if (!product.disallowedSignals) return [];
    const inc = product.disallowedSignals.inception || [];
    const trans = product.disallowedSignals.transformation || [];
    return [...inc, ...trans];
  }

  formatSignalName(signal: string): string {
    let cached = this.signalNameCache.get(signal);
    if (cached !== undefined) return cached;
    cached = signal
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
    this.signalNameCache.set(signal, cached);
    return cached;
  }

  formatFileFormat(format: string): string {
    if (!format) return '';
    let cached = this.fileFormatCache.get(format);
    if (cached !== undefined) return cached;

    const mapping: Record<string, string> = {
      // Image
      'image/jpeg': 'jpeg',
      'image/jxl': 'jxl',
      'image/png': 'png',
      'image/svg+xml': 'svg',
      'image/gif': 'gif',
      'image/x-adobe-dng': 'dng',
      'image/tiff': 'tiff',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heic-sequence': 'heics',
      'image/heif': 'heif',
      'image/heif-sequence': 'heifs',
      'image/avif': 'avif',
      'image/x-tiff-based': 'tiff-based',
      'image/x-riff-based': 'riff-based',

      // Video
      'video/x-msvideo': 'avi',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/x-bmff-based': 'bmff-based',
      'video/x-riff-based': 'riff-based',

      // Audio
      'audio/flac': 'flac',
      'audio/MPA': 'mpa',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/aac': 'aac',
      'audio/mp4': 'm4a',
      'audio/x-riff-based': 'riff-based',

      // Text HTML
      'text/html': 'html',

      // Text Unstructured
      'text/csv': 'csv',
      'text/tab-separated-values': 'tsv',
      'text/plain': 'txt',

      // Text Structured
      'text/markdown': 'md',
      'text/xml': 'xml',
      'application/xml': 'xml',
      'application/xhtml+xml': 'xhtml',

      // Documents
      'application/pdf': 'pdf',
      'application/epub+zip': 'epub',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/vnd.openxmlformats-officedocument.presentationml.slideshow': 'ppsx',
      'application/vnd.oasis.opendocument.text': 'odt',
      'application/vnd.oasis.opendocument.spreadsheet': 'ods',
      'application/vnd.oasis.opendocument.presentation': 'odp',
      'application/vnd.oasis.opendocument.graphics': 'odg',
      'application/oxps': 'oxps',
      'application/x-zip-based': 'zip-based',

      // Fonts
      'font/otf': 'otf',
    };

    let res = format;
    if (mapping[format]) {
      res = mapping[format];
    } else if (format.includes('/')) {
      const subtype = format.split('/')[1];
      if (subtype.startsWith('x-')) {
        res = subtype.substring(2);
      } else {
        res = subtype;
      }
    }

    this.fileFormatCache.set(format, res);
    return res;
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

  copiedRecordId = signal<string | null>(null);

  copyRecordJson(product: Product): void {
    const jsonContent = product.raw
      ? JSON.stringify(product.raw, null, 2)
      : JSON.stringify(product, null, 2);

    navigator.clipboard
      .writeText(jsonContent)
      .then(() => {
        this.copiedRecordId.set(product.recordId);
        setTimeout(() => {
          if (this.copiedRecordId() === product.recordId) {
            this.copiedRecordId.set(null);
          }
        }, 2000);
      })
      .catch(err => console.error('Failed to copy record JSON:', err));
  }
}