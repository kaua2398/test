import { Injectable, PLATFORM_ID, inject, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { PainelService } from './painel.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private userSubject = new BehaviorSubject<any | null | undefined>(undefined);
  private apiUrl = environment.apiUrl
  user$ = this.userSubject.asObservable();
  isLoggedIn$: Observable<boolean> = this.user$.pipe(map(user => !!user));
  isAdmin$: Observable<boolean> = this.user$.pipe(
    map(user => user?.userType?.toLowerCase() === 'administrador')
  );

  private _painelService: PainelService | undefined;
  private get painelService(): PainelService {
    if (!this._painelService) {
      this._painelService = this.injector.get(PainelService);
    }
    return this._painelService;
  }

  constructor(
    private router: Router,
    private injector: Injector
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.userSubject.next(null);
      return;
    }

    let user = localStorage.getItem('user');
    let token = localStorage.getItem('token');

    if (!user || !token) {
      user = sessionStorage.getItem('user');
      token = sessionStorage.getItem('token');
    }

    if (user && token) {
      this.userSubject.next(JSON.parse(user));
    } else {
      this.userSubject.next(null);
    }
  }

  getCurrentUser(): any {
    return this.userSubject.getValue();
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  login(credentials: { email: string, password: string, rememberMe: boolean }): Observable<any> {
    return this.painelService.login(credentials).pipe(
      tap((response: any) => {
        const user = response.userResponseDTO;
        const token = response.token;

        const storage = credentials.rememberMe ? localStorage : sessionStorage;

        this.clearStorage();

        storage.setItem('user', JSON.stringify(user));
        storage.setItem('token', token);

        this.userSubject.next(user);
      }),
      catchError(err => {
        this.clearStorage();
        throw err;
      })
    );
  }

  loginWithMicrosoft(): void {
    const backendMicrosoftLoginUrl = `${this.apiUrl}/users/auth/microsoft`;
    const width = 500;
    const height = 600;
    const top = (window.screen.height - height) / 2;
    const left = (window.screen.width - width) / 2;

    // Abre a pop-up
    window.open(
      backendMicrosoftLoginUrl,
      'MicrosoftLogin',
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );
  }

  

  resendVerifyEmail(email: string): Observable<any> {
    return this.painelService.resendVerifyEmail({ email });
  }

  verifyEmail(token: string): Observable<any> {
    return this.painelService.verifyEmail(token);
  }

  forgotPassword(email: string): Observable<any> {
    return this.painelService.forgotPassword({ email });
  }
  register(credentials: { email: string, password: string }): Observable<any> {
    const registerData = {
      ...credentials,
      userType: 'Normal'
    };
    return this.painelService.registerUser(registerData);
  }

  logout(): void {
    this.clearStorage();
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  private clearStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
    }
  }

  isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!this.getToken();
    }
    return false;
  }

}

