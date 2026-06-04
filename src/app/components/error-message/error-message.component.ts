import { Component, input } from '@angular/core';

@Component({
  selector: 'la-error-message',
  standalone: true,
  imports: [],
  templateUrl: './error-message.component.html',
  styleUrl: './error-message.component.scss',
})
export class ErrorMessageComponent {
  readonly message = input.required<string | null>();
}
