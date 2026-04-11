from sqlalchemy import Column, Integer, String, Date, Float, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Fundo(Base):
    __tablename__ = "fundos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    direccion = Column(String, nullable=False)
    representante_legal = Column(String, nullable=True)
    rut_empresa = Column(String, default="77.605.354-6")
    nombre_empresa = Column(String, default="AFT Servicios SpA")
    created_at = Column(DateTime, server_default=func.now())

    contratos = relationship("Contrato", back_populates="fundo")


class Trabajador(Base):
    __tablename__ = "trabajadores"

    id = Column(Integer, primary_key=True, index=True)
    nombres = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    rut = Column(String, nullable=False, unique=True, index=True)
    nacionalidad = Column(String, default="Chilena")
    direccion = Column(String, nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    sexo = Column(String, nullable=False)  # M / F
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    contratos = relationship("Contrato", back_populates="trabajador")

    @property
    def nombre_completo(self):
        return f"{self.nombres} {self.apellidos}"


class Contrato(Base):
    __tablename__ = "contratos"

    id = Column(Integer, primary_key=True, index=True)
    trabajador_id = Column(Integer, ForeignKey("trabajadores.id"), nullable=False)
    fundo_id = Column(Integer, ForeignKey("fundos.id"), nullable=False)
    fecha_ingreso = Column(Date, nullable=False)
    actividad = Column(String, nullable=False)  # ej: "Poda 2025"
    horario = Column(String, nullable=False)     # ej: "Lunes a Sábado 08:00-17:00"
    sueldo = Column(Float, nullable=False, default=510000)
    epp_entregado = Column(Text, nullable=True)  # JSON string o texto separado por comas
    created_at = Column(DateTime, server_default=func.now())

    trabajador = relationship("Trabajador", back_populates="contratos")
    fundo = relationship("Fundo", back_populates="contratos")
