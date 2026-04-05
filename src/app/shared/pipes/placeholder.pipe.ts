import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appPlaceholder',
  standalone: true,
})
export class PlaceholderPipe implements PipeTransform {
  transform(value: string | null | undefined, fallback: string): string {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : fallback;
  }
}
