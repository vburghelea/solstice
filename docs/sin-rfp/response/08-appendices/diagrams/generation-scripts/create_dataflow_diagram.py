#!/usr/bin/env python3
"""
High-Fidelity Data Flow Diagram v3
Following the Systematic Clarity design philosophy
Updated to include Redis caching, DLQ, and ECS Fargate batch processing
"""

from PIL import Image, ImageDraw, ImageFont
import math

WIDTH = 2400
HEIGHT = 1700  # Compact layout for 4 flows
MARGIN = 80
EXPORT_SCALE = 2

COLORS = {
    'background': '#FAFBFC',

    # Flow colors
    'submission': '#3B82F6',
    'submission_bg': '#EFF6FF',
    'reporting': '#10B981',
    'reporting_bg': '#ECFDF5',
    'notification': '#8B5CF6',
    'notification_bg': '#F5F3FF',
    'batch': '#F97316',  # Orange for batch import
    'batch_bg': '#FFF7ED',

    # Component colors
    'user': '#1E293B',
    'user_bg': '#F1F5F9',
    'app': '#059669',
    'app_bg': '#ECFDF5',
    'data': '#F59E0B',
    'data_bg': '#FFFBEB',
    'async': '#7C3AED',
    'async_bg': '#F5F3FF',
    'security': '#EC4899',
    'security_bg': '#FDF2F8',
    'audit': '#EF4444',
    'audit_bg': '#FEF2F2',
    'cache': '#06B6D4',  # Cyan for Redis
    'cache_bg': '#ECFEFF',
    'storage': '#6366F1',  # Indigo for S3
    'storage_bg': '#EEF2FF',
    'dlq': '#DC2626',  # Red for DLQ
    'dlq_bg': '#FEF2F2',

    # Text
    'text_primary': '#1E293B',
    'text_secondary': '#64748B',
    'text_muted': '#94A3B8',
    'text_white': '#FFFFFF',
    'line': '#CBD5E1',
    'arrow': '#475569',
}

FONT_DIR = "/Users/austin/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/canvas-design/canvas-fonts"

def load_fonts():
    fonts = {}
    try:
        fonts['title'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 36)
        fonts['subtitle'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Regular.ttf", 20)
        fonts['section'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 18)
        fonts['flow'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 16)
        fonts['service'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Bold.ttf", 14)
        fonts['service_detail'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Regular.ttf", 12)
        fonts['label'] = ImageFont.truetype(f"{FONT_DIR}/IBMPlexMono-Regular.ttf", 11)
        fonts['badge'] = ImageFont.truetype(f"{FONT_DIR}/IBMPlexMono-Bold.ttf", 10)
        fonts['legend'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Regular.ttf", 12)
        fonts['step'] = ImageFont.truetype(f"{FONT_DIR}/IBMPlexMono-Bold.ttf", 14)
    except Exception as e:
        print(f"Font error: {e}")
        for key in ['title', 'subtitle', 'section', 'flow', 'service', 'service_detail', 'label', 'badge', 'legend', 'step']:
            fonts[key] = ImageFont.load_default()
    return fonts

def draw_rounded_rect(draw, coords, radius, fill=None, outline=None, width=1):
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

def draw_service_box(draw, x, y, w, h, name, detail, color, bg_color, fonts):
    radius = 6
    shadow = 2
    draw_rounded_rect(draw, [x+shadow, y+shadow, x+w+shadow, y+h+shadow], radius, fill='#E2E8F0')
    draw_rounded_rect(draw, [x, y, x+w, y+h], radius, fill=bg_color, outline=color, width=2)
    draw.rectangle([x, y+radius, x+4, y+h-radius], fill=color)
    text_x = x + 12
    text_y = y + (h//2 - 12) if detail else (h//2 - 8)
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

def draw_step_number(draw, cx, cy, num, color, fonts):
    """Draw a circled step number"""
    r = 14
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=color)
    draw.text((cx-5, cy-7), str(num), font=fonts['step'], fill='#FFFFFF')

def create_dataflow_diagram():
    img = Image.new('RGB', (WIDTH, HEIGHT), COLORS['background'])
    draw = ImageDraw.Draw(img)
    fonts = load_fonts()

    # Title
    draw.text((MARGIN, 30), "Data Flow Diagrams v3", font=fonts['title'], fill=COLORS['text_primary'])
    draw.text((MARGIN, 72), "User Submission · Reporting · Notifications · Batch Import", font=fonts['subtitle'], fill=COLORS['text_secondary'])

    # ========== Flow 1: User Submission (with Redis) ==========
    flow1_x = MARGIN
    flow1_y = 130
    flow1_w = 2240
    flow1_h = 280

    draw_rounded_rect(draw, [flow1_x, flow1_y, flow1_x + flow1_w, flow1_y + flow1_h],
                      12, fill=COLORS['submission_bg'], outline=COLORS['submission'], width=2)

    # Flow title badge
    badge_w = 180
    draw_rounded_rect(draw, [flow1_x + 20, flow1_y - 14, flow1_x + 20 + badge_w, flow1_y + 14], 6, fill=COLORS['submission'])
    draw.text((flow1_x + 35, flow1_y - 8), "USER SUBMISSION", font=fonts['badge'], fill='#FFFFFF')

    # Step 1: Browser
    s1_x = flow1_x + 50
    s1_y = flow1_y + 60
    draw_step_number(draw, s1_x - 15, s1_y + 25, 1, COLORS['submission'], fonts)
    draw_service_box(draw, s1_x, s1_y, 120, 50, "Browser", "Form entry", COLORS['user'], COLORS['user_bg'], fonts)

    # Step 2: API
    s2_x = s1_x + 170
    draw_step_number(draw, s2_x - 15, s1_y + 25, 2, COLORS['submission'], fonts)
    draw_service_box(draw, s2_x, s1_y, 120, 50, "API Lambda", "Handler", COLORS['app'], COLORS['app_bg'], fonts)

    # Step 3: Validation
    s3_x = s2_x + 170
    draw_step_number(draw, s3_x - 15, s1_y + 25, 3, COLORS['submission'], fonts)
    draw_service_box(draw, s3_x, s1_y, 140, 50, "Validation", "Schema + rules", COLORS['app'], COLORS['app_bg'], fonts)

    # Step 4: Redis (NEW)
    s4_x = s3_x + 190
    draw_step_number(draw, s4_x - 15, s1_y + 25, 4, COLORS['submission'], fonts)
    draw_service_box(draw, s4_x, s1_y, 130, 50, "Redis", "Rate limit check", COLORS['cache'], COLORS['cache_bg'], fonts)

    # Step 5: Database
    s5_x = s4_x + 180
    draw_step_number(draw, s5_x - 15, s1_y + 25, 5, COLORS['submission'], fonts)
    draw_database_icon(draw, s5_x + 40, s1_y + 30, 55, 65, COLORS['data'], COLORS['data_bg'])
    draw.text((s5_x + 5, s1_y + 70), "PostgreSQL", font=fonts['service_detail'], fill=COLORS['text_primary'])

    # Step 6: Audit Log + S3 Archive
    s6_x = s5_x + 130
    draw_step_number(draw, s6_x - 15, s1_y + 25, 6, COLORS['submission'], fonts)
    draw_service_box(draw, s6_x, s1_y - 15, 130, 45, "Audit Log", "Hash chain", COLORS['audit'], COLORS['audit_bg'], fonts)
    draw_service_box(draw, s6_x, s1_y + 40, 130, 45, "S3 Archive", "WORM storage", COLORS['storage'], COLORS['storage_bg'], fonts)

    # Arrows for flow 1
    draw_arrow(draw, (s1_x + 120, s1_y + 25), (s2_x, s1_y + 25), COLORS['submission'], 2)
    draw_arrow(draw, (s2_x + 120, s1_y + 25), (s3_x, s1_y + 25), COLORS['submission'], 2)
    draw_arrow(draw, (s3_x + 140, s1_y + 25), (s4_x, s1_y + 25), COLORS['submission'], 2)
    draw_arrow(draw, (s4_x + 130, s1_y + 25), (s5_x + 10, s1_y + 25), COLORS['submission'], 2)
    draw_arrow(draw, (s5_x + 75, s1_y + 10), (s6_x, s1_y + 10), COLORS['submission'], 2)
    draw_arrow(draw, (s5_x + 75, s1_y + 50), (s6_x, s1_y + 60), COLORS['submission'], 2)

    # Flow description
    draw.text((flow1_x + 40, flow1_y + 170), "Form data validated → Rate limit checked via Redis → Stored with version history → Audit record in DB + S3 archive",
              font=fonts['service_detail'], fill=COLORS['text_secondary'])
    draw.text((flow1_x + 40, flow1_y + 190), "Every submission: validation rules, org scoping check, hash chain audit log entry, S3 WORM archive for compliance",
              font=fonts['service_detail'], fill=COLORS['text_muted'])

    # ========== Flow 2: Reporting (with Redis cache) ==========
    flow2_x = MARGIN
    flow2_y = 460
    flow2_w = 2240
    flow2_h = 280

    draw_rounded_rect(draw, [flow2_x, flow2_y, flow2_x + flow2_w, flow2_y + flow2_h],
                      12, fill=COLORS['reporting_bg'], outline=COLORS['reporting'], width=2)

    draw_rounded_rect(draw, [flow2_x + 20, flow2_y - 14, flow2_x + 20 + badge_w, flow2_y + 14], 6, fill=COLORS['reporting'])
    draw.text((flow2_x + 50, flow2_y - 8), "REPORTING FLOW", font=fonts['badge'], fill='#FFFFFF')

    # Step 1: Report Builder
    r1_x = flow2_x + 50
    r1_y = flow2_y + 60
    draw_step_number(draw, r1_x - 15, r1_y + 25, 1, COLORS['reporting'], fonts)
    draw_service_box(draw, r1_x, r1_y, 130, 50, "Report Builder", "UI interface", COLORS['user'], COLORS['user_bg'], fonts)

    # Step 2: Query API
    r2_x = r1_x + 180
    draw_step_number(draw, r2_x - 15, r1_y + 25, 2, COLORS['reporting'], fonts)
    draw_service_box(draw, r2_x, r1_y, 130, 50, "Query API", "Handler", COLORS['app'], COLORS['app_bg'], fonts)

    # Step 3: Access Control
    r3_x = r2_x + 180
    draw_step_number(draw, r3_x - 15, r1_y + 25, 3, COLORS['reporting'], fonts)
    draw_service_box(draw, r3_x, r1_y, 150, 50, "Access Control", "RBAC + org scope", COLORS['security'], COLORS['security_bg'], fonts)

    # Step 4: Redis Cache Check (NEW)
    r4_x = r3_x + 200
    draw_step_number(draw, r4_x - 15, r1_y + 25, 4, COLORS['reporting'], fonts)
    draw_service_box(draw, r4_x, r1_y, 130, 50, "Redis Cache", "Query cache", COLORS['cache'], COLORS['cache_bg'], fonts)

    # Step 5: Aggregation
    r5_x = r4_x + 180
    draw_step_number(draw, r5_x - 15, r1_y + 25, 5, COLORS['reporting'], fonts)
    draw_service_box(draw, r5_x, r1_y, 140, 50, "Aggregation", "Compute engine", COLORS['app'], COLORS['app_bg'], fonts)

    # Step 6: Export
    r6_x = r5_x + 190
    draw_step_number(draw, r6_x - 15, r1_y + 25, 6, COLORS['reporting'], fonts)
    draw_service_box(draw, r6_x, r1_y, 120, 50, "Export", "CSV / PDF", COLORS['data'], COLORS['data_bg'], fonts)

    # Arrows for flow 2
    draw_arrow(draw, (r1_x + 130, r1_y + 25), (r2_x, r1_y + 25), COLORS['reporting'], 2)
    draw_arrow(draw, (r2_x + 130, r1_y + 25), (r3_x, r1_y + 25), COLORS['reporting'], 2)
    draw_arrow(draw, (r3_x + 150, r1_y + 25), (r4_x, r1_y + 25), COLORS['reporting'], 2)
    draw_arrow(draw, (r4_x + 130, r1_y + 25), (r5_x, r1_y + 25), COLORS['reporting'], 2)
    draw_arrow(draw, (r5_x + 140, r1_y + 25), (r6_x, r1_y + 25), COLORS['reporting'], 2)

    draw.text((flow2_x + 40, flow2_y + 170), "Report requests filtered by org scope → Redis cache checked → Data aggregated server-side → Exported in format",
              font=fonts['service_detail'], fill=COLORS['text_secondary'])
    draw.text((flow2_x + 40, flow2_y + 190), "All queries auto-scoped to user's orgs · Frequent queries cached in Redis · Sensitive fields masked by role",
              font=fonts['service_detail'], fill=COLORS['text_muted'])

    # ========== Flow 3: Notifications (with DLQ) ==========
    flow3_x = MARGIN
    flow3_y = 790
    flow3_w = 2240
    flow3_h = 300

    draw_rounded_rect(draw, [flow3_x, flow3_y, flow3_x + flow3_w, flow3_y + flow3_h],
                      12, fill=COLORS['notification_bg'], outline=COLORS['notification'], width=2)

    draw_rounded_rect(draw, [flow3_x + 20, flow3_y - 14, flow3_x + 20 + badge_w, flow3_y + 14], 6, fill=COLORS['notification'])
    draw.text((flow3_x + 35, flow3_y - 8), "NOTIFICATION FLOW", font=fonts['badge'], fill='#FFFFFF')

    # Step 1: Domain Event
    n1_x = flow3_x + 50
    n1_y = flow3_y + 70
    draw_step_number(draw, n1_x - 15, n1_y + 25, 1, COLORS['notification'], fonts)
    draw_service_box(draw, n1_x, n1_y, 130, 50, "Domain Event", "Trigger action", COLORS['app'], COLORS['app_bg'], fonts)

    # Step 2: SQS Queue
    n2_x = n1_x + 180
    draw_step_number(draw, n2_x - 15, n1_y + 25, 2, COLORS['notification'], fonts)
    draw_service_box(draw, n2_x, n1_y, 130, 50, "SQS Queue", "Message buffer", COLORS['async'], COLORS['async_bg'], fonts)

    # Step 3: Worker
    n3_x = n2_x + 180
    draw_step_number(draw, n3_x - 15, n1_y + 25, 3, COLORS['notification'], fonts)
    draw_service_box(draw, n3_x, n1_y, 140, 50, "Worker Lambda", "Process job", COLORS['app'], COLORS['app_bg'], fonts)

    # Step 4a: Email (SES)
    n4a_x = n3_x + 200
    n4a_y = n1_y - 25
    draw_step_number(draw, n4a_x - 15, n4a_y + 25, 4, COLORS['notification'], fonts)
    draw_service_box(draw, n4a_x, n4a_y, 120, 45, "SES Email", "External", COLORS['async'], COLORS['async_bg'], fonts)

    # Step 4b: In-App
    n4b_x = n3_x + 200
    n4b_y = n1_y + 35
    draw_service_box(draw, n4b_x, n4b_y, 120, 45, "In-App", "Dashboard", COLORS['async'], COLORS['async_bg'], fonts)

    # DLQ (NEW)
    dlq_x = n2_x + 40
    dlq_y = n1_y + 90
    draw_service_box(draw, dlq_x, dlq_y, 150, 50, "SQS DLQ", "Failed messages", COLORS['dlq'], COLORS['dlq_bg'], fonts)
    draw.text((dlq_x, dlq_y + 55), "Max 3 retries", font=fonts['label'], fill=COLORS['text_muted'])

    # Arrows for flow 3
    draw_arrow(draw, (n1_x + 130, n1_y + 25), (n2_x, n1_y + 25), COLORS['notification'], 2)
    draw_arrow(draw, (n2_x + 130, n1_y + 25), (n3_x, n1_y + 25), COLORS['notification'], 2)
    draw_arrow(draw, (n3_x + 140, n1_y + 10), (n4a_x, n4a_y + 22), COLORS['notification'], 2)
    draw_arrow(draw, (n3_x + 140, n1_y + 40), (n4b_x, n4b_y + 22), COLORS['notification'], 2)
    # Arrow to DLQ
    draw_arrow(draw, (n2_x + 65, n1_y + 50), (dlq_x + 75, dlq_y), COLORS['dlq'], 2)

    draw.text((flow3_x + 40, flow3_y + 200), "Domain events queued → Workers process with retry → Delivered via email and/or in-app · Failed messages go to DLQ",
              font=fonts['service_detail'], fill=COLORS['text_secondary'])
    draw.text((flow3_x + 40, flow3_y + 220), "Decoupled architecture ensures main request path is never blocked · Max 3 retries before DLQ · Alerts on DLQ depth",
              font=fonts['service_detail'], fill=COLORS['text_muted'])

    # ========== Flow 4: Batch Import (NEW - ECS Fargate) ==========
    flow4_x = MARGIN
    flow4_y = 1140
    flow4_w = 2240
    flow4_h = 330

    draw_rounded_rect(draw, [flow4_x, flow4_y, flow4_x + flow4_w, flow4_y + flow4_h],
                      12, fill=COLORS['batch_bg'], outline=COLORS['batch'], width=2)

    badge_w_batch = 180
    draw_rounded_rect(draw, [flow4_x + 20, flow4_y - 14, flow4_x + 20 + badge_w_batch, flow4_y + 14], 6, fill=COLORS['batch'])
    draw.text((flow4_x + 50, flow4_y - 8), "BATCH IMPORT", font=fonts['badge'], fill='#FFFFFF')

    # NEW badge
    draw_rounded_rect(draw, [flow4_x + 210, flow4_y - 14, flow4_x + 260, flow4_y + 14], 6, fill='#22C55E')
    draw.text((flow4_x + 222, flow4_y - 8), "NEW", font=fonts['badge'], fill='#FFFFFF')

    # Step 1: CSV Upload
    b1_x = flow4_x + 50
    b1_y = flow4_y + 70
    draw_step_number(draw, b1_x - 15, b1_y + 25, 1, COLORS['batch'], fonts)
    draw_service_box(draw, b1_x, b1_y, 120, 50, "CSV Upload", "User file", COLORS['user'], COLORS['user_bg'], fonts)

    # Step 2: S3 Artifacts
    b2_x = b1_x + 170
    draw_step_number(draw, b2_x - 15, b1_y + 25, 2, COLORS['batch'], fonts)
    draw_service_box(draw, b2_x, b1_y, 130, 50, "S3 Artifacts", "Object Lock", COLORS['storage'], COLORS['storage_bg'], fonts)

    # Step 3: Lambda Trigger
    b3_x = b2_x + 180
    draw_step_number(draw, b3_x - 15, b1_y + 25, 3, COLORS['batch'], fonts)
    draw_service_box(draw, b3_x, b1_y, 130, 50, "Lambda", "S3 trigger", COLORS['app'], COLORS['app_bg'], fonts)

    # Step 4: ECS Fargate
    b4_x = b3_x + 180
    draw_step_number(draw, b4_x - 15, b1_y + 25, 4, COLORS['batch'], fonts)
    draw_service_box(draw, b4_x, b1_y, 150, 50, "ECS Fargate", "Batch task", COLORS['batch'], COLORS['batch_bg'], fonts)
    draw.text((b4_x, b1_y + 55), "2 vCPU, 4GB RAM", font=fonts['label'], fill=COLORS['text_muted'])

    # Step 5: Validation
    b5_x = b4_x + 200
    draw_step_number(draw, b5_x - 15, b1_y + 25, 5, COLORS['batch'], fonts)
    draw_service_box(draw, b5_x, b1_y, 130, 50, "Validation", "Row-by-row", COLORS['app'], COLORS['app_bg'], fonts)

    # Step 6: PostgreSQL
    b6_x = b5_x + 180
    draw_step_number(draw, b6_x - 15, b1_y + 25, 6, COLORS['batch'], fonts)
    draw_database_icon(draw, b6_x + 40, b1_y + 30, 55, 65, COLORS['data'], COLORS['data_bg'])
    draw.text((b6_x + 5, b1_y + 70), "PostgreSQL", font=fonts['service_detail'], fill=COLORS['text_primary'])

    # Step 7: Audit + Notification
    b7_x = b6_x + 120
    draw_step_number(draw, b7_x - 15, b1_y + 25, 7, COLORS['batch'], fonts)
    draw_service_box(draw, b7_x, b1_y - 15, 110, 40, "Audit Log", "Batch entry", COLORS['audit'], COLORS['audit_bg'], fonts)
    draw_service_box(draw, b7_x, b1_y + 35, 110, 40, "Notification", "Complete", COLORS['async'], COLORS['async_bg'], fonts)

    # Arrows for flow 4
    draw_arrow(draw, (b1_x + 120, b1_y + 25), (b2_x, b1_y + 25), COLORS['batch'], 2)
    draw_arrow(draw, (b2_x + 130, b1_y + 25), (b3_x, b1_y + 25), COLORS['batch'], 2)
    draw_arrow(draw, (b3_x + 130, b1_y + 25), (b4_x, b1_y + 25), COLORS['batch'], 2)
    draw_arrow(draw, (b4_x + 150, b1_y + 25), (b5_x, b1_y + 25), COLORS['batch'], 2)
    draw_arrow(draw, (b5_x + 130, b1_y + 25), (b6_x + 10, b1_y + 25), COLORS['batch'], 2)
    draw_arrow(draw, (b6_x + 75, b1_y + 10), (b7_x, b1_y + 5), COLORS['batch'], 2)
    draw_arrow(draw, (b6_x + 75, b1_y + 45), (b7_x, b1_y + 55), COLORS['batch'], 2)

    draw.text((flow4_x + 40, flow4_y + 200), "CSV uploaded to S3 → Lambda triggers ECS Fargate task → Row validation with rollback → Bulk insert → Audit + notification",
              font=fonts['service_detail'], fill=COLORS['text_secondary'])
    draw.text((flow4_x + 40, flow4_y + 220), "Large imports (1M+ rows) run in ECS Fargate (2 vCPU, 4GB) · Progress tracking · Automatic rollback on validation failure",
              font=fonts['service_detail'], fill=COLORS['text_muted'])

    # ========== Legend ==========
    legend_x = MARGIN
    legend_y = 1520
    legend_w = 2240
    legend_h = 120

    draw_rounded_rect(draw, [legend_x, legend_y, legend_x + legend_w, legend_y + legend_h], 10, fill='#FFFFFF', outline=COLORS['line'], width=1)
    draw.text((legend_x + 20, legend_y + 14), "Component Types", font=fonts['section'], fill=COLORS['text_primary'])

    legend_items = [
        ("User Interface", COLORS['user'], COLORS['user_bg']),
        ("Application Logic", COLORS['app'], COLORS['app_bg']),
        ("Data Storage", COLORS['data'], COLORS['data_bg']),
        ("Cache (Redis)", COLORS['cache'], COLORS['cache_bg']),
        ("Async Processing", COLORS['async'], COLORS['async_bg']),
        ("Security Controls", COLORS['security'], COLORS['security_bg']),
        ("Audit Trail", COLORS['audit'], COLORS['audit_bg']),
        ("Object Storage (S3)", COLORS['storage'], COLORS['storage_bg']),
        ("Dead Letter Queue", COLORS['dlq'], COLORS['dlq_bg']),
        ("Batch Processing", COLORS['batch'], COLORS['batch_bg']),
    ]

    # Two rows of legend items
    items_per_row = 5
    for i, (label, color, bg) in enumerate(legend_items):
        row = i // items_per_row
        col = i % items_per_row
        lx = legend_x + 20 + col * 440
        ly = legend_y + 45 + row * 35
        draw_rounded_rect(draw, [lx, ly, lx + 35, ly + 22], 4, fill=bg, outline=color, width=2)
        draw.text((lx + 45, ly + 3), label, font=fonts['legend'], fill=COLORS['text_primary'])

    # ========== Footer ==========
    footer_y = HEIGHT - 40
    draw.text((MARGIN, footer_y), "Solstice Platform · Data Flow Architecture v3", font=fonts['label'], fill=COLORS['text_muted'])
    draw.text((WIDTH - 500, footer_y), "Redis caching · ECS Fargate batch · DLQ · S3 WORM archive", font=fonts['label'], fill=COLORS['text_muted'])

    return img

if __name__ == "__main__":
    img = create_dataflow_diagram()
    output_path = "/Users/austin/dev/solstice/docs/sin-rfp/response/08-appendices/diagrams/data-flow-diagram-v3.png"
    if EXPORT_SCALE != 1:
        img = img.resize((WIDTH * EXPORT_SCALE, HEIGHT * EXPORT_SCALE), Image.LANCZOS)
    img.save(output_path, "PNG", dpi=(300 * EXPORT_SCALE, 300 * EXPORT_SCALE))
    print(f"Saved: {output_path}")
