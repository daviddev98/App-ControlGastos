import { MovementItem } from '../constants/sampleData';

export function mapMovementFromDb(row: Record<string, unknown>): MovementItem {
  return {
    id: String(row.id),
    merchant: String(row.merchant),
    category: String(row.category),
    bankAccount: String(row.bank_account),
    amount: Number(row.amount),
    dueDate: Number(row.due_date),
    date: row.date ? String(row.date).slice(0, 10) : undefined,
  };
}

export function splitCategoryAndNotes(categoryValue: string): {
  category: string;
  notes: string;
} {
  const [category, ...notesParts] = categoryValue.split(' · ');
  return {
    category: category.trim(),
    notes: notesParts.join(' · ').trim(),
  };
}

export function buildCategoryWithNotes(category: string, notes: string): string {
  return notes.trim() ? `${category} · ${notes.trim()}` : category;
}
