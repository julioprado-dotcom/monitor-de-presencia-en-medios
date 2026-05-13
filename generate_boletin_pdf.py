#!/usr/bin/env python3
"""
Generador PDF — Boletín del Grano #1
DECODEX Bolivia / ONION200 v0.16.0
Semana 20 — 11 al 17 de mayo de 2026
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, Color, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Frame, PageTemplate, BaseDocTemplate, KeepTogether
)
from reportlab.pdfgen import canvas
from reportlab.platypus.flowables import Flowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
from datetime import datetime

# ── Register Fonts ──
pdfmetrics.registerFont(TTFont('NotoSerif', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerif-Bold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerif-Italic', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-VariableFont_wght.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSans', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSans-Bold', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSerif', '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSerif-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'))

# ── Coffee Color Palette ──
HEADER_BG = HexColor('#3e2723')
ACCENT = HexColor('#6d4c41')
ACCENT2 = HexColor('#4e342e')
BORDER = HexColor('#bcaaa4')
TEXT_COLOR = HexColor('#1b1a17')
MUTED = HexColor('#8d7b74')
BG = HexColor('#faf6f1')
SURFACE = HexColor('#f0ebe3')
HIGHLIGHT = HexColor('#fff8e1')
TENSION_ALTA = HexColor('#c62828')
TENSION_MEDIA = HexColor('#ef6c00')
TENSION_BAJA = HexColor('#2e7d32')

# ── Custom Flowable: Colored Line ──
class ColoredLine(Flowable):
    def __init__(self, width, height=1, color=BORDER):
        Flowable.__init__(self)
        self.width = width
        self.height = height
        self.color = color
    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setFillColor(self.color)
        self.canv.rect(0, 0, self.width, self.height, fill=1, stroke=0)

class AccentBox(Flowable):
    def __init__(self, width, height, color=ACCENT):
        Flowable.__init__(self)
        self.width = width
        self.height = height
        self.color = color
    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.rect(0, 0, self.width, self.height, fill=1, stroke=0)

class CircleNumber(Flowable):
    def __init__(self, number, size=18, bg_color=HEADER_BG, text_color=white):
        Flowable.__init__(self)
        self.number = str(number)
        self.size = size
        self.bg_color = bg_color
        self.text_color = text_color
        self.width = size
        self.height = size
    def draw(self):
        r = self.size / 2
        self.canv.setFillColor(self.bg_color)
        self.canv.circle(r, r, r, fill=1, stroke=0)
        self.canv.setFillColor(self.text_color)
        self.canv.setFont('LiberationSans-Bold', 9)
        tw = self.canv.stringWidth(self.number, 'LiberationSans-Bold', 9)
        self.canv.drawString(r - tw/2, r - 3, self.number)

# ── Styles ──
styles = getSampleStyleSheet()

style_body = ParagraphStyle(
    'BodyCustom', parent=styles['Normal'],
    fontName='DejaVuSerif', fontSize=9.5, leading=14,
    textColor=TEXT_COLOR, alignment=TA_JUSTIFY,
    spaceAfter=6
)

style_section_title = ParagraphStyle(
    'SectionTitle', parent=styles['Normal'],
    fontName='LiberationSans-Bold', fontSize=13, leading=16,
    textColor=HEADER_BG, spaceBefore=14, spaceAfter=8,
    borderColor=ACCENT, borderWidth=0, borderPadding=0,
)

style_resumen = ParagraphStyle(
    'Resumen', parent=styles['Normal'],
    fontName='DejaVuSerif', fontSize=10, leading=15,
    textColor=TEXT_COLOR, alignment=TA_JUSTIFY,
    leftIndent=12, rightIndent=8,
    spaceAfter=8
)

style_noticia_title = ParagraphStyle(
    'NoticiaTitle', parent=styles['Normal'],
    fontName='LiberationSans-Bold', fontSize=10, leading=13,
    textColor=TEXT_COLOR, spaceAfter=4
)

style_noticia_meta = ParagraphStyle(
    'NoticiaMeta', parent=styles['Normal'],
    fontName='LiberationSans', fontSize=7.5, leading=10,
    textColor=MUTED, spaceAfter=4
)

style_noticia_body = ParagraphStyle(
    'NoticiaBody', parent=styles['Normal'],
    fontName='DejaVuSerif', fontSize=9, leading=13,
    textColor=TEXT_COLOR, alignment=TA_JUSTIFY,
    spaceAfter=6
)

style_analisis = ParagraphStyle(
    'Analisis', parent=styles['Normal'],
    fontName='DejaVuSerif', fontSize=9.5, leading=14.5,
    textColor=TEXT_COLOR, alignment=TA_JUSTIFY,
    leftIndent=12, rightIndent=8,
    spaceAfter=6
)

style_footer = ParagraphStyle(
    'Footer', parent=styles['Normal'],
    fontName='LiberationSans', fontSize=7, leading=9,
    textColor=MUTED, alignment=TA_CENTER,
)

style_stat_label = ParagraphStyle(
    'StatLabel', parent=styles['Normal'],
    fontName='LiberationSans', fontSize=7.5, leading=10,
    textColor=MUTED, alignment=TA_CENTER,
)

style_stat_value = ParagraphStyle(
    'StatValue', parent=styles['Normal'],
    fontName='LiberationSans-Bold', fontSize=20, leading=24,
    textColor=HEADER_BG, alignment=TA_CENTER,
)

style_stat_value_sm = ParagraphStyle(
    'StatValueSm', parent=styles['Normal'],
    fontName='LiberationSans-Bold', fontSize=13, leading=16,
    textColor=HEADER_BG, alignment=TA_CENTER,
)

style_metodo = ParagraphStyle(
    'Metodo', parent=styles['Normal'],
    fontName='DejaVuSerif', fontSize=8.5, leading=13,
    textColor=TEXT_COLOR, alignment=TA_JUSTIFY,
    spaceAfter=4
)

style_metodo_title = ParagraphStyle(
    'MetodoTitle', parent=styles['Normal'],
    fontName='LiberationSans-Bold', fontSize=9, leading=12,
    textColor=HEADER_BG, spaceBefore=10, spaceAfter=4,
)

style_watermark = ParagraphStyle(
    'Watermark', parent=styles['Normal'],
    fontName='LiberationSans', fontSize=6, leading=8,
    textColor=MUTED, alignment=TA_RIGHT,
)

style_bullet = ParagraphStyle(
    'Bullet', parent=styles['Normal'],
    fontName='DejaVuSerif', fontSize=8.5, leading=12,
    textColor=TEXT_COLOR, leftIndent=18, bulletIndent=6,
    spaceAfter=2
)

# ── Helper Functions ──
def section_header(number, title, content_width):
    """Creates a section header with numbered circle and line"""
    elements = []
    row = Table(
        [[CircleNumber(number), Paragraph(title, style_section_title)]],
        colWidths=[20, content_width - 24]
    )
    row.setStyle(TableStyle([
        ('VALIGN', (0, 0), (0, 0), 'MIDDLE'),
        ('VALIGN', (1, 0), (1, 0), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(row)
    elements.append(ColoredLine(content_width, 2, ACCENT))
    elements.append(Spacer(1, 8))
    return elements

def tension_badge(tension):
    """Creates a colored tension badge"""
    colors = {
        'ALTA': (TENSION_ALTA, HexColor('#c6282820')),
        'MEDIA': (TENSION_MEDIA, HexColor('#ef6c0020')),
        'BAJA': (TENSION_BAJA, HexColor('#2e7d3220')),
    }
    fg, bg = colors.get(tension, (MUTED, BG))
    style = ParagraphStyle('Badge', fontName='LiberationSans-Bold', fontSize=8,
                           textColor=fg, alignment=TA_CENTER, leading=12)
    return Paragraph(tension, style)

def eje_tag(nombre):
    style = ParagraphStyle('EjeTag', fontName='LiberationSans', fontSize=7,
                           textColor=ACCENT2, alignment=TA_CENTER, leading=10)
    return Paragraph(nombre, style)

# ── Page Templates ──
def cover_page(canvas, doc):
    canvas.saveState()
    w, h = A4

    # Background gradient
    steps = 60
    for i in range(steps):
        ratio = i / steps
        r = 0.243 * (1 - ratio) + 0.306 * ratio
        g = 0.153 * (1 - ratio) + 0.204 * ratio
        b = 0.137 * (1 - ratio) + 0.254 * ratio
        color = Color(r, g, b)
        canvas.setFillColor(color)
        y = h - (h * (i + 1) / steps)
        canvas.rect(0, y, w, h / steps + 1, fill=1, stroke=0)

    # Subtle radial effects
    canvas.setFillColor(Color(1, 1, 1, 0.03))
    canvas.circle(w * 0.2, h * 0.2, 200, fill=1, stroke=0)
    canvas.setFillColor(Color(1, 1, 1, 0.05))
    canvas.circle(w * 0.8, h * 0.8, 250, fill=1, stroke=0)

    # Coffee cup icon
    canvas.setFillColor(Color(1, 1, 1, 0.85))
    canvas.setFont('DejaVuSans-Bold', 42)
    icon = '\u2615'
    tw = canvas.stringWidth(icon, 'DejaVuSans-Bold', 42)
    canvas.drawString((w - tw) / 2, h * 0.68, icon)

    # Title
    canvas.setFillColor(white)
    canvas.setFont('LiberationSans-Bold', 32)
    title = 'BOLET\u00cdN DEL GRANO'
    tw = canvas.stringWidth(title, 'LiberationSans-Bold', 32)
    canvas.drawString((w - tw) / 2, h * 0.57, title)

    # Subtitle
    canvas.setFont('DejaVuSerif', 13)
    canvas.setFillColor(Color(1, 1, 1, 0.85))
    subtitle = 'Caf\u00e9 de Especialidad Bolivia \u2014 An\u00e1lisis Semanal'
    tw = canvas.stringWidth(subtitle, 'DejaVuSerif', 13)
    canvas.drawString((w - tw) / 2, h * 0.52, subtitle)

    # Separator line
    canvas.setStrokeColor(Color(1, 1, 1, 0.3))
    canvas.setLineWidth(0.5)
    canvas.line(w * 0.25, h * 0.47, w * 0.75, h * 0.47)

    # Period
    canvas.setFont('LiberationSans-Bold', 12)
    canvas.setFillColor(Color(1, 1, 1, 0.9))
    periodo = '11 al 17 de mayo de 2026'
    tw = canvas.stringWidth(periodo, 'LiberationSans-Bold', 12)
    canvas.drawString((w - tw) / 2, h * 0.41, periodo)

    # Week info
    canvas.setFont('LiberationSans', 10)
    canvas.setFillColor(Color(1, 1, 1, 0.65))
    semana = 'Semana 20  \u2022  Edici\u00f3n 1  \u2022  Versi\u00f3n 0.16.0'
    tw = canvas.stringWidth(semana, 'LiberationSans', 10)
    canvas.drawString((w - tw) / 2, h * 0.37, semana)

    # Tension badge
    canvas.setFillColor(HexColor('#ef6c00'))
    canvas.roundRect(w/2 - 55, h * 0.28, 110, 28, 14, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont('LiberationSans-Bold', 11)
    tension = 'TENSI\u00d3N MEDIA'
    tw = canvas.stringWidth(tension, 'LiberationSans-Bold', 11)
    canvas.drawString((w - tw) / 2, h * 0.291, tension)

    # Bottom mark
    canvas.setFont('LiberationSans', 8)
    canvas.setFillColor(Color(1, 1, 1, 0.4))
    mark = 'DECODEX Bolivia \u2014 decodexbolivia.org'
    tw = canvas.stringWidth(mark, 'LiberationSans', 8)
    canvas.drawString((w - tw) / 2, 30, mark)

    canvas.restoreState()

def normal_page(canvas, doc):
    canvas.saveState()
    w, h = A4

    # Header line
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(0.5)
    canvas.line(15*mm, h - 12*mm, w - 15*mm, h - 12*mm)

    # Header text
    canvas.setFont('LiberationSans', 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(15*mm, h - 11*mm, 'DECODEX Bolivia')
    canvas.drawRightString(w - 15*mm, h - 11*mm, 'Bolet\u00edn del Grano \u2014 Semana 20')

    # Footer
    canvas.setStrokeColor(BORDER)
    canvas.line(15*mm, 15*mm, w - 15*mm, 15*mm)
    canvas.setFont('LiberationSans', 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(15*mm, 10*mm, 'BOLET\u00cdN DEL GRANO \u2014 Caf\u00e9 de Especialidad Bolivia')
    canvas.drawRightString(w - 15*mm, 10*mm, f'P\u00e1gina {doc.page}')
    canvas.drawCentredString(w/2, 10*mm, 'DECODEX Bolivia \u2014 decodexbolivia.org')

    canvas.restoreState()


# ── Build Document ──
output_path = '/home/z/my-project/download/BoletinDelGrano_Semana20_Edicion1.pdf'
os.makedirs(os.path.dirname(output_path), exist_ok=True)

doc = BaseDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=15*mm,
    rightMargin=15*mm,
    topMargin=18*mm,
    bottomMargin=20*mm,
    title='Boletin del Grano - Semana 20 - Edicion 1',
    author='DECODEX Bolivia',
    subject='Cafe de Especialidad Bolivia - Analisis Semanal'
)

content_width = A4[0] - 30*mm

# Cover page frame (no margins - canvas draws everything)
cover_frame = Frame(0, 0, A4[0], A4[1], id='cover')
# Content frame
content_frame = Frame(15*mm, 20*mm, content_width, A4[1] - 38*mm, id='content')

doc.addPageTemplates([
    PageTemplate(id='Cover', frames=[cover_frame], onPage=cover_page),
    PageTemplate(id='Content', frames=[content_frame], onPage=normal_page),
])

# ── Content Elements ──
story = []

# Cover page (empty - canvas draws everything)
story.append(Spacer(1, 1))
story.append(PageBreak())

# Switch to content template
from reportlab.platypus.doctemplate import NextPageTemplate
story.insert(1, NextPageTemplate('Content'))

# ══════════════════════════════════════════════
# SECCI\u00d3N 2: RESUMEN EJECUTIVO
# ══════════════════════════════════════════════
story.extend(section_header(2, 'RESUMEN EJECUTIVO', content_width))

resumen_text = """Durante la semana 20 del presente a\u00f1o, el monitoreo de DECODEX Bolivia capt\u00f3 un total de 57 menciones clasificadas bajo el Lente de Caf\u00e9 y Econom\u00edas Regionales, distribuidas en 10 fuentes informativas de distinta naturaleza: medios especializados internacionales, c\u00e1maras empresariales, organismos internacionales del sector cafetero y medios nacionales bolivianos. El volumen de informaci\u00f3n recopilada evidencia una actividad moderada en el \u00e1mbito cafetero, con \u00e9nfasis en la din\u00e1mica de precios internacionales, las innovaciones tecnol\u00f3gicas en procesamiento y las tendencias globales de consumo de caf\u00e9 de especialidad.

El precio internacional del caf\u00e9 ar\u00e1bica (Contrato C) se ubic\u00f3 en 288,80 centavos de d\u00f3lar por libra al 6 de mayo de 2026, seg\u00fan datos del IBCE. Este nivel de cotizaci\u00f3n refleja la persistencia de presiones alcistas en el mercado global, vinculadas a factores clim\u00e1ticos en las principales regiones productoras y a una demanda sostenida en los mercados de especialidad. Para Bolivia, este contexto de precios relativamente elevados representa una oportunidad para los productores nacionales que logran acceder a los canales de caf\u00e9 de especialidad, aunque persisten desaf\u00edos log\u00edsticos y de escala productiva.

Desde la perspectiva nacional, la agenda ca\u00f1era y agroindustrial de la regi\u00f3n de Santa Cruz \u2014particularmente las actividades de los ingenios Guabir\u00e1, UNAGRO, Agua\u00ed y La B\u00e9lgica\u2014 mantuvo presencia en la cobertura informativa, con notas sobre diversificaci\u00f3n hacia biocombustibles y alianzas estrat\u00e9gicas con empresarios brasile\u00f1os. La conexi\u00f3n entre la agroindustria regional y las econom\u00edas cafeteras bolivianas, aunque indirecta en varios de los registros capturados, sugiere una din\u00e1mica econ\u00f3mica regional interconectada que merece seguimiento."""

for para in resumen_text.strip().split('\n\n'):
    story.append(Paragraph(para.strip(), style_resumen))

story.append(Spacer(1, 8))

# ══════════════════════════════════════════════
# SECCI\u00d3N 3: ESTAD\u00cdSTICAS CLAVE
# ══════════════════════════════════════════════
story.extend(section_header(3, 'ESTAD\u00cdSTICAS CLAVE', content_width))

stats_data = [
    ('57', 'Menciones\nCapturadas'),
    ('10', 'Fuentes\nMonitoreadas'),
    ('8', 'Ejes\nActivados'),
    ('MEDIA', 'Nivel de\nActividad'),
    ('288,80', 'Precio C-Market\n(\u00a2US$/lb)'),
    ('Estable', 'Tendencia\nSemanal'),
]

stat_cells = []
for val, label in stats_data:
    is_text = not val.replace('.', '').replace(',', '').isdigit()
    cell_content = [
        Paragraph(val, style_stat_value_sm if is_text else style_stat_value),
        Paragraph(label.replace('\n', '<br/>'), style_stat_label),
    ]
    stat_cells.append(cell_content)

stat_table = Table(
    [stat_cells],
    colWidths=[content_width / 6] * 6,
    rowHeights=[None]
)
stat_table.setStyle(TableStyle([
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('LEFTPADDING', (0, 0), (-1, -1), 4),
    ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ('BACKGROUND', (0, 0), (-1, -1), BG),
    ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
    ('LINEBEFORE', (1, 0), (-1, -1), 0.3, BORDER),
    ('LINEBEFORE', (2, 0), (2, -1), 0.3, BORDER),
    ('LINEBEFORE', (3, 0), (3, -1), 0.3, BORDER),
    ('LINEBEFORE', (4, 0), (4, -1), 0.3, BORDER),
    ('LINEBEFORE', (5, 0), (5, -1), 0.3, BORDER),
    ('ROUNDEDCORNERS', [4, 4, 4, 4]),
]))
story.append(stat_table)
story.append(Spacer(1, 12))

# ══════════════════════════════════════════════
# SECCI\u00d3N 4: MAPA DE TENSIONES
# ══════════════════════════════════════════════
story.extend(section_header(4, 'MAPA DE TENSIONES', content_width))

ejes_data = [
    ('Geopol\u00edtica y Relaciones Internacionales', 89, 51, '\u2191'),
    ('Gobierno, Poder e Instituciones', 32, 18, '\u2192'),
    ('Procesos Electorales y Democracia', 28, 16, '\u2192'),
    ('Movilizaci\u00f3n Social y Acci\u00f3n Colectiva', 25, 14, '\u2191'),
    ('Econom\u00eda, Pol\u00edtica Econ\u00f3mica y Empleo', 23, 13, '\u2192'),
    ('Recursos Naturales y Modelo de Desarrollo', 21, 12, '\u2192'),
    ('Salud, Educaci\u00f3n y Servicios P\u00fablicos', 19, 11, '\u2193'),
    ('Territorio, Poblaci\u00f3n y Derechos Colectivos', 5, 3, '\u2192'),
    ('Justicia, Derechos Humanos e Impunidad', 4, 2, '\u2192'),
]

# Header
ejes_header = [
    Paragraph('<b>Eje Tem\u00e1tico</b>', ParagraphStyle('th', fontName='LiberationSans-Bold', fontSize=8, textColor=white, leading=11)),
    Paragraph('<b>Cobertura</b>', ParagraphStyle('th', fontName='LiberationSans-Bold', fontSize=8, textColor=white, leading=11, alignment=TA_CENTER)),
    Paragraph('<b>N\u00b0</b>', ParagraphStyle('th', fontName='LiberationSans-Bold', fontSize=8, textColor=white, leading=11, alignment=TA_CENTER)),
    Paragraph('<b>Tend.</b>', ParagraphStyle('th', fontName='LiberationSans-Bold', fontSize=8, textColor=white, leading=11, alignment=TA_CENTER)),
]

ejes_rows = [ejes_header]
for nombre, cobertura, noticias, tendencia in ejes_data:
    tend_color = '#2e7d32' if tendencia == '\u2191' else ('#c62828' if tendencia == '\u2193' else '#6d4c41')
    row = [
        Paragraph(nombre, ParagraphStyle('td', fontName='LiberationSans', fontSize=8, textColor=TEXT_COLOR, leading=11)),
        Paragraph(f'{cobertura}%', ParagraphStyle('td', fontName='LiberationSans-Bold', fontSize=8, textColor=MUTED, leading=11, alignment=TA_CENTER)),
        Paragraph(str(noticias), ParagraphStyle('td', fontName='LiberationSans-Bold', fontSize=8, textColor=TEXT_COLOR, leading=11, alignment=TA_CENTER)),
        Paragraph(f'<font color="{tend_color}"><b>{tendencia}</b></font>', ParagraphStyle('td', fontName='DejaVuSans-Bold', fontSize=12, textColor=HexColor(tend_color), leading=14, alignment=TA_CENTER)),
    ]
    ejes_rows.append(row)

ejes_table = Table(ejes_rows, colWidths=[content_width * 0.45, content_width * 0.20, content_width * 0.15, content_width * 0.20])
ejes_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [SURFACE, BG]),
    ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
    ('LINEBELOW', (0, 0), (-1, 0), 1, ACCENT),
    ('LINEBELOW', (0, 1), (-1, -2), 0.3, BORDER),
    ('GRID', (0, 1), (-1, -1), 0.3, BORDER),
]))
story.append(ejes_table)
story.append(Spacer(1, 8))

# ══════════════════════════════════════════════
# SECCI\u00d3N 5: NOTICIAS DESTACADAS
# ══════════════════════════════════════════════
story.append(PageBreak())
story.extend(section_header(5, 'NOTICIAS DESTACADAS', content_width))

noticias = [
    {
        'titulo': 'Precio internacional del caf\u00e9 ar\u00e1bica se ubica en 288,80 centavos US$/libra',
        'medio': 'IBCE (C\u00e1mara empresarial)',
        'fecha': '6 de mayo de 2026',
        'fuentes': 1,
        'tension': 'ALTA',
        'resumen': 'El Instituto Boliviano de Comercio Exterior (IBCE) report\u00f3 que la cotizaci\u00f3n internacional del caf\u00e9 ar\u00e1bica (Contrato C) alcanz\u00f3 los 288,80 centavos de d\u00f3lar por libra al 6 de mayo de 2026. Este precio refleja la tendencia del mercado global de caf\u00e9 de especialidad y commodities, y constituye un indicador clave para los productores bolivianos que exportan a mercados internacionales. Los niveles actuales se mantienen en un rango elevado, lo que beneficia potencialmente a los caficultores bolivianos que logran posicionar sus productos en los nichos de especialidad.',
        'ejes': ['Econom\u00eda y Pol\u00edtica Econ\u00f3mica', 'Recursos Naturales'],
        'url': 'https://www.ibce.org.bo/informacion-commodities.php',
    },
    {
        'titulo': 'Boliviano Strauss asume la presidencia de AFIDA y marca un hito para el pa\u00eds',
        'medio': 'eju.tv (Digital)',
        'fecha': 'Mayo 2026',
        'fuentes': 1,
        'tension': 'MEDIA',
        'resumen': 'El profesional boliviano Strauss asumi\u00f3 la presidencia de la Asociaci\u00f3n de Fabricantes de Infusiones y Destilados de las Am\u00e9ricas (AFIDA), un hito sin precedentes para Bolivia en el \u00e1mbito de las bebidas y destilados a nivel continental. Este nombramiento posiciona al pa\u00eds en una plataforma de relevancia regional para la industria de infusiones y destilados, con posibles repercusiones positivas para la promoci\u00f3n del caf\u00e9 boliviano en circuitos internacionales de la industria.',
        'ejes': ['Gobierno e Instituciones', 'Relaciones Internacionales'],
        'url': 'https://eju.tv/2026/05/boliviano-strauss-asume-la-presidencia-de-afida-y-marca-un-hito-para-el-pais/',
    },
    {
        'titulo': 'SCA presenta Coffee Value Assessment: nuevo sistema de evaluaci\u00f3n de caf\u00e9',
        'medio': 'SCA (Asociaci\u00f3n sectorial)',
        'fecha': 'Mayo 2026',
        'fuentes': 1,
        'tension': 'MEDIA',
        'resumen': 'La Specialty Coffee Association (SCA) present\u00f3 su nuevo sistema de Coffee Value Assessment, una iniciativa que busca transformar la forma en que se eval\u00faa la calidad del caf\u00e9 a nivel global. Despu\u00e9s de d\u00e9cadas con el mismo sistema de evaluaci\u00f3n, la SCA colabor\u00f3 con la industria, cient\u00edficos y reguladores para desarrollar un marco m\u00e1s integral que considere no solo las caracter\u00edsticas sensoriales sino tambi\u00e9n la sostenibilidad, la trazabilidad y el valor percibido a lo largo de la cadena productiva. Este cambio tiene implicaciones directas para los productores bolivianos que buscan certificarse en mercados de especialidad.',
        'ejes': ['Relaciones Internacionales', 'Econom\u00eda y Pol\u00edtica Econ\u00f3mica'],
        'url': 'https://sca.coffee/value-assessment',
    },
    {
        'titulo': 'EUDR incluir\u00e1 caf\u00e9 instant\u00e1neo; Honduras proyecta m\u00e1s de 6 millones de sacos para 2026/27',
        'medio': 'Perfect Daily Grind (Medio especializado)',
        'fecha': '8 de mayo de 2026',
        'fuentes': 1,
        'tension': 'ALTA',
        'resumen': 'Perfect Daily Grind report\u00f3 en su resumen semanal que el Reglamento Europeo de Deforestaci\u00f3n (EUDR) ampliar\u00e1 su alcance para incluir el caf\u00e9 instant\u00e1neo, una medida que impactar\u00e1 las exportaciones de pa\u00edses productores de Am\u00e9rica Latina. Paralelamente, Honduras proyecta una producci\u00f3n superior a 6 millones de sacos de 60 kg para la cosecha 2026/27. Estas noticias son relevantes para Bolivia, ya que el pa\u00eds debe prepararse para cumplir con los requisitos de trazabilidad del EUDR y compite con pa\u00edses como Honduras en los mercados internacionales de caf\u00e9 de especialidad.',
        'ejes': ['Relaciones Internacionales', 'Econom\u00eda y Pol\u00edtica Econ\u00f3mica'],
        'url': 'https://perfectdailygrind.com/2026/05/coffee-news-recap-8-may-2026/',
    },
    {
        'titulo': 'Nestl\u00e9 confirma venta de Blue Bottle a respaldador de Luckin Coffee',
        'medio': 'Perfect Daily Grind (Medio especializado)',
        'fecha': '1 de mayo de 2026',
        'fuentes': 1,
        'tension': 'BAJA',
        'resumen': 'En el resumen semanal del 1 de mayo, Perfect Daily Grind destac\u00f3 la confirmaci\u00f3n por parte de Nestl\u00e9 de la venta de la cadena Blue Bottle Coffee a un inversor vinculado a Luckin Coffee, la compa\u00f1\u00eda china que revolucion\u00f3 el mercado de caf\u00e9. Adicionalmente, China recort\u00f3 aranceles a las importaciones de caf\u00e9 et\u00edope, se\u00f1alando una apertura del mercado asi\u00e1tico que podr\u00eda beneficiar a productores latinoamericanos incluyendo a Bolivia en el mediano plazo.',
        'ejes': ['Relaciones Internacionales', 'Econom\u00eda y Pol\u00edtica Econ\u00f3mica'],
        'url': 'https://perfectdailygrind.com/2026/05/coffee-news-recap-1-may-2026/',
    },
    {
        'titulo': 'La agroindustria ca\u00f1era boliviana desperta el inter\u00e9s de 21 empresas brasile\u00f1as',
        'medio': 'IBCE (C\u00e1mara empresarial)',
        'fecha': 'Abril 2026',
        'fuentes': 1,
        'tension': 'MEDIA',
        'resumen': 'El IBCE report\u00f3 que un total de 21 empresas brasile\u00f1as del sector sucroalcoholero visitaron los ingenios Guabir\u00e1, UNAGRO, Agua\u00ed y La B\u00e9lgica en Bolivia durante una gira de cuatro d\u00edas. El objetivo de la visita fue explorar oportunidades de diversificaci\u00f3n de la industria ca\u00f1era hacia la producci\u00f3n de biocombustibles y fortalecer las relaciones comerciales bilaterales. Esta din\u00e1mica de integraci\u00f3n agroindustrial con Brasil tiene implicaciones para las econom\u00edas regionales bolivianas, incluyendo las zonas cafeteras que se beneficiar\u00edan de una mejor infraestructura log\u00edstica y comercial.',
        'ejes': ['Econom\u00eda y Pol\u00edtica Econ\u00f3mica', 'Relaciones Internacionales'],
        'url': 'https://ibce.org.bo/noticias-detalle.php?idNot=966',
    },
]

for i, n in enumerate(noticias):
    tension_color = TENSION_ALTA if n['tension'] == 'ALTA' else (TENSION_MEDIA if n['tension'] == 'MEDIA' else TENSION_BAJA)
    
    border_color = tension_color
    
    noticia_content = [
        [Paragraph(n['titulo'], style_noticia_title), tension_badge(n['tension'])],
    ]
    noticia_table = Table(noticia_content, colWidths=[content_width - 60, 55])
    noticia_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    
    inner_elements = [
        noticia_table,
        Paragraph(f"{n['medio']}  \u2022  {n['fecha']}  \u2022  {n['fuentes']} fuente{'s' if n['fuentes'] > 1 else ''}", style_noticia_meta),
        Paragraph(n['resumen'], style_noticia_body),
        Paragraph('  \u2022  '.join([f'<font color="#4e342e">{e}</font>' for e in n['ejes']]),
                  ParagraphStyle('Ejes', fontName='LiberationSans', fontSize=7, textColor=MUTED, leading=10)),
    ]
    
    inner_table = Table([[e] for e in inner_elements], colWidths=[content_width - 8])
    inner_table.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (0, 0), 4),
        ('BOTTOMPADDING', (0, -1), (0, -1), 4),
        ('TOPPADDING', (0, 1), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (0, -2), 0),
    ]))
    
    outer_table = Table([[AccentBox(3, 10, border_color), inner_table]], colWidths=[5, content_width - 5])
    outer_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (1, 0), (1, 0), BG),
        ('BOX', (0, 0), (-1, -1), 0.3, BORDER),
    ]))
    
    story.append(outer_table)
    story.append(Spacer(1, 4))

story.append(PageBreak())

# ══════════════════════════════════════════════
# SECCI\u00d3N 6: \u00cdNDICE DE FUENTES
# ══════════════════════════════════════════════
story.extend(section_header(6, '\u00cdNDICE DE FUENTES', content_width))

fuentes = [
    (1, 'Perfect Daily Grind', 'Medio especializado', 30, False),
    (2, 'OIC Caf\u00e9 (Organizaci\u00f3n Internacional del Caf\u00e9)', 'Organizaci\u00f3n internacional', 8, True),
    (3, 'IBCE (C\u00e1mara de Industria y Comercio)', 'C\u00e1mara empresarial', 7, True),
    (4, 'Bolpress', 'Portal nacional', 2, False),
    (5, 'RTP Bolivia', 'Medio digital nacional', 2, True),
    (6, 'SCA (Specialty Coffee Association)', 'Asociaci\u00f3n sectorial', 2, True),
    (7, 'SENASAG (Servicio Nacional de Sanidad)', 'Instituci\u00f3n estatal', 2, True),
    (8, 'Urgente Bolivia', 'Medio digital nacional', 2, True),
    (9, 'ERBOL (Radio L\u00edder - Potos\u00ed)', 'Agencia comunitaria', 1, True),
    (10, 'eju.tv', 'Medio digital', 1, True),
]

fuentes_header = [
    Paragraph('<b>#</b>', ParagraphStyle('th', fontName='LiberationSans-Bold', fontSize=8, textColor=white, leading=11, alignment=TA_CENTER)),
    Paragraph('<b>Fuente</b>', ParagraphStyle('th', fontName='LiberationSans-Bold', fontSize=8, textColor=white, leading=11)),
    Paragraph('<b>Tipo</b>', ParagraphStyle('th', fontName='LiberationSans-Bold', fontSize=8, textColor=white, leading=11)),
    Paragraph('<b>N\u00b0</b>', ParagraphStyle('th', fontName='LiberationSans-Bold', fontSize=8, textColor=white, leading=11, alignment=TA_CENTER)),
    Paragraph('<b>Etiqueta</b>', ParagraphStyle('th', fontName='LiberationSans-Bold', fontSize=8, textColor=white, leading=11, alignment=TA_CENTER)),
]

fuentes_rows = [fuentes_header]
for num, nombre, tipo, count, nueva in fuentes:
    badge = '<font color="#ffffff"><b>NUEVA</b></font>' if nueva else ''
    badge_style = ParagraphStyle('nb', fontName='LiberationSans-Bold', fontSize=7, textColor=white, leading=10, alignment=TA_CENTER)
    fuentes_rows.append([
        Paragraph(f'<b>{num}</b>', ParagraphStyle('td', fontName='LiberationSans-Bold', fontSize=9, textColor=ACCENT2, leading=12, alignment=TA_CENTER)),
        Paragraph(nombre, ParagraphStyle('td', fontName='LiberationSans-Bold', fontSize=8, textColor=TEXT_COLOR, leading=11)),
        Paragraph(tipo, ParagraphStyle('td', fontName='LiberationSans', fontSize=7.5, textColor=MUTED, leading=10)),
        Paragraph(f'<b>{count}</b>', ParagraphStyle('td', fontName='LiberationSans-Bold', fontSize=9, textColor=HEADER_BG, leading=12, alignment=TA_CENTER)),
        Paragraph(badge, badge_style),
    ])

fuentes_table = Table(fuentes_rows, colWidths=[content_width * 0.06, content_width * 0.42, content_width * 0.22, content_width * 0.08, content_width * 0.12])
fuentes_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [SURFACE, BG]),
    ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
    ('LINEBELOW', (0, 0), (-1, 0), 1, ACCENT),
    ('GRID', (0, 1), (-1, -1), 0.3, BORDER),
]))
story.append(fuentes_table)
story.append(Spacer(1, 12))

# ══════════════════════════════════════════════
# SECCI\u00d3N 7: CRUCE TRANSVERSAL
# ══════════════════════════════════════════════
story.extend(section_header(7, 'CRUCE TRANSVERSAL', content_width))

cruce_bg = Table(
    [[Paragraph("""
El an\u00e1lisis transversal de las 57 menciones capturadas durante la semana 20 revela patrones significativos 
de intersecci\u00f3n entre la tem\u00e1tica cafetera y otras \u00e1reas de la coyuntura nacional e internacional. 
El eje de Geopol\u00edtica y Relaciones Internacionales acumula el 89% de cobertura, lo cual indica que la 
dimensi\u00f3n internacional del caf\u00e9 \u2014precios globales, regulaciones como el EUDR, y din\u00e1micas 
competitivas entre pa\u00edses productores\u2014 domina el paisaje informativo del sector.

Desde la perspectiva del mercado laboral y la movilizaci\u00f3n social, se observa una tensi\u00f3n moderada 
derivada del paro indefinido de la COB y las movilizaciones en El Alto, que aunque no est\u00e1n directamente 
vinculadas al sector cafetero, generan un clima de incertidumbre econ\u00f3mica que impacta las cadenas 
productivas regionales, incluyendo la log\u00edstica de exportaci\u00f3n de caf\u00e9.

La presencia de la agroindustria ca\u00f1era en la cobertura informativa (IBCE) establece un puente tem\u00e1tico 
entre las econom\u00edas regionales de Santa Cruz y las zonas cafeteras del pa\u00eds. Las alianzas con 
empresarios brasile\u00f1os para diversificar hacia biocombustibles y la inversi\u00f3n de m\u00e1s de 30 millones 
de d\u00f3lares en nuevas f\u00e1bricas en Guabir\u00e1 sugieren un dinamismo econ\u00f3mico regional que podr\u00eda 
beneficiar indirectamente al sector cafetero a trav\u00e9s de mejoras en infraestructura y conectividad 
comercial. El nombramiento del boliviano Strauss al frente de AFIDA constituye un hito que conecta al 
pa\u00eds con las redes hemisf\u00e9ricas de la industria de bebidas, un espacio donde el caf\u00e9 boliviano 
podr\u00eda ganar mayor visibilidad.
""", style_analisis)]],
    colWidths=[content_width - 4]
)
cruce_bg.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), HIGHLIGHT),
    ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ('TOPPADDING', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ('BOX', (0, 0), (-1, -1), 0.3, ACCENT),
]))
story.append(cruce_bg)
story.append(Spacer(1, 12))

# ══════════════════════════════════════════════
# SECCI\u00d3N 8: TENDENCIA Y PROYECCI\u00d3N
# ══════════════════════════════════════════════
story.extend(section_header(8, 'TENDENCIA Y PROYECCI\u00d3N', content_width))

tendencia_bg = Table(
    [[Paragraph("""
La proyecci\u00f3n para las pr\u00f3ximas semanas sugiere un mantenimiento de los niveles actuales de 
actividad en el sector cafetero boliviano, con una tendencia estable en la cobertura medi\u00e1tica. 
El precio internacional del caf\u00e9 (Contrato C) se espera que permanezca en rangos elevados, 
impulsado por factores estructurales como el cambio clim\u00e1tico en las zonas productoras 
tradicionales de Brasil y Vietnam, la creciente demanda en mercados asi\u00e1ticos y la volatilidad 
generada por las regulaciones ambientales europeas (EUDR).

Se identifican tres \u00e1reas de atenci\u00f3n prioritaria para el monitoreo: (a) la evoluci\u00f3n del 
EUDR y su impacto en los requisitos de trazabilidad para las exportaciones bolivianas, lo cual 
demandar\u00e1 inversi\u00f3n en sistemas de certificaci\u00f3n y documentaci\u00f3n por parte de los 
productores nacionales; (b) las oportunidades derivadas de la apertura del mercado chino a 
importaciones de caf\u00e9, un espacio donde Bolivia podr\u00eda posicionarse como proveedor de 
especialidad; y (c) la situaci\u00f3n pol\u00edtica interna, donde la conflictividad social 
(paros, bloqueos) podr\u00eda afectar la log\u00edstica de exportaci\u00f3n si se prolonga.

El nuevo sistema de Coffee Value Assessment de la SCA representa un cambio de paradigma que los 
productores bolivianos deber\u00e1n monitorear de cerca, ya que podr\u00eda modificar los criterios 
de evaluaci\u00f3n y los est\u00e1ndares de calidad exigidos en los mercados internacionales. La 
tendencia hacia la innovaci\u00f3n en procesamiento (co-fermentados, levaduras inoculadas) 
observada en medios especializados indica que la diferenciaci\u00f3n por calidad seguir\u00e1 siendo 
el camino estrat\u00e9gico para los productores bolivianos de caf\u00e9 de especialidad.
""", style_analisis)]],
    colWidths=[content_width - 4]
)
tendencia_bg.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), HIGHLIGHT),
    ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ('TOPPADDING', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ('BOX', (0, 0), (-1, -1), 0.3, ACCENT),
]))
story.append(tendencia_bg)
story.append(Spacer(1, 12))

# ══════════════════════════════════════════════
# SECCI\u00d3N 9: NOTA METODOL\u00d3GICA
# ══════════════════════════════════════════════
story.extend(section_header(9, 'NOTA METODOL\u00d3GICA', content_width))

story.append(Paragraph(
    'El <b>Bolet\u00edn del Grano</b> es un producto de an\u00e1lisis semanal elaborado por '
    '<b>DECODEX Bolivia</b> que monitorea, clasifica y analiza la informaci\u00f3n p\u00fablica '
    'relevante sobre caf\u00e9 de especialidad en Bolivia. El bolet\u00edn cubre m\u00faltiples ejes '
    'tem\u00e1ticos que permiten una lectura transversal de la coyuntura cafetera nacional, '
    'articulando datos provenientes de medios especializados internacionales, organismos '
    'sectoriales, c\u00e1maras empresariales y medios nacionales.',
    style_metodo
))

story.append(Paragraph('Periodo de cobertura', style_metodo_title))
story.append(Paragraph('11 al 17 de mayo de 2026 (Semana 20)', style_metodo))

story.append(Paragraph('Fuentes monitoreadas (10)', style_metodo_title))

fuentes_lista = [
    'Perfect Daily Grind (Medio especializado internacional)',
    'OIC Caf\u00e9 \u2014 International Coffee Organization',
    'IBCE \u2014 C\u00e1mara de Industria y Comercio de Santa Cruz',
    'SCA \u2014 Specialty Coffee Association',
    'SENASAG \u2014 Servicio Nacional de Sanidad Agropecuaria e Inocuidad Alimentaria',
    'Bolpress (Portal nacional)',
    'RTP Bolivia (Medio digital nacional)',
    'Urgente Bolivia (Medio digital nacional)',
    'ERBOL \u2014 Radio L\u00edder Potos\u00ed (Agencia comunitaria)',
    'eju.tv (Medio digital)',
]

for f in fuentes_lista:
    story.append(Paragraph(f'\u2022  {f}', style_bullet))

story.append(Spacer(1, 6))

story.append(Paragraph('Palabras clave de b\u00fasqueda', style_metodo_title))
story.append(Paragraph(
    'caf\u00e9, caf\u00e9 de especialidad, caf\u00e9 ar\u00e1bica, cafetera, caficultor, caf\u00e9 boliviano, '
    'coffee, specialty coffee, commodities, precios caf\u00e9, C-Market, IBCE commodities, '
    'procesamiento caf\u00e9, tostado caf\u00e9, catar caf\u00e9, economies cafeteras, economies regionales',
    ParagraphStyle('Keywords', fontName='DejaVuSerif', fontSize=8.5, leading=12,
                   textColor=TEXT_COLOR, leftIndent=8, rightIndent=8,
                   spaceBefore=2, spaceAfter=4,
                   backColor=BG, borderPadding=6)
))

story.append(Spacer(1, 8))
story.append(Paragraph(
    '<i>Este documento es de car\u00e1cter informativo y no representa una posici\u00f3n institucional. '
    'Las fuentes citadas son de acceso p\u00fablico. Los datos de precios corresponden a la '
    'fecha de referencia indicada. Para consultas: decodexbolivia.org</i>',
    ParagraphStyle('Disclaimer', fontName='DejaVuSerif', fontSize=8, leading=11,
                   textColor=MUTED, alignment=TA_CENTER)
))

# ── Build ──
doc.build(story)
print(f'PDF generado exitosamente: {output_path}')
print(f'Tama\u00f1o: {os.path.getsize(output_path):,} bytes')
