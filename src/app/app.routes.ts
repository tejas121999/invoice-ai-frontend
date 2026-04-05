import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';
import { MainLayoutComponent } from './shared/layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
      },
      {
        path: 'upload',
        loadChildren: () =>
          import('./invoice-upload/invoice-upload.module').then((m) => m.InvoiceUploadModule),
      },
      {
        path: 'review/:id',
        loadChildren: () =>
          import('./invoice-review/invoice-review.module').then((m) => m.InvoiceReviewModule),
      },
      {
        path: 'history',
        loadChildren: () =>
          import('./invoice-history/invoice-history.module').then((m) => m.InvoiceHistoryModule),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
