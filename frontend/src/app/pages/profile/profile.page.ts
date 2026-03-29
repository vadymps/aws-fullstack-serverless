import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.css'],
  standalone: true
})
export class ProfilePageComponent implements OnInit {
  public readonly auth = inject(AuthService);

  authorized = signal(false);
  checking = signal(true);

  async ngOnInit(): Promise<void> {
    await this.auth.init();

    console.log('Is authenticated:', this.auth.isAuthenticated());

    if (this.auth.isAuthenticated()) {
      this.authorized.set(true);
      this.checking.set(false);
      return;
    }

    this.checking.set(false);
  }

  login(): void {
    this.auth.login();
  }
}
