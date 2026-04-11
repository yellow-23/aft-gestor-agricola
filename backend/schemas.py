from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import date, datetime
import re


# ─── FUNDO SCHEMAS ─────────────────────────────────────────────────────────────

class FundoBase(BaseModel):
    nombre: str
    direccion: str
    representante_legal: Optional[str] = None
    rut_empresa: Optional[str] = "77.605.354-6"
    nombre_empresa: Optional[str] = "AFT Servicios SpA"


class FundoCreate(FundoBase):
    pass


class FundoUpdate(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    representante_legal: Optional[str] = None


class FundoOut(FundoBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── TRABAJADOR SCHEMAS ─────────────────────────────────────────────────────────

class TrabajadorBase(BaseModel):
    nombres: str
    apellidos: str
    rut: str
    nacionalidad: Optional[str] = "Chilena"
    direccion: str
    fecha_nacimiento: date
    sexo: str  # "M" o "F"

    @validator("sexo")
    def sexo_valid(cls, v):
        if v not in ("M", "F"):
            raise ValueError("sexo debe ser M o F")
        return v


class TrabajadorCreate(TrabajadorBase):
    pass


class TrabajadorUpdate(BaseModel):
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    nacionalidad: Optional[str] = None
    direccion: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    sexo: Optional[str] = None
    activo: Optional[bool] = None


class TrabajadorOut(TrabajadorBase):
    id: int
    activo: bool
    created_at: datetime
    nombre_completo: str

    class Config:
        from_attributes = True


# ─── CONTRATO SCHEMAS ──────────────────────────────────────────────────────────

class ContratoBase(BaseModel):
    trabajador_id: int
    fundo_id: int
    fecha_ingreso: date
    actividad: str
    horario: str
    sueldo: float = 510000
    epp_entregado: Optional[str] = None


class ContratoCreate(ContratoBase):
    pass


class ContratoUpdate(BaseModel):
    actividad: Optional[str] = None
    horario: Optional[str] = None
    sueldo: Optional[float] = None
    epp_entregado: Optional[str] = None


class ContratoOut(ContratoBase):
    id: int
    created_at: datetime
    trabajador: TrabajadorOut
    fundo: FundoOut

    class Config:
        from_attributes = True


# ─── AUTH SCHEMAS ──────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
