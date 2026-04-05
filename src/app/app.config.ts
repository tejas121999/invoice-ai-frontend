import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { APP_CONFIG, defaultAppConfig } from './core/config/app-config';
import { apiPrefixInterceptor } from './core/interceptors/api-prefix.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: APP_CONFIG, useValue: defaultAppConfig },
    provideHttpClient(withInterceptors([apiPrefixInterceptor])),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
  ],
};
