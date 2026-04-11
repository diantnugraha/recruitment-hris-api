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

      // Shared column widths — all rows align to these borders
      const basicCol1 = 140
      const basicCol2 = 255
      const basicCol3 = fullW - basicCol1 - basicCol2

      // Total available height on page
      const pageAvailableH = doc.page.height - 30 - 30 // top + bottom margins

      // ── Pre-calculate all fixed section heights ──
      const headerH = 40

      // ── Pre-calc row heights for basic info ──
      const preRow1H = Math.max(26, Math.max(LABEL_H,
        getTextHeight(data.position || ' ', basicCol1 - 55 - PAD, 7),
        getTextHeight(data.division || ' ', basicCol2 - 55 - PAD, 7)) + 3 + PAD)
      const preRow2H = 26
      const preTypeRowH = 62
      const preReasonValH = getTextHeight(data.reason || ' ', (basicCol1 + basicCol2) - PAD * 2, 7)
      const preReasonRowH = Math.max(36, LABEL_H + 4 + preReasonValH + PAD)

      // ── Pre-calc qualification section height ──
      const preQualMinH = 20
      const preFullQualContentW = fullW - col1W - col2W
      const preRow3ValueW = preFullQualContentW - 110
      const preExpH = getTextHeight(data.experience || ' ', preRow3ValueW - PAD * 2, 7)
      const preQRow1H = preQualMinH
      const preQRow2H = preQualMinH
      const preQRow3H = Math.max(preQualMinH, Math.max(preExpH, LABEL_H) + PAD * 2)

      const preCompMidW = 165
      const preCompRightW = preFullQualContentW - preCompMidW
      const preAllCompItems = [
        ...data.mandatoryCompetencies,
        ...data.specialistCompetencies,
        ...data.optionalCompetencies
      ]
      const preAllCompText = preAllCompItems.filter(c => c).map((c, idx) => `${idx + 1}. ${c}`).join('\n')
      const preAllCompContentH = preAllCompText ? getTextHeight(preAllCompText, preCompRightW - PAD * 2, 7) : 0
      const preCompTotalRows = 13
      const preCompMinTotalH = preCompTotalRows * preQualMinH
      const preCompTotalH = Math.max(preCompMinTotalH, preAllCompContentH + PAD * 2)
      const preQualTotalH = preQRow1H + preQRow2H + preQRow3H + preCompTotalH

      // ── Signature section heights ──
      const preSigRowH = 22
      const preSigBoxH = 80
      const preRoleH = 16

      // ── Total fixed height (everything except JD) ──
      const fixedH = headerH + preRow1H + preRow2H + preTypeRowH + preReasonRowH
        + preQualTotalH + preSigRowH + preSigBoxH + preRoleH

      // ── JD natural min heights ──
      const jdCount = 7
      const preJdContentW = fullW - col1W - col2W
      const preJdNaturalMinH = 18
      const preJdNaturalTotal = Array.from({ length: jdCount }, (_, i) => {
        const content = data.jobDescriptions[i] || ''
        const contentH = content ? getTextHeight(content, preJdContentW - PAD * 2, 7) : 0
        return Math.max(preJdNaturalMinH, contentH + PAD * 2)
      }).reduce((a, b) => a + b, 0)

      // ── Distribute remaining space to JD rows ──
      const totalUsed = fixedH + preJdNaturalTotal
      const remaining = pageAvailableH - totalUsed
      const jdExtraPerRow = remaining > 0 ? Math.floor(remaining / jdCount) : 0
      const jdAdjustedMinH = preJdNaturalMinH + jdExtraPerRow

      // ============================================
      // 1. HEADER ROW — Logo + Title + Form Info
      // ============================================
      const logoColW = basicCol1
      const titleColW = basicCol2
      const formInfoColW = basicCol3

      drawCell(tableX, curY, logoColW, headerH)
      drawCell(tableX + logoColW, curY, titleColW, headerH)
      drawCell(tableX + logoColW + titleColW, curY, formInfoColW, headerH)

      // Logo
      try {
        const logoPath = getLogoPath()
        const logoW = 90, logoH = 24
        doc.image(logoPath, tableX + (logoColW - logoW) / 2, curY + (headerH - logoH) / 2, { width: logoW, height: logoH })
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

      // Row 1: Jabatan | Divisi | Jumlah Kebutuhan
      const posValH = getTextHeight(data.position || ' ', basicCol1 - 55 - PAD, 7)
      const divValH = getTextHeight(data.division || ' ', basicCol2 - 55 - PAD, 7)
      const row1H = Math.max(26, Math.max(LABEL_H, posValH, divValH) + 3 + PAD)

      drawCell(tableX, curY, basicCol1, row1H)
      drawCell(tableX + basicCol1, curY, basicCol2, row1H)
      drawCell(tableX + basicCol1 + basicCol2, curY, basicCol3, row1H)

      const row1Mid = (row1H - LABEL_H) / 2
      drawBilingual('Jabatan', 'Position', tableX + PAD, curY + row1Mid, { size: 6.5 })
      drawText(data.position, tableX + 55, curY + row1Mid + 1, { size: 7, width: basicCol1 - 55 - PAD })

      drawBilingual('Divisi', 'Division', tableX + basicCol1 + PAD, curY + row1Mid, { size: 6.5 })
      drawText(data.division, tableX + basicCol1 + 55, curY + row1Mid + 1, { size: 7, width: basicCol2 - 55 - PAD })

      drawBilingual('Jumlah Kebutuhan', 'Number of Required', tableX + basicCol1 + basicCol2 + PAD, curY + row1Mid, { size: 6.5 })
      drawText(String(data.numberOfRequired), tableX + basicCol1 + basicCol2 + basicCol3 - 25, curY + row1Mid + 2, { size: 8, width: 20 })

      curY += row1H

      // Row 2: Tanggal Pengajuan | Tanggal Dibutuhkan | Level Posisi
      const row2H = 26

      drawCell(tableX, curY, basicCol1, row2H)
      drawCell(tableX + basicCol1, curY, basicCol2, row2H)
      drawCell(tableX + basicCol1 + basicCol2, curY, basicCol3, row2H)

      const row2Mid = (row2H - LABEL_H) / 2
      drawBilingual('Tanggal Pengajuan', 'Requested Date', tableX + PAD, curY + row2Mid, { size: 6.5 })
      drawText(data.requestedDate, tableX + 80, curY + row2Mid + 1, { size: 7, width: basicCol1 - 80 - PAD })

      drawBilingual('Tanggal Dibutuhkan', 'Date Required', tableX + basicCol1 + PAD, curY + row2Mid, { size: 6.5 })
      drawText(data.dateRequired, tableX + basicCol1 + 80, curY + row2Mid + 1, { size: 7, width: basicCol2 - 80 - PAD })

      drawBilingual('Level Posisi', 'Position Level', tableX + basicCol1 + basicCol2 + PAD, curY + row2Mid, { size: 6.5 })
      drawText(data.positionLevel, tableX + basicCol1 + basicCol2 + 75, curY + row2Mid + 1, { size: 7, width: basicCol3 - 75 - PAD })

      curY += row2H

      // ============================================
      // 3. TYPE OF REQUEST ROW
      // ============================================
      const typeRowH = 62
      // Align borders with basic info rows: borders at basicCol1 and basicCol1+basicCol2
      const typeA = basicCol1                              // "Tipe Permohonan" label
      const typeB = basicCol2                              // Checkboxes + Budget + Gender
      const typeC = basicCol3                              // Centang helper

      // Sub-divisions within typeB
      const typeBsub1 = 95                                  // Checkboxes (Penambahan/Penggantian)
      const typeBsub2 = 80                                  // Budget / Sisa Budget
      const typeBsub3 = typeB - typeBsub1 - typeBsub2      // Gender (Pria/Wanita)

      // 5 cells — borders at basicCol1 and basicCol1+basicCol2 align with rows above
      drawCell(tableX, curY, typeA, typeRowH)
      drawCell(tableX + typeA, curY, typeBsub1, typeRowH)
      drawCell(tableX + typeA + typeBsub1, curY, typeBsub2, typeRowH)
      drawCell(tableX + typeA + typeBsub1 + typeBsub2, curY, typeBsub3, typeRowH)
      drawCell(tableX + typeA + typeB, curY, typeC, typeRowH)

      // Col 1: Tipe Permohonan (centered vertically)
      const typeMid = (typeRowH - LABEL_H) / 2
      drawBilingual('Tipe Permohonan', 'Type of Request', tableX + 8, curY + typeMid, { size: 6.5 })

      // Col 2: Checkboxes (two items, each ~14px bilingual + 6px gap = 34px total)
      const cbBlockH = LABEL_H * 2 + 6
      const cbTopY = curY + (typeRowH - cbBlockH) / 2
      const cbX = tableX + typeA + 5
      drawCheckbox(cbX, cbTopY + 3, data.typeOfRequest === 'new')
      drawBilingual('Penambahan', 'Additional', cbX + 14, cbTopY, { size: 6.5 })

      drawCheckbox(cbX, cbTopY + LABEL_H + 6 + 3, data.typeOfRequest === 'replacement')
      drawBilingual('Penggantian', 'Replacement', cbX + 14, cbTopY + LABEL_H + 6, { size: 6.5 })

      // Col 3: Budget (two lines, each ~8px, total ~22px)
      const budgetBlockH = 22
      const budgetTopY = curY + (typeRowH - budgetBlockH) / 2
      const budgetX = tableX + typeA + typeBsub1 + 5
      drawText('Budget : ' + data.budget, budgetX, budgetTopY, { size: 6.5, width: typeBsub2 - 10 })
      drawText('Sisa Budget : ' + data.remainingBudget, budgetX, budgetTopY + budgetBlockH / 2 + 2, { size: 6.5, width: typeBsub2 - 10 })

      // Col 4: Gender (title 14px + 2 items each 14px + gaps = ~46px)
      const genderBlockH = LABEL_H * 3 + 4
      const genderTopY = curY + (typeRowH - genderBlockH) / 2
      const genderX = tableX + typeA + typeBsub1 + typeBsub2 + 5
      drawBilingual('Jenis Kelamin', 'Gender', genderX, genderTopY, { size: 6.5 })

      // Col 5: Centang helper (centered in cell)
      const centangCellX = tableX + typeA + typeB
      const centangLineH = 7
      const centangBlockH = centangLineH * 2 + 2
      const centangTopY = curY + (typeRowH - centangBlockH) / 2
      drawText('<= Centang |', centangCellX, centangTopY, { size: 5.5, width: typeC, align: 'center' })
      drawText('Checklist (v)', centangCellX, centangTopY + centangLineH + 2, { size: 5.5, width: typeC, align: 'center', font: FONT_ITALIC })

      const genderItem1Y = genderTopY + LABEL_H + 2
      drawBilingual('Pria', 'Male', genderX, genderItem1Y, { size: 6.5 })
      drawCheckbox(genderX + 40, genderItem1Y + 3, data.genderMale)

      const genderItem2Y = genderItem1Y + LABEL_H + 2
      drawBilingual('Wanita', 'Female', genderX, genderItem2Y, { size: 6.5 })
      drawCheckbox(genderX + 40, genderItem2Y + 3, data.genderFemale)

      curY += typeRowH

      // ============================================
      // 4. REASON + PLACEMENT ROW
      // ============================================
      const reasonColW = basicCol1 + basicCol2
      const placementColW = basicCol3

      // Reason value goes below label (label is 2 lines long), placement value inline
      const reasonValH = getTextHeight(data.reason || ' ', reasonColW - PAD * 2, 7)
      const reasonRowH = Math.max(36, LABEL_H + 4 + reasonValH + PAD)

      drawCell(tableX, curY, reasonColW, reasonRowH)
      drawCell(tableX + reasonColW, curY, placementColW, reasonRowH)

      // Reason: label + value stacked, center block vertically
      const reasonContentH = LABEL_H + 2 + reasonValH
      const reasonMid = (reasonRowH - reasonContentH) / 2
      drawBilingual('Alasan Permohonan untuk Penambahan atau Penggantian', 'Reason for this additional or substitution',
        tableX + PAD, curY + reasonMid, { size: 6.5 })
      drawText(data.reason, tableX + PAD, curY + reasonMid + LABEL_H + 2, { size: 7, width: reasonColW - PAD * 2 })

      // Placement: label + value stacked, center block vertically
      const placeValH = getTextHeight(data.placement || ' ', placementColW - PAD * 2, 7)
      const placeContentH = LABEL_H + 2 + placeValH
      const placeMid = (reasonRowH - placeContentH) / 2
      drawBilingual('Penempatan', 'Placement', tableX + reasonColW + PAD, curY + placeMid, { size: 6.5 })
      drawText(data.placement, tableX + reasonColW + PAD, curY + placeMid + LABEL_H + 2, { size: 7, width: placementColW - PAD * 2 })

      curY += reasonRowH

      // ============================================
      // 5. JOB DESCRIPTIONS (6 rows)
      // ============================================
      const jdLabelW = col1W
      const jdNumW = col2W
      const jdContentW = fullW - jdLabelW - jdNumW
      const jdMinH = jdAdjustedMinH

      // Pre-calculate all row heights using adjusted min height
      const jdRowHeights = Array.from({ length: jdCount }, (_, i) => {
        const content = data.jobDescriptions[i] || ''
        const contentH = content ? getTextHeight(content, jdContentW - PAD * 2, 7) : 0
        return Math.max(jdMinH, contentH + PAD * 2)
      })
      const jdTotalH = jdRowHeights.reduce((a, b) => a + b, 0)

      // Draw merged label cell spanning all 6 rows
      drawCell(tableX, curY, jdLabelW, jdTotalH)

      // Center "Uraian Jabatan | Job Descriptions" in merged cell
      const jdLabelBlockH = 14 // bilingual text height
      drawBilingual('Uraian Jabatan', 'Job Descriptions',
        tableX + PAD, curY + (jdTotalH - jdLabelBlockH) / 2, { size: 6.5 })

      // Draw number + content cells per row
      Array.from({ length: jdCount }, (_, i) => i).forEach((i) => {
        const content = data.jobDescriptions[i] || ''
        const jdRowH = jdRowHeights[i] ?? jdMinH

        drawCell(tableX + jdLabelW, curY, jdNumW, jdRowH)
        drawCell(tableX + jdLabelW + jdNumW, curY, jdContentW, jdRowH)

        drawText(String(i + 1), tableX + jdLabelW + 6, curY + (jdRowH - 7) / 2, {
          size: 7, align: 'center', width: jdNumW - 12
        })

        if (content) {
          const contentTextH = getTextHeight(content, jdContentW - PAD * 2, 7)
          const contentMidY = curY + (jdRowH - contentTextH) / 2
          doc.save()
          doc.rect(tableX + jdLabelW + jdNumW + 1, curY + 1, jdContentW - 2, jdRowH - 2).clip()
          drawText(content, tableX + jdLabelW + jdNumW + PAD, contentMidY, {
            size: 7, width: jdContentW - PAD * 2
          })
          doc.restore()
        }

        curY += jdRowH
      })

      // ============================================
      // 6. JOB QUALIFICATION SECTION
      // ============================================
      const qualLabelW = col1W
      const qualNumW = col2W
      const qualMinH = 20
      const fullQualContentW = fullW - qualLabelW - qualNumW

      // Sub-columns for rows 1-2: [numW] | [subLabelW | subValueW] | [subLabelW | subValueW]
      const halfContentW = fullQualContentW / 2
      const subLabelW = 110
      const subValueW = halfContentW - subLabelW

      // Column X positions
      const subLabel1X = tableX + qualLabelW + qualNumW
      const subValue1X = subLabel1X + subLabelW
      const subLabel2X = subValue1X + subValueW
      const subValue2X = subLabel2X + subLabelW

      // Row 3: [numW] | [labelW | valueW] spanning full content
      const row3LabelW = subLabelW
      const row3ValueW = fullQualContentW - row3LabelW

      // Sub-columns for competency rows (4-13): merged label (per group) | merged content (all rows)
      const compMidW = 165
      const compRightW = fullQualContentW - compMidW
      const compMidX = tableX + qualLabelW + qualNumW
      const compRightX = compMidX + compMidW

      // Build combined content for the single merged right cell (rows 4-13)
      const allCompItems = [
        ...data.mandatoryCompetencies,
        ...data.specialistCompetencies,
        ...data.optionalCompetencies
      ]
      const allCompText = allCompItems.filter(c => c).map((c, idx) => `${idx + 1}. ${c}`).join('\n')
      const allCompContentH = allCompText ? getTextHeight(allCompText, compRightW - PAD * 2, 7) : 0

      // 10 competency rows total (5 mandatory + 3 specialist + 2 optional)
      const compTotalRows = 13
      const compMinTotalH = compTotalRows * qualMinH
      const compTotalH = Math.max(compMinTotalH, allCompContentH + PAD * 2)
      // Distribute: first 9 rows get qualMinH, last row gets remainder
      const compRowHeights = [
        ...Array.from({ length: compTotalRows - 1 }, () => qualMinH),
        compTotalH - (compTotalRows - 1) * qualMinH
      ]

      // Pre-calculate all qualification row heights (rows 1-13)
      const expH = getTextHeight(data.experience || ' ', row3ValueW - PAD * 2, 7)
      const qualRowHeights: number[] = []

      // Row 1: Usia Minimal / Maksimal
      qualRowHeights.push(qualMinH)
      // Row 2: Pendidikan / Jurusan
      qualRowHeights.push(qualMinH)
      // Row 3: Pengalaman
      qualRowHeights.push(Math.max(qualMinH, Math.max(expH, LABEL_H) + PAD * 2))
      // Rows 4-13: Competency rows
      qualRowHeights.push(...compRowHeights)

      const qualTotalH = qualRowHeights.reduce((a, b) => a + b, 0)

      // Draw merged label cell spanning all qualification rows
      drawCell(tableX, curY, qualLabelW, qualTotalH)
      const qualLabelBlockH = 14
      drawBilingual('Kualifikasi Jabatan', 'Job Qualification',
        tableX + PAD, curY + (qualTotalH - qualLabelBlockH) / 2, { size: 6.5 })

      // Row 1: Usia Minimal | value | Usia Maksimal | value
      const qRow1H = qualRowHeights[0] ?? qualMinH
      drawCell(tableX + qualLabelW, curY, qualNumW, qRow1H)
      drawCell(subLabel1X, curY, subLabelW, qRow1H)
      drawCell(subValue1X, curY, subValueW, qRow1H)
      drawCell(subLabel2X, curY, subLabelW, qRow1H)
      drawCell(subValue2X, curY, subValueW, qRow1H)

      const q1Mid = (qRow1H - LABEL_H) / 2
      drawText('1', tableX + qualLabelW + 6, curY + (qRow1H - 7) / 2, { size: 7, align: 'center', width: qualNumW - 12 })
      drawBilingual('Usia Minimal', 'Minimum Age', subLabel1X + PAD, curY + q1Mid, { size: 6.5 })
      drawText(data.minimumAge, subValue1X + PAD, curY + (qRow1H - 7) / 2, { size: 7, width: subValueW - PAD * 2 })
      drawBilingual('Usia Maksimal', 'Maximum Age', subLabel2X + PAD, curY + q1Mid, { size: 6.5 })
      drawText(data.maximumAge, subValue2X + PAD, curY + (qRow1H - 7) / 2, { size: 7, width: subValueW - PAD * 2 })

      curY += qRow1H

      // Row 2: Pendidikan | value | Jurusan | value
      const qRow2H = qualRowHeights[1] ?? qualMinH
      drawCell(tableX + qualLabelW, curY, qualNumW, qRow2H)
      drawCell(subLabel1X, curY, subLabelW, qRow2H)
      drawCell(subValue1X, curY, subValueW, qRow2H)
      drawCell(subLabel2X, curY, subLabelW, qRow2H)
      drawCell(subValue2X, curY, subValueW, qRow2H)

      const q2Mid = (qRow2H - LABEL_H) / 2
      drawText('2', tableX + qualLabelW + 6, curY + (qRow2H - 7) / 2, { size: 7, align: 'center', width: qualNumW - 12 })
      drawBilingual('Pendidikan', 'Educational', subLabel1X + PAD, curY + q2Mid, { size: 6.5 })
      drawText(data.educational, subValue1X + PAD, curY + (qRow2H - 7) / 2, { size: 7, width: subValueW - PAD * 2 })
      drawBilingual('Jurusan', 'Majors', subLabel2X + PAD, curY + q2Mid, { size: 6.5 })
      drawText(data.majors, subValue2X + PAD, curY + (qRow2H - 7) / 2, { size: 7, width: subValueW - PAD * 2 })

      curY += qRow2H

      // Row 3: Pengalaman | value (full width)
      const qRow3H = qualRowHeights[2] ?? qualMinH
      drawCell(tableX + qualLabelW, curY, qualNumW, qRow3H)
      drawCell(subLabel1X, curY, row3LabelW, qRow3H)
      drawCell(subLabel1X + row3LabelW, curY, row3ValueW, qRow3H)

      const q3Mid = (qRow3H - LABEL_H) / 2
      drawText('3', tableX + qualLabelW + 6, curY + (qRow3H - 7) / 2, { size: 7, align: 'center', width: qualNumW - 12 })
      drawBilingual('Pengalaman', 'Experience', subLabel1X + PAD, curY + q3Mid, { size: 6.5 })
      drawText(data.experience, subLabel1X + row3LabelW + PAD, curY + (qRow3H - 7) / 2, { size: 7, width: row3ValueW - PAD * 2 })

      curY += qRow3H

      // Single merged right cell spanning ALL competency rows (4-13)
      drawCell(compRightX, curY, compRightW, compTotalH)
      if (allCompText) {
        doc.save()
        doc.rect(compRightX + 1, curY + 1, compRightW - 2, compTotalH - 2).clip()
        drawText(allCompText, compRightX + PAD, curY + PAD, {
          size: 7, width: compRightW - PAD * 2
        })
        doc.restore()
      }

      // Merged label cells per group (centered in middle column)
      const mandGroupH = compRowHeights.slice(0, 5).reduce((a, b) => a + b, 0)
      const specGroupH = compRowHeights.slice(5, 9).reduce((a, b) => a + b, 0)
      const optGroupH = compRowHeights.slice(9, 13).reduce((a, b) => a + b, 0)

      // Mandatory label (rows 4-8)
      let labelY = curY
      drawCell(compMidX, labelY, compMidW, mandGroupH)
      drawText('Kompetensi Khusus |', compMidX, labelY + (mandGroupH - 16) / 2, {
        size: 6.5, font: FONT_BOLD, width: compMidW, align: 'center'
      })
      drawText('Mandatory', compMidX, labelY + (mandGroupH - 16) / 2 + 8, {
        size: 6.5, font: FONT_ITALIC, width: compMidW, align: 'center'
      })
      labelY += mandGroupH

      // Specialist label (rows 9-11)
      drawCell(compMidX, labelY, compMidW, specGroupH)
      drawText('Kompetensi Khusus |', compMidX, labelY + (specGroupH - 16) / 2, {
        size: 6.5, font: FONT_BOLD, width: compMidW, align: 'center'
      })
      drawText('Specialist', compMidX, labelY + (specGroupH - 16) / 2 + 8, {
        size: 6.5, font: FONT_ITALIC, width: compMidW, align: 'center'
      })
      labelY += specGroupH

      // Optional label (rows 12-13)
      drawCell(compMidX, labelY, compMidW, optGroupH)
      drawText('Kompetensi Penunjang |', compMidX, labelY + (optGroupH - 16) / 2, {
        size: 6.5, font: FONT_BOLD, width: compMidW, align: 'center'
      })
      drawText('Optional', compMidX, labelY + (optGroupH - 16) / 2 + 8, {
        size: 6.5, font: FONT_ITALIC, width: compMidW, align: 'center'
      })

      // Individual number cells per row (rows 4-16)
      Array.from({ length: compTotalRows }, (_, i) => i).forEach((i) => {
        const rowH = compRowHeights[i] ?? qualMinH
        drawCell(tableX + qualLabelW, curY, qualNumW, rowH)
        drawText(String(i + 4), tableX + qualLabelW + 4, curY + (rowH - 7) / 2, {
          size: 7, align: 'center', width: qualNumW - 8
        })
        curY += rowH
      })

      // ============================================
      // 7. SIGNATURE SECTION
      // ============================================
      const sigRowH = 22
      const sigBoxH = 80
      const sigColW = fullW / 4

      // Signature labels row
      drawCell(tableX, curY, sigColW, sigRowH)
      drawCell(tableX + sigColW, curY, sigColW, sigRowH)
      drawCell(tableX + sigColW * 2, curY, sigColW, sigRowH)
      drawCell(tableX + sigColW * 3, curY, sigColW, sigRowH)

      // Centered bilingual labels
      const sigLabelOpts = { size: 7, font: FONT_BOLD, width: sigColW - PAD * 2, align: 'center' as const }
      const sigLabelItOpts = { size: 7, font: FONT_ITALIC, width: sigColW - PAD * 2, align: 'center' as const }

      const sigLabelBlockH = 16 // two lines of text
      const sigLabelMid = (sigRowH - sigLabelBlockH) / 2

      drawText('Dibuat Oleh', tableX + PAD, curY + sigLabelMid, sigLabelOpts)
      drawText('Created By', tableX + PAD, curY + sigLabelMid + 9, sigLabelItOpts)

      drawText('Diketahui Oleh', tableX + sigColW + PAD, curY + sigLabelMid, sigLabelOpts)
      drawText('Acknowledge By', tableX + sigColW + PAD, curY + sigLabelMid + 9, sigLabelItOpts)

      drawText('Diperiksa Oleh', tableX + sigColW * 2 + PAD, curY + sigLabelMid, sigLabelOpts)
      drawText('Checked By', tableX + sigColW * 2 + PAD, curY + sigLabelMid + 9, sigLabelItOpts)

      drawText('Disetujui Oleh', tableX + sigColW * 3 + PAD, curY + sigLabelMid, sigLabelOpts)
      drawText('Approved By', tableX + sigColW * 3 + PAD, curY + sigLabelMid + 9, sigLabelItOpts)

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

      const roleMid = (roleH - 7) / 2
      drawText('Department', tableX + PAD, curY + roleMid, { size: 7, font: FONT_BOLD, width: sigColW - PAD * 2, align: 'center' })
      drawText('Head of Division', tableX + sigColW + PAD, curY + roleMid, { size: 7, font: FONT_BOLD, width: sigColW - PAD * 2, align: 'center' })
      drawText('Human Capital Division', tableX + sigColW * 2 + PAD, curY + roleMid, { size: 7, font: FONT_BOLD, width: sigColW - PAD * 2, align: 'center' })
      drawText('President Director', tableX + sigColW * 3 + PAD, curY + roleMid, { size: 7, font: FONT_BOLD, width: sigColW - PAD * 2, align: 'center' })

      // Finalize
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
