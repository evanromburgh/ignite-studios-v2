/**
 * Development documentation entries for the Documents page.
 * Add PDFs (or other files) to public/documents/ and reference them by filename here.
 * Files are served at /documents/<filename> (e.g. /documents/site-blueprints.pdf).
 */
export interface DocumentEntry {
  id: string
  title: string
  description: string
  /** Filename under public/documents/ (e.g. "site-blueprints.pdf"). Download URL becomes /documents/<filename>. */
  filePath: string
  /** Optional category for grouping (e.g. "Legal", "Development"). */
  category?: string
}

export const developmentDocuments: DocumentEntry[] = [
  // Example entries – add real PDFs to public/documents/ and uncomment or add more:
  // {
  //   id: 'site-blueprints',
  //   title: 'Site development blueprints',
  //   description: 'Architectural and development blueprints for the site.',
  //   filePath: 'site-blueprints.pdf',
  //   category: 'Development',
  // },
  // {
  //   id: 'legal-frameworks',
  //   title: 'Legal frameworks',
  //   description: 'Legal and regulatory documentation.',
  //   filePath: 'legal-frameworks.pdf',
  //   category: 'Legal',
  // },
]
