import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.css']
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
