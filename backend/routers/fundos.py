from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Fundo
from schemas import FundoCreate, FundoUpdate, FundoOut
from auth import verify_token
from typing import List

router = APIRouter(prefix="/fundos", tags=["Fundos"])


@router.get("/", response_model=List[FundoOut])
def listar_fundos(
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    """Retorna todos los fundos/empresas registrados."""
    return db.query(Fundo).order_by(Fundo.nombre).all()


@router.get("/{fundo_id}", response_model=FundoOut)
def obtener_fundo(
    fundo_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    """Retorna un fundo por ID."""
    fundo = db.query(Fundo).filter(Fundo.id == fundo_id).first()
    if not fundo:
        raise HTTPException(status_code=404, detail="Fundo no encontrado")
    return fundo


@router.post("/", response_model=FundoOut, status_code=status.HTTP_201_CREATED)
def crear_fundo(
    data: FundoCreate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    """Crea un nuevo fundo o empresa."""
    fundo = Fundo(**data.dict())
    db.add(fundo)
    db.commit()
    db.refresh(fundo)
    return fundo


@router.put("/{fundo_id}", response_model=FundoOut)
def actualizar_fundo(
    fundo_id: int,
    data: FundoUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    """Actualiza los datos de un fundo."""
    fundo = db.query(Fundo).filter(Fundo.id == fundo_id).first()
    if not fundo:
        raise HTTPException(status_code=404, detail="Fundo no encontrado")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(fundo, field, value)
    db.commit()
    db.refresh(fundo)
    return fundo


@router.delete("/{fundo_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_fundo(
    fundo_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    """Elimina un fundo (solo si no tiene contratos activos)."""
    fundo = db.query(Fundo).filter(Fundo.id == fundo_id).first()
    if not fundo:
        raise HTTPException(status_code=404, detail="Fundo no encontrado")
    if fundo.contratos:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar un fundo con contratos asociados"
        )
    db.delete(fundo)
    db.commit()
