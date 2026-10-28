import { Player, PlayerRole, PlayerStatus } from '../types';
import { parsePriceToLakhs } from './currency';

/**
 * Formats 3-digit code cleanly
 */
export function normalizeCode(raw: string | number): string {
  const str = String(raw).trim();
  if (/^\d{1,3}$/.test(str)) {
    return str.padStart(3, '0');
  }
  return str.slice(0, 3).toUpperCase();
}

/**
 * Generate CSV text and trigger client-side download
 */
/**
 * Generate CSV text and trigger client-side download
 */
export function exportPlayersToCSV(players: Player[], filename = 'somun_international_auction_data.csv') {
  const headers = [
    'Code',
    'Name',
    'Nation',
    'Role',
    'Style',
    'BasePriceLakhs',
    'Status',
    'SoldTo',
    'SoldPriceLakhs',
  ];

  const escapeCSV = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = players.map((p) => [
    escapeCSV(p.code),
    escapeCSV(p.name),
    escapeCSV(p.nation),
    escapeCSV(p.role),
    escapeCSV(p.style),
    escapeCSV(p.basePrice),
    escapeCSV(p.status),
    escapeCSV(p.soldTo || ''),
    escapeCSV(p.soldPrice || ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate sample CSV template for users to fill
 */
export function downloadSampleCSVTemplate() {
  const sampleData: Player[] = [
    {
      id: 'sample-1',
      code: '201',
      name: 'Sam Curran',
      nation: 'England',
      role: 'All-Rounder',
      style: 'Left-hand bat / Left-arm medium',
      basePrice: 200,
      status: 'draft',
    },
    {
      id: 'sample-2',
      code: '202',
      name: 'Tilak Varma',
      nation: 'India',
      role: 'Batsman',
      style: 'Left-hand bat / Right-arm offbreak',
      basePrice: 100,
      status: 'draft',
    },
    {
      id: 'sample-3',
      code: '203',
      name: 'Kagiso Rabada',
      nation: 'South Africa',
      role: 'Bowler',
      style: 'Right-arm fast',
      basePrice: 200,
      status: 'draft',
    },
  ];

  exportPlayersToCSV(sampleData, 'somun_players_template.csv');
}

/**
 * Parse CSV text into Player objects
 */
export function parseCSVToPlayers(csvText: string): { players: Player[]; errors: string[] } {
  const errors: string[] = [];
  const lines = csvText.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { players: [], errors: ['CSV file is empty or does not have data rows.'] };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = splitCSVLine(headerLine).map((h) => h.trim().toLowerCase());

  const colIdx = {
    code: headers.findIndex((h) => h.includes('code')),
    name: headers.findIndex((h) => h.includes('name')),
    nation: headers.findIndex((h) => h.includes('nation') || h.includes('country')),
    role: headers.findIndex((h) => h.includes('role') || h.includes('speciality') || h.includes('specialty')),
    style: headers.findIndex((h) => h.includes('style')),
    basePrice: headers.findIndex((h) => h.includes('base') || h.includes('price')),
    status: headers.findIndex((h) => h.includes('status')),
    soldTo: headers.findIndex((h) => h.includes('soldto') || h.includes('team')),
    soldPrice: headers.findIndex((h) => h.includes('soldprice')),
  };

  if (colIdx.name === -1) {
    return { players: [], errors: ['Header missing "Name" column. Please check format.'] };
  }

  const parsedPlayers: Player[] = [];
  const existingCodes = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const rawCols = splitCSVLine(lines[i]);
    if (rawCols.length === 0 || rawCols.every((c) => !c.trim())) continue;

    const name = colIdx.name !== -1 && rawCols[colIdx.name] ? rawCols[colIdx.name].trim() : '';
    if (!name) continue;

    let rawCode = colIdx.code !== -1 && rawCols[colIdx.code] ? rawCols[colIdx.code].trim() : '';
    if (!rawCode) {
      rawCode = String(300 + i);
    }
    const code = normalizeCode(rawCode);

    const nation = colIdx.nation !== -1 && rawCols[colIdx.nation] ? rawCols[colIdx.nation].trim() : 'India';

    // Role / Speciality (preserves exact custom text)
    const role: PlayerRole =
      colIdx.role !== -1 && rawCols[colIdx.role]?.trim()
        ? rawCols[colIdx.role].trim()
        : 'All-Rounder';

    const style = colIdx.style !== -1 && rawCols[colIdx.style] ? rawCols[colIdx.style].trim() : 'Right-hand bat';

    let basePrice = 20;
    if (colIdx.basePrice !== -1 && rawCols[colIdx.basePrice]) {
      basePrice = parsePriceToLakhs(rawCols[colIdx.basePrice]);
      if (basePrice <= 0) basePrice = 20;
    }

    let status: PlayerStatus = 'draft';
    if (colIdx.status !== -1 && rawCols[colIdx.status]) {
      const st = rawCols[colIdx.status].trim().toLowerCase();
      if (st === 'sold') status = 'sold';
      else if (st === 'unsold') status = 'unsold';
      else if (st === 'in_auction') status = 'in_auction';
      else status = 'draft';
    }

    const soldTo = colIdx.soldTo !== -1 && rawCols[colIdx.soldTo] ? rawCols[colIdx.soldTo].trim().toUpperCase() : null;
    let soldPrice: number | null = null;
    if (colIdx.soldPrice !== -1 && rawCols[colIdx.soldPrice]) {
      soldPrice = parsePriceToLakhs(rawCols[colIdx.soldPrice]);
    }

    // Auto-detect sold if soldTo is provided
    if (soldTo && status !== 'unsold') {
      status = 'sold';
      if (!soldPrice || soldPrice <= 0) {
        soldPrice = basePrice;
      }
    }

    if (existingCodes.has(code)) {
      errors.push(`Row ${i + 1}: Duplicate code "${code}" for ${name}. Code was adjusted.`);
    }
    existingCodes.add(code);

    parsedPlayers.push({
      id: `csv-p-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      code,
      name,
      nation,
      role,
      style,
      basePrice,
      status,
      soldTo: status === 'sold' ? soldTo : null,
      soldPrice: status === 'sold' ? (soldPrice || basePrice) : null,
    });
  }

  return { players: parsedPlayers, errors };
}

/**
 * Proper CSV line splitter handling quoted commas
 */
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
