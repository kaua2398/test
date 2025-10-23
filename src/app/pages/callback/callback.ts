import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './callback.html',
  styleUrls: ['./callback.scss']
})
export class Callback implements OnInit {

  errorMessage: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.fragment.subscribe({
      next: (fragment) => {
        if (!fragment) {
          this.processQueryParams();
        } else {
          this.processParams(new URLSearchParams(fragment));
        }
      },
      error: (err) => {
        this.handleError("Erro ao ler o fragmento da URL: " + err.message);
      }
    });
  }

  private processQueryParams(): void {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('token') && !params.has('userType') && !params.has('error')) {
      this.handleError("Dados de autenticação não encontrados na URL (nem no fragmento, nem nos query params).");
      return;
    }
    this.processParams(params);
  }

  private processParams(params: URLSearchParams): void {
    try {
      if (params.has('error')) {
        const errorMessage = params.get('error_description') || params.get('error') || 'Erro desconhecido do provedor.';
        this.handleError(errorMessage);
        return;
      }

      if (params.has('token') || params.has('userType')) {
        
        const loginData = {
          success: true,
          token: params.get('token'),
          userResponseDTO: {
            userType: params.get('userType'),
            name: params.get('name'),
            email: params.get('email')
          }
        };

        const targetOrigin = '*'; 
        
        if (window.opener) {
          window.opener.postMessage(loginData, targetOrigin);
          window.close(); 
        } else {
          throw new Error("A janela 'opener' (principal) não foi encontrada.");
        }

      } else {
        throw new Error("Dados de autenticação esperados (token, userType) não encontrados nos parâmetros da URL.");
      }

    } catch (e: any) {
      this.handleError(e.message || 'Erro desconhecido ao processar o callback.');
    }
  }

  private handleError(message: string): void {
    this.errorMessage = message;
    console.error('Erro no callback de autenticação:', message);
    
    try {
      const targetOrigin = '*'; 
      if (window.opener) {
        window.opener.postMessage({
          success: false,
          message: message
        }, targetOrigin);
      }
    } catch (openerError) {
      console.error("Não foi possível enviar mensagem de erro para o opener.", openerError);
    }
  }
}

