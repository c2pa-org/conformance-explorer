import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductListComponent } from './product-list.component';
import { DataService } from './services/data.service';
import { signal } from '@angular/core';
import { Product, GroupedProduct } from './models/product.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let mockDataService: Partial<DataService>;

  const createMockProduct = (level: number | null, id: string, dn?: string): Product => ({
    recordId: id,
    vendorName: `Vendor ${dn || id}`,
    productName: `Product ${dn || id}`,
    organizationalUnit: `OU ${dn || id}`,
    distinguishedName: dn || `CN=Product ${id}, O=Vendor ${id}, C=US`,
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
    const products = fixture.nativeElement.querySelectorAll('.bg-white.dark\\:bg-slate-800.rounded-lg.shadow-sm');
    const productCard = Array.from(products).find((p: any) => p.textContent.includes('Product prod-1')) as HTMLElement;
    expect(productCard).toBeTruthy();
    const dots = productCard.querySelectorAll('.h-2.w-2.rounded-full');
    expect(dots.length).toBe(4);
    expect(dots[0].classList).toContain('bg-amber-500');
    expect(dots[1].classList).toContain('bg-slate-300');
    expect(dots[2].classList).toContain('bg-slate-300');
    expect(dots[3].classList).toContain('bg-slate-300');
  });

  it('should display assurance level dots correctly for Level 4', () => {
    const products = fixture.nativeElement.querySelectorAll('.bg-white.dark\\:bg-slate-800.rounded-lg.shadow-sm');
    const productCard = Array.from(products).find((p: any) => p.textContent.includes('Product prod-4')) as HTMLElement;
    expect(productCard).toBeTruthy();
    const dots = productCard.querySelectorAll('.h-2.w-2.rounded-full');
    expect(dots.length).toBe(4);
    expect(dots[0].classList).toContain('bg-green-800'); // Note: changed from green-700 in my implementation
    expect(dots[1].classList).toContain('bg-green-800');
    expect(dots[2].classList).toContain('bg-green-800');
    expect(dots[3].classList).toContain('bg-green-800');
  });

  it('should group products by DN', () => {
    const dn = 'CN=Shared, O=Vendor, C=US';
    mockDataService.products?.set([
      createMockProduct(1, 'prod-1', 'Shared'),
      createMockProduct(1, 'prod-2', 'Shared'),
    ]);
    fixture.detectChanges();
    
    expect(component.groupedProducts().length).toBe(1);
    expect(component.groupedProducts()[0].records.length).toBe(2);
    
    const badge = fixture.nativeElement.querySelector('.bg-blue-50');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('2 RECORDS');
  });
});