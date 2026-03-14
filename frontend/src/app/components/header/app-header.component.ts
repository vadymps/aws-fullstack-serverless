import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule],
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.css']
})
export class AppHeaderComponent implements OnInit, OnDestroy {
  @Input() showMenu = false;
  @Output() menuClick = new EventEmitter<void>();
  constructor(
    public readonly auth: AuthService,
    private readonly router: Router
  ) {}

  pageTitle = signal('Movies');

  private subscription = this.router.events
    .pipe(filter((event) => event instanceof NavigationEnd))
    .subscribe((event) => {
      this.updateTitle((event as NavigationEnd).urlAfterRedirects);
    });

  ngOnInit(): void {
    this.updateTitle(this.router.url);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updateTitle(url: string): void {
    const path = url.split('?')[0].replace(/^\//, '');
    if (path.startsWith('profile')) {
      this.pageTitle.set('Profile');
    } else if (path.startsWith('login')) {
      this.pageTitle.set('Login');
    } else {
      this.pageTitle.set('Movies');
    }
  }
}
