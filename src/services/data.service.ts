import { Injectable, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, shareReplay } from 'rxjs/operators';
import { Product, RawProduct, ContainerFormats } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private http = inject(HttpClient);
  private readonly JSON_URL = 'https://raw.githubusercontent.com/c2pa-org/conformance-public/refs/heads/main/conforming-products/conforming-products-list.json';

  private rawProducts$ = this.http.get<RawProduct[]>(this.JSON_URL).pipe(
    map(data => Array.isArray(data) ? data : []),
    shareReplay(1) // Cache the raw data to avoid re-fetching
  );

  rawProducts = toSignal(this.rawProducts$, { initialValue: [] as RawProduct[] });

  products = computed(() => {
    return this.rawProducts().map((p: RawProduct): Product => {
      const generationFormats: { [key: string]: string[] } = {};
      const validationFormats: { [key: string]: string[] } = {};
      const generationMediaTypesSet = new Set<string>();
      const validationMediaTypesSet = new Set<string>();

      const processContainer = (container: ContainerFormats | undefined, targetFormats: { [key: string]: string[] }, targetMediaTypes: Set<string>) => {
        if (!container) return;
        for (const mediaType of Object.keys(container)) {
          const key = mediaType as keyof ContainerFormats;
          const formatArray = container[key];
          
          if (Array.isArray(formatArray) && formatArray.length > 0) {
            targetMediaTypes.add(mediaType);
            const mediaTypeFormats = new Set<string>(targetFormats[mediaType] || []);
            formatArray.forEach(format => mediaTypeFormats.add(format));
            targetFormats[mediaType] = Array.from(mediaTypeFormats).sort();
          }
        }
      };

      processContainer(p.containers?.generate, generationFormats, generationMediaTypesSet);
      processContainer(p.containers?.validate, validationFormats, validationMediaTypesSet);

      if (p.liveVideo?.supported) {
        if (p.liveVideo.encapsulations && p.liveVideo.encapsulations.length > 0) {
          p.liveVideo.encapsulations.forEach(encap => {
            const items = [encap.type, ...(encap.methods || [])];
            if (encap.generation) {
              generationMediaTypesSet.add('liveVideo');
              if (!generationFormats['liveVideo']) generationFormats['liveVideo'] = [];
              items.forEach(item => {
                if (!generationFormats['liveVideo'].includes(item)) {
                  generationFormats['liveVideo'].push(item);
                }
              });
            }
            if (encap.validation) {
              validationMediaTypesSet.add('liveVideo');
              if (!validationFormats['liveVideo']) validationFormats['liveVideo'] = [];
              items.forEach(item => {
                if (!validationFormats['liveVideo'].includes(item)) {
                  validationFormats['liveVideo'].push(item);
                }
              });
            }
          });
        } else {
          generationMediaTypesSet.add('liveVideo');
          validationMediaTypesSet.add('liveVideo');
        }
      }

      // Create the combined properties for filtering from the separate ones.
      const allFormats = new Set<string>();
      const allMediaTypes = new Set<string>(generationMediaTypesSet);
      validationMediaTypesSet.forEach(mt => allMediaTypes.add(mt));

      const formatsByMediaType: { [key: string]: string[] } = {};
      
      for (const mediaType of allMediaTypes) {
        const combinedFormats = new Set<string>();
        if (generationFormats[mediaType]) {
            generationFormats[mediaType].forEach(f => combinedFormats.add(f));
        }
        if (validationFormats[mediaType]) {
            validationFormats[mediaType].forEach(f => combinedFormats.add(f));
        }
        const sortedFormats = Array.from(combinedFormats).sort();
        formatsByMediaType[mediaType] = sortedFormats;
        sortedFormats.forEach(f => allFormats.add(f));
      }
      
      // Determine assurance level
      let assuranceLevel = 'N/A';
      if (p.product.assurance?.maxAssuranceLevel) {
        assuranceLevel = `Level ${p.product.assurance.maxAssuranceLevel}`;
      }

      const productTypeMap: Record<string, string> = {
        'generatorProduct': 'Generator',
        'validatorProduct': 'Validator'
      };
      const friendlyProductType = productTypeMap[p.product.productType] ?? p.product.productType;
      
      const dnParts = [
        `CN=${p.product.DN.CN}`,
        p.product.DN.OU ? `OU=${p.product.DN.OU}` : '',
        `O=${p.product.DN.O}`,
        `C=${p.product.DN.C}`
      ].filter(Boolean);
      const distinguishedName = dnParts.join(', ');

      const liveVideoTokens: string[] = [];
      if (p.liveVideo?.supported) {
        liveVideoTokens.push('live video');
        p.liveVideo.encapsulations?.forEach(e => {
          liveVideoTokens.push(e.type);
          if (e.methods) liveVideoTokens.push(...e.methods);
        });
      }

      const searchBlob = [
        p.applicant,
        p.product.DN.CN,
        p.product.DN.OU || '',
        distinguishedName,
        friendlyProductType,
        assuranceLevel,
        p.status,
        p.conformanceProgramVersion || '',
        ...(p.specVersion || []),
        ...Array.from(allFormats),
        ...Array.from(allMediaTypes),
        ...liveVideoTokens,
      ].join(' ').toLowerCase();

      return {
        recordId: p.recordId,
        vendorName: p.applicant,
        productName: p.product.DN.CN,
        organizationalUnit: p.product.DN.OU || '',
        distinguishedName: distinguishedName,
        productVersion: p.product.minVersion || 'N/A',
        productType: friendlyProductType,
        assuranceLevel: assuranceLevel,
        infoURL: p.product.infoURL || undefined,
        supportsCompressedManifests: p.supportsCompressedManifests ?? null,
        disallowedSignals: p.product.disallowedSignals || undefined,
        liveVideo: p.liveVideo || undefined,
        supportedFileFormats: Array.from(allFormats).sort(),
        formatsByMediaType: formatsByMediaType,
        supportedMediaTypes: Array.from(allMediaTypes).sort(),
        generationFormats,
        validationFormats,
        generationMediaTypes: Array.from(generationMediaTypesSet).sort(),
        validationMediaTypes: Array.from(validationMediaTypesSet).sort(),
        creationDate: p.dates.creation,
        conformanceDate: p.dates.conformance,
        specVersions: p.specVersion,
        conformanceProgramVersion: p.conformanceProgramVersion || 'N/A',
        status: p.status,
        lastModification: p.dates.lastModification,
        assuranceLevelValue: p.product.assurance?.maxAssuranceLevel ?? null,
        searchBlob: searchBlob,
        raw: p,
      };
    });
  });
}