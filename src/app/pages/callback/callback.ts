import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './callback.html',
  styleUrls: ['./callback.scss']
})
export class Callback implements OnInit {

  errorMessage: string | null = null;
  statusMessage: string = 'Autenticando, por favor aguarde...';

  constructor(
    private route: ActivatedRoute,
    private router: Router, // Injetar Router para possível navegação em erro
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Só executa no browser
    if (isPlatformBrowser(this.platformId)) {
      // Tenta ler do fragmento primeiro
      this.route.fragment.subscribe({
        next: (fragment) => {
          if (fragment) {
            this.processParams(new URLSearchParams(fragment));
          } else {
            // Se não houver fragmento, tenta query params (menos comum para OAuth implícito)
            this.processQueryParams();
          }
        },
        error: (err) => {
          this.handleError("Erro ao ler parâmetros da URL: " + (err.message || 'Erro desconhecido'));
        }
      });
    } else {
      this.handleError("Callback não suportado fora do ambiente do navegador.");
    }
  }

  /** Tenta processar query params (dados depois do ?) se o fragmento estiver vazio */
  private processQueryParams(): void {
    const params = new URLSearchParams(window.location.search);
    // Verifica se há pelo menos um parâmetro esperado (sucesso ou erro)
    if (!params.has('token') && !params.has('userType') && !params.has('error') && !params.has('code')) {
      this.handleError("Dados de autenticação não encontrados na URL.");
      return;
    }
    this.processParams(params);
  }

  /** Lógica principal para processar os parâmetros vindos da URL (fragmento ou query) */
  private processParams(params: URLSearchParams): void {
    try {
      // 1. Verifica se o backend retornou um erro explícito
      if (params.has('error')) {
        const errorDescription = params.get('error_description') || params.get('error') || 'Erro desconhecido do provedor de autenticação.';
        this.handleError(`Falha na autenticação: ${errorDescription}`);
        return;
      }

      // 2. Extrai os dados esperados em caso de sucesso
      const token = params.get('token');
      const userType = params.get('userType');
      const name = params.get('name'); // Opcional
      const email = params.get('email'); // Opcional

      // 3. Verifica se os dados mínimos (token e userType) estão presentes
      if (token && userType) {
        // Estrutura os dados para enviar ao componente Login
        const loginData = {
          success: true,
          token: token,
          userResponseDTO: {
            userType: userType,
            name: name,
            email: email
            // Adicione quaisquer outros dados relevantes que o backend passar
          }
        };

        // --- VALIDAÇÃO DE ORIGEM ANTES DE ENVIAR ---
        // Obtenha a URL da sua aplicação Angular (ajuste conforme necessário)
        const targetOrigin = window.location.origin; // Ex: 'http://localhost:4200'

        // 4. Envia a mensagem para a janela principal (opener)
        if (window.opener && !window.opener.closed) {
           window.opener.postMessage(loginData, targetOrigin);
           // A janela pop-up será fechada pelo listener na janela principal após receber a mensagem
           // Não fechar aqui imediatamente permite depuração em caso de falha no postMessage
           // window.close(); // Pode ser descomentado se preferir fechar aqui
        } else {
          // Se não houver opener, algo deu errado (ex: pop-up bloqueado ou janela fechada)
          throw new Error("A janela principal (opener) não foi encontrada ou está fechada. Não foi possível completar o login.");
        }

      } else {
        // Não encontramos os parâmetros de sucesso esperados
        throw new Error("Dados de autenticação esperados (token, userType) não encontrados nos parâmetros da URL.");
      }

    } catch (e: any) {
      this.handleError(e.message || 'Erro desconhecido ao processar o callback de autenticação.');
    }
  }

  /** Função para lidar com erros e exibi-los na tela do pop-up */
  private handleError(message: string): void {
    this.errorMessage = message;
    this.statusMessage = 'Falha na Autenticação'; // Atualiza a mensagem de status
    console.error('Erro no callback de autenticação:', message);

    // Tenta notificar a janela principal sobre o erro, se possível
    try {
        const targetOrigin = window.location.origin;
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
            success: false,
            message: message
            }, targetOrigin);
        }
    } catch (openerError) {
      console.error("Não foi possível enviar mensagem de erro para o opener.", openerError);
    }
     // A janela NÃO será fechada automaticamente em caso de erro,
     // para que o usuário (ou desenvolvedor) possa ver a mensagem.
     // Pode-se adicionar um botão para fechar manualmente ou redirecionar para /login.
  }

  // Opcional: Método para o usuário fechar manualmente em caso de erro
  closeWindow(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.close();
    }
  }

  // Opcional: Método para redirecionar para o login em caso de erro
  redirectToLogin(): void {
    if (isPlatformBrowser(this.platformId)) {
       // Tenta redirecionar a janela principal, se possível
       if (window.opener && !window.opener.closed) {
          window.opener.location.href = '/login'; // Ajuste a rota se necessário
          window.close(); // Fecha o pop-up
       } else {
          // Se não conseguir acessar o opener, redireciona o próprio pop-up
          window.location.href = '/login';
       }
    }
  }
}

