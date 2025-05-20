import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-company-key',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-key.component.html',
  styleUrl: './company-key.component.css'
})
export class CompanyKeyComponent {
  key = '';
  @Output() keyChanged = new EventEmitter<string>();

  continue() {
    if (this.key.trim()) {
      this.keyChanged.emit(this.key.trim());
    }
  }
}
