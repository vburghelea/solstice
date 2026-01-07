#!/usr/bin/env python3
"""
High-Fidelity Data Flow Diagram
Following the Systematic Clarity design philosophy
"""

from PIL import Image, ImageDraw, ImageFont
import math

WIDTH = 2400
HEIGHT = 1600
MARGIN = 80

COLORS = {
    'background': '#FAFBFC',

    # Flow colors
    'submission': '#3B82F6',
    'submission_bg': '#EFF6FF',
    'reporting': '#10B981',
    'reporting_bg': '#ECFDF5',
    'notification': '#8B5CF6',
    'notification_bg': '#F5F3FF',

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
        for key in fonts.keys():
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
    draw.text((MARGIN, 30), "Data Flow Diagrams", font=fonts['title'], fill=COLORS['text_primary'])
    draw.text((MARGIN, 72), "User Submission · Reporting · Notifications", font=fonts['subtitle'], fill=COLORS['text_secondary'])

    # ========== Flow 1: User Submission ==========
    flow1_x = MARGIN
    flow1_y = 130
    flow1_w = 2240
    flow1_h = 320

    draw_rounded_rect(draw, [flow1_x, flow1_y, flow1_x + flow1_w, flow1_y + flow1_h],
                      12, fill=COLORS['submission_bg'], outline=COLORS['submission'], width=2)

    # Flow title badge
    badge_w = 180
    badge_h = 28
    draw_rounded_rect(draw, [flow1_x + 20, flow1_y - 14, flow1_x + 20 + badge_w, flow1_y + 14], 6, fill=COLORS['submission'])
    draw.text((flow1_x + 35, flow1_y - 8), "USER SUBMISSION", font=fonts['badge'], fill='#FFFFFF')

    # Step 1: Browser
    s1_x = flow1_x + 60
    s1_y = flow1_y + 80
    draw_step_number(draw, s1_x - 20, s1_y + 30, 1, COLORS['submission'], fonts)
    draw_service_box(draw, s1_x, s1_y, 140, 60, "Browser", "Form entry", COLORS['user'], COLORS['user_bg'], fonts)

    # Step 2: API
    s2_x = s1_x + 220
    draw_step_number(draw, s2_x - 20, s1_y + 30, 2, COLORS['submission'], fonts)
    draw_service_box(draw, s2_x, s1_y, 140, 60, "API", "Lambda handler", COLORS['app'], COLORS['app_bg'], fonts)

    # Step 3: Validation
    s3_x = s2_x + 220
    draw_step_number(draw, s3_x - 20, s1_y + 30, 3, COLORS['submission'], fonts)
    draw_service_box(draw, s3_x, s1_y, 180, 60, "Validation", "Schema + business rules", COLORS['app'], COLORS['app_bg'], fonts)

    # Step 4: Database
    s4_x = s3_x + 260
    draw_step_number(draw, s4_x - 20, s1_y + 30, 4, COLORS['submission'], fonts)
    draw_database_icon(draw, s4_x + 50, s1_y + 35, 70, 80, COLORS['data'], COLORS['data_bg'])
    draw.text((s4_x + 10, s1_y + 90), "PostgreSQL", font=fonts['service'], fill=COLORS['text_primary'])

    # Step 5: Audit Log
    s5_x = s4_x + 180
    draw_step_number(draw, s5_x - 20, s1_y + 30, 5, COLORS['submission'], fonts)
    draw_service_box(draw, s5_x, s1_y, 160, 60, "Audit Log", "Hash chain entry", COLORS['audit'], COLORS['audit_bg'], fonts)

    # Arrows for flow 1
    draw_arrow(draw, (s1_x + 140, s1_y + 30), (s2_x, s1_y + 30), COLORS['submission'], 2)
    draw_arrow(draw, (s2_x + 140, s1_y + 30), (s3_x, s1_y + 30), COLORS['submission'], 2)
    draw_arrow(draw, (s3_x + 180, s1_y + 30), (s4_x + 10, s1_y + 30), COLORS['submission'], 2)
    draw_arrow(draw, (s4_x + 95, s1_y + 30), (s5_x, s1_y + 30), COLORS['submission'], 2)

    # Flow description
    draw.text((flow1_x + 40, flow1_y + 200), "Form data validated against schema → Stored with version history → Immutable audit record created",
              font=fonts['service_detail'], fill=COLORS['text_secondary'])
    draw.text((flow1_x + 40, flow1_y + 225), "Every submission triggers: validation rules, organization scoping check, audit log entry with hash chain verification",
              font=fonts['service_detail'], fill=COLORS['text_muted'])

    # ========== Flow 2: Reporting ==========
    flow2_x = MARGIN
    flow2_y = 500
    flow2_w = 2240
    flow2_h = 320

    draw_rounded_rect(draw, [flow2_x, flow2_y, flow2_x + flow2_w, flow2_y + flow2_h],
                      12, fill=COLORS['reporting_bg'], outline=COLORS['reporting'], width=2)

    draw_rounded_rect(draw, [flow2_x + 20, flow2_y - 14, flow2_x + 20 + badge_w, flow2_y + 14], 6, fill=COLORS['reporting'])
    draw.text((flow2_x + 50, flow2_y - 8), "REPORTING FLOW", font=fonts['badge'], fill='#FFFFFF')

    # Step 1: Report Builder
    r1_x = flow2_x + 60
    r1_y = flow2_y + 80
    draw_step_number(draw, r1_x - 20, r1_y + 30, 1, COLORS['reporting'], fonts)
    draw_service_box(draw, r1_x, r1_y, 150, 60, "Report Builder", "UI interface", COLORS['user'], COLORS['user_bg'], fonts)

    # Step 2: Query API
    r2_x = r1_x + 230
    draw_step_number(draw, r2_x - 20, r1_y + 30, 2, COLORS['reporting'], fonts)
    draw_service_box(draw, r2_x, r1_y, 140, 60, "Query API", "Request handler", COLORS['app'], COLORS['app_bg'], fonts)

    # Step 3: Access Control
    r3_x = r2_x + 220
    draw_step_number(draw, r3_x - 20, r1_y + 30, 3, COLORS['reporting'], fonts)
    draw_service_box(draw, r3_x, r1_y, 170, 60, "Access Control", "RBAC + org scope", COLORS['security'], COLORS['security_bg'], fonts)

    # Step 4: Aggregation
    r4_x = r3_x + 250
    draw_step_number(draw, r4_x - 20, r1_y + 30, 4, COLORS['reporting'], fonts)
    draw_service_box(draw, r4_x, r1_y, 160, 60, "Aggregation", "Compute engine", COLORS['app'], COLORS['app_bg'], fonts)

    # Step 5: Export
    r5_x = r4_x + 240
    draw_step_number(draw, r5_x - 20, r1_y + 30, 5, COLORS['reporting'], fonts)
    draw_service_box(draw, r5_x, r1_y, 140, 60, "Export", "CSV / PDF", COLORS['data'], COLORS['data_bg'], fonts)

    # Arrows for flow 2
    draw_arrow(draw, (r1_x + 150, r1_y + 30), (r2_x, r1_y + 30), COLORS['reporting'], 2)
    draw_arrow(draw, (r2_x + 140, r1_y + 30), (r3_x, r1_y + 30), COLORS['reporting'], 2)
    draw_arrow(draw, (r3_x + 170, r1_y + 30), (r4_x, r1_y + 30), COLORS['reporting'], 2)
    draw_arrow(draw, (r4_x + 160, r1_y + 30), (r5_x, r1_y + 30), COLORS['reporting'], 2)

    draw.text((flow2_x + 40, flow2_y + 200), "Report requests filtered by user's organization scope → Data aggregated server-side → Exported in requested format",
              font=fonts['service_detail'], fill=COLORS['text_secondary'])
    draw.text((flow2_x + 40, flow2_y + 225), "All queries automatically scoped to user's accessible organizations · Sensitive fields masked based on role",
              font=fonts['service_detail'], fill=COLORS['text_muted'])

    # ========== Flow 3: Notifications ==========
    flow3_x = MARGIN
    flow3_y = 870
    flow3_w = 2240
    flow3_h = 320

    draw_rounded_rect(draw, [flow3_x, flow3_y, flow3_x + flow3_w, flow3_y + flow3_h],
                      12, fill=COLORS['notification_bg'], outline=COLORS['notification'], width=2)

    draw_rounded_rect(draw, [flow3_x + 20, flow3_y - 14, flow3_x + 20 + badge_w, flow3_y + 14], 6, fill=COLORS['notification'])
    draw.text((flow3_x + 35, flow3_y - 8), "NOTIFICATION FLOW", font=fonts['badge'], fill='#FFFFFF')

    # Step 1: Domain Event
    n1_x = flow3_x + 60
    n1_y = flow3_y + 80
    draw_step_number(draw, n1_x - 20, n1_y + 30, 1, COLORS['notification'], fonts)
    draw_service_box(draw, n1_x, n1_y, 150, 60, "Domain Event", "Trigger action", COLORS['app'], COLORS['app_bg'], fonts)

    # Step 2: SQS Queue
    n2_x = n1_x + 230
    draw_step_number(draw, n2_x - 20, n1_y + 30, 2, COLORS['notification'], fonts)
    draw_service_box(draw, n2_x, n1_y, 140, 60, "SQS Queue", "Message buffer", COLORS['async'], COLORS['async_bg'], fonts)

    # Step 3: Worker
    n3_x = n2_x + 220
    draw_step_number(draw, n3_x - 20, n1_y + 30, 3, COLORS['notification'], fonts)
    draw_service_box(draw, n3_x, n1_y, 160, 60, "Worker Lambda", "Process job", COLORS['app'], COLORS['app_bg'], fonts)

    # Step 4a: Email (SES)
    n4a_x = n3_x + 250
    n4a_y = n1_y - 30
    draw_step_number(draw, n4a_x - 20, n4a_y + 30, 4, COLORS['notification'], fonts)
    draw_service_box(draw, n4a_x, n4a_y, 140, 55, "SES Email", "External delivery", COLORS['async'], COLORS['async_bg'], fonts)

    # Step 4b: In-App
    n4b_x = n3_x + 250
    n4b_y = n1_y + 50
    draw_service_box(draw, n4b_x, n4b_y, 140, 55, "In-App", "Dashboard alerts", COLORS['async'], COLORS['async_bg'], fonts)

    # Arrows for flow 3
    draw_arrow(draw, (n1_x + 150, n1_y + 30), (n2_x, n1_y + 30), COLORS['notification'], 2)
    draw_arrow(draw, (n2_x + 140, n1_y + 30), (n3_x, n1_y + 30), COLORS['notification'], 2)
    draw_arrow(draw, (n3_x + 160, n1_y + 15), (n4a_x, n4a_y + 27), COLORS['notification'], 2)
    draw_arrow(draw, (n3_x + 160, n1_y + 45), (n4b_x, n4b_y + 27), COLORS['notification'], 2)

    draw.text((flow3_x + 40, flow3_y + 200), "Domain events queued asynchronously → Workers process with retry logic → Delivered via email and/or in-app notifications",
              font=fonts['service_detail'], fill=COLORS['text_secondary'])
    draw.text((flow3_x + 40, flow3_y + 225), "Decoupled architecture ensures main request path is never blocked · Failed notifications automatically retried",
              font=fonts['service_detail'], fill=COLORS['text_muted'])

    # ========== Legend ==========
    legend_x = MARGIN + 1800
    legend_y = 130
    legend_w = 420
    legend_h = 300

    draw_rounded_rect(draw, [legend_x, legend_y, legend_x + legend_w, legend_y + legend_h], 10, fill='#FFFFFF', outline=COLORS['line'], width=1)
    draw.text((legend_x + 20, legend_y + 16), "Component Types", font=fonts['section'], fill=COLORS['text_primary'])

    legend_items = [
        ("User Interface", COLORS['user'], COLORS['user_bg']),
        ("Application Logic", COLORS['app'], COLORS['app_bg']),
        ("Data Storage", COLORS['data'], COLORS['data_bg']),
        ("Async Processing", COLORS['async'], COLORS['async_bg']),
        ("Security Controls", COLORS['security'], COLORS['security_bg']),
        ("Audit Trail", COLORS['audit'], COLORS['audit_bg']),
    ]

    for i, (label, color, bg) in enumerate(legend_items):
        ly = legend_y + 50 + i * 38
        draw_rounded_rect(draw, [legend_x + 20, ly, legend_x + 60, ly + 26], 4, fill=bg, outline=color, width=2)
        draw.text((legend_x + 75, ly + 5), label, font=fonts['legend'], fill=COLORS['text_primary'])

    # ========== Footer ==========
    footer_y = HEIGHT - 40
    draw.text((MARGIN, footer_y), "Solstice Platform · Data Flow Architecture", font=fonts['label'], fill=COLORS['text_muted'])
    draw.text((WIDTH - 400, footer_y), "Async processing · Audit trail · Access control", font=fonts['label'], fill=COLORS['text_muted'])

    return img

if __name__ == "__main__":
    img = create_dataflow_diagram()
    output_path = "/Users/austin/dev/solstice/docs/sin-rfp/response/08-appendices/diagrams/data-flow-diagram-v2.png"
    img.save(output_path, "PNG", dpi=(300, 300))
    print(f"Saved: {output_path}")
