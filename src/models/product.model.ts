export interface Product {
  recordId: string;
  vendorName: string;
  productName: string;
  organizationalUnit: string;
  distinguishedName: string;
  productVersion: string;
  productType: string;
  assuranceLevel: string;
  infoURL?: string;
  supportsCompressedManifests?: boolean | null;
  disallowedSignals?: {
    inception?: string[];
    transformation?: string[];
    [key: string]: string[] | undefined;
  };
  liveVideo?: {
    supported: boolean;
    encapsulations?: Array<{
      type: string;
      methods: string[];
      generation?: boolean;
      validation?: boolean;
    }>;
  };
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
  conformanceProgramVersion: string;
  status: string;
  lastModification: string;
  assuranceLevelValue: number | null;
}

export interface GroupedProduct {
  distinguishedName: string;
  vendorName: string;
  productName: string;
  organizationalUnit: string;
  infoURL?: string;
  records: Product[];
  latestConformanceDate: string;
  statuses: string[];
  productTypes: string[];
  assuranceLevel: string;
  assuranceLevelValue: number | null;
  supportsLiveVideo?: boolean;
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
    infoURL?: string;
    minVersion?: string;
    assurance?: {
      maxAssuranceLevel: number;
      attestationMethods?: string[];
    };
    disallowedSignals?: {
      inception?: string[];
      transformation?: string[];
      [key: string]: string[] | undefined;
    };
  };
  specVersion: string[];
  conformanceProgramVersion: string;
  containers?: {
    generate?: ContainerFormats;
    validate?: ContainerFormats;
  };
  liveVideo?: {
    supported: boolean;
    encapsulations?: Array<{
      type: string;
      methods: string[];
      generation?: boolean;
      validation?: boolean;
    }>;
  };
  supportsCompressedManifests?: boolean;
  status: string;
  dates: {
    creation: string;
    conformance: string;
    earliestPublicDisclosure: string;
    lastModification: string;
  };
}

export interface ContainerFormats {
  image?: string[];
  video?: string[];
  audio?: string[];
  textHtml?: string[];
  textUnstructured?: string[];
  textStructured?: string[];
  documents?: string[];
  fonts?: string[];
  mlModel?: string[];
}