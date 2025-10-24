import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ContainerModule } from '../../components/container/container.module';
import { PainelService } from '../../services/painel.service';

@Component({
  selector: 'app-cadastro-atualizacao',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ContainerModule,
  ],
  templateUrl: './cadastro-atualizacao.html',
  styleUrls: ['./cadastro-atualizacao.scss']
})
export class CadastroAtualizacao implements OnInit {
  demanda: any = {
    title: '',
    priority: '',
    status: '',
    gitLink: '',
    date: '',
    description: ''
  };
  isEditMode = false;
  demandaId: number | null = null;
  pageTitle = 'Cadastro de Demanda';
  pageDescription = 'Preencha os campos abaixo para registrar uma nova solicitação de TI';

  constructor(
    private painelService: PainelService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.demandaId = Number(id);
      this.pageTitle = 'Atualização de Demanda';
      this.pageDescription = 'Altere os campos abaixo para atualizar a solicitação de TI';
      this.loadDemanda(this.demandaId);
    }
  }

  loadDemanda(id: number): void {
    this.painelService.getDemandById(id).subscribe({
      next: (data) => {
        if (data.date) {
          data.date = new Date(data.date).toISOString().split('T')[0];
        }
        this.demanda = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastr.error('Erro ao carregar a demanda para edição.', 'Erro');
        this.router.navigate(['/demandas']);
      }
    });
  }

  onSubmit(): void {
    const payload = {
      ...this.demanda,
      priority: Number(this.demanda.priority)
    };

    if (this.isEditMode && this.demandaId) {
      this.painelService.updateDemand(this.demandaId, payload).subscribe({
        next: () => {
          this.toastr.success('Demanda atualizada com sucesso!', 'Sucesso!');
          this.router.navigate(['/demandas']);
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Erro ao atualizar a demanda.', 'Erro');
        }
      });
    } else {
      console.log("Enviando payload para registro: ", payload);
      this.painelService.registerDemand(payload).subscribe({
        next: () => {
          this.toastr.success('Demanda cadastrada com sucesso!', 'Sucesso!');
          this.router.navigate(['/demandas']);
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Erro ao cadastrar a demanda.', 'Erro');
        }
      });
    }
  }
}

