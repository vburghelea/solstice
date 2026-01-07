#!/usr/bin/env python3
"""
High-Fidelity Multi-Tenant Architecture Diagram
Following the Systematic Clarity design philosophy
"""

from PIL import Image, ImageDraw, ImageFont
import math

WIDTH = 2400
HEIGHT = 1400
MARGIN = 80

COLORS = {
    'background': '#FAFBFC',

    # Platform
    'platform': '#1E293B',
    'platform_bg': '#F1F5F9',

    # Tenant colors
    'viasport': '#3B82F6',
    'viasport_bg': '#EFF6FF',
    'viasport_light': '#DBEAFE',
    'qc': '#10B981',
    'qc_bg': '#ECFDF5',
    'qc_light': '#D1FAE5',

    # Organizations
    'org_pso': '#8B5CF6',
    'org_pso_bg': '#F5F3FF',
    'org_club': '#F59E0B',
    'org_club_bg': '#FFFBEB',

    # Security
    'security': '#EC4899',
    'security_bg': '#FDF2F8',

    # Data
    'data': '#F97316',
    'data_bg': '#FFF7ED',

    # Text
    'text_primary': '#1E293B',
    'text_secondary': '#64748B',
    'text_muted': '#94A3B8',
    'text_white': '#FFFFFF',
    'line': '#CBD5E1',
    'arrow': '#475569',
    'dashed': '#94A3B8',
}

FONT_DIR = "/Users/austin/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/canvas-design/canvas-fonts"

def load_fonts():
    fonts = {}
    try:
        fonts['title'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 36)
        fonts['subtitle'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Regular.ttf", 20)
        fonts['section'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 16)
        fonts['service'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Bold.ttf", 14)
        fonts['service_detail'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Regular.ttf", 12)
        fonts['label'] = ImageFont.truetype(f"{FONT_DIR}/IBMPlexMono-Regular.ttf", 11)
        fonts['badge'] = ImageFont.truetype(f"{FONT_DIR}/IBMPlexMono-Bold.ttf", 11)
        fonts['legend'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Regular.ttf", 12)
        fonts['tenant'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 20)
    except Exception as e:
        print(f"Font error: {e}")
        for key in fonts.keys():
            fonts[key] = ImageFont.load_default()
    return fonts

def draw_rounded_rect(draw, coords, radius, fill=None, outline=None, width=1, dash=False):
    x1, y1, x2, y2 = coords
    draw.ellipse([x1, y1, x1 + 2*radius, y1 + 2*radius], fill=fill, outline=outline, width=width)
    draw.ellipse([x2 - 2*radius, y1, x2, y1 + 2*radius], fill=fill, outline=outline, width=width)
    draw.ellipse([x1, y2 - 2*radius, x1 + 2*radius, y2], fill=fill, outline=outline, width=width)
    draw.ellipse([x2 - 2*radius, y2 - 2*radius, x2, y2], fill=fill, outline=outline, width=width)
    draw.rectangle([x1 + radius, y1, x2 - radius, y2], fill=fill)
    draw.rectangle([x1, y1 + radius, x2, y2 - radius], fill=fill)
    if outline:
        draw.arc([x1, y1, x1 + 2*radius, y1 + 2*radius], 180, 270, fill=outline, width=width)
        draw.arc([x2 - 2*radius, y1, x2, y1 + 2*radius], 270, 360, fill=outline, width=width)
        draw.arc([x1, y2 - 2*radius, x1 + 2*radius, y2], 90, 180, fill=outline, width=width)
        draw.arc([x2 - 2*radius, y2 - 2*radius, x2, y2], 0, 90, fill=outline, width=width)
        draw.line([x1 + radius, y1, x2 - radius, y1], fill=outline, width=width)
        draw.line([x1 + radius, y2, x2 - radius, y2], fill=outline, width=width)
        draw.line([x1, y1 + radius, x1, y2 - radius], fill=outline, width=width)
        draw.line([x2, y1 + radius, x2, y2 - radius], fill=outline, width=width)

def draw_dashed_rect(draw, coords, radius, color, width=2, dash_length=10):
    """Draw a dashed rounded rectangle border"""
    x1, y1, x2, y2 = coords

    # Draw dashed lines
    def draw_dashed_line(start, end):
        x1, y1 = start
        x2, y2 = end
        length = math.sqrt((x2-x1)**2 + (y2-y1)**2)
        dashes = int(length / (dash_length * 2))
        for i in range(dashes):
            t1 = i * 2 * dash_length / length
            t2 = (i * 2 + 1) * dash_length / length
            if t2 > 1:
                t2 = 1
            sx = x1 + t1 * (x2 - x1)
            sy = y1 + t1 * (y2 - y1)
            ex = x1 + t2 * (x2 - x1)
            ey = y1 + t2 * (y2 - y1)
            draw.line([sx, sy, ex, ey], fill=color, width=width)

    # Top, bottom, left, right
    draw_dashed_line((x1 + radius, y1), (x2 - radius, y1))
    draw_dashed_line((x1 + radius, y2), (x2 - radius, y2))
    draw_dashed_line((x1, y1 + radius), (x1, y2 - radius))
    draw_dashed_line((x2, y1 + radius), (x2, y2 - radius))

    # Corners (arcs approximated as dashed)
    draw.arc([x1, y1, x1 + 2*radius, y1 + 2*radius], 180, 270, fill=color, width=width)
    draw.arc([x2 - 2*radius, y1, x2, y1 + 2*radius], 270, 360, fill=color, width=width)
    draw.arc([x1, y2 - 2*radius, x1 + 2*radius, y2], 90, 180, fill=color, width=width)
    draw.arc([x2 - 2*radius, y2 - 2*radius, x2, y2], 0, 90, fill=color, width=width)

def draw_service_box(draw, x, y, w, h, name, detail, color, bg_color, fonts):
    radius = 6
    shadow = 2
    draw_rounded_rect(draw, [x+shadow, y+shadow, x+w+shadow, y+h+shadow], radius, fill='#E2E8F0')
    draw_rounded_rect(draw, [x, y, x+w, y+h], radius, fill=bg_color, outline=color, width=2)
    draw.rectangle([x, y+radius, x+4, y+h-radius], fill=color)
    text_x = x + 12
    text_y = y + (h//2 - 12)
    draw.text((text_x, text_y), name, font=fonts['service'], fill=COLORS['text_primary'])
    if detail:
        draw.text((text_x, text_y + 16), detail, font=fonts['service_detail'], fill=COLORS['text_secondary'])

def draw_database_icon(draw, cx, cy, w, h, color, bg_color):
    ellipse_h = h // 5
    shadow = 2
    draw.ellipse([cx-w//2+shadow, cy-h//2+shadow, cx+w//2+shadow, cy-h//2+ellipse_h+shadow], fill='#E2E8F0')
    draw.rectangle([cx-w//2+shadow, cy-h//2+ellipse_h//2+shadow, cx+w//2+shadow, cy+h//2-ellipse_h//2+shadow], fill='#E2E8F0')
    draw.ellipse([cx-w//2+shadow, cy+h//2-ellipse_h+shadow, cx+w//2+shadow, cy+h//2+shadow], fill='#E2E8F0')
    draw.ellipse([cx-w//2, cy-h//2, cx+w//2, cy-h//2+ellipse_h], fill=bg_color, outline=color, width=2)
    draw.rectangle([cx-w//2, cy-h//2+ellipse_h//2, cx+w//2, cy+h//2-ellipse_h//2], fill=bg_color)
    draw.line([cx-w//2, cy-h//2+ellipse_h//2, cx-w//2, cy+h//2-ellipse_h//2], fill=color, width=2)
    draw.line([cx+w//2, cy-h//2+ellipse_h//2, cx+w//2, cy+h//2-ellipse_h//2], fill=color, width=2)
    draw.ellipse([cx-w//2, cy+h//2-ellipse_h, cx+w//2, cy+h//2], fill=bg_color, outline=color, width=2)

def draw_arrow(draw, start, end, color, width=2):
    x1, y1 = start
    x2, y2 = end
    draw.line([x1, y1, x2, y2], fill=color, width=width)
    angle = math.atan2(y2 - y1, x2 - x1)
    arrow_len = 10
    arrow_angle = math.pi / 6
    ax1 = x2 - arrow_len * math.cos(angle - arrow_angle)
    ay1 = y2 - arrow_len * math.sin(angle - arrow_angle)
    ax2 = x2 - arrow_len * math.cos(angle + arrow_angle)
    ay2 = y2 - arrow_len * math.sin(angle + arrow_angle)
    draw.polygon([(x2, y2), (ax1, ay1), (ax2, ay2)], fill=color)

def draw_org_hierarchy(draw, x, y, fonts, tenant_color, tenant_bg):
    """Draw organization hierarchy (Gov Body -> PSO -> Club)"""
    box_w = 140
    box_h = 50
    gap_y = 30

    # Governing Body
    gov_x = x
    gov_y = y
    draw_service_box(draw, gov_x, gov_y, box_w, box_h, "Governing Body", "Top-level org", tenant_color, tenant_bg, fonts)

    # PSO
    pso_x = x + 40
    pso_y = gov_y + box_h + gap_y
    draw_service_box(draw, pso_x, pso_y, box_w, box_h, "PSO", "Provincial org", COLORS['org_pso'], COLORS['org_pso_bg'], fonts)

    # Club
    club_x = x + 80
    club_y = pso_y + box_h + gap_y
    draw_service_box(draw, club_x, club_y, box_w, box_h, "Club", "Local org", COLORS['org_club'], COLORS['org_club_bg'], fonts)

    # Connecting lines
    draw.line([gov_x + box_w//2, gov_y + box_h, pso_x + box_w//2, pso_y], fill=COLORS['line'], width=2)
    draw.line([pso_x + box_w//2, pso_y + box_h, club_x + box_w//2, club_y], fill=COLORS['line'], width=2)

    return club_y + box_h

def create_multitenant_diagram():
    img = Image.new('RGB', (WIDTH, HEIGHT), COLORS['background'])
    draw = ImageDraw.Draw(img)
    fonts = load_fonts()

    # Title
    draw.text((MARGIN, 30), "Multi-Tenant Architecture", font=fonts['title'], fill=COLORS['text_primary'])
    draw.text((MARGIN, 72), "Tenant Isolation · Organization Hierarchy · Data Segregation", font=fonts['subtitle'], fill=COLORS['text_secondary'])

    # ========== Platform Layer ==========
    platform_x = MARGIN
    platform_y = 130
    platform_w = 400
    platform_h = 200

    draw_rounded_rect(draw, [platform_x, platform_y, platform_x + platform_w, platform_y + platform_h],
                      12, fill=COLORS['platform_bg'], outline=COLORS['platform'], width=2)
    draw.text((platform_x + 20, platform_y + 15), "Solstice Platform", font=fonts['section'], fill=COLORS['text_primary'])
    draw.text((platform_x + 20, platform_y + 40), "Single codebase · Shared infrastructure", font=fonts['service_detail'], fill=COLORS['text_secondary'])

    # Tenant Router
    router_x = platform_x + 50
    router_y = platform_y + 80
    router_w = 300
    router_h = 80
    draw_service_box(draw, router_x, router_y, router_w, router_h,
                    "Tenant Router", "TENANT_KEY routing · Domain mapping",
                    COLORS['security'], COLORS['security_bg'], fonts)

    # ========== viaSport Tenant ==========
    vs_x = MARGIN + 500
    vs_y = 130
    vs_w = 850
    vs_h = 700

    # Tenant container with dashed border
    draw_rounded_rect(draw, [vs_x, vs_y, vs_x + vs_w, vs_y + vs_h], 16, fill=COLORS['viasport_light'])
    draw_dashed_rect(draw, [vs_x, vs_y, vs_x + vs_w, vs_y + vs_h], 16, COLORS['viasport'], width=3)

    # Tenant badge
    badge_w = 180
    badge_h = 32
    draw_rounded_rect(draw, [vs_x + 20, vs_y - 16, vs_x + 20 + badge_w, vs_y - 16 + badge_h], 6, fill=COLORS['viasport'])
    draw.text((vs_x + 35, vs_y - 10), "Tenant: viaSport", font=fonts['badge'], fill=COLORS['text_white'])

    draw.text((vs_x + 30, vs_y + 30), "viaSport BC", font=fonts['tenant'], fill=COLORS['viasport'])
    draw.text((vs_x + 30, vs_y + 58), "Provincial sport governing body", font=fonts['service_detail'], fill=COLORS['text_secondary'])

    # RBAC section
    rbac_x = vs_x + 30
    rbac_y = vs_y + 100
    rbac_w = 380
    rbac_h = 180
    draw_rounded_rect(draw, [rbac_x, rbac_y, rbac_x + rbac_w, rbac_y + rbac_h], 8, fill='#FFFFFF', outline=COLORS['viasport'], width=1)
    draw.text((rbac_x + 15, rbac_y + 12), "RBAC Roles", font=fonts['section'], fill=COLORS['text_primary'])

    roles = ["Owner", "Admin", "Reporter", "Viewer"]
    role_colors = ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD']
    for i, (role, color) in enumerate(zip(roles, role_colors)):
        ry = rbac_y + 45 + i * 32
        draw_rounded_rect(draw, [rbac_x + 20, ry, rbac_x + 100, ry + 24], 4, fill=color)
        draw.text((rbac_x + 32, ry + 4), role, font=fonts['badge'], fill='#FFFFFF')
        desc = ["Full access", "Manage org", "Submit data", "Read only"][i]
        draw.text((rbac_x + 115, ry + 5), desc, font=fonts['service_detail'], fill=COLORS['text_secondary'])

    # Organization hierarchy
    org_x = vs_x + 450
    org_y = vs_y + 100
    draw.text((org_x, org_y), "Organization Hierarchy", font=fonts['section'], fill=COLORS['text_primary'])
    draw_org_hierarchy(draw, org_x, org_y + 35, fonts, COLORS['viasport'], COLORS['viasport_bg'])

    # Data stores for viaSport
    data_y = vs_y + 400

    # RDS
    rds_cx = vs_x + 150
    rds_cy = data_y + 100
    draw_database_icon(draw, rds_cx, rds_cy, 80, 100, COLORS['viasport'], COLORS['viasport_bg'])
    draw.text((rds_cx - 45, rds_cy + 60), "RDS - viaSport", font=fonts['service'], fill=COLORS['text_primary'])

    # S3
    s3_x = vs_x + 280
    s3_y = data_y + 55
    s3_w = 160
    s3_h = 55
    draw_service_box(draw, s3_x, s3_y, s3_w, s3_h, "S3 - viaSport", "File storage", COLORS['viasport'], COLORS['viasport_bg'], fonts)

    draw.text((vs_x + 30, data_y + 180), "All viaSport data isolated · Separate encryption keys", font=fonts['service_detail'], fill=COLORS['text_secondary'])

    # ========== QC Tenant (simplified) ==========
    qc_x = MARGIN + 1420
    qc_y = 130
    qc_w = 450
    qc_h = 400

    draw_rounded_rect(draw, [qc_x, qc_y, qc_x + qc_w, qc_y + qc_h], 16, fill=COLORS['qc_light'])
    draw_dashed_rect(draw, [qc_x, qc_y, qc_x + qc_w, qc_y + qc_h], 16, COLORS['qc'], width=3)

    # QC badge
    draw_rounded_rect(draw, [qc_x + 20, qc_y - 16, qc_x + 20 + badge_w, qc_y - 16 + badge_h], 6, fill=COLORS['qc'])
    draw.text((qc_x + 55, qc_y - 10), "Tenant: QC", font=fonts['badge'], fill=COLORS['text_white'])

    draw.text((qc_x + 30, qc_y + 30), "Quadball Canada", font=fonts['tenant'], fill=COLORS['qc'])
    draw.text((qc_x + 30, qc_y + 58), "Separate AWS account", font=fonts['service_detail'], fill=COLORS['text_secondary'])

    # QC org hierarchy (simplified)
    draw.text((qc_x + 30, qc_y + 100), "QC Organization", font=fonts['section'], fill=COLORS['text_primary'])
    qc_org_x = qc_x + 50
    qc_org_y = qc_y + 135
    draw_service_box(draw, qc_org_x, qc_org_y, 140, 50, "QC Hierarchy", "Full org tree", COLORS['qc'], COLORS['qc_bg'], fonts)

    # QC data stores
    qc_data_y = qc_y + 230

    qc_rds_cx = qc_x + 120
    qc_rds_cy = qc_data_y + 60
    draw_database_icon(draw, qc_rds_cx, qc_rds_cy, 70, 90, COLORS['qc'], COLORS['qc_bg'])
    draw.text((qc_rds_cx - 35, qc_rds_cy + 55), "RDS - QC", font=fonts['service'], fill=COLORS['text_primary'])

    qc_s3_x = qc_x + 230
    qc_s3_y = qc_data_y + 20
    draw_service_box(draw, qc_s3_x, qc_s3_y, 140, 50, "S3 - QC", "File storage", COLORS['qc'], COLORS['qc_bg'], fonts)

    # ========== Arrows ==========
    # Platform -> viaSport
    draw_arrow(draw, (platform_x + platform_w, platform_y + platform_h//2),
               (vs_x, vs_y + 150), COLORS['arrow'], 2)
    draw.text((platform_x + platform_w + 20, platform_y + platform_h//2 - 30), "sin.*", font=fonts['label'], fill=COLORS['text_muted'])

    # Platform -> QC
    draw_arrow(draw, (platform_x + platform_w, platform_y + platform_h//2 + 40),
               (qc_x, qc_y + 150), COLORS['arrow'], 2)
    draw.text((platform_x + platform_w + 20, platform_y + platform_h//2 + 10), "qc.*", font=fonts['label'], fill=COLORS['text_muted'])

    # ========== Isolation callout ==========
    iso_x = MARGIN + 1420
    iso_y = 600
    iso_w = 450
    iso_h = 200

    draw_rounded_rect(draw, [iso_x, iso_y, iso_x + iso_w, iso_y + iso_h], 10, fill='#FEF2F2', outline='#EF4444', width=2)
    draw.text((iso_x + 20, iso_y + 15), "Tenant Isolation Guarantees", font=fonts['section'], fill='#B91C1C')

    guarantees = [
        "• Complete data segregation by tenant",
        "• Separate encryption keys (KMS)",
        "• Independent backup/restore",
        "• No cross-tenant data access",
        "• Audit logs per tenant",
    ]
    for i, g in enumerate(guarantees):
        draw.text((iso_x + 20, iso_y + 50 + i * 26), g, font=fonts['service_detail'], fill=COLORS['text_primary'])

    # ========== Legend ==========
    legend_x = MARGIN
    legend_y = HEIGHT - 320
    legend_w = 380
    legend_h = 260

    draw_rounded_rect(draw, [legend_x, legend_y, legend_x + legend_w, legend_y + legend_h], 10, fill='#FFFFFF', outline=COLORS['line'], width=1)
    draw.text((legend_x + 20, legend_y + 16), "Legend", font=fonts['section'], fill=COLORS['text_primary'])

    legend_items = [
        ("Platform Layer", COLORS['platform'], COLORS['platform_bg']),
        ("viaSport Tenant", COLORS['viasport'], COLORS['viasport_bg']),
        ("Quadball Canada Tenant", COLORS['qc'], COLORS['qc_bg']),
        ("PSO (Provincial Org)", COLORS['org_pso'], COLORS['org_pso_bg']),
        ("Club (Local Org)", COLORS['org_club'], COLORS['org_club_bg']),
    ]

    for i, (label, color, bg) in enumerate(legend_items):
        ly = legend_y + 50 + i * 38
        draw_rounded_rect(draw, [legend_x + 20, ly, legend_x + 60, ly + 26], 4, fill=bg, outline=color, width=2)
        draw.text((legend_x + 75, ly + 5), label, font=fonts['legend'], fill=COLORS['text_primary'])

    # ========== Footer ==========
    footer_y = HEIGHT - 40
    draw.text((MARGIN, footer_y), "Solstice Platform · Multi-Tenant Architecture", font=fonts['label'], fill=COLORS['text_muted'])
    draw.text((WIDTH - 400, footer_y), "Single codebase · Complete tenant isolation", font=fonts['label'], fill=COLORS['text_muted'])

    return img

if __name__ == "__main__":
    img = create_multitenant_diagram()
    output_path = "/Users/austin/dev/solstice/docs/sin-rfp/response/08-appendices/diagrams/multi-tenant-architecture-v2.png"
    img.save(output_path, "PNG", dpi=(300, 300))
    print(f"Saved: {output_path}")
