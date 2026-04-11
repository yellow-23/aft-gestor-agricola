from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from database import get_db
from models import Contrato, Trabajador, Fundo
from schemas import ContratoCreate, ContratoUpdate, ContratoOut
from auth import verify_token
from pdf_generator import (
    generar_todos_los_documentos,
    generar_contrato,
    generar_ds44,
    generar_reglamento,
    generar_epp,
)
from typing import List
import io

router = APIRouter(prefix="/contratos", tags=["Contratos"])


@router.get("/", response_model=List[ContratoOut])
def listar_contratos(
    trabajador_id: int = None,
    fundo_id: int = None,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    """Lista contratos. Filtra opcionalmente por trabajador o fundo."""
    query = db.query(Contrato)
    if trabajador_id:
        query = query.filter(Contrato.trabajador_id == trabajador_id)
    if fundo_id:
        query = query.filter(Contrato.fundo_id == fundo_id)
    return query.order_by(Contrato.created_at.desc()).all()


@router.get("/{contrato_id}", response_model=ContratoOut)
def obtener_contrato(
    contrato_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    contrato = db.query(Contrato).filter(Contrato.id == contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    return contrato


@router.post("/", response_model=ContratoOut, status_code=status.HTTP_201_CREATED)
def crear_contrato(
    data: ContratoCreate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    """Crea un nuevo contrato de trabajo."""
    trabajador = db.query(Trabajador).filter(Trabajador.id == data.trabajador_id).first()
    if not trabajador:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")

    fundo = db.query(Fundo).filter(Fundo.id == data.fundo_id).first()
    if not fundo:
        raise HTTPException(status_code=404, detail="Fundo no encontrado")

    contrato = Contrato(**data.dict())
    db.add(contrato)
    db.commit()
    db.refresh(contrato)
    return contrato


@router.put("/{contrato_id}", response_model=ContratoOut)
def actualizar_contrato(
    contrato_id: int,
    data: ContratoUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    contrato = db.query(Contrato).filter(Contrato.id == contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(contrato, field, value)
    db.commit()
    db.refresh(contrato)
    return contrato


@router.delete("/{contrato_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_contrato(
    contrato_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    contrato = db.query(Contrato).filter(Contrato.id == contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    db.delete(contrato)
    db.commit()


# ─── ENDPOINTS DE GENERACIÓN DE PDF ────────────────────────────────────────

def _get_contrato_o_404(contrato_id: int, db: Session):
    contrato = db.query(Contrato).filter(Contrato.id == contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    return contrato


@router.get("/{contrato_id}/pdfs/todos", summary="Descarga ZIP con los 4 documentos")
def descargar_todos_pdfs(
    contrato_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    """Genera y descarga un ZIP con los 4 documentos legales del contrato."""
    contrato = _get_contrato_o_404(contrato_id, db)
    nombre = f"{contrato.trabajador.apellidos}_{contrato.trabajador.nombres}".replace(" ", "_")
    pdf_bytes = generar_todos_los_documentos(contrato, contrato.trabajador, contrato.fundo)
    return Response(
        content=pdf_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=Documentos_{nombre}.zip"}
    )


@router.get("/{contrato_id}/pdfs/contrato", summary="Descarga PDF del contrato de trabajo")
def descargar_contrato_pdf(
    contrato_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    contrato = _get_contrato_o_404(contrato_id, db)
    nombre = f"{contrato.trabajador.apellidos}_{contrato.trabajador.nombres}".replace(" ", "_")
    pdf_bytes = generar_contrato(contrato, contrato.trabajador, contrato.fundo)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=Contrato_{nombre}.pdf"}
    )


@router.get("/{contrato_id}/pdfs/ds44", summary="Descarga PDF Declaración D.S. N°44")
def descargar_ds44_pdf(
    contrato_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    contrato = _get_contrato_o_404(contrato_id, db)
    nombre = f"{contrato.trabajador.apellidos}_{contrato.trabajador.nombres}".replace(" ", "_")
    pdf_bytes = generar_ds44(contrato, contrato.trabajador, contrato.fundo)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=DSN44_{nombre}.pdf"}
    )


@router.get("/{contrato_id}/pdfs/reglamento", summary="Descarga PDF Entrega Reglamento Interno")
def descargar_reglamento_pdf(
    contrato_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    contrato = _get_contrato_o_404(contrato_id, db)
    nombre = f"{contrato.trabajador.apellidos}_{contrato.trabajador.nombres}".replace(" ", "_")
    pdf_bytes = generar_reglamento(contrato, contrato.trabajador, contrato.fundo)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=Reglamento_{nombre}.pdf"}
    )


@router.get("/{contrato_id}/pdfs/epp", summary="Descarga PDF Acta Entrega EPP")
def descargar_epp_pdf(
    contrato_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token)
):
    contrato = _get_contrato_o_404(contrato_id, db)
    nombre = f"{contrato.trabajador.apellidos}_{contrato.trabajador.nombres}".replace(" ", "_")
    pdf_bytes = generar_epp(contrato, contrato.trabajador, contrato.fundo)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=EPP_{nombre}.pdf"}
    )
