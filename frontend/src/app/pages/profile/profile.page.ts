import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.css'],
  standalone: true,
})
export class ProfilePageComponent implements OnInit {
  public readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly fb = inject(FormBuilder);

  public authorized = signal(false);
  public checking = signal(true);
  public loadingProfile = signal(false);
  public savingProfile = signal(false);
  public errorMessage = signal('');
  public successMessage = signal('');
  public pictureUrl = signal('');

  public profileForm: FormGroup = this.fb.group({
    givenName: ['', Validators.required],
    familyName: ['', Validators.required]
  });
  private selectedFile: File | null = null;

  ngOnInit(): void {
    this.auth.init().then(() => {
      if (this.auth.isAuthenticated()) {
        this.authorized.set(true);
        this.checking.set(false);
        this.loadProfile();
      } else {
        this.checking.set(false);
      }
    });
  }

  login(): void {
    this.auth.login();
  }

  async loadProfile(): Promise<void> {
    this.loadingProfile.set(true);
    this.errorMessage.set('');

    try {
      const claims = this.auth.getIdTokenClaims();
      if (!claims) {
        this.errorMessage.set('Unable to load your profile. Please try again.');
        return;
      }

      const givenName = typeof claims['given_name'] === 'string' ? claims['given_name'] : '';
      const familyName = typeof claims['family_name'] === 'string' ? claims['family_name'] : '';
      const picture = typeof claims['picture'] === 'string' ? claims['picture'] : '';

      this.profileForm.patchValue({
        givenName,
        familyName
      });
      this.pictureUrl.set(picture);
    } catch (err) {
      this.errorMessage.set('Unable to load your profile. Please try again.');
    } finally {
      this.loadingProfile.set(false);
    }
  }

  handleFileChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.selectedFile = file;
  }

  async saveProfile(): Promise<void> {
    if (this.savingProfile()) {
      return;
    }

    if (this.profileForm.invalid) {
      this.errorMessage.set('Please fill in all required fields.');
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const payload: {
        given_name?: string;
        family_name?: string;
        picture_base64?: string;
        picture_name?: string;
        picture_type?: string;
      } = {
        given_name: this.profileForm.value.givenName?.trim(),
        family_name: this.profileForm.value.familyName?.trim(),
      };

      if (this.selectedFile) {
        if (this.selectedFile.size > 5 * 1024 * 1024) {
          this.errorMessage.set('Image must be 5MB or smaller.');
          return;
        }

        const dataUrl = await this.readFileAsDataUrl(this.selectedFile);
        payload.picture_base64 = dataUrl;
        payload.picture_name = this.selectedFile.name;
        payload.picture_type = this.selectedFile.type;
      }

      this.savingProfile.set(true);
      const response = await firstValueFrom(this.profileService.updateProfile(payload));
      if (response?.data) {
        this.profileForm.patchValue({
          givenName: response.data.given_name || '',
          familyName: response.data.family_name || ''
        });
        this.pictureUrl.set(response.data.picture || '');
      }
      this.selectedFile = null;
      this.successMessage.set('Profile updated.');
    } catch (err) {
      this.errorMessage.set('Unable to update profile. Please try again.');
    } finally {
      this.savingProfile.set(false);
    }
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
}
