import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AppFooterComponent } from './components/footer/app-footer.component';
import { AppHeaderComponent } from './components/header/app-header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    MatSidenavModule,
    MatButtonModule,
    AppHeaderComponent,
    AppFooterComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  isHandset = signal(false);

  constructor() {
    this.breakpointObserver.observe('(max-width: 900px)').subscribe((state) => {
      this.isHandset.set(state.matches);
    });
  }

  closeDrawerOnNavigate(drawer: { close: () => void }): void {
    if (!this.isHandset()) {
      return;
    }
    const sub = this.router.events.subscribe(() => {
      drawer.close();
      sub.unsubscribe();
    });
  }
}
