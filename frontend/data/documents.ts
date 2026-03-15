/**
 * Development documentation entries for the Documents page.
 * filePath can be either a full URL (e.g. Supabase Storage public URL) or a relative path for local files.
 */
export interface DocumentEntry {
  id: string
  title: string
  description: string
  /** Full URL (e.g. Supabase Storage) or path under public/documents/. */
  filePath: string
  /** Optional short file type label (e.g. "PDF", "ZIP"). If omitted, inferred from filePath extension. */
  fileType?: string
  /** Optional human-readable file size label (e.g. "3.5 MB"). */
  fileSize?: string
}

/** Supabase Storage public URL for downloads (bucket: units, folder: downloads). */
const STORAGE_BASE = 'https://bhmgvodqmdwnwntffvsd.supabase.co/storage/v1/object/public/units/downloads/'

export const developmentDocuments: DocumentEntry[] = [
  {
    id: 'site-development-plan',
    title: 'Site Development Plan',
    description:
      'Architectural overview detailing building placement, landscaping zones, and site infrastructure.',
    filePath: `${STORAGE_BASE}site-development-plan.pdf`,
    fileType: 'PDF',
    fileSize: '5.88 MB',
  },
  {
    id: 'floorplan-pack',
    title: 'Floorplan Pack',
    description:
      'Comprehensive technical layouts for all standard and premium configuration variants.',
    filePath: `${STORAGE_BASE}floorplan-pack.pdf`,
    fileType: 'PDF',
    fileSize: '1.03 MB',
  },
  {
    id: 'electrical-schedule',
    title: 'Electrical Schedule',
    description:
      'Complete technical layout of lighting, power points, and smart-home integration conduits for all unit types.',
    filePath: `${STORAGE_BASE}electrical-schedule.pdf`,
    fileType: 'PDF',
    fileSize: '1.97 MB',
  },
  {
    id: 'conduct-rules',
    title: 'Conduct Rules',
    description:
      'Official regulatory framework ensuring the maintenance of Ignite’s luxury standards and communal harmony.',
    filePath: `${STORAGE_BASE}conduct-rules.pdf`,
    fileType: 'PDF',
    fileSize: '1.57 MB',
  },
  {
    id: 'list-of-specifications',
    title: 'List of Specifications',
    description:
      'Technical breakdown of luxury finishes, fixtures, and premium structural materials.',
    filePath: `${STORAGE_BASE}list-of-specifications.pdf`,
    fileType: 'PDF',
    fileSize: '381 KB',
  },
]
