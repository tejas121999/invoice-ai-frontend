import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppRuntimeService {
  readonly startedAt = new Date();
}
