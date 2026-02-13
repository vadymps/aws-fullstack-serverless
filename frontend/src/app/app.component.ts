import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Hello world';
  apiMessage = signal('Checking backend...');

  private http = inject(HttpClient);

  constructor() {
    const apiBaseUrl = environment.apiUrl.trim();
    if (!apiBaseUrl) {
      this.apiMessage.set('Set environment.apiUrl to your API Gateway URL to measure server time.');
      return;
    }

    const url = `${apiBaseUrl.replace(/\/+$/, '')}/ping`;

    this.http
      .get<{ ok: boolean; server_ms?: number }>(url)
      .pipe(
        catchError((err) => {
          const message = err?.message ? String(err.message) : 'Request failed';
          this.apiMessage.set(`Backend request failed: ${message}`);
          return of(null);
        })
      )
      .subscribe((res) => {
        if (!res?.ok) return;
        const serverMs = typeof res.server_ms === 'number' ? res.server_ms : null;
        this.apiMessage.set(
          serverMs === null ? 'Backend responded.' : `Backend responded. Server time: ${serverMs} ms`
        );
      });
  }
}
