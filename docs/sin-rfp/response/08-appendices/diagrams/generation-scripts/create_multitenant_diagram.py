#!/usr/bin/env python3
"""
High-Fidelity Multi-Tenant Architecture Diagram v3
Following the Systematic Clarity design philosophy
Updated to include Redis tenant prefixing and ECS batch isolation
"""

from PIL import Image, ImageDraw, ImageFont
import math

WIDTH = 2400
HEIGHT = 800
MARGIN = 60
EXPORT_SCALE = 2

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

    # Cache (Redis)
    'cache': '#EC4899',
    'cache_bg': '#FDF2F8',

    # Batch
    'batch': '#0EA5E9',
    'batch_bg': '#F0F9FF',

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
        fonts['title'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 32)
        fonts['subtitle'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Regular.ttf", 18)
        fonts['section'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 14)
        fonts['service'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Bold.ttf", 13)
        fonts['service_detail'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Regular.ttf", 11)
        fonts['label'] = ImageFont.truetype(f"{FONT_DIR}/IBMPlexMono-Regular.ttf", 10)
        fonts['badge'] = ImageFont.truetype(f"{FONT_DIR}/IBMPlexMono-Bold.ttf", 10)
        fonts['legend'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Regular.ttf", 11)
        fonts['tenant'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 18)
    except Exception as e:
        print(f"Font error: {e}")
        for key in ['title', 'subtitle', 'section', 'service', 'service_detail', 'label', 'badge', 'legend', 'tenant']:
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

    draw_dashed_line((x1 + radius, y1), (x2 - radius, y1))
    draw_dashed_line((x1 + radius, y2), (x2 - radius, y2))
    draw_dashed_line((x1, y1 + radius), (x1, y2 - radius))
    draw_dashed_line((x2, y1 + radius), (x2, y2 - radius))

    draw.arc([x1, y1, x1 + 2*radius, y1 + 2*radius], 180, 270, fill=color, width=width)
    draw.arc([x2 - 2*radius, y1, x2, y1 + 2*radius], 270, 360, fill=color, width=width)
    draw.arc([x1, y2 - 2*radius, x1 + 2*radius, y2], 90, 180, fill=color, width=width)
    draw.arc([x2 - 2*radius, y2 - 2*radius, x2, y2], 0, 90, fill=color, width=width)

def draw_service_box(draw, x, y, w, h, name, detail, color, bg_color, fonts):
    radius = 5
    shadow = 2
    draw_rounded_rect(draw, [x+shadow, y+shadow, x+w+shadow, y+h+shadow], radius, fill='#E2E8F0')
    draw_rounded_rect(draw, [x, y, x+w, y+h], radius, fill=bg_color, outline=color, width=2)
    draw.rectangle([x, y+radius, x+3, y+h-radius], fill=color)
    text_x = x + 10
    text_y = y + (h//2 - 12)
    draw.text((text_x, text_y), name, font=fonts['service'], fill=COLORS['text_primary'])
    if detail:
        draw.text((text_x, text_y + 15), detail, font=fonts['service_detail'], fill=COLORS['text_secondary'])

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
    arrow_len = 8
    arrow_angle = math.pi / 6
    ax1 = x2 - arrow_len * math.cos(angle - arrow_angle)
    ay1 = y2 - arrow_len * math.sin(angle - arrow_angle)
    ax2 = x2 - arrow_len * math.cos(angle + arrow_angle)
    ay2 = y2 - arrow_len * math.sin(angle + arrow_angle)
    draw.polygon([(x2, y2), (ax1, ay1), (ax2, ay2)], fill=color)

def draw_polyline_arrow(draw, points, color, width=2):
    """Draw a multi-segment arrow with an arrowhead on the final segment"""
    for i in range(len(points) - 1):
        draw.line([points[i], points[i + 1]], fill=color, width=width)

    x1, y1 = points[-2]
    x2, y2 = points[-1]
    angle = math.atan2(y2 - y1, x2 - x1)
    arrow_len = 8
    arrow_angle = math.pi / 6
    ax1 = x2 - arrow_len * math.cos(angle - arrow_angle)
    ay1 = y2 - arrow_len * math.sin(angle - arrow_angle)
    ax2 = x2 - arrow_len * math.cos(angle + arrow_angle)
    ay2 = y2 - arrow_len * math.sin(angle + arrow_angle)
    draw.polygon([(x2, y2), (ax1, ay1), (ax2, ay2)], fill=color)

def draw_org_hierarchy(draw, x, y, fonts, tenant_color, tenant_bg):
    """Draw organization hierarchy (Gov Body -> PSO -> Club)"""
    box_w = 120
    box_h = 42
    gap_y = 20

    # Governing Body
    gov_x = x
    gov_y = y
    draw_service_box(draw, gov_x, gov_y, box_w, box_h, "Governing Body", "Top-level", tenant_color, tenant_bg, fonts)

    # PSO
    pso_x = x + 30
    pso_y = gov_y + box_h + gap_y
    draw_service_box(draw, pso_x, pso_y, box_w, box_h, "PSO", "Provincial", COLORS['org_pso'], COLORS['org_pso_bg'], fonts)

    # Club
    club_x = x + 60
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
    draw.text((MARGIN, 25), "Multi-Tenant Architecture v3", font=fonts['title'], fill=COLORS['text_primary'])
    draw.text((MARGIN, 60), "Tenant Isolation · Organization Hierarchy · Data Segregation", font=fonts['subtitle'], fill=COLORS['text_secondary'])

    # ========== Platform Layer (Shared Infrastructure) ==========
    platform_x = MARGIN
    platform_y = 110
    platform_w = 380
    platform_h = 360

    draw_rounded_rect(draw, [platform_x, platform_y, platform_x + platform_w, platform_y + platform_h],
                      12, fill=COLORS['platform_bg'], outline=COLORS['platform'], width=2)
    draw.text((platform_x + 15, platform_y + 12), "Solstice Platform (Shared)", font=fonts['section'], fill=COLORS['text_primary'])
    draw.text((platform_x + 15, platform_y + 32), "Single codebase · Shared infrastructure", font=fonts['service_detail'], fill=COLORS['text_secondary'])

    # Tenant Router
    router_x = platform_x + 30
    router_y = platform_y + 60
    router_w = 320
    router_h = 55
    draw_service_box(draw, router_x, router_y, router_w, router_h,
                    "Tenant Router", "TENANT_KEY routing · Domain mapping",
                    COLORS['security'], COLORS['security_bg'], fonts)

    # Redis (Shared with tenant prefixing) - NEW in v3
    redis_x = platform_x + 30
    redis_y = router_y + router_h + 20
    redis_w = 320
    redis_h = 55
    draw_service_box(draw, redis_x, redis_y, redis_w, redis_h,
                    "Redis (ElastiCache)", "Tenant-prefixed keys: sin:{stage}:*",
                    COLORS['cache'], COLORS['cache_bg'], fonts)

    # ECS Batch (Shared cluster, isolated tasks) - NEW in v3
    ecs_x = platform_x + 30
    ecs_y = redis_y + redis_h + 20
    ecs_w = 320
    ecs_h = 55
    draw_service_box(draw, ecs_x, ecs_y, ecs_w, ecs_h,
                    "ECS Fargate Cluster", "Isolated batch tasks per tenant",
                    COLORS['batch'], COLORS['batch_bg'], fonts)

    # Shared RDS Infrastructure
    shared_db_x = platform_x + 30
    shared_db_y = ecs_y + ecs_h + 20
    shared_db_w = 320
    shared_db_h = 55
    draw_service_box(draw, shared_db_x, shared_db_y, shared_db_w, shared_db_h,
                    "RDS PostgreSQL", "Org-scoped queries · Row-level isolation",
                    COLORS['data'], COLORS['data_bg'], fonts)

    # ========== viaSport Tenant ==========
    vs_x = MARGIN + 440
    vs_y = 110
    vs_w = 680
    vs_h = 540

    draw_rounded_rect(draw, [vs_x, vs_y, vs_x + vs_w, vs_y + vs_h], 14, fill=COLORS['viasport_light'])
    draw_dashed_rect(draw, [vs_x, vs_y, vs_x + vs_w, vs_y + vs_h], 14, COLORS['viasport'], width=3)

    # Tenant badge
    badge_w = 160
    badge_h = 28
    draw_rounded_rect(draw, [vs_x + 15, vs_y - 14, vs_x + 15 + badge_w, vs_y - 14 + badge_h], 5, fill=COLORS['viasport'])
    draw.text((vs_x + 28, vs_y - 9), "Tenant: viaSport", font=fonts['badge'], fill=COLORS['text_white'])

    draw.text((vs_x + 25, vs_y + 22), "viaSport BC", font=fonts['tenant'], fill=COLORS['viasport'])
    draw.text((vs_x + 25, vs_y + 45), "Provincial sport governing body", font=fonts['service_detail'], fill=COLORS['text_secondary'])

    # RBAC section
    rbac_x = vs_x + 25
    rbac_y = vs_y + 75
    rbac_w = 300
    rbac_h = 155
    draw_rounded_rect(draw, [rbac_x, rbac_y, rbac_x + rbac_w, rbac_y + rbac_h], 6, fill='#FFFFFF', outline=COLORS['viasport'], width=1)
    draw.text((rbac_x + 12, rbac_y + 10), "RBAC Roles", font=fonts['section'], fill=COLORS['text_primary'])

    roles = ["Owner", "Admin", "Reporter", "Viewer"]
    role_colors = ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD']
    for i, (role, color) in enumerate(zip(roles, role_colors)):
        ry = rbac_y + 38 + i * 28
        draw_rounded_rect(draw, [rbac_x + 15, ry, rbac_x + 80, ry + 20], 3, fill=color)
        draw.text((rbac_x + 24, ry + 3), role, font=fonts['badge'], fill='#FFFFFF')
        desc = ["Full access", "Manage org", "Submit data", "Read only"][i]
        draw.text((rbac_x + 95, ry + 4), desc, font=fonts['service_detail'], fill=COLORS['text_secondary'])

    # Organization hierarchy
    org_x = vs_x + 360
    org_y = vs_y + 75
    draw.text((org_x, org_y), "Organization Hierarchy", font=fonts['section'], fill=COLORS['text_primary'])
    draw_org_hierarchy(draw, org_x, org_y + 25, fonts, COLORS['viasport'], COLORS['viasport_bg'])

    # Data stores for viaSport
    data_y = vs_y + 290

    # S3 Artifacts with Object Lock - NEW in v3
    s3_x = vs_x + 25
    s3_y = data_y
    s3_w = 200
    s3_h = 50
    draw_service_box(draw, s3_x, s3_y, s3_w, s3_h, "S3 Artifacts", "Object Lock + Glacier", COLORS['viasport'], COLORS['viasport_bg'], fonts)

    # S3 Audit Archives - NEW in v3
    s3_audit_x = vs_x + 240
    s3_audit_y = data_y
    s3_audit_w = 200
    s3_audit_h = 50
    draw_service_box(draw, s3_audit_x, s3_audit_y, s3_audit_w, s3_audit_h, "S3 Audit Archives", "7-year WORM", COLORS['viasport'], COLORS['viasport_bg'], fonts)

    # Redis keys label
    redis_label_x = vs_x + 25
    redis_label_y = data_y + 65
    draw.text((redis_label_x, redis_label_y), "Redis keys: sin:{stage}:rate:*, sin:{stage}:cache:*", font=fonts['label'], fill=COLORS['text_muted'])

    # Batch task label
    batch_label_y = redis_label_y + 18
    draw.text((redis_label_x, batch_label_y), "Batch imports: Isolated ECS tasks with tenant context", font=fonts['label'], fill=COLORS['text_muted'])

    draw.text((vs_x + 25, data_y + 110), "All viaSport data isolated · Separate encryption keys · Object Lock enabled", font=fonts['service_detail'], fill=COLORS['text_secondary'])

    # ========== Other Tenants (generic) ==========
    other_x = MARGIN + 1180
    other_y = 110
    other_w = 170
    other_h = 260
    other_gap = 20

    other_a_x = other_x
    other_b_x = other_x + other_w + other_gap

    for idx, (tenant_x, label, name, prefix) in enumerate([
        (other_a_x, "Tenant: Partner A", "Partner Org A", "tenant-a:*"),
        (other_b_x, "Tenant: Partner B", "Partner Org B", "tenant-b:*"),
    ]):
        draw_rounded_rect(draw, [tenant_x, other_y, tenant_x + other_w, other_y + other_h], 14, fill=COLORS['qc_light'])
        draw_dashed_rect(draw, [tenant_x, other_y, tenant_x + other_w, other_y + other_h], 14, COLORS['qc'], width=3)

        badge_width = other_w - 30
        draw_rounded_rect(draw, [tenant_x + 15, other_y - 14, tenant_x + 15 + badge_width, other_y - 14 + badge_h], 5, fill=COLORS['qc'])
        draw.text((tenant_x + 24, other_y - 9), label, font=fonts['badge'], fill=COLORS['text_white'])

        draw.text((tenant_x + 18, other_y + 22), name, font=fonts['tenant'], fill=COLORS['qc'])
        draw.text((tenant_x + 18, other_y + 45), "Isolated tenant", font=fonts['service_detail'], fill=COLORS['text_secondary'])

        org_box_x = tenant_x + 18
        org_box_y = other_y + 80
        draw_service_box(draw, org_box_x, org_box_y, 130, 42, "Org Hierarchy", "Scoped access", COLORS['qc'], COLORS['qc_bg'], fonts)

        data_box_y = other_y + 130
        draw_service_box(draw, org_box_x, data_box_y, 130, 42, "S3 Buckets", "Object Lock", COLORS['qc'], COLORS['qc_bg'], fonts)

        draw.text((tenant_x + 18, other_y + 190), f"Redis: {prefix}", font=fonts['label'], fill=COLORS['text_muted'])
        draw.text((tenant_x + 18, other_y + 208), "Batch: Isolated tasks", font=fonts['label'], fill=COLORS['text_muted'])

    # ========== Arrows ==========
    # Platform -> viaSport
    draw_arrow(draw, (platform_x + platform_w, platform_y + 100),
               (vs_x, vs_y + 100), COLORS['arrow'], 2)
    draw.text((platform_x + platform_w + 10, platform_y + 85), "sin.*", font=fonts['label'], fill=COLORS['text_muted'])

    # Platform -> Other tenants (routed above to avoid overlap)
    tenant_rail_y = vs_y - 20
    other_a_mid_y = other_y + 90
    other_b_mid_y = other_y + 90
    other_a_rail_x = other_a_x - 30
    other_b_rail_x = other_b_x - 10

    draw_polyline_arrow(draw, [
        (platform_x + platform_w, platform_y + 150),
        (platform_x + platform_w, tenant_rail_y),
        (other_a_rail_x, tenant_rail_y),
        (other_a_rail_x, other_a_mid_y),
        (other_a_x, other_a_mid_y),
    ], COLORS['arrow'], 2)

    draw_polyline_arrow(draw, [
        (platform_x + platform_w, platform_y + 180),
        (platform_x + platform_w, tenant_rail_y),
        (other_b_rail_x, tenant_rail_y),
        (other_b_rail_x, other_b_mid_y),
        (other_b_x, other_b_mid_y),
    ], COLORS['arrow'], 2)

    # ========== Isolation callout - Updated for v3 ==========
    iso_x = MARGIN + 1180
    iso_y = 500
    iso_w = 360
    iso_h = 190

    draw_rounded_rect(draw, [iso_x, iso_y, iso_x + iso_w, iso_y + iso_h], 8, fill='#FEF2F2', outline='#EF4444', width=2)
    draw.text((iso_x + 15, iso_y + 12), "Tenant Isolation Guarantees", font=fonts['section'], fill='#B91C1C')

    guarantees = [
        "• Complete data segregation by tenant",
        "• Redis key prefixing (tenant-id:*)",
        "• Separate S3 buckets with Object Lock",
        "• Isolated ECS batch tasks",
        "• Separate encryption keys (KMS)",
        "• Audit logs per tenant",
    ]
    for i, g in enumerate(guarantees):
        draw.text((iso_x + 15, iso_y + 40 + i * 24), g, font=fonts['service_detail'], fill=COLORS['text_primary'])

    # ========== Legend ==========
    legend_x = MARGIN
    legend_y = 510
    legend_w = 360
    legend_h = 230

    draw_rounded_rect(draw, [legend_x, legend_y, legend_x + legend_w, legend_y + legend_h], 8, fill='#FFFFFF', outline=COLORS['line'], width=1)
    draw.text((legend_x + 15, legend_y + 12), "Legend", font=fonts['section'], fill=COLORS['text_primary'])

    legend_items = [
        ("Platform (Shared)", COLORS['platform'], COLORS['platform_bg']),
        ("viaSport Tenant", COLORS['viasport'], COLORS['viasport_bg']),
        ("Other Tenants", COLORS['qc'], COLORS['qc_bg']),
        ("Cache (Redis)", COLORS['cache'], COLORS['cache_bg']),
        ("Batch (ECS)", COLORS['batch'], COLORS['batch_bg']),
    ]

    for i, (label, color, bg) in enumerate(legend_items):
        ly = legend_y + 42 + i * 34
        draw_rounded_rect(draw, [legend_x + 15, ly, legend_x + 50, ly + 22], 4, fill=bg, outline=color, width=2)
        draw.text((legend_x + 60, ly + 4), label, font=fonts['legend'], fill=COLORS['text_primary'])

    # ========== Footer ==========
    footer_y = HEIGHT - 30
    draw.text((MARGIN, footer_y), "Solstice Platform · Multi-Tenant Architecture v3", font=fonts['label'], fill=COLORS['text_muted'])
    draw.text((WIDTH - 380, footer_y), "Single codebase · Complete tenant isolation", font=fonts['label'], fill=COLORS['text_muted'])

    return img

if __name__ == "__main__":
    img = create_multitenant_diagram()
    output_path = "/Users/austin/dev/solstice/docs/sin-rfp/response/08-appendices/diagrams/multi-tenant-architecture-v3.png"
    if EXPORT_SCALE != 1:
        img = img.resize((WIDTH * EXPORT_SCALE, HEIGHT * EXPORT_SCALE), Image.LANCZOS)
    img.save(output_path, "PNG", dpi=(300 * EXPORT_SCALE, 300 * EXPORT_SCALE))
    print(f"Saved: {output_path}")
