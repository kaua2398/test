import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // ⚠️ Primeiro: regra coringa vem antes, para SSR normal
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
<<<<<<< HEAD
=======

  // 🚫 Depois: exceções (rotas com parâmetros dinâmicos)
>>>>>>> 76ab49d3ad20ff5e68180ec896331e13170cb4b0
  {
    path: 'ver-mais/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'editar-demanda/:id',
    renderMode: RenderMode.Client,
  },
];
