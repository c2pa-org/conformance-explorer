export interface Product {
  recordId: string;
  vendorName: string;
  productName: string;
  organizationalUnit: string;
  productVersion: string;
  productType: string;
  assuranceLevel: string;
  supportedFileFormats: string[];
  formatsByMediaType: { [key: string]: string[] };
  supportedMediaTypes: string[];
  generationFormats: { [key: string]: string[] };
  validationFormats: { [key: string]: string[] };
  generationMediaTypes: string[];
  validationMediaTypes: string[];
  creationDate: string;
  conformanceDate: string;
  specVersions: string[];
  status: string;
  lastModification: string;
  assuranceLevelValue: number | null;
}

// Interfaces for the raw JSON data structure from the conformance list
export interface RawProduct {
  recordId: string;
  applicant: string;
  product: {
    productType: 'generatorProduct' | 'validatorProduct';
    DN: {
      CN: string;
      O: string;
      OU?: string;
      C: string;
    };
    minVersion?: string;
    assurance?: {
      maxAssuranceLevel: number;
      attestationMethods?: string[];
    };
  };
  specVersion: string[];
  conformanceProgramVersion: string;
  containers: {
    generate?: ContainerFormats;
    validate?: ContainerFormats;
  };
  status: string;
  dates: {
    creation: string;
    conformance: string;
    earliestPublicDisclosure: string;
    lastModification: string;
  }
}

export interface ContainerFormats {
  image?: string[];
  video?: string[];
  audio?: string[];
  documents?: string[];
  fonts?: string[];
  mlModel?: string[];
}