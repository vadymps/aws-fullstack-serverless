import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-protected-route',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './protected-route.component.html',
  styleUrls: ['./protected-route.component.css']
})
export class ProtectedRouteComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private redirectTimer: ReturnType<typeof setTimeout> | null = null;

  authorized = signal(false);
  checking = signal(true);

  async ngOnInit(): Promise<void> {
    await this.auth.init();

    if (this.auth.isAuthenticated()) {
      this.authorized.set(true);
      this.checking.set(false);
      return;
    }

    this.checking.set(false);
    const delay =
      typeof this.route.snapshot.data['redirectDelayMs'] === 'number'
        ? this.route.snapshot.data['redirectDelayMs']
        : 500;

    this.redirectTimer = setTimeout(() => {
      this.auth.login();
    }, delay);
  }

  ngOnDestroy(): void {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
  }
}
