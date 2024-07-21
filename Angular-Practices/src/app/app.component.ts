import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { debounceTime, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { UserCardComponent } from './module/user-card/user-card.component';

import imageCompression from 'browser-image-compression';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    UserCardComponent,
    CommonModule,
    ReactiveFormsModule,
    UserCardComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'debouncing';
  response: any[] = [];
  searchForm: FormGroup;
  totalCount: number = 0;

  constructor(private http: HttpClient) {
    this.searchForm = new FormGroup({
      search: new FormControl(''),
    });
  }

  ngOnInit(): void {
    this.searchForm
      .get('search')
      ?.valueChanges.pipe(
        debounceTime(500), //500 milisec
        switchMap((search) =>
          search ? this.getUsers(search) : of({ items: [] })
        )
      )
      .subscribe({
        next: (res) => {
          this.totalCount = res.total_count;
          console.log(res);
          this.response = res && res.items ? res.items : [];
          this.compressAllImages();
        },
        error: (error) => {
          this.response = [];
        },
      });
  }

  private getUsers(search: string) {
    const url = `https://api.github.com/search/users?q=${search}`;
    return this.http.get<any>(url);
  }
  private async compressAllImages() {

    for (const res of this.response) {
      try {
        const response = await fetch(res.avatar_url);
        const blob = await response.blob();
        const file = this.blobToFile(blob, 'image.jpg');
        const compressedBlob = await this.compressImage(file);
        const compressedImageUrl = URL.createObjectURL(compressedBlob);
        res.avatar_url=compressedImageUrl;
      } catch (error) {
        console.error('Error fetching and compressing image:', error);
      }
    }
  }

  private async compressImage(image: File): Promise<Blob> {
    const options = {
      maxSizeMB: 0.001,          // Max file size in MB
      maxWidthOrHeight: 800, // Max width or height
      useWebWorker: true     // Use web worker for better performance
    };

    try {
      const compressedImage = await imageCompression(image, options);
      return compressedImage;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  }
  private blobToFile(blob: Blob, fileName: string): File {
    const file = new File([blob], fileName, { type: blob.type });
    return file;
  }
}

