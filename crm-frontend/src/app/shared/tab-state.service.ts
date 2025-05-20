import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

interface DateRangePayload {
  start: Date;
  end: Date;
  section: string;
}

@Injectable({ providedIn: 'root' })
export class TabStateService {
  // Tab selection state
  private tabSubject = new BehaviorSubject<string>('');
  currentTab$ = this.tabSubject.asObservable();
  private brdCache: { data: any[], filters: any } | null = null;
  private invoiceCache: { data: any[], filters: any } | null = null;
  private paymentCache: { data: any[], filters: any } | null = null;
  private ticketListCache: any[] = [];
  private ticketFilters: any = {
    currentTab: 'All Tickets',
    searchText: '',
    dateRange: null
  };
  
  

  // ✅ Set and get ticket list
  setTickets(data: any[]) {
    this.ticketListCache = data;
  }

  getTickets(): any[] {
    return this.ticketListCache;
  }

  // ✅ Set and get filters
  setTicketFilters(filters: { currentTab: string; searchText: string; dateRange: any }) {
    this.ticketFilters = filters;
  }

  getTicketFilters() {
    return this.ticketFilters;
  }

  // ✅ Clear cache if needed
  clearTicketCache() {
    this.ticketListCache = [];
    this.ticketFilters = {
      currentTab: 'All Tickets',
      searchText: '',
      dateRange: null
    };
  }

  setBrdCache(payload: { data: any[], filters: any }) {
  this.brdCache = payload;
}

getBrdCache() {
  return this.brdCache;
}

clearBrdCache() {
  this.brdCache = null;
}

setInvoiceCache(payload: { data: any[], filters: any }) {
  this.invoiceCache = payload;
}

getInvoiceCache() {
  return this.invoiceCache;
}

clearInvoiceCache() {
  this.invoiceCache = null;
}

setPaymentCache(payload: { data: any[]; filters: any }) {
  this.paymentCache = payload;
}
getPaymentCache() {
  return this.paymentCache;
}

  // Global search state
  private searchSubject = new BehaviorSubject<string>('');
  searchText$ = this.searchSubject.asObservable();

  // Section-wise date range state
  private dateRangeSubject = new BehaviorSubject<Record<string, { start: Date; end: Date }>>({});
  dateRange$ = this.dateRangeSubject.asObservable();

  // Manual refresh trigger
  private refreshSubject = new BehaviorSubject<void>(undefined);
  refresh$ = this.refreshSubject.asObservable();

  // Modal triggers
  openAddTicket$ = new Subject<void>();
  openAddInvoice$ = new Subject<void>();
  openAddBrd$ = new Subject<void>(); // Optional: if you want modal-based BRD creation

  /** ✅ Set the active tab (used in Tickets, BRDs, Reports, etc.) */
  setTab(tab: string): void {
    this.tabSubject.next(tab);
  }

  /** ✅ Set search string used globally or per module */
  setSearchText(text: string): void {
    this.searchSubject.next(text);
  }

  /** ✅ Set section-specific date range (e.g., 'payment-due', 'new-business') */
  setDateRange(payload: DateRangePayload): void {
    const updated = {
      ...this.dateRangeSubject.value,
      [payload.section]: {
        start: payload.start,
        end: payload.end
      }
    };
    this.dateRangeSubject.next(updated);
  }

  /** ✅ Get current date range for a specific section */
  getDateRange(section: string): { start: Date; end: Date } | undefined {
    return this.dateRangeSubject.value[section];
  }

  /** ✅ Trigger refresh event across subscribed components */
  triggerRefresh(): void {
    this.refreshSubject.next();
  }

  /** ✅ Reset all search and date filters */
  resetAllFilters(): void {
    this.dateRangeSubject.next({});
    this.searchSubject.next('');
    this.refreshSubject.next();
  }

  /** ✅ Modal popups for different modules */
  triggerAddTicket(): void {
    this.openAddTicket$.next();
  }

  triggerAddInvoice(): void {
    this.openAddInvoice$.next();
  }

  triggerAddBrd(): void {
    this.openAddBrd$.next();
  }

  /** ✅ Utility to return all filters (expandable if needed) */
  getCurrentFilters(): {
    dateRange: Record<string, { start: Date; end: Date }>
  } {
    return {
      dateRange: this.dateRangeSubject.value
    };
  }
}
