import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // ⚠️ Primeiro: regra coringa vem antes, para SSR normal
  {
    path: '**',
    renderMode: RenderMode.Server,
  },

  // 🚫 Depois: exceções (rotas com parâmetros dinâmicos)
  {
    path: 'ver-mais/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'editar-demanda/:id',
    renderMode: RenderMode.Client,
  },
];
