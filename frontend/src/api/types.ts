export interface Fundo {
  id: number;
  nombre: string;
  direccion: string;
  representante_legal: string | null;
  rut_empresa: string;
  nombre_empresa: string;
  created_at: string;
}

export interface FundoCreate {
  nombre: string;
  direccion: string;
  representante_legal?: string;
  rut_empresa?: string;
  nombre_empresa?: string;
}

export interface Trabajador {
  id: number;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  rut: string;
  nacionalidad: string;
  direccion: string;
  fecha_nacimiento: string;
  sexo: 'M' | 'F';
  activo: boolean;
  created_at: string;
}

export interface TrabajadorCreate {
  nombres: string;
  apellidos: string;
  rut: string;
  nacionalidad: string;
  direccion: string;
  fecha_nacimiento: string;
  sexo: 'M' | 'F';
}

export interface Contrato {
  id: number;
  trabajador_id: number;
  fundo_id: number;
  fecha_ingreso: string;
  actividad: string;
  horario: string;
  sueldo: number;
  epp_entregado: string | null;
  created_at: string;
  trabajador: Trabajador;
  fundo: Fundo;
}

export interface ContratoCreate {
  trabajador_id: number;
  fundo_id: number;
  fecha_ingreso: string;
  actividad: string;
  horario: string;
  sueldo: number;
  epp_entregado?: string;
}
