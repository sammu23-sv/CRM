import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { ColDef, Module, ICellRendererParams } from 'ag-grid-community';
import { environment } from '../../../../environments/environment';
import { TabStateService } from '../../../shared/tab-state.service';

@Component({
  selector: 'app-brds',
  standalone: true,
  templateUrl: './brds.component.html',
  styleUrls: ['./brds.component.css'],
  imports: [CommonModule, AgGridAngular]
})
export class BrdsComponent implements OnInit {
  brds: any[] = [];
  allBrds: any[] = [];
  loading = true;
  userRole = '';

  currentTab: string = 'All BRDs';
  latestSearchText: string = '';
  dateRange: { start: Date | null; end: Date | null } = { start: null, end: null };

  columnDefs: ColDef[] = [];
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  modules: Module[] = [ClientSideRowModelModule];

  constructor(
    private http: HttpClient,
    private router: Router,
    private tabService: TabStateService
  ) {}

  ngOnInit(): void {
    this.userRole = JSON.parse(localStorage.getItem('user') || '{}')?.role || '';
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    // ✅ Step 1: Setup column definitions
    this.columnDefs = [
      { field: 'id', headerName: 'BRD ID', flex: 1 },
      { field: 'title', headerName: 'Title', flex: 1 },
      { field: 'company_name', headerName: 'Company', flex: 1 },
      { field: 'product_name', headerName: 'Product', flex: 1 },
{
  field: 'status_name',
  headerName: 'Status',
  flex: 1,
  cellRenderer: (params: ICellRendererParams) => {
    const status = params.value || 'null';
    const badgeMap: { [key: string]: string } = {
      Approved: '#22c55e',
      Rejected: '#ef4444',
      Pending: '#f59e0b',
      null: '#6b7280'
    };
    const color = badgeMap[status] || '#6b7280';

    return `<span style="
       display: inline-block;
            padding: 1px 8px;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.3;
            border-radius: 9999px;
            color: #fff;
            background-color: ${color};
            text-align: center;
            white-space: nowrap;">
            ${status}
    </span>`;
  }
},

      { field: 'created_at', headerName: 'Created At', flex: 1 }
    ];

    // ✅ Step 2: Listen to filters
    this.tabService.currentTab$.subscribe(tab => {
      this.currentTab = tab;
      this.applyAllFilters();
    });

    this.tabService.searchText$.subscribe(text => {
      this.latestSearchText = text;
      this.applyAllFilters();
    });

    this.tabService.refresh$.subscribe(() => {
      const dr = this.tabService.getDateRange('brds');
      this.dateRange = dr
        ? { start: new Date(dr.start), end: new Date(dr.end) }
        : { start: null, end: null };
      this.applyAllFilters();
    });

    // ✅ Step 3: Try cache first
    const cached = this.tabService.getBrdCache?.();
    if (cached?.data?.length) {
      this.allBrds = cached.data;
      this.currentTab = cached.filters.currentTab;
      this.latestSearchText = cached.filters.searchText;

      // Restore date range and notify
      const dr = cached.filters.dateRange;
      this.dateRange = dr && dr.start && dr.end
        ? { start: new Date(dr.start), end: new Date(dr.end) }
        : { start: null, end: null };

      if (this.dateRange.start && this.dateRange.end) {
        this.tabService.setDateRange({
          section: 'brds',
          start: this.dateRange.start,
          end: this.dateRange.end
        });
      }

      this.applyAllFilters();
      this.loading = false;
      return;
    }

    // ✅ Step 4: Fetch from API if no cache
    const endpoint =
      this.userRole === 'Developer'
        ? `${environment.apiBaseUrl}/brds/assigned`
        : this.userRole === 'Customer'
        ? `${environment.apiBaseUrl}/brds/my-brds`
        : `${environment.apiBaseUrl}/brds`;

    this.http.get<any[]>(endpoint, { headers }).subscribe({
      next: (res) => {
        this.allBrds = res;
        this.tabService.setBrdCache({
          data: res,
          filters: {
            currentTab: this.currentTab,
            searchText: this.latestSearchText,
            dateRange: this.dateRange
          }
        });
        this.applyAllFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Failed to fetch BRDs:', err);
        this.loading = false;
      }
    });
  }

  applyAllFilters(): void {
    // 🛡️ Ensure date range is valid
    if (
      !(this.dateRange.start instanceof Date) || isNaN(this.dateRange.start.getTime()) ||
      !(this.dateRange.end instanceof Date) || isNaN(this.dateRange.end.getTime())
    ) {
      this.brds = [];
      return;
    }

    let filtered = [...this.allBrds];

    if (this.currentTab && this.currentTab !== 'All BRDs') {
      filtered = filtered.filter(brd =>
        brd.status_name?.toLowerCase() === this.currentTab.toLowerCase()
      );
    }

    const keyword = this.latestSearchText.toLowerCase();
    if (keyword) {
      filtered = filtered.filter(brd =>
        Object.values(brd).some(val =>
          typeof val === 'string' && val.toLowerCase().includes(keyword)
        )
      );
    }

    filtered = filtered.filter(brd => {
      const created = new Date(brd.created_at);
      return created >= this.dateRange.start! && created <= this.dateRange.end!;
    });

    this.brds = filtered;
  }

  onRowClicked(event: any): void {
    const brdId = event.data.id;
    this.tabService.setBrdCache({
      data: this.allBrds,
      filters: {
        currentTab: this.currentTab,
        searchText: this.latestSearchText,
        dateRange: this.dateRange
      }
    });
    this.router.navigate([`/admin/brds/${brdId}`]);
  }
}
