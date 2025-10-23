import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthLayout } from '../../components/auth-layout/auth-layout';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AuthLayout,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  credentials = {
    email: '',
    password: '',
    rememberMe: false
  };
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  onSubmit(): void {
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = 'Por favor, preencha o e-mail e a senha.';
      return;
    }

    this.errorMessage = null;
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        setTimeout(() => {
          if (response.userResponseDTO.userType?.toLowerCase() === 'administrador') {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/demandas']);
          }
        }, 0);
      },
      error: (err) => {
        console.log(err);
        if (err.error?.message === "Usuário desabilitado") {
          this.errorMessage = 'Sua conta está desabilitada. Por favor, verifique seu e-mail para mais informações.';
          return;
        }
        this.errorMessage = 'Email ou senha inválidos. Por favor, tente novamente.';
      }
    });
  }

  loginWithMicrosoft(): void {
    this.authService.loginWithMicrosoft();
  }

  public handleMicrosoftLoginCallback(event: MessageEvent): void {
    const data = event.data;

    if (data && data.success && data.userResponseDTO) {
      setTimeout(() => {
        if (data.userResponseDTO.userType?.toLowerCase() === 'administrador') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/demandas']);
        }
      }, 0);
    } else if (data && !data.success) {
      this.errorMessage = data.message || 'Falha no login com Microsoft.';
    }
  }
}
