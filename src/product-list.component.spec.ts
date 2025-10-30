import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductListComponent } from './product-list.component';
import { DataService } from './services/data.service';
import { signal } from '@angular/core';
import { Product } from './models/product.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let mockDataService: Partial<DataService>;

  const createMockProduct = (level: number | null, id: string): Product => ({
    recordId: id,
    vendorName: `Vendor ${id}`,
    productName: `Product ${id}`,
    organizationalUnit: `OU ${id}`,
    productVersion: '1.0',
    productType: 'Generator',
    assuranceLevel: level ? `Level ${level}` : 'N/A',
    assuranceLevelValue: level,
    supportedFileFormats: [],
    formatsByMediaType: {},
    supportedMediaTypes: [],
    generationFormats: {},
    validationFormats: {},
    generationMediaTypes: [],
    validationMediaTypes: [],
    creationDate: '2023-01-01',
    conformanceDate: '2023-01-01',
    specVersions: ['2.2'],
    status: 'conformant',
    lastModification: '2023-01-01',
  });

  beforeEach(async () => {
    mockDataService = {
      products: signal<Product[]>([
        createMockProduct(1, 'prod-1'),
        createMockProduct(2, 'prod-2'),
        createMockProduct(3, 'prod-3'),
        createMockProduct(4, 'prod-4'),
        createMockProduct(null, 'prod-na'),
      ]),
    };

    await TestBed.configureTestingModule({
      imports: [ProductListComponent, CommonModule, FormsModule],
      providers: [
        { provide: DataService, useValue: mockDataService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display assurance level dots correctly for Level 1', () => {
    const productCard = fixture.nativeElement.querySelector('[data-record-id="prod-1"]');
    expect(productCard).toBeTruthy();
    const dots = productCard.querySelectorAll('.h-2.w-2.rounded-full');
    expect(dots.length).toBe(4);
    expect(dots[0].classList).toContain('bg-amber-500');
    expect(dots[1].classList).toContain('bg-slate-300');
    expect(dots[2].classList).toContain('bg-slate-300');
    expect(dots[3].classList).toContain('bg-slate-300');
  });

  it('should display assurance level dots correctly for Level 2', () => {
    const productCard = fixture.nativeElement.querySelector('[data-record-id="prod-2"]');
    expect(productCard).toBeTruthy();
    const dots = productCard.querySelectorAll('.h-2.w-2.rounded-full');
    expect(dots.length).toBe(4);
    expect(dots[0].classList).toContain('bg-lime-500');
    expect(dots[1].classList).toContain('bg-lime-500');
    expect(dots[2].classList).toContain('bg-slate-300');
    expect(dots[3].classList).toContain('bg-slate-300');
  });

  it('should display assurance level dots correctly for Level 3', () => {
    const productCard = fixture.nativeElement.querySelector('[data-record-id="prod-3"]');
    expect(productCard).toBeTruthy();
    const dots = productCard.querySelectorAll('.h-2.w-2.rounded-full');
    expect(dots.length).toBe(4);
    expect(dots[0].classList).toContain('bg-green-500');
    expect(dots[1].classList).toContain('bg-green-500');
    expect(dots[2].classList).toContain('bg-green-500');
    expect(dots[3].classList).toContain('bg-slate-300');
  });

  it('should display assurance level dots correctly for Level 4', () => {
    const productCard = fixture.nativeElement.querySelector('[data-record-id="prod-4"]');
    expect(productCard).toBeTruthy();
    const dots = productCard.querySelectorAll('.h-2.w-2.rounded-full');
    expect(dots.length).toBe(4);
    expect(dots[0].classList).toContain('bg-green-700');
    expect(dots[1].classList).toContain('bg-green-700');
    expect(dots[2].classList).toContain('bg-green-700');
    expect(dots[3].classList).toContain('bg-green-700');
  });

  it('should display N/A for assurance level when value is null', () => {
    const productCard = fixture.nativeElement.querySelector('[data-record-id="prod-na"]');
    expect(productCard).toBeTruthy();
    const assuranceText = productCard.querySelector('span.text-slate-700');
    expect(assuranceText.textContent).toContain('N/A');
    const dots = productCard.querySelectorAll('.h-2.w-2.rounded-full');
    expect(dots.length).toBe(0); // No dots should be rendered for N/A
  });

  it('should display assurance level dots correctly in the detail modal for Level 1', () => {
    component.selectProduct(createMockProduct(1, 'detail-prod-1'));
    fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector('.fixed.inset-0');
    expect(modal).toBeTruthy();
    const dots = modal.querySelectorAll('dd .h-2.w-2.rounded-full');
    expect(dots.length).toBe(4);
    expect(dots[0].classList).toContain('bg-amber-500');
    expect(dots[1].classList).toContain('bg-slate-300');
    expect(dots[2].classList).toContain('bg-slate-300');
    expect(dots[3].classList).toContain('bg-slate-300');
  });

  it('should display assurance level dots correctly in the detail modal for Level 4', () => {
    component.selectProduct(createMockProduct(4, 'detail-prod-4'));
    fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector('.fixed.inset-0');
    expect(modal).toBeTruthy();
    const dots = modal.querySelectorAll('dd .h-2.w-2.rounded-full');
    expect(dots.length).toBe(4);
    expect(dots[0].classList).toContain('bg-green-700');
    expect(dots[1].classList).toContain('bg-green-700');
    expect(dots[2].classList).toContain('bg-green-700');
    expect(dots[3].classList).toContain('bg-green-700');
  });
});
