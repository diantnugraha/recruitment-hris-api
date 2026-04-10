import PDFDocument from 'pdfkit'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Resolve logo path - works in both dev (src/) and prod (dist/)
function getLogoPath(): string {
  // Try src/assets first (dev), then project root assets
  const candidates = [
    join(__dirname, '..', 'assets', 'tuv-nord-logo.png'),
    resolve(process.cwd(), 'src', 'assets', 'tuv-nord-logo.png'),
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return candidates[0] ?? join(__dirname, '..', 'assets', 'tuv-nord-logo.png')
}

// Data interface for PDF generation
export interface EmployeeRequestPdfData {
  // Header Info
  position: string           // Job Title
  division: string
  department: string
  numberOfRequired: number
  requestedDate: string
  dateRequired: string
  positionLevel: string      // Job Level
  // Type of Request
  typeOfRequest: 'new' | 'replacement'
  budget: string
  remainingBudget: string
  genderMale: boolean
  genderFemale: boolean
  // Reason
  reason: string
  // Placement
  placement: string
  // Job Descriptions (array of up to 6 items)
  jobDescriptions: string[]
  // Job Qualification
  minimumAge: string
  maximumAge: string
  educational: string
  majors: string
  experience: string
  // Kompetensi Khusus - Mandatory (items 4-8)
  mandatoryCompetencies: string[]
  // Kompetensi Khusus - Specialist (item 9)
  specialistCompetencies: string[]
  // Kompetensi Penunjang - Optional (items 10-13)
  optionalCompetencies: string[]
  // Signatures
  createdByName: string
  createdByDept: string
  acknowledgeByName: string   // Head of Division
  checkedByName: string       // Human Capital Division
  approvedByName: string      // President Director
}

// Strip HTML tags from a string
function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]+>/g, '').trim()
}

// Lexical node type for recursive traversal
interface LexicalNode {
  type?: string
  text?: string
  listType?: string
  tag?: string
  children?: LexicalNode[]
}

// Collect all text content from a single node's subtree into one string
function collectNodeText(node: LexicalNode): string {
  if (node.type === 'text' && node.text) {
    return node.text
  }
  if (node.type === 'linebreak') {
    return '\n'
  }
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(collectNodeText).join('')
  }
  return ''
}

// Walk the Lexical tree, grouping text by paragraph or list-item
function processLexicalNode(node: LexicalNode, items: string[]): void {
  if (!node) return

  // Each listitem becomes one entry
  if (node.type === 'list') {
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        if (child.type === 'listitem') {
          const text = collectNodeText(child).trim()
          if (text) items.push(text)
        }
      }
    }
    return
  }

  // Each paragraph becomes one entry
  if (node.type === 'paragraph') {
    const text = collectNodeText(node).trim()
    if (text) items.push(text)
    return
  }

  // For root and other container nodes, recurse
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      processLexicalNode(child, items)
    }
  }
}

// Lexical JSON to plain text extractor
function extractTextFromLexical(content: string | null | undefined): string[] {
  if (!content) return []

  try {
    const parsed = JSON.parse(content)
    const items: string[] = []

    if (parsed.root) {
      processLexicalNode(parsed.root, items)
    }

    return items.filter(l => l.trim() !== '')
  } catch {
    // Not valid JSON — strip HTML tags and split by newline
    const cleaned = stripHtmlTags(content)
    if (cleaned) {
      return cleaned.split('\n').filter(l => l.trim() !== '')
    }
    return []
  }
}

export function extractTextLines(content: string | null | undefined): string[] {
  return extractTextFromLexical(content)
}

export function generateEmployeeRequestPdf(data: EmployeeRequestPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 30, bottom: 30, left: 30, right: 30 },
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const pageWidth = doc.page.width - 60 // margins
      const startX = 30
      const startY = 30

      // ============================================
      // CONSTANTS & HELPERS
      // ============================================
      const FONT_BOLD = 'Helvetica-Bold'
      const FONT_REGULAR = 'Helvetica'
      const FONT_ITALIC = 'Helvetica-Oblique'

      const BORDER_COLOR = '#000000'
      const HEADER_BG = '#FFFFFF'
      const PAD = 4  // cell padding
      const LABEL_H = 16 // bilingual label height (2 lines of 6.5pt + spacing)

      function drawCell(
        x: number, y: number, w: number, h: number,
        options?: { fill?: string; borderWidth?: number }
      ) {
        const fill = options?.fill || HEADER_BG
        const bw = options?.borderWidth ?? 0.5
        doc.save()
        doc.rect(x, y, w, h).lineWidth(bw).stroke(BORDER_COLOR)
        if (fill !== HEADER_BG) {
          doc.rect(x, y, w, h).fill(fill)
          doc.rect(x, y, w, h).lineWidth(bw).stroke(BORDER_COLOR)
        }
        doc.restore()
      }

      function drawText(
        text: string, x: number, y: number,
        options?: { font?: string; size?: number; color?: string; width?: number; align?: 'left' | 'center' | 'right' }
      ) {
        doc.save()
        doc.font(options?.font || FONT_REGULAR)
          .fontSize(options?.size || 7)
          .fillColor(options?.color || '#000000')
        if (options?.width) {
          doc.text(text, x, y, { width: options.width, align: options.align || 'left' })
        } else {
          doc.text(text, x, y)
        }
        doc.restore()
      }

      function drawBilingual(
        id: string, en: string, x: number, y: number,
        options?: { font?: string; size?: number; width?: number }
      ) {
        const sz = options?.size || 7
        doc.save()
        doc.font(options?.font || FONT_REGULAR).fontSize(sz).fillColor('#000000')
        doc.text(id + ' |', x, y)
        doc.font(FONT_ITALIC).fontSize(sz)
        doc.text(en, x, y + sz + 1)
        doc.restore()
      }

      function drawDottedLine(x: number, y: number, width: number) {
        doc.save()
        doc.moveTo(x, y)
          .lineTo(x + width, y)
          .dash(1, { space: 2 })
          .lineWidth(0.3)
          .stroke('#666666')
        doc.undash()
        doc.restore()
      }

      function drawCheckbox(x: number, y: number, checked: boolean, size: number = 8) {
        doc.save()
        doc.rect(x, y, size, size).lineWidth(0.5).stroke(BORDER_COLOR)
        if (checked) {
          doc.moveTo(x + 1.5, y + size / 2)
            .lineTo(x + size / 3, y + size - 2)
            .lineTo(x + size - 1.5, y + 1.5)
            .lineWidth(1)
            .stroke(BORDER_COLOR)
        }
        doc.restore()
      }

      /** Measure how tall `text` will be when rendered at `fontSize` within `width`. */
      function getTextHeight(text: string, width: number, fontSize: number = 7, font: string = FONT_REGULAR): number {
        doc.save()
        doc.font(font).fontSize(fontSize)
        const h = doc.heightOfString(text, { width })
        doc.restore()
        return h
      }

      // ============================================
      // LAYOUT
      // ============================================
      const tableX = startX
      let curY = startY
      const fullW = pageWidth
      const col1W = 130  // Labels column
      const col2W = 20   // Number column

      // ============================================
      // 1. HEADER ROW — Logo + Title + Form Info
      // ============================================
      const headerH = 40
      const logoColW = 110
      const titleColW = fullW - logoColW - 160
      const formInfoColW = 160

      drawCell(tableX, curY, logoColW, headerH)
      drawCell(tableX + logoColW, curY, titleColW, headerH)
      drawCell(tableX + logoColW + titleColW, curY, formInfoColW, headerH)

      // Logo
      try {
        const logoPath = getLogoPath()
        doc.image(logoPath, tableX + 8, curY + 8, { width: 90, height: 24 })
      } catch {
        drawText('TÜV NORD', tableX + 10, curY + 14, { font: FONT_BOLD, size: 12 })
      }

      // Title
      drawText('PERMINTAAN KARYAWAN BARU', tableX + logoColW + 10, curY + 14, {
        font: FONT_BOLD, size: 11, width: titleColW - 20, align: 'center'
      })

      // Form Info
      const fiX = tableX + logoColW + titleColW + 5
      const fiLabelW = 80
      drawText('Form No.', fiX, curY + 6, { size: 6.5 })
      drawText(': FHR-TNI-01A', fiX + fiLabelW, curY + 6, { size: 6.5 })
      drawText('Revision', fiX, curY + 16, { size: 6.5 })
      drawText(': 00', fiX + fiLabelW, curY + 16, { size: 6.5 })
      drawText('Effective Date', fiX, curY + 26, { size: 6.5 })
      drawText(': 27.12.2024', fiX + fiLabelW, curY + 26, { size: 6.5 })

      curY += headerH

      // ============================================
      // 2. BASIC INFO ROWS
      // ============================================
      const basicCol1 = 140
      const basicCol2 = 255
      const basicCol3 = fullW - basicCol1 - basicCol2

      // Row 1: Jabatan | Divisi | Jumlah Kebutuhan
      const posValH = getTextHeight(data.position || ' ', basicCol1 - 55 - PAD, 7)
      const divValH = getTextHeight(data.division || ' ', basicCol2 - 55 - PAD, 7)
      const row1H = Math.max(30, 3 + LABEL_H + Math.max(posValH, divValH) + PAD)

      drawCell(tableX, curY, basicCol1, row1H)
      drawCell(tableX + basicCol1, curY, basicCol2, row1H)
      drawCell(tableX + basicCol1 + basicCol2, curY, basicCol3, row1H)

      drawBilingual('Jabatan', 'Position', tableX + PAD, curY + 3, { size: 6.5 })
      drawText(data.position, tableX + 55, curY + 3 + LABEL_H, { size: 7, width: basicCol1 - 55 - PAD })

      drawBilingual('Divisi', 'Division', tableX + basicCol1 + PAD, curY + 3, { size: 6.5 })
      drawText(data.division, tableX + basicCol1 + 55, curY + 3 + LABEL_H, { size: 7, width: basicCol2 - 55 - PAD })

      drawBilingual('Jumlah Kebutuhan', 'Number of Required', tableX + basicCol1 + basicCol2 + PAD, curY + 3, { size: 6.5 })
      drawText(String(data.numberOfRequired), tableX + basicCol1 + basicCol2 + PAD, curY + 3 + LABEL_H, { size: 7, width: basicCol3 - PAD * 2 })

      curY += row1H

      // Row 2: Tanggal Pengajuan | Tanggal Dibutuhkan | Level Posisi
      const row2H = 30 // dates and level are short, fixed height is fine

      drawCell(tableX, curY, basicCol1, row2H)
      drawCell(tableX + basicCol1, curY, basicCol2, row2H)
      drawCell(tableX + basicCol1 + basicCol2, curY, basicCol3, row2H)

      drawBilingual('Tanggal Pengajuan', 'Requested Date', tableX + PAD, curY + 3, { size: 6.5 })
      drawText(data.requestedDate, tableX + 80, curY + 3 + LABEL_H, { size: 7, width: basicCol1 - 80 - PAD })

      drawBilingual('Tanggal Dibutuhkan', 'Date Required', tableX + basicCol1 + PAD, curY + 3, { size: 6.5 })
      drawText(data.dateRequired, tableX + basicCol1 + 80, curY + 3 + LABEL_H, { size: 7, width: basicCol2 - 80 - PAD })

      drawBilingual('Level Posisi', 'Position Level', tableX + basicCol1 + basicCol2 + PAD, curY + 3, { size: 6.5 })
      drawText(data.positionLevel, tableX + basicCol1 + basicCol2 + PAD, curY + 3 + LABEL_H, { size: 7, width: basicCol3 - PAD * 2 })

      curY += row2H

      // ============================================
      // 3. TYPE OF REQUEST ROW
      // ============================================
      const typeRowH = 42
      const typeCol1 = 100
      const typeCol2 = 90
      const typeCol3 = 130
      const typeCol4 = fullW - typeCol1 - typeCol2 - typeCol3

      drawCell(tableX, curY, typeCol1, typeRowH)
      drawCell(tableX + typeCol1, curY, typeCol2, typeRowH)
      drawCell(tableX + typeCol1 + typeCol2, curY, typeCol3, typeRowH)
      drawCell(tableX + typeCol1 + typeCol2 + typeCol3, curY, typeCol4, typeRowH)

      drawBilingual('Tipe Permohonan', 'Type of Request', tableX + 8, curY + 12, { size: 6.5 })

      const cbX = tableX + typeCol1 + 10
      drawCheckbox(cbX, curY + 6, data.typeOfRequest === 'new')
      drawBilingual('Penambahan', 'Additional', cbX + 14, curY + 4, { size: 6.5 })

      drawCheckbox(cbX, curY + 24, data.typeOfRequest === 'replacement')
      drawBilingual('Penggantian', 'Replacement', cbX + 14, curY + 22, { size: 6.5 })

      const budgetX = tableX + typeCol1 + typeCol2 + 5
      drawText('Budget : ' + data.budget, budgetX, curY + 8, { size: 6.5, width: typeCol3 - 10 })
      drawText('Sisa Budget : ' + data.remainingBudget, budgetX, curY + 24, { size: 6.5, width: typeCol3 - 10 })

      const genderX = tableX + typeCol1 + typeCol2 + typeCol3 + 5
      drawBilingual('Jenis Kelamin', 'Gender', genderX, curY + 2, { size: 6.5 })

      const checklistX = genderX + typeCol4 - 70
      drawText('<= Centang |', checklistX, curY + 2, { size: 5.5 })
      drawText('Checklist (v)', checklistX + 5, curY + 9, { size: 5.5, font: FONT_ITALIC })

      drawBilingual('Pria', 'Male', genderX, curY + 16, { size: 6.5 })
      drawCheckbox(genderX + 40, curY + 16, data.genderMale)

      drawBilingual('Wanita', 'Female', genderX, curY + 28, { size: 6.5 })
      drawCheckbox(genderX + 40, curY + 28, data.genderFemale)

      curY += typeRowH

      // ============================================
      // 4. REASON + PLACEMENT ROW
      // ============================================
      const reasonColW = fullW - 130
      const placementColW = 130

      const reasonValH = getTextHeight(data.reason || ' ', reasonColW - PAD * 2, 7)
      const reasonRowH = Math.max(36, 3 + LABEL_H + reasonValH + PAD)

      drawCell(tableX, curY, reasonColW, reasonRowH)
      drawCell(tableX + reasonColW, curY, placementColW, reasonRowH)

      drawBilingual('Alasan Permohonan untuk Penambahan atau', 'Reason for this additional or substitution',
        tableX + PAD, curY + 3, { size: 6.5 })
      drawText(data.reason, tableX + PAD, curY + 3 + LABEL_H, { size: 7, width: reasonColW - PAD * 2 })

      drawBilingual('Penempatan', 'Placement', tableX + reasonColW + PAD, curY + 3, { size: 6.5 })
      drawText(data.placement, tableX + reasonColW + PAD, curY + 3 + LABEL_H, { size: 7, width: placementColW - PAD * 2 })

      curY += reasonRowH

      // ============================================
      // 5. JOB DESCRIPTIONS (6 rows)
      // ============================================
      const jdLabelW = col1W
      const jdNumW = col2W
      const jdContentW = fullW - jdLabelW - jdNumW
      const jdMinH = 18

      for (let i = 0; i < 6; i++) {
        const content = data.jobDescriptions[i] || ''
        const contentH = content ? getTextHeight(content, jdContentW - PAD * 2, 7) : 0
        const jdRowH = Math.max(jdMinH, contentH + PAD * 2)

        drawCell(tableX, curY, jdLabelW, jdRowH)
        drawCell(tableX + jdLabelW, curY, jdNumW, jdRowH)
        drawCell(tableX + jdLabelW + jdNumW, curY, jdContentW, jdRowH)

        if (i === 0) {
          drawBilingual('Uraian Jabatan', 'Job Descriptions', tableX + PAD, curY + 3, { size: 6.5 })
        }

        drawText(String(i + 1), tableX + jdLabelW + 6, curY + 5, {
          size: 7, align: 'center', width: jdNumW - 12
        })

        if (content) {
          drawText(content, tableX + jdLabelW + jdNumW + PAD, curY + PAD, {
            size: 7, width: jdContentW - PAD * 2
          })
        }

        curY += jdRowH
      }

      // ============================================
      // 6. JOB QUALIFICATION SECTION
      // ============================================
      const qualLabelW = col1W
      const qualNumW = col2W
      const qualLeftContentW = 170
      const qualRightLabelW = 80
      const qualRightContentW = fullW - qualLabelW - qualNumW - qualLeftContentW - qualRightLabelW
      const qualMinH = 20
      const fullQualContentW = fullW - qualLabelW - qualNumW

      const qcX = tableX + qualLabelW + qualNumW + PAD
      const qrX = tableX + qualLabelW + qualNumW + qualLeftContentW + PAD

      // Row 1: Usia Minimal | Usia Maksimal
      drawCell(tableX, curY, qualLabelW, qualMinH)
      drawCell(tableX + qualLabelW, curY, qualNumW, qualMinH)
      drawCell(tableX + qualLabelW + qualNumW, curY, qualLeftContentW, qualMinH)
      drawCell(tableX + qualLabelW + qualNumW + qualLeftContentW, curY, qualRightLabelW, qualMinH)
      drawCell(tableX + qualLabelW + qualNumW + qualLeftContentW + qualRightLabelW, curY, qualRightContentW, qualMinH)

      drawText('1', tableX + qualLabelW + 6, curY + 5, { size: 7, align: 'center', width: qualNumW - 12 })

      drawBilingual('Usia Minimal', 'Minimum Age', qcX, curY + 2, { size: 6.5 })
      drawText(data.minimumAge, qcX + 65, curY + 3, { size: 7, width: qualLeftContentW - 65 - PAD })

      drawBilingual('Usia Maksimal', 'Maximum Age', qrX, curY + 2, { size: 6.5 })
      drawText(data.maximumAge, qrX + 65, curY + 3, { size: 7, width: qualRightContentW - 65 - PAD })

      curY += qualMinH

      // Row 2: Pendidikan | Jurusan
      drawCell(tableX, curY, qualLabelW, qualMinH)
      drawCell(tableX + qualLabelW, curY, qualNumW, qualMinH)
      drawCell(tableX + qualLabelW + qualNumW, curY, qualLeftContentW, qualMinH)
      drawCell(tableX + qualLabelW + qualNumW + qualLeftContentW, curY, qualRightLabelW, qualMinH)
      drawCell(tableX + qualLabelW + qualNumW + qualLeftContentW + qualRightLabelW, curY, qualRightContentW, qualMinH)

      drawText('2', tableX + qualLabelW + 6, curY + 5, { size: 7, align: 'center', width: qualNumW - 12 })

      drawBilingual('Pendidikan', 'Educational', qcX, curY + 2, { size: 6.5 })
      drawText(data.educational, qcX + 60, curY + 3, { size: 7, width: qualLeftContentW - 60 - PAD })

      drawBilingual('Jurusan', 'Majors', qrX, curY + 2, { size: 6.5 })
      drawText(data.majors, qrX + 45, curY + 3, { size: 7, width: qualRightContentW - 10 })

      curY += qualMinH

      // Row 3: Pengalaman
      const expH = getTextHeight(data.experience || ' ', fullQualContentW - 65, 7)
      const expRowH = Math.max(qualMinH, Math.max(expH, LABEL_H) + PAD * 2)

      drawCell(tableX, curY, qualLabelW, expRowH)
      drawCell(tableX + qualLabelW, curY, qualNumW, expRowH)
      drawCell(tableX + qualLabelW + qualNumW, curY, fullQualContentW, expRowH)

      drawBilingual('Kualifikasi Jabatan', 'Job Qualification', tableX + PAD, curY + 3, { size: 6.5 })
      drawText('3', tableX + qualLabelW + 6, curY + 5, { size: 7, align: 'center', width: qualNumW - 12 })
      drawBilingual('Pengalaman', 'Experience', qcX, curY + 2, { size: 6.5 })
      drawText(data.experience, qcX + 60, curY + 3, { size: 7, width: fullQualContentW - 65 })

      curY += expRowH

      // Rows 4-8: Kompetensi Khusus - Mandatory
      for (let i = 0; i < 5; i++) {
        const rowNum = i + 4
        const content = data.mandatoryCompetencies[i] || ''
        const contentH = content ? getTextHeight(content, fullQualContentW - PAD * 2, 7) : 0
        const hasLabel = i === 1
        const minH = hasLabel ? Math.max(qualMinH, LABEL_H + PAD * 2) : qualMinH
        const rowH = hasLabel
          ? Math.max(minH, LABEL_H + PAD + contentH + PAD)
          : Math.max(minH, contentH + PAD * 2)

        drawCell(tableX, curY, qualLabelW, rowH)
        drawCell(tableX + qualLabelW, curY, qualNumW, rowH)
        drawCell(tableX + qualLabelW + qualNumW, curY, fullQualContentW, rowH)

        drawText(String(rowNum), tableX + qualLabelW + 6, curY + 5, {
          size: 7, align: 'center', width: qualNumW - 12
        })

        if (hasLabel) {
          drawBilingual('Kompetensi Khusus', 'Mandatory', qcX, curY + 2, { size: 6.5, font: FONT_BOLD })
        }

        if (content) {
          const textY = hasLabel ? curY + LABEL_H + PAD : curY + PAD
          drawText(content, qcX, textY, { size: 7, width: fullQualContentW - PAD * 2 })
        }

        curY += rowH
      }

      // Row 9: Kompetensi Khusus - Specialist
      const spec0 = data.specialistCompetencies[0] || ''
      const spec0H = spec0 ? getTextHeight(spec0, fullQualContentW - PAD * 2, 7) : 0
      const row9H = Math.max(qualMinH, LABEL_H + PAD + spec0H + PAD)

      drawCell(tableX, curY, qualLabelW, row9H)
      drawCell(tableX + qualLabelW, curY, qualNumW, row9H)
      drawCell(tableX + qualLabelW + qualNumW, curY, fullQualContentW, row9H)

      drawText('9', tableX + qualLabelW + 6, curY + 5, { size: 7, align: 'center', width: qualNumW - 12 })
      drawBilingual('Kompetensi Khusus', 'Specialist', qcX, curY + 2, { size: 6.5, font: FONT_BOLD })

      if (spec0) {
        drawText(spec0, qcX, curY + LABEL_H + PAD, { size: 7, width: fullQualContentW - PAD * 2 })
      }

      curY += row9H

      // Rows 10-11: Specialist continued
      for (let i = 0; i < 2; i++) {
        const rowNum = i + 10
        const specIdx = i + 1
        const content = data.specialistCompetencies[specIdx] || ''
        const contentH = content ? getTextHeight(content, fullQualContentW - PAD * 2, 7) : 0
        const rowH = Math.max(qualMinH, contentH + PAD * 2)

        drawCell(tableX, curY, qualLabelW, rowH)
        drawCell(tableX + qualLabelW, curY, qualNumW, rowH)
        drawCell(tableX + qualLabelW + qualNumW, curY, fullQualContentW, rowH)

        drawText(String(rowNum), tableX + qualLabelW + 6, curY + 5, {
          size: 7, align: 'center', width: qualNumW - 12
        })

        if (content) {
          drawText(content, qcX, curY + PAD, { size: 7, width: fullQualContentW - PAD * 2 })
        }

        curY += rowH
      }

      // Row 12: Kompetensi Penunjang - Optional
      const opt0 = data.optionalCompetencies[0] || ''
      const opt0H = opt0 ? getTextHeight(opt0, fullQualContentW - PAD * 2, 7) : 0
      const row12H = Math.max(qualMinH, LABEL_H + PAD + opt0H + PAD)

      drawCell(tableX, curY, qualLabelW, row12H)
      drawCell(tableX + qualLabelW, curY, qualNumW, row12H)
      drawCell(tableX + qualLabelW + qualNumW, curY, fullQualContentW, row12H)

      drawText('12', tableX + qualLabelW + 4, curY + 5, { size: 7, align: 'center', width: qualNumW - 8 })
      drawBilingual('Kompetensi Penunjang', 'Optional', qcX, curY + 2, { size: 6.5, font: FONT_BOLD })

      if (opt0) {
        drawText(opt0, qcX, curY + LABEL_H + PAD, { size: 7, width: fullQualContentW - PAD * 2 })
      }

      curY += row12H

      // Row 13: Optional continued
      const opt1 = data.optionalCompetencies[1] || ''
      const opt1H = opt1 ? getTextHeight(opt1, fullQualContentW - PAD * 2, 7) : 0
      const row13H = Math.max(qualMinH, opt1H + PAD * 2)

      drawCell(tableX, curY, qualLabelW, row13H)
      drawCell(tableX + qualLabelW, curY, qualNumW, row13H)
      drawCell(tableX + qualLabelW + qualNumW, curY, fullQualContentW, row13H)

      drawText('13', tableX + qualLabelW + 4, curY + 5, { size: 7, align: 'center', width: qualNumW - 8 })

      if (opt1) {
        drawText(opt1, qcX, curY + PAD, { size: 7, width: fullQualContentW - PAD * 2 })
      }

      curY += row13H

      // ============================================
      // 7. SIGNATURE SECTION
      // ============================================
      const sigRowH = 22
      const sigBoxH = 60
      const sigColW = fullW / 4

      // Signature labels row
      drawCell(tableX, curY, sigColW, sigRowH)
      drawCell(tableX + sigColW, curY, sigColW, sigRowH)
      drawCell(tableX + sigColW * 2, curY, sigColW, sigRowH)
      drawCell(tableX + sigColW * 3, curY, sigColW, sigRowH)

      drawBilingual('Dibuat Oleh', 'Created By', tableX + PAD, curY + 4, { size: 7, font: FONT_BOLD })
      drawBilingual('Diketahui Oleh', 'Acknowledge By', tableX + sigColW + PAD, curY + 4, { size: 7, font: FONT_BOLD })
      drawBilingual('Diperiksa Oleh', 'Checked By', tableX + sigColW * 2 + PAD, curY + 4, { size: 7, font: FONT_BOLD })
      drawBilingual('Disetujui Oleh', 'Approved By', tableX + sigColW * 3 + PAD, curY + 4, { size: 7, font: FONT_BOLD })

      curY += sigRowH

      // Signature boxes
      drawCell(tableX, curY, sigColW, sigBoxH)
      drawCell(tableX + sigColW, curY, sigColW, sigBoxH)
      drawCell(tableX + sigColW * 2, curY, sigColW, sigBoxH)
      drawCell(tableX + sigColW * 3, curY, sigColW, sigBoxH)

      // Names with dotted underlines (kept for signatures)
      const sigNameY = curY + sigBoxH - 22
      drawDottedLine(tableX + 10, sigNameY + 8, sigColW - 20)
      drawText(data.createdByName, tableX + 10, sigNameY, { size: 7, width: sigColW - 20, align: 'center' })

      drawDottedLine(tableX + sigColW + 10, sigNameY + 8, sigColW - 20)
      drawText(data.acknowledgeByName, tableX + sigColW + 10, sigNameY, { size: 7, width: sigColW - 20, align: 'center' })

      drawDottedLine(tableX + sigColW * 2 + 10, sigNameY + 8, sigColW - 20)
      drawText(data.checkedByName, tableX + sigColW * 2 + 10, sigNameY, { size: 7, width: sigColW - 20, align: 'center' })

      drawDottedLine(tableX + sigColW * 3 + 10, sigNameY + 8, sigColW - 20)
      drawText(data.approvedByName, tableX + sigColW * 3 + 10, sigNameY, { size: 7, width: sigColW - 20, align: 'center' })

      curY += sigBoxH

      // Role labels row
      const roleH = 16
      drawCell(tableX, curY, sigColW, roleH)
      drawCell(tableX + sigColW, curY, sigColW, roleH)
      drawCell(tableX + sigColW * 2, curY, sigColW, roleH)
      drawCell(tableX + sigColW * 3, curY, sigColW, roleH)

      drawText('Department', tableX + PAD, curY + 4, { size: 7, font: FONT_BOLD, width: sigColW - PAD * 2, align: 'center' })
      drawText('Head of Division', tableX + sigColW + PAD, curY + 4, { size: 7, font: FONT_BOLD, width: sigColW - PAD * 2, align: 'center' })
      drawText('Human Capital Division', tableX + sigColW * 2 + PAD, curY + 4, { size: 7, font: FONT_BOLD, width: sigColW - PAD * 2, align: 'center' })
      drawText('President Director', tableX + sigColW * 3 + PAD, curY + 4, { size: 7, font: FONT_BOLD, width: sigColW - PAD * 2, align: 'center' })

      // Finalize
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
