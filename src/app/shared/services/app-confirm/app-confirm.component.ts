import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';

@Component({
  selector: 'app-confirm',
  template: `<h1 matDialogTitle class="mb-8"><mat-icon style="vertical-align:text-bottom; color:#198754;">info</mat-icon> {{ data.title }}</h1>
    <div mat-dialog-content class="mb-16">{{ data.message }}</div>
    <div mat-dialog-actions class="pb-16">
    <span fxFlex></span><button
    type="button"
    mat-raised-button
    color="primary"
    (click)="dialogRef.close(true)">Evet</button>
    &nbsp;
    
    <button
    type="button"
    color="warn"
    mat-raised-button
    (click)="dialogRef.close(false)">İptal</button>
    </div>`,
})
export class AppComfirmComponent {
  constructor(
    public dialogRef: MatDialogRef<AppComfirmComponent>,
    @Inject(MAT_DIALOG_DATA) public data:any
  ) {}
}