# Employee Request PDF Template Cleanup

**Date:** 2026-04-10
**File:** `src/services/employeeRequestPdfService.ts`
**Scope:** Backend (recruitment-hris-api)
**Library:** PDFKit v0.18.0

## Problem

The current Employee Request PDF output has several rendering issues:

1. **Values rendered in bold** — All data values use `Helvetica-Bold` instead of regular weight
2. **Text collides with dotted lines** — Values positioned too close to decorative dotted underlines
3. **Lexical JSON extraction broken** — `extractTextFromLexical()` only handles basic `text` nodes, producing garbled characters for complex Lexical structures (lists, formatted text)
4. **HTML tags visible in PDF** — Fallback path splits raw HTML without stripping tags, resulting in `<ol>`, `<li>`, `</ul>` appearing in output
5. **Text overflows cell boundaries** — Values without `width` constraints extend past cell borders
6. **Fixed row heights** — Long content gets clipped because all rows use hardcoded heights

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Dotted lines | Remove all value dotted lines | Cleaner layout; keep only signature underlines |
| Value font | `Helvetica` (regular) | Distinguish values from labels/headers visually |
| Long text handling | Auto-wrap + expand row height | All content visible; PDF can grow vertically |
| Content numbering | Plain text numbered (1. xxx) | Job descriptions and requirements get manual numbering |
| PDF size | A4 (unchanged) | Already set in current code |

## Changes

### 1. Rewrite `extractTextFromLexical()`

Current implementation only handles `node.type === 'text'`. Rewrite to:

- Recursively traverse Lexical node tree
- Handle node types: `root`, `paragraph`, `list`, `listitem`, `text`, `linebreak`
- For `list` nodes: collect each `listitem` as a separate entry
- For `paragraph` nodes: concatenate all child text nodes into one string
- For `linebreak` nodes: insert newline
- HTML fallback: strip all HTML tags via regex `/<[^>]+>/g` before splitting by newline
- Return `string[]` where each entry = one content item

### 2. Font Changes

Replace `font: FONT_BOLD` with `font: FONT_REGULAR` for ALL value fields:

- Position, Division, Number of Required (line 261, 265, 268)
- Requested Date, Date Required, Position Level (line 279, 283, 286)
- Placement (line 360)
- Minimum Age, Maximum Age (line 417, 421)
- Educational, Majors (line 435, 438)
- Experience (line 451)
- Job description content rows
- Competency content rows

Keep `FONT_BOLD` only for:
- Section headers: "Kompetensi Khusus", "Kompetensi Penunjang"
- Signature labels: "Dibuat Oleh", "Diketahui Oleh", etc.
- Role labels: "Department", "Head of Division", etc.
- PDF main title: "PERMINTAAN KARYAWAN BARU"

### 3. Remove Dotted Lines

Remove all `drawDottedLine()` calls for value separators (~15 occurrences).

Keep dotted lines ONLY in:
- Signature section (underlines for signer names)

The `drawDottedLine` helper function can be kept for the signature usage.

### 4. Fix Cell Layout — Label + Value Positioning

New vertical positioning within cells:

```
Cell with bilingual label + value (minHeight: 30px):
┌─────────────────────────────┐
│ Label ID               y+3  │  FONT_REGULAR 6.5pt
│ Label EN              y+11  │  FONT_ITALIC 6.5pt
│ Value text            y+19  │  FONT_REGULAR 7pt
└─────────────────────────────┘

Cell with value only (minHeight: 18px):
┌─────────────────────────────┐
│ Value text             y+4  │  FONT_REGULAR 7pt
└─────────────────────────────┘
```

All values must have `width` constraint = `cellWidth - 8` (4px padding each side).

### 5. Dynamic Row Heights

Add helper:

```typescript
function measureTextHeight(
  doc: PDFKit.PDFDocument,
  text: string,
  width: number,
  fontSize: number,
  font: string
): number
```

Uses PDFKit's `doc.heightOfString(text, { width })` after setting font/size.

Row height calculation:
- `rowH = Math.max(minHeight, labelHeight + valueTextHeight + padding)`
- Basic info rows: minHeight = 30
- Content-only rows (job desc, competencies): minHeight = 18
- Type of Request row: minHeight = 42 (unchanged, complex layout)
- Reason row: dynamic based on content

Apply to all rows that display data values.

### 6. Signature Section

- Signer names: `FONT_REGULAR` (not bold) for consistency
- Dotted underlines below names: kept
- Role labels: `FONT_BOLD` (kept)
- Consistent 4px padding in all cells

## Files Changed

| File | Change |
|------|--------|
| `src/services/employeeRequestPdfService.ts` | All changes (single file) |

## Out of Scope

- No dependency changes (stay on PDFKit)
- No changes to `buildPdfData()` in controller
- No changes to API endpoint/route
- No changes to frontend
