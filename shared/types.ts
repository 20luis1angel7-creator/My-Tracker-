export interface Entry {
  id?: string;
  type?: "habit" | "class" | "app";
  habit: string;
  category?: string;
  subcategory?: string;
  occurredAt: string;
  endedAt?: string;
  durationMinutes?: number;
  count: number;
  description?: string;
  comment?: string;
}
export interface HabitGroup {
  category: string;
  subcategory: string;
  purpose?: string;
}
export interface ClassDefinition {
  name: string;
  subclasses: string[];
}
export interface CalendarEvent {
  type?: Entry["type"];
  durationMinutes?: number;
  id?: string;
  name: string;
  category?: string;
  subcategory?: string;
  occurredAt: string;
  endedAt: string;
  count: number;
  description?: string;
  comment?: string;
  kind: string;
}
export interface BreakdownRow {
  category: string;
  name: string;
  value: number;
  count: number;
}
export type StorageWrite = [string, unknown];
