
import { Unit, DocumentAsset } from './types';

/**
 * SOURCE OF TRUTH: DEFAULT INVENTORY TEMPLATE
 * The system will use these as the baseline if the cloud database is empty.
 */
export const MOCK_UNITS: Unit[] = [
  { id: "701", unitNumber: "701", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1814000, status: "Sold", unitType: "C1", imageUrl: "https://sales.moresonestate.co.za/units/unit_c1.webp" },
  { id: "702", unitNumber: "702", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1714000, status: "Sold", unitType: "B1", imageUrl: "https://sales.moresonestate.co.za/units/unit_b1.webp" },
  { id: "703", unitNumber: "703", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1714000, status: "Sold", unitType: "B1", imageUrl: "https://sales.moresonestate.co.za/units/unit_b1.webp" },
  { id: "704", unitNumber: "704", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1664000, status: "Sold", unitType: "A1", imageUrl: "https://sales.moresonestate.co.za/units/unit_a1.webp" },
  { id: "705", unitNumber: "705", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1664000, status: "Sold", unitType: "A1", imageUrl: "https://sales.moresonestate.co.za/units/unit_a1.webp" },
  { id: "706", unitNumber: "706", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1814000, status: "Sold", unitType: "C1", imageUrl: "https://sales.moresonestate.co.za/units/unit_c1.webp" },
  { id: "707", unitNumber: "707", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1764000, status: "Sold", unitType: "C2", imageUrl: "https://sales.moresonestate.co.za/units/unit_c2.webp" },
  { id: "708", unitNumber: "708", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1664000, status: "Sold", unitType: "B2", imageUrl: "https://sales.moresonestate.co.za/units/unit_b2.webp" },
  { id: "709", unitNumber: "709", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1664000, status: "Sold", unitType: "B2", imageUrl: "https://sales.moresonestate.co.za/units/unit_b2.webp" },
  { id: "710", unitNumber: "710", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1614000, status: "Sold", unitType: "A2", imageUrl: "https://sales.moresonestate.co.za/units/unit_a2.webp" },
  { id: "711", unitNumber: "711", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1614000, status: "Sold", unitType: "A2", imageUrl: "https://sales.moresonestate.co.za/units/unit_a2.webp" },
  { id: "712", unitNumber: "712", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1764000, status: "Sold", unitType: "C2", imageUrl: "https://sales.moresonestate.co.za/units/unit_c2.webp" },
  { id: "713", unitNumber: "713", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1744000, status: "Sold", unitType: "C1", imageUrl: "https://sales.moresonestate.co.za/units/unit_c1.webp" },
  { id: "714", unitNumber: "714", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1644000, status: "Sold", unitType: "B1", imageUrl: "https://sales.moresonestate.co.za/units/unit_b1.webp" },
  { id: "715", unitNumber: "715", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1644000, status: "Sold", unitType: "B1", imageUrl: "https://sales.moresonestate.co.za/units/unit_b1.webp" },
  { id: "716", unitNumber: "716", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1594000, status: "Sold", unitType: "A1", imageUrl: "https://sales.moresonestate.co.za/units/unit_a1.webp" },
  { id: "717", unitNumber: "717", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1594000, status: "Sold", unitType: "A1", imageUrl: "https://sales.moresonestate.co.za/units/unit_a1.webp" },
  { id: "718", unitNumber: "718", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1744000, status: "Sold", unitType: "C1", imageUrl: "https://sales.moresonestate.co.za/units/unit_c1.webp" },
  { id: "801", unitNumber: "801", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1814000, status: "Sold", unitType: "C1", imageUrl: "https://sales.moresonestate.co.za/units/unit_c1.webp" },
  { id: "802", unitNumber: "802", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1664000, status: "Reserved", unitType: "A1", imageUrl: "https://sales.moresonestate.co.za/units/unit_a1.webp" },
  { id: "803", unitNumber: "803", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1664000, status: "Reserved", unitType: "A1", imageUrl: "https://sales.moresonestate.co.za/units/unit_a1.webp" },
  { id: "804", unitNumber: "804", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1714000, status: "Sold", unitType: "B1", imageUrl: "https://sales.moresonestate.co.za/units/unit_b1.webp" },
  { id: "805", unitNumber: "805", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1714000, status: "Reserved", unitType: "B1", imageUrl: "https://sales.moresonestate.co.za/units/unit_b1.webp" },
  { id: "806", unitNumber: "806", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1814000, status: "Sold", unitType: "C1", imageUrl: "https://sales.moresonestate.co.za/units/unit_c1.webp" },
  { id: "807", unitNumber: "807", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1814000, status: "Sold", unitType: "C1", imageUrl: "https://sales.moresonestate.co.za/units/unit_c1.webp" },
  { id: "808", unitNumber: "808", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1714000, status: "Sold", unitType: "B1", imageUrl: "https://sales.moresonestate.co.za/units/unit_b1.webp" },
  { id: "809", unitNumber: "809", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1714000, status: "Reserved", unitType: "B1", imageUrl: "https://sales.moresonestate.co.za/units/unit_b1.webp" },
  { id: "810", unitNumber: "810", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1664000, status: "Sold", unitType: "A1", imageUrl: "https://sales.moresonestate.co.za/units/unit_a1.webp" },
  { id: "811", unitNumber: "811", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1664000, status: "Reserved", unitType: "A1", imageUrl: "https://sales.moresonestate.co.za/units/unit_a1.webp" },
  { id: "812", unitNumber: "812", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1814000, status: "Sold", unitType: "C1", imageUrl: "https://sales.moresonestate.co.za/units/unit_c1.webp" },
  { id: "813", unitNumber: "813", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1764000, status: "Reserved", unitType: "C2", imageUrl: "https://sales.moresonestate.co.za/units/unit_c2.webp" },
  { id: "814", unitNumber: "814", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1614000, status: "Available", unitType: "A2", imageUrl: "https://sales.moresonestate.co.za/units/unit_a2.webp" },
  { id: "815", unitNumber: "815", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1614000, status: "Available", unitType: "A2", imageUrl: "https://sales.moresonestate.co.za/units/unit_a2.webp" },
  { id: "816", unitNumber: "816", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1664000, status: "Available", unitType: "B2", imageUrl: "https://sales.moresonestate.co.za/units/unit_b2.webp" },
  { id: "817", unitNumber: "817", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1664000, status: "Available", unitType: "B2", imageUrl: "https://sales.moresonestate.co.za/units/unit_b2.webp" },
  { id: "818", unitNumber: "818", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1764000, status: "Sold", unitType: "C2", imageUrl: "https://sales.moresonestate.co.za/units/unit_c2.webp" },
  { id: "819", unitNumber: "819", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1764000, status: "Sold", unitType: "C1", imageUrl: "https://sales.moresonestate.co.za/units/unit_c1.webp" },
  { id: "820", unitNumber: "820", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1664000, status: "Sold", unitType: "B1", imageUrl: "https://sales.moresonestate.co.za/units/unit_b1.webp" },
  { id: "821", unitNumber: "821", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1664000, status: "Available", unitType: "B1", imageUrl: "https://sales.moresonestate.co.za/units/unit_b1.webp" },
  { id: "822", unitNumber: "822", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1725000, status: "Available", unitType: "A1", imageUrl: "https://sales.moresonestate.co.za/units/unit_a1.webp" },
  { id: "823", unitNumber: "823", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1614000, status: "Sold", unitType: "A1", imageUrl: "https://sales.moresonestate.co.za/units/unit_a1.webp" },
  { id: "824", unitNumber: "824", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1764000, status: "Sold", unitType: "C1", imageUrl: "https://sales.moresonestate.co.za/units/unit_c1.webp" },
  { id: "825", unitNumber: "825", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1875000, status: "Available", unitType: "C1", imageUrl: "https://sales.moresonestate.co.za/units/unit_c1.webp" },
  { id: "826", unitNumber: "826", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1725000, status: "Available", unitType: "A1", imageUrl: "https://sales.moresonestate.co.za/units/unit_a1.webp" },
  { id: "827", unitNumber: "827", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1725000, status: "Available", unitType: "A1", imageUrl: "https://sales.moresonestate.co.za/units/unit_a1.webp" },
  { id: "828", unitNumber: "828", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1775000, status: "Available", unitType: "B1", imageUrl: "https://sales.moresonestate.co.za/units/unit_b1.webp" },
  { id: "829", unitNumber: "829", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1775000, status: "Available", unitType: "B1", imageUrl: "https://sales.moresonestate.co.za/units/unit_b1.webp" },
  { id: "830", unitNumber: "830", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1764000, status: "Reserved", unitType: "C1", imageUrl: "https://sales.moresonestate.co.za/units/unit_c1.webp" },
  { id: "831", unitNumber: "831", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1764000, status: "Sold", unitType: "C1", imageUrl: "https://sales.moresonestate.co.za/units/unit_c1.webp" },
  { id: "832", unitNumber: "832", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1775000, status: "Available", unitType: "B1", imageUrl: "https://sales.moresonestate.co.za/units/unit_b1.webp" },
  { id: "833", unitNumber: "833", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1775000, status: "Available", unitType: "B1", imageUrl: "https://sales.moresonestate.co.za/units/unit_b1.webp" },
  { id: "834", unitNumber: "834", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1725000, status: "Available", unitType: "A1", imageUrl: "https://sales.moresonestate.co.za/units/unit_a1.webp" },
  { id: "835", unitNumber: "835", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1725000, status: "Available", unitType: "A1", imageUrl: "https://sales.moresonestate.co.za/units/unit_a1.webp" },
  { id: "836", unitNumber: "836", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1764000, status: "Reserved", unitType: "C1", imageUrl: "https://sales.moresonestate.co.za/units/unit_c1.webp" },
  { id: "837", unitNumber: "837", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1744000, status: "Sold", unitType: "C2", imageUrl: "https://sales.moresonestate.co.za/units/unit_c2.webp" },
  { id: "838", unitNumber: "838", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1594000, status: "Available", unitType: "A2", imageUrl: "https://sales.moresonestate.co.za/units/unit_a2.webp" },
  { id: "839", unitNumber: "839", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1594000, status: "Sold", unitType: "A2", imageUrl: "https://sales.moresonestate.co.za/units/unit_a2.webp" },
  { id: "840", unitNumber: "840", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1644000, status: "Sold", unitType: "B2", imageUrl: "https://sales.moresonestate.co.za/units/unit_b2.webp" },
  { id: "841", unitNumber: "841", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1644000, status: "Sold", unitType: "B2", imageUrl: "https://sales.moresonestate.co.za/units/unit_b2.webp" },
  { id: "842", unitNumber: "842", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1744000, status: "Sold", unitType: "C2", imageUrl: "https://sales.moresonestate.co.za/units/unit_c2.webp" },
  { id: "843", unitNumber: "843", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1744000, status: "Sold", unitType: "C1", imageUrl: "https://sales.moresonestate.co.za/units/unit_c1.webp" },
  { id: "844", unitNumber: "844", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1644000, status: "Sold", unitType: "B1", imageUrl: "https://sales.moresonestate.co.za/units/unit_b1.webp" },
  { id: "845", unitNumber: "845", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 65, price: 1644000, status: "Sold", unitType: "B1", imageUrl: "https://sales.moresonestate.co.za/units/unit_b1.webp" },
  { id: "846", unitNumber: "846", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1594000, status: "Sold", unitType: "A1", imageUrl: "https://sales.moresonestate.co.za/units/unit_a1.webp" },
  { id: "847", unitNumber: "847", bedrooms: 2, bathrooms: 1, parking: 1, sizeSqm: 65, price: 1594000, status: "Sold", unitType: "A1", imageUrl: "https://sales.moresonestate.co.za/units/unit_a1.webp" },
  { id: "848", unitNumber: "848", bedrooms: 2, bathrooms: 2, parking: 1, sizeSqm: 75, price: 1744000, status: "Sold", unitType: "C1", imageUrl: "https://sales.moresonestate.co.za/units/unit_c1.webp" },
];

export const MOCK_DOCUMENTS: DocumentAsset[] = [
  {
    id: 'd1',
    title: 'Site Development Plan',
    description: 'Architectural overview detailing building placement, landscaping zones, and site infrastructure.',
    type: 'PDF',
    size: '14.2 MB',
    url: '#'
  },
  {
    id: 'd2',
    title: 'Floorplan Pack',
    description: 'Comprehensive technical layouts for all standard and premium configuration variants.',
    type: 'ZIP',
    size: '52.8 MB',
    url: '#'
  },
  {
    id: 'd3',
    title: 'List of Specifications',
    description: 'Technical breakdown of luxury finishes, fixtures, and premium structural materials.',
    type: 'PDF',
    size: '8.4 MB',
    url: '#'
  },
  {
    id: 'd4',
    title: 'Electrical Schedule',
    description: 'Complete technical layout of lighting, power points, and smart-home integration conduits for all unit types.',
    type: 'PDF',
    size: '6.1 MB',
    url: '#'
  },
  {
    id: 'd5',
    title: 'Conduct Rules',
    description: "Official regulatory framework ensuring the maintenance of Ignite's luxury standards and communal harmony.",
    type: 'PDF',
    size: '3.5 MB',
    url: '#'
  }
];
