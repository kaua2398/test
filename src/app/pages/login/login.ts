import { Component, OnInit, OnDestroy, NgZone, PLATFORM_ID, Inject } from '@angular/core'; // Adicionar OnInit, OnDestroy, NgZone, PLATFORM_ID, Inject
import { isPlatformBrowser, CommonModule } from '@angular/common'; // Adicionar isPlatformBrowser
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs'; // Adicionar Observable se não estiver lá
import { AuthLayout } from '../../components/auth-layout/auth-layout';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment'; // Importar environment

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
export class Login implements OnInit, OnDestroy {
  credentials = {
    email: '',
    password: '',
    rememberMe: false
  };
  errorMessage: string | null = null;

  // IMPORTANTE: Esta deve ser a URL do SEU backend que INICIA o fluxo OAuth da Microsoft
  backendMicrosoftLoginUrl = `${environment.apiUrl}/auth/microsoft`; // Ajuste este endpoint se necessário

  private messageListener: ((event: MessageEvent) => void) | null = null;
  private popup: Window | null = null; // Referência ao pop-up

  constructor(
    private authService: AuthService,
    private router: Router,
    private zone: NgZone, // Injetar NgZone
    @Inject(PLATFORM_ID) private platformId: Object // Injetar PLATFORM_ID
  ) { }

  ngOnInit(): void {
    // Só adiciona o listener se estiver no browser
    if (isPlatformBrowser(this.platformId)) {
      this.messageListener = (event: MessageEvent) => {
        // --- VALIDAÇÃO DE ORIGEM ---
        // Descomente e ajuste a URL de origem em produção por segurança!
        // const expectedOrigin = 'http://localhost:4200'; // Ou a URL da sua API/Backend que faz o redirect final
        // if (event.origin !== expectedOrigin) {
        //   console.warn(`Mensagem ignorada de origem inesperada: ${event.origin}`);
        //   return;
        // }

        // Fecha o popup se ele ainda estiver aberto (mesmo em caso de erro no callback)
        if (this.popup && !this.popup.closed) {
          this.popup.close();
        }

        // Garante que a atualização ocorra dentro da zona do Angular
        this.zone.run(() => {
          this.handleMicrosoftLoginCallback(event.data);
        });
      };
      window.addEventListener('message', this.messageListener);
    }
  }

  ngOnDestroy(): void {
    // Remove o listener ao destruir o componente
    if (isPlatformBrowser(this.platformId) && this.messageListener) {
      window.removeEventListener('message', this.messageListener);
    }
    // Garante que o pop-up seja fechado se o componente for destruído
    if (this.popup && !this.popup.closed) {
      this.popup.close();
    }
  }

  onSubmit(): void {
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = 'Por favor, preencha o e-mail e a senha.';
      return;
    }

    this.errorMessage = null;
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        // O processLoginResponse já atualiza o estado, só precisamos navegar
        this.navigateToDashboardOrDemandas(response.userResponseDTO);
      },
      error: (err) => {
        console.error("Erro no login:", err);
        if (err.error?.message === "Usuário desabilitado") {
          this.errorMessage = 'Sua conta está desabilitada. Por favor, verifique seu e-mail ou contate o suporte.';
        } else if (err.status === 401 || err.status === 400) {
           this.errorMessage = 'Email ou senha inválidos. Por favor, tente novamente.';
        } else {
           this.errorMessage = 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
        }
      }
    });
  }

  loginWithMicrosoft(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Não faz nada se não estiver no browser
    }
    const width = 600;
    const height = 700;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    // Abre o pop-up e guarda a referência
    this.popup = window.open(
      this.backendMicrosoftLoginUrl,
      'MicrosoftLogin',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
    );

     // Opcional: Focar no popup se ele já existir e não estiver fechado
     if (this.popup) {
        this.popup.focus();
     }
  }

  handleMicrosoftLoginCallback(data: any): void {
    console.log("Mensagem recebida do popup:", data); // Para depuração
    if (data && data.success && data.token && data.userResponseDTO) {
      this.errorMessage = null;
      // Processa a resposta usando o AuthService (assume que rememberMe é false para OAuth)
      this.authService.processLoginResponse(data, false);
      // Navega para a página apropriada
      this.navigateToDashboardOrDemandas(data.userResponseDTO);
    } else if (data && !data.success) {
      this.errorMessage = data.message ;
      // Limpa qualquer estado de login anterior se o callback falhar
      this.authService.logout();
    } else {
      console.warn("Recebida mensagem inesperada ou incompleta do popup de login:", data);
      this.errorMessage = 'Ocorreu um erro inesperado durante o login com a Microsoft.';
      // Limpa qualquer estado de login anterior
      this.authService.logout();
    }
  }

  // Método auxiliar para navegação centralizada
  private navigateToDashboardOrDemandas(userResponseDTO: any): void {
    // Usar setTimeout para garantir que a navegação ocorra após o ciclo atual de detecção de mudanças
    setTimeout(() => {
      this.zone.run(() => { // Garante que a navegação ocorra na zona do Angular
        if (userResponseDTO?.userType?.toLowerCase() === 'administrador') {
          this.router.navigate(['/dashboard']);
        } else if (userResponseDTO?.userType?.toLowerCase() === 'normal') {
          this.router.navigate(['/demandas']);
        } else {
          // Fallback ou tratamento para outros tipos de usuário, se houver
          console.warn("Tipo de usuário desconhecido:", userResponseDTO?.userType);
          this.router.navigate(['/login']); // Ou uma página padrão
        }
      });
    }, 0);
  }
}

