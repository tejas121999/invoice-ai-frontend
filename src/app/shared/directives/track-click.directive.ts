import { Directive, HostListener, input, output } from '@angular/core';

@Directive({
  selector: '[appTrackClick]',
  standalone: true,
})
export class TrackClickDirective {
  readonly appTrackClick = input<string>('');
  readonly appTrackClickEvent = output<string>();

  @HostListener('click')
  onClick(): void {
    this.appTrackClickEvent.emit(this.appTrackClick());
  }
}
