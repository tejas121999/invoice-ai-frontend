import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_CONFIG } from '../../../core/config/app-config';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private readonly config = inject(APP_CONFIG);
  private readonly auth = inject(AuthService);

  protected readonly appName = this.config.appName;

  protected signOut(): void {
    this.auth.logout();
  }
}
