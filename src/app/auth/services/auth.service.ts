import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly _authenticated = signal(this.readSession());

  private readSession(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return sessionStorage.getItem('invoice-ai-auth') === '1';
  }

  isAuthenticated(): boolean {
    return this._authenticated();
  }

  login(): void {
    this._authenticated.set(true);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('invoice-ai-auth', '1');
    }
    void this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this._authenticated.set(false);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('invoice-ai-auth');
    }
    void this.router.navigate(['/login']);
  }
}
