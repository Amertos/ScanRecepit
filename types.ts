export interface LineItem {
  description: string;
  price: number;
}

export const SPENDING_CATEGORIES = [
    'food_dining', 
    'groceries', 
    'shopping', 
    'transportation', 
    'health', 
    'entertainment', 
    'utilities', 
    'home', 
    'other'
] as const;

export type SpendingCategory = typeof SPENDING_CATEGORIES[number];


export interface ReceiptData {
  id: string;
  storeName: string;
  date: string;
  items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  category: SpendingCategory;
  currency: string;
  insight?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ChatSession {
  id: string;
  title: string;
  startTime: number;
  messages: ChatMessage[];
}

export type Theme = 'light' | 'dark' | 'nebula';
export type Language = 'en' | 'sr' | 'de' | 'es';