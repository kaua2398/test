import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ContainerModule } from '../../components/container/container.module';
import { PainelService } from '../../services/painel.service';
import { AuthService } from '../../services/auth.service';
import { Observable, of, Subscription } from 'rxjs';
import { ConfirmationModal } from './confirmation-modal/confirmation-modal';
import { take, filter } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ReplacePipe } from '../../util/replace.pipe';

@Component({
  selector: 'app-demandas',
  standalone: true,
  imports: [
    CommonModule,
    ContainerModule,
    RouterLink,
    DatePipe,
    ConfirmationModal,
    FormsModule,
    ReplacePipe,
  ],
  templateUrl: './demandas.html',
  styleUrl: './demandas.scss',
})
export class Demandas implements OnInit, OnDestroy {
  demandas: any[] = [];
  demandasFiltradas: any[] = [];
  demandasPaginadas: any[] = [];
  termoBusca = '';
  isLoading = true;
  isModalOpen = false;
  demandaParaExcluir: number | null = null;
  isAdmin = false;
  private authSubscription: Subscription | undefined;

  paginaAtual = 1;
  itensPorPagina = 5;

  constructor(
    private painelService: PainelService,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.authSubscription = this.authService.user$.pipe(
      filter(user => user !== null), 
      take(1) 
    ).subscribe(user => {
      this.isAdmin = user?.userType?.toLowerCase() === 'administrador';
      this.loadDemandas();
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  loadDemandas(): void {
    this.isLoading = true;

    const demandas$: Observable<any> = this.isAdmin
      ? this.painelService.getAllDemandRecord()
      : this.painelService.getUserAllDemandRecord();

    demandas$.subscribe({
      next: (data) => {
        this.demandas = data || []; 
        this.filtrarDemandas();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  filtrarDemandas(): void {
    const termo = this.termoBusca.toLowerCase();
    if (!termo) {
      this.demandasFiltradas = this.demandas;
    } else {
      this.demandasFiltradas = this.demandas.filter(demanda =>
        demanda.title.toLowerCase().includes(termo) ||
        (demanda.owner && demanda.owner.toLowerCase().includes(termo)) ||
        demanda.status.toLowerCase().includes(termo)
      );
    }
    this.paginaAtual = 1; // Reseta para a primeira página ao filtrar
    this.atualizarPaginacao();
  }

  atualizarPaginacao(): void {
    const indiceInicial = (this.paginaAtual - 1) * this.itensPorPagina;
    const indiceFinal = indiceInicial + this.itensPorPagina;
    this.demandasPaginadas = this.demandasFiltradas.slice(indiceInicial, indiceFinal);
  }

  irParaPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaAtual = pagina;
      this.atualizarPaginacao();
    }
  }

  proximaPagina(): void {
    this.irParaPagina(this.paginaAtual + 1);
  }

  paginaAnterior(): void {
    this.irParaPagina(this.paginaAtual - 1);
  }

  totalPaginas(): number {
    return Math.ceil(this.demandasFiltradas.length / this.itensPorPagina);
  }

  getPaginas(): number[] {
    const total = this.totalPaginas();
    return Array.from({ length: total }, (_, i) => i + 1);
  }


  solicitarExclusao(demandaId: number): void {
    this.demandaParaExcluir = demandaId;
    this.isModalOpen = true;
  }

  fecharModal(): void {
    this.isModalOpen = false;
    this.demandaParaExcluir = null;
  }

  confirmarExclusao(): void {
    if (this.demandaParaExcluir === null) {
      return;
    }

    this.painelService.deleteDemand(this.demandaParaExcluir).subscribe({
      next: () => {
        this.toastr.success('Demanda excluída com sucesso!', 'Sucesso');
        this.demandas = this.demandas.filter(
          (d) => d.id !== this.demandaParaExcluir
        );
        this.filtrarDemandas();
        this.fecharModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastr.error('Erro ao excluir a demanda.', 'Erro');
        this.fecharModal();
      },
    });
  }

  verMais(demandaId: number): void {
    this.router.navigate(['/ver-mais', demandaId]);
  }
}

