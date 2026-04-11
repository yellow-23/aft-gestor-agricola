from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models import Trabajador
from schemas import TrabajadorCreate, TrabajadorUpdate, TrabajadorOut
from auth import verify_token
from typing import List, Optional

router = APIRouter(prefix="/trabajadores", tags=["Trabajadores"])


@router.get("/", response_model=List[TrabajadorOut])
def listar_trabajadores(
    buscar: Optional[str] = Query(None, description="Buscar por nombre o RUT"),
    solo_activos: bool = Query(True),
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    """Lista todos los trabajadores. Permite búsqueda por nombre o RUT."""
    query = db.query(Trabajador)

    if solo_activos:
        query = query.filter(Trabajador.activo == True)

    if buscar:
        termino = f"%{buscar}%"
        query = query.filter(
            or_(
                Trabajador.nombres.ilike(termino),
                Trabajador.apellidos.ilike(termino),
                Trabajador.rut.ilike(termino)
            )
        )

    return query.order_by(Trabajador.apellidos).all()


@router.get("/{trabajador_id}", response_model=TrabajadorOut)
def obtener_trabajador(
    trabajador_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    """Retorna un trabajador por ID."""
    trabajador = db.query(Trabajador).filter(Trabajador.id == trabajador_id).first()
    if not trabajador:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")
    return trabajador


@router.post("/", response_model=TrabajadorOut, status_code=status.HTTP_201_CREATED)
def crear_trabajador(
    data: TrabajadorCreate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    """Registra un nuevo trabajador. El RUT debe ser único."""
    existente = db.query(Trabajador).filter(Trabajador.rut == data.rut).first()
    if existente:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un trabajador con el RUT {data.rut}"
        )
    trabajador = Trabajador(**data.dict())
    db.add(trabajador)
    db.commit()
    db.refresh(trabajador)
    return trabajador


@router.put("/{trabajador_id}", response_model=TrabajadorOut)
def actualizar_trabajador(
    trabajador_id: int,
    data: TrabajadorUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    """Actualiza los datos de un trabajador."""
    trabajador = db.query(Trabajador).filter(Trabajador.id == trabajador_id).first()
    if not trabajador:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(trabajador, field, value)
    db.commit()
    db.refresh(trabajador)
    return trabajador


@router.delete("/{trabajador_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_trabajador(
    trabajador_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    """Desactiva (soft delete) un trabajador. No elimina sus contratos."""
    trabajador = db.query(Trabajador).filter(Trabajador.id == trabajador_id).first()
    if not trabajador:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")
    trabajador.activo = False
    db.commit()
