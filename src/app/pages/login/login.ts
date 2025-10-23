import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthLayout } from '../../components/auth-layout/auth-layout';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

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
export class LoginComponent {
  credentials = {
    email: '',
    password: '',
    rememberMe: false
  };

  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = 'Por favor, preencha o e-mail e a senha.';
      return;
    }

    this.errorMessage = null;
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        setTimeout(() => {
          const userType = response.userResponseDTO.userType?.toLowerCase();
          if (userType === 'administrador') {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/demandas']);
          }
        }, 0);
      },
      error: (err) => {
        console.log(err);
        if (err.error?.message === 'Usuário desabilitado') {
          this.errorMessage = 'Sua conta está desabilitada. Verifique seu e-mail para mais informações.';
          return;
        }
        this.errorMessage = 'Email ou senha inválidos. Por favor, tente novamente.';
      }
    });
  }

  loginWithMicrosoft() {
    window.location.href = environment.oauthUrl;
  }
}
