import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent {
  protected readonly widgets = [
    { title: 'Invoices this month', value: '128', hint: '+12% vs last month' },
    { title: 'Pending review', value: '9', hint: 'Oldest: 2 days' },
    { title: 'Extraction accuracy', value: '97%', hint: 'Rolling 30 days' },
  ] as const;
}
