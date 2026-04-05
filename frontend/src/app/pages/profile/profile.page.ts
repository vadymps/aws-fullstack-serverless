import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { AppSnackbarComponent } from '../../components/snackbar/app-snackbar.component';

@Component({
  imports: [CommonModule, ReactiveFormsModule, AppSnackbarComponent],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.css'],
  standalone: true,
})
export class ProfilePageComponent implements OnInit {
  public readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly fb = inject(FormBuilder);

  public authorized = signal(false);
  public loadingProfile = signal(true);
  public savingProfile = signal(false);
  public savingPicture = signal(false);
  public pendingPicture = signal(false);
  public notificationMessage = signal('');
  public notificationType = signal<'success' | 'error' | ''>('');
  public pictureUrl = signal('');
  private notificationTimer: ReturnType<typeof setTimeout> | null = null;

  public profileForm: FormGroup = this.fb.group({
    givenName: ['', Validators.required],
    familyName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
  });
  private pendingPictureFile: File | null = null;

  ngOnInit(): void {
    this.auth.init().then(() => {
      if (this.auth.isAuthenticated()) {
        this.authorized.set(true);
        this.loadProfile();
      } else {
        this.loadingProfile.set(false);
      }
    });
  }

  login(): void {
    this.auth.login();
  }

  async loadProfile(): Promise<void> {
    try {
      const response = await firstValueFrom(this.profileService.getProfile());
      if (!response?.data) {
        this.showNotification('Unable to load your profile. Please try again.', 'error');
        return;
      }

      this.profileForm.patchValue({
        givenName: response.data.given_name || '',
        familyName: response.data.family_name || '',
        email: response.data.email || ''
      });
      this.profileForm.markAsPristine();
      this.pictureUrl.set(response.data.picture || '');
    } catch (err) {
      this.showNotification('Unable to load your profile. Please try again.', 'error');
    } finally {
      this.loadingProfile.set(false);
    }
  }

  handlePictureChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showNotification('Image must be 5MB or smaller.', 'error');
      return;
    }

    this.clearNotification();
    this.pendingPictureFile = file;
    this.pendingPicture.set(true);

    const previewUrl = URL.createObjectURL(file);
    this.pictureUrl.set(previewUrl);

    if (input) {
      input.value = '';
    }
  }

  async saveProfile(): Promise<void> {
    if (this.savingProfile()) {
      return;
    }

    const hasFormChanges = this.profileForm.dirty;
    const hasPictureChange = Boolean(this.pendingPictureFile);
    if (!hasFormChanges && !hasPictureChange) {
      return;
    }

    if (hasFormChanges && this.profileForm.invalid) {
      this.showNotification('Please fill in all required fields.', 'error');
      return;
    }

    this.clearNotification();

    try {
      this.savingProfile.set(true);

      if (hasFormChanges) {
        const payload = {
          given_name: this.profileForm.value.givenName?.trim(),
          family_name: this.profileForm.value.familyName?.trim(),
          email: this.profileForm.value.email?.trim(),
        };
        const response = await firstValueFrom(this.profileService.updateProfile(payload));
        if (response?.data) {
          this.profileForm.patchValue({
            givenName: response.data.given_name || '',
            familyName: response.data.family_name || '',
            email: response.data.email || ''
          });
          this.profileForm.markAsPristine();
        }
      }

      if (hasPictureChange && this.pendingPictureFile) {
        const dataUrl = await this.readFileAsDataUrl(this.pendingPictureFile);
        this.savingPicture.set(true);
        const response = await firstValueFrom(
          this.profileService.updateProfilePicture({
            picture_base64: dataUrl,
            picture_name: this.pendingPictureFile.name,
            picture_type: this.pendingPictureFile.type
          })
        );
        if (response?.data) {
          this.pictureUrl.set(response.data.picture || '');
        }
        this.pendingPictureFile = null;
        this.pendingPicture.set(false);
      }

      this.showNotification('Profile updated.', 'success');
    } catch (err) {
      this.showNotification('Unable to update profile. Please try again.', 'error');
    } finally {
      this.savingProfile.set(false);
      this.savingPicture.set(false);
    }
  }

  closeNotification(): void {
    this.clearNotification();
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.notificationMessage.set(message);
    this.notificationType.set(type);
    this.resetNotificationTimer();
  }

  private clearNotification(): void {
    this.notificationMessage.set('');
    this.notificationType.set('');
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
      this.notificationTimer = null;
    }
  }

  private resetNotificationTimer(): void {
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
    }
    this.notificationTimer = setTimeout(() => {
      this.clearNotification();
    }, 4000);
  }
}
