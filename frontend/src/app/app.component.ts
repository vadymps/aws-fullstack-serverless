import { Component, OnDestroy, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AppFooterComponent } from './components/footer/app-footer.component';
import { AppHeaderComponent } from './components/header/app-header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    AppHeaderComponent,
    AppFooterComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
  private mediaQueryList: MediaQueryList | null = null;
  private mediaQueryListener: ((event: MediaQueryListEvent) => void) | null = null;
  isHandset = signal(false);
  menuOpen = signal(false);

  constructor() {
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      this.mediaQueryList = window.matchMedia('(max-width: 900px)');
      this.isHandset.set(this.mediaQueryList.matches);
      this.mediaQueryListener = (event) => {
        this.isHandset.set(event.matches);
        if (!event.matches) {
          this.menuOpen.set(false);
        }
      };
      if (this.mediaQueryList.addEventListener) {
        this.mediaQueryList.addEventListener('change', this.mediaQueryListener);
      } else {
        // Safari < 14
        (
          this.mediaQueryList as MediaQueryList & {
            addListener: (listener: (event: MediaQueryListEvent) => void) => void;
          }
        ).addListener(this.mediaQueryListener);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.mediaQueryList && this.mediaQueryListener) {
      if (this.mediaQueryList.removeEventListener) {
        this.mediaQueryList.removeEventListener('change', this.mediaQueryListener);
      } else {
        // Safari < 14
        (
          this.mediaQueryList as MediaQueryList & {
            removeListener: (listener: (event: MediaQueryListEvent) => void) => void;
          }
        ).removeListener(this.mediaQueryListener);
      }
    }
  }

  toggleMenu(): void {
    if (!this.isHandset()) {
      return;
    }
    this.menuOpen.set(!this.menuOpen());
  }

  closeMenu(): void {
    if (this.menuOpen()) {
      this.menuOpen.set(false);
    }
  }

  handleNavClick(): void {
    if (this.isHandset()) {
      this.closeMenu();
    }
  }
}
