import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../services/app-config.service';
import { User, UsersResponse } from '../../models/user.model';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.css']
})
export class UsersPageComponent implements OnInit {
  title = 'Users';
  loading = signal(true);
  error = signal('');
  users = signal<User[]>([]);
  page = signal(1);
  pageSize = signal(10);
  total = signal(0);
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private apiBaseUrl = this.config.get().apiUrl.trim().replace(/\/+$/, '');

  ngOnInit(): void {
    this.loadUsers(1);
  }

  loadUsers(page: number): void {
    this.loading.set(true);
    this.error.set('');

    this.http
      .get<UsersResponse>(`${this.apiBaseUrl}/users`, {
        params: { page }
      })
      .subscribe({
        next: (res) => {
          if (!res?.ok) {
            this.error.set(res?.error || 'Failed to fetch users.');
            this.loading.set(false);
            return;
          }
          this.users.set(Array.isArray(res.data) ? res.data : []);
          this.page.set(typeof res.page === 'number' ? res.page : page);
          this.pageSize.set(typeof res.page_size === 'number' ? res.page_size : 10);
          this.total.set(typeof res.total === 'number' ? res.total : 0);
          this.loading.set(false);
        },
        error: (err) => {
          const message = err?.message ? String(err.message) : 'Request failed';
          this.error.set(`Backend request failed: ${message}`);
          this.loading.set(false);
        }
      });
  }

  prevPage(): void {
    if (this.page() > 1 && !this.loading()) {
      this.loadUsers(this.page() - 1);
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages() && !this.loading()) {
      this.loadUsers(this.page() + 1);
    }
  }
}
