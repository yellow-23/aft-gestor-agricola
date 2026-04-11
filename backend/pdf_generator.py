"""
Generador de PDFs con ReportLab.
Genera los 4 documentos legales para contratos de trabajo agrícola.
"""
import io
import zipfile
from datetime import date
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT

# Sueldo mínimo vigente (actualizar según corresponda)
SUELDO_MINIMO = 510000


def _styles():
    """Estilos base para todos los documentos."""
    base = getSampleStyleSheet()
    estilos = {
        "titulo": ParagraphStyle(
            "titulo", parent=base["Heading1"],
            fontSize=12, alignment=TA_CENTER, spaceAfter=6,
            fontName="Helvetica-Bold"
        ),
        "subtitulo": ParagraphStyle(
            "subtitulo", parent=base["Normal"],
            fontSize=10, alignment=TA_CENTER, spaceAfter=4,
            fontName="Helvetica-Bold"
        ),
        "normal": ParagraphStyle(
            "normal", parent=base["Normal"],
            fontSize=9, leading=14, spaceAfter=4,
            fontName="Helvetica"
        ),
        "justificado": ParagraphStyle(
            "justificado", parent=base["Normal"],
            fontSize=9, leading=14, spaceAfter=6,
            alignment=TA_JUSTIFY, fontName="Helvetica"
        ),
        "bold": ParagraphStyle(
            "bold", parent=base["Normal"],
            fontSize=9, leading=14,
            fontName="Helvetica-Bold"
        ),
        "firma": ParagraphStyle(
            "firma", parent=base["Normal"],
            fontSize=9, alignment=TA_CENTER,
            fontName="Helvetica"
        ),
        "small": ParagraphStyle(
            "small", parent=base["Normal"],
            fontSize=8, leading=12,
            fontName="Helvetica"
        ),
    }
    return estilos


def _firma_table(label1: str, label2: str):
    """Tabla de 2 firmas lado a lado."""
    firma_line = "_" * 30
    data = [
        [firma_line, firma_line],
        [label1, label2],
    ]
    t = Table(data, colWidths=[9 * cm, 9 * cm])
    t.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, 0), 20),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


def _formato_rut(rut: str) -> str:
    return rut.strip()


def _formato_sueldo(sueldo: float) -> str:
    return f"${int(sueldo):,}".replace(",", ".")


def _formato_fecha(d: date) -> str:
    meses = ["enero","febrero","marzo","abril","mayo","junio",
             "julio","agosto","septiembre","octubre","noviembre","diciembre"]
    return f"{d.day} de {meses[d.month - 1]} de {d.year}"


# ─── DOCUMENTO 1: CONTRATO DE TRABAJO POR FAENA ────────────────────────────

def generar_contrato(contrato, trabajador, fundo) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=LETTER,
        topMargin=1.5*cm, bottomMargin=1.5*cm,
        leftMargin=2*cm, rightMargin=2*cm
    )
    s = _styles()
    story = []

    # Encabezado
    story.append(Paragraph("AFT SERVICIOS SpA", s["titulo"]))
    story.append(Paragraph(f"RUT: {fundo.rut_empresa}", s["subtitulo"]))
    story.append(Spacer(1, 0.3*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.black))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("CONTRATO DE TRABAJO POR FAENA", s["titulo"]))
    story.append(Spacer(1, 0.3*cm))

    # Fecha y lugar
    fecha_str = _formato_fecha(contrato.fecha_ingreso)
    story.append(Paragraph(
        f"En {fundo.direccion}, a {fecha_str}, entre:", s["normal"]
    ))
    story.append(Spacer(1, 0.2*cm))

    # Empleador
    story.append(Paragraph("<b>EMPLEADOR:</b>", s["normal"]))
    rep = fundo.representante_legal or "Alberto Flores Villegas"
    story.append(Paragraph(
        f"<b>{fundo.nombre_empresa}</b>, RUT N° <b>{fundo.rut_empresa}</b>, "
        f"representada legalmente por don(ña) <b>{rep}</b>, "
        f"con domicilio en <b>{fundo.direccion}</b>, en adelante EL EMPLEADOR;",
        s["justificado"]
    ))
    story.append(Spacer(1, 0.2*cm))

    # Trabajador
    story.append(Paragraph("<b>TRABAJADOR:</b>", s["normal"]))
    story.append(Paragraph(
        f"Don(ña) <b>{trabajador.nombre_completo}</b>, "
        f"de nacionalidad <b>{trabajador.nacionalidad}</b>, "
        f"RUT N° <b>{_formato_rut(trabajador.rut)}</b>, "
        f"con domicilio en <b>{trabajador.direccion}</b>, "
        f"en adelante EL TRABAJADOR;",
        s["justificado"]
    ))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("Se ha convenido el siguiente contrato de trabajo:", s["normal"]))
    story.append(Spacer(1, 0.2*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    story.append(Spacer(1, 0.2*cm))

    clausulas = [
        (
            "PRIMERA: NATURALEZA DE LOS SERVICIOS",
            f"El TRABAJADOR se compromete y obliga a prestar servicios en calidad de "
            f"<b>TRABAJADOR AGRÍCOLA</b>, en la faena denominada <b>{contrato.actividad}</b>, "
            f"debiendo desempeñar todas las labores propias de dicha faena. El trabajador se "
            f"obliga a acatar las instrucciones del supervisor o jefe de faena y a cumplir con "
            f"las normas de seguridad establecidas."
        ),
        (
            "SEGUNDA: LUGAR DE TRABAJO",
            f"Los servicios se prestarán en <b>{fundo.nombre}</b>, ubicado en <b>{fundo.direccion}</b>. "
            f"Sin perjuicio de lo anterior, el EMPLEADOR podrá alterar, por causa justificada, la "
            f"naturaleza de los servicios o el sitio o recinto en que ellos deban prestarse, "
            f"con la limitación de que no se menoscabe al trabajador y que sea una tarea compatible."
        ),
        (
            "TERCERA: JORNADA DE TRABAJO",
            f"La jornada de trabajo será de <b>{contrato.horario}</b>. "
            f"La jornada no podrá exceder de 45 horas semanales. Los tiempos de colación no "
            f"serán imputables a la jornada de trabajo. El trabajador deberá cumplir con "
            f"la jornada en los términos señalados, sin perjuicio de las facultades del empleador "
            f"para modificarla según las necesidades de la faena."
        ),
        (
            "CUARTA: REMUNERACIÓN",
            f"El EMPLEADOR pagará al TRABAJADOR una remuneración mensual de "
            f"<b>{_formato_sueldo(contrato.sueldo)}</b> (pesos chilenos), "
            f"equivalente al ingreso mínimo mensual legal vigente. Dicha remuneración "
            f"será pagada mensualmente por períodos vencidos a través de transferencia "
            f"bancaria o en efectivo. De la remuneración se deducirán los descuentos legales "
            f"correspondientes (AFP, FONASA u ISAPRE, Seguro de Cesantía)."
        ),
        (
            "QUINTA: PREVISIÓN Y SALUD",
            "El TRABAJADOR declara afiliarse o estar afiliado al sistema de pensiones "
            "que corresponda (AFP). En caso de no indicar AFP, los descuentos se realizarán "
            "en la AFP que la ley determine. En materia de salud, el TRABAJADOR se acoge al "
            "sistema de FONASA, salvo que indique expresamente su afiliación a una ISAPRE."
        ),
        (
            "SEXTA: VIGENCIA DEL CONTRATO",
            f"El presente contrato regirá a contar del día <b>{fecha_str}</b> y tendrá "
            f"vigencia mientras dure la faena de <b>{contrato.actividad}</b>, de "
            f"conformidad a lo establecido en el artículo 159 N°5 del Código del Trabajo. "
            f"Una vez concluida la faena, el contrato terminará de pleno derecho."
        ),
        (
            "SÉPTIMA: OBLIGACIONES DEL TRABAJADOR",
            "El TRABAJADOR se obliga a: (a) Prestar los servicios con diligencia y esmero; "
            "(b) Cumplir las normas de seguridad e higiene establecidas en el Reglamento "
            "Interno y las instrucciones del empleador; (c) Usar y mantener en buen estado "
            "los elementos de protección personal (EPP) entregados; (d) No realizar "
            "actividades que puedan poner en riesgo su integridad o la de sus compañeros; "
            "(e) Informar oportunamente de cualquier accidente, enfermedad o situación "
            "que afecte su desempeño."
        ),
        (
            "OCTAVA: REGLAMENTO INTERNO",
            "El TRABAJADOR declara haber recibido un ejemplar del Reglamento Interno de "
            "Orden, Higiene y Seguridad de la empresa, comprometiéndose a conocerlo, "
            "respetarlo y cumplirlo en todas sus partes."
        ),
        (
            "NOVENA: LEGISLACIÓN APLICABLE",
            "En todo lo no previsto en el presente contrato, se aplicarán las disposiciones "
            "del Código del Trabajo y demás legislación laboral vigente en Chile. "
            "Las partes acuerdan que cualquier diferencia que se suscite será sometida "
            "a los Tribunales de Justicia competentes."
        ),
    ]

    for titulo_c, texto_c in clausulas:
        story.append(Paragraph(f"<b>{titulo_c}:</b>", s["bold"]))
        story.append(Paragraph(texto_c, s["justificado"]))
        story.append(Spacer(1, 0.15*cm))

    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        f"En fe de lo anterior, las partes firman el presente contrato en dos ejemplares "
        f"del mismo tenor, quedando uno en poder de cada parte, en {fundo.direccion}, "
        f"a {fecha_str}.",
        s["justificado"]
    ))
    story.append(Spacer(1, 1*cm))
    story.append(_firma_table(
        f"EMPLEADOR\n{fundo.nombre_empresa}\nRUT: {fundo.rut_empresa}",
        f"TRABAJADOR\n{trabajador.nombre_completo}\nRUT: {trabajador.rut}"
    ))

    doc.build(story)
    return buffer.getvalue()


# ─── DOCUMENTO 2: DECLARACIÓN JURADA D.S. N°44 ─────────────────────────────

def generar_ds44(contrato, trabajador, fundo) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=LETTER,
        topMargin=1.5*cm, bottomMargin=1.5*cm,
        leftMargin=2*cm, rightMargin=2*cm
    )
    s = _styles()
    story = []

    story.append(Paragraph("AFT SERVICIOS SpA", s["titulo"]))
    story.append(Paragraph(f"RUT: {fundo.rut_empresa}", s["subtitulo"]))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.black))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("DECLARACIÓN JURADA", s["titulo"]))
    story.append(Paragraph(
        "INFORMACIÓN DE RIESGOS LABORALES (D.S. N°44 DEL MINSAL)",
        s["subtitulo"]
    ))
    story.append(Spacer(1, 0.3*cm))

    fecha_str = _formato_fecha(contrato.fecha_ingreso)
    story.append(Paragraph(
        f"En <b>{fundo.direccion}</b>, a {fecha_str}, "
        f"Yo <b>{trabajador.nombre_completo}</b>, RUT N° <b>{trabajador.rut}</b>, "
        f"trabajador(a) de la empresa <b>{fundo.nombre_empresa}</b>, "
        f"declaro haber sido informado(a) de los riesgos asociados a las labores "
        f"que desarrollaré en la faena <b>{contrato.actividad}</b>, en conformidad "
        f"al Decreto Supremo N°44 del Ministerio de Salud.",
        s["justificado"]
    ))
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("<b>RIESGOS IDENTIFICADOS EN LA FAENA AGRÍCOLA:</b>", s["bold"]))
    story.append(Spacer(1, 0.2*cm))

    riesgos = [
        ("Caídas al mismo o distinto nivel",
         "Uso de calzado de seguridad antideslizante. Mantener orden en el lugar de trabajo."),
        ("Exposición a plaguicidas y agroquímicos",
         "Uso de EPP (guantes, mascarilla, lentes). No ingresar a áreas recién fumigadas."),
        ("Golpes y cortes con herramientas (tijeras de poda, machetes)",
         "Uso correcto de herramientas. Guantes de corte. Capacitación en uso seguro."),
        ("Exposición a radiación UV solar",
         "Uso de sombrero/jocky, manga larga, bloqueador solar. Hidratación frecuente."),
        ("Sobreesfuerzo y posturas forzadas",
         "Técnicas correctas de levantamiento. Pausas activas. Rotación de tareas."),
        ("Picaduras de insectos y animales ponzoñosos",
         "Revisión del entorno antes de trabajar. Uso de ropa adecuada. Botiquín en faena."),
        ("Deshidratación y golpe de calor",
         "Agua potable disponible. Descanso en sombra. Reporte inmediato de síntomas."),
        ("Riesgos de tránsito (maquinaria, vehículos)",
         "Respetar señalética. No atravesar zonas de maquinaria. Chalecos reflectantes."),
    ]

    for riesgo, medida in riesgos:
        data = [[f"• {riesgo}", f"→ {medida}"]]
        t = Table(data, colWidths=[8*cm, 10*cm])
        t.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("LEFTPADDING", (0, 0), (0, -1), 5),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
        ]))
        story.append(t)

    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph(
        "El(la) suscrito(a) declara haber recibido la información anterior de manera clara "
        "y comprensible, comprometiéndose a cumplir con todas las medidas preventivas "
        "indicadas y a utilizar correctamente los elementos de protección personal entregados.",
        s["justificado"]
    ))
    story.append(Spacer(1, 0.8*cm))
    story.append(_firma_table(
        f"EMPLEADOR\n{fundo.nombre_empresa}",
        f"TRABAJADOR\n{trabajador.nombre_completo}\nRUT: {trabajador.rut}"
    ))

    doc.build(story)
    return buffer.getvalue()


# ─── DOCUMENTO 3: ENTREGA REGLAMENTO INTERNO ────────────────────────────────

def generar_reglamento(contrato, trabajador, fundo) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=LETTER,
        topMargin=1.5*cm, bottomMargin=1.5*cm,
        leftMargin=2*cm, rightMargin=2*cm
    )
    s = _styles()
    story = []

    story.append(Paragraph("AFT SERVICIOS SpA", s["titulo"]))
    story.append(Paragraph(f"RUT: {fundo.rut_empresa}", s["subtitulo"]))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.black))
    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph(
        "REGISTRO DE ENTREGA DE REGLAMENTO INTERNO\nDE ORDEN, HIGIENE Y SEGURIDAD",
        s["titulo"]
    ))
    story.append(Spacer(1, 0.4*cm))

    fecha_str = _formato_fecha(contrato.fecha_ingreso)
    story.append(Paragraph(
        f"En <b>{fundo.direccion}</b>, a {fecha_str}, la empresa "
        f"<b>{fundo.nombre_empresa}</b> (RUT {fundo.rut_empresa}) hace "
        f"entrega formal a:",
        s["justificado"]
    ))
    story.append(Spacer(1, 0.3*cm))

    # Datos del trabajador en tabla
    data_trabajador = [
        ["Nombre completo:", trabajador.nombre_completo],
        ["RUT:", trabajador.rut],
        ["Nacionalidad:", trabajador.nacionalidad],
        ["Dirección:", trabajador.direccion],
        ["Faena:", contrato.actividad],
        ["Fecha de ingreso:", fecha_str],
    ]
    t = Table(data_trabajador, colWidths=[5*cm, 13*cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#f0f0f0"), colors.white]),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.4*cm))

    story.append(Paragraph(
        "Un ejemplar del <b>Reglamento Interno de Orden, Higiene y Seguridad</b> "
        "de la empresa, de conformidad a lo establecido en los artículos 153 y "
        "siguientes del Código del Trabajo y el Decreto Supremo N°40 del Ministerio "
        "del Trabajo y Previsión Social.",
        s["justificado"]
    ))
    story.append(Spacer(1, 0.3*cm))

    items = [
        "El Reglamento Interno contiene las normas de orden, higiene y seguridad que rigen en la empresa.",
        "El trabajador se compromete a leer, conocer y cumplir íntegramente su contenido.",
        "El incumplimiento de las disposiciones del Reglamento Interno podrá ser causal de "
        "las sanciones contempladas en el mismo o incluso de término del contrato de trabajo.",
        "Este documento queda en poder del empleador como constancia de la entrega.",
    ]

    for item in items:
        story.append(Paragraph(f"• {item}", s["justificado"]))

    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(
        f"El(la) trabajador(a) firma la presente constancia, declarando haber recibido "
        f"el Reglamento Interno en la fecha indicada.",
        s["justificado"]
    ))
    story.append(Spacer(1, 1*cm))
    story.append(_firma_table(
        f"EMPLEADOR\n{fundo.nombre_empresa}",
        f"TRABAJADOR\n{trabajador.nombre_completo}\nRUT: {trabajador.rut}"
    ))

    doc.build(story)
    return buffer.getvalue()


# ─── DOCUMENTO 4: ACTA ENTREGA EPP ─────────────────────────────────────────

def generar_epp(contrato, trabajador, fundo) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=LETTER,
        topMargin=1.5*cm, bottomMargin=1.5*cm,
        leftMargin=2*cm, rightMargin=2*cm
    )
    s = _styles()
    story = []

    story.append(Paragraph("AFT SERVICIOS SpA", s["titulo"]))
    story.append(Paragraph(f"RUT: {fundo.rut_empresa}", s["subtitulo"]))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.black))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "ACTA DE ENTREGA DE ELEMENTOS DE PROTECCIÓN PERSONAL (EPP)",
        s["titulo"]
    ))
    story.append(Spacer(1, 0.3*cm))

    fecha_str = _formato_fecha(contrato.fecha_ingreso)
    story.append(Paragraph(
        f"En <b>{fundo.direccion}</b>, a {fecha_str}, la empresa "
        f"<b>{fundo.nombre_empresa}</b> hace entrega al trabajador que a "
        f"continuación se identifica, de los elementos de protección personal "
        f"indicados, de conformidad a la Ley N°16.744 y al D.S. N°594:",
        s["justificado"]
    ))
    story.append(Spacer(1, 0.2*cm))

    # Datos trabajador
    data_t = [
        ["Nombre:", trabajador.nombre_completo, "RUT:", trabajador.rut],
        ["Faena:", contrato.actividad, "Fecha ingreso:", fecha_str],
    ]
    t = Table(data_t, colWidths=[3*cm, 8*cm, 3*cm, 5*cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (0, 2), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8f8f8")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.3*cm))

    # EPP entregado
    story.append(Paragraph("<b>ELEMENTOS DE PROTECCIÓN PERSONAL ENTREGADOS:</b>", s["bold"]))
    story.append(Spacer(1, 0.1*cm))

    # Parsear EPP del contrato (puede ser lista separada por comas o líneas)
    epp_raw = contrato.epp_entregado or ""
    epp_items = [e.strip() for e in epp_raw.replace("\n", ",").split(",") if e.strip()]

    # EPP estándar agrícola si no hay ninguno especificado
    epp_default = [
        "Sombrero o jocky de trabajo",
        "Guantes de cuero o nitrilo",
        "Zapatos de seguridad / zapatillas con punta reforzada",
        "Chaleco reflectante",
        "Mascarilla antipolvo (KN95 o similar)",
        "Lentes de seguridad",
    ]

    todos_epp = epp_items if epp_items else epp_default

    # Tabla de EPP con columnas: N°, EPP, Cantidad, Estado, Firma recepción
    header = [["N°", "Elemento de Protección Personal", "Cant.", "Estado", "Conforme"]]
    rows = []
    for i, epp in enumerate(todos_epp, 1):
        rows.append([str(i), epp, "1", "Nuevo", ""])
    # Filas en blanco adicionales
    for i in range(len(todos_epp) + 1, len(todos_epp) + 4):
        rows.append([str(i), "", "1", "", ""])

    data_epp = header + rows
    t_epp = Table(data_epp, colWidths=[1*cm, 9*cm, 1.5*cm, 3*cm, 3.5*cm])
    t_epp.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2d6a4f")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (2, 0), (2, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("MINROWHEIGHT", (0, 1), (-1, -1), 18),
    ]))
    story.append(t_epp)
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph(
        "El(la) trabajador(a) declara haber recibido los elementos de protección personal "
        "indicados en buen estado, comprometiéndose a utilizarlos obligatoriamente durante "
        "el desempeño de sus labores, mantenerlos en buen estado, y reportar cualquier "
        "deterioro o pérdida a la brevedad. El incumplimiento de esta obligación podrá "
        "ser sancionado según lo dispuesto en el Reglamento Interno.",
        s["justificado"]
    ))
    story.append(Spacer(1, 0.8*cm))
    story.append(_firma_table(
        f"EMPLEADOR\n{fundo.nombre_empresa}",
        f"TRABAJADOR\n{trabajador.nombre_completo}\nRUT: {trabajador.rut}"
    ))

    doc.build(story)
    return buffer.getvalue()


# ─── GENERAR ZIP CON TODOS LOS DOCUMENTOS ──────────────────────────────────

def generar_todos_los_documentos(contrato, trabajador, fundo) -> bytes:
    """Genera un ZIP con los 4 documentos PDF."""
    buffer = io.BytesIO()
    nombre = f"{trabajador.apellidos}_{trabajador.nombres}".replace(" ", "_")

    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"1_Contrato_{nombre}.pdf", generar_contrato(contrato, trabajador, fundo))
        zf.writestr(f"2_DSN44_{nombre}.pdf", generar_ds44(contrato, trabajador, fundo))
        zf.writestr(f"3_Reglamento_{nombre}.pdf", generar_reglamento(contrato, trabajador, fundo))
        zf.writestr(f"4_EPP_{nombre}.pdf", generar_epp(contrato, trabajador, fundo))

    return buffer.getvalue()
