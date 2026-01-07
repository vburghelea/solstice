#!/usr/bin/env python3
"""
High-Fidelity Security Architecture Diagram
Following the Systematic Clarity design philosophy
"""

from PIL import Image, ImageDraw, ImageFont
import math

# Canvas dimensions
WIDTH = 2400
HEIGHT = 1800
MARGIN = 80

# Color palette - Security focused
COLORS = {
    'background': '#FAFBFC',
    'container_bg': '#F8FAFC',
    'container_border': '#E2E8F0',

    # Security layers
    'user': '#1E293B',
    'user_bg': '#F1F5F9',
    'edge': '#3B82F6',
    'edge_bg': '#EFF6FF',
    'auth': '#8B5CF6',
    'auth_bg': '#F5F3FF',
    'authz': '#EC4899',
    'authz_bg': '#FDF2F8',
    'data': '#F59E0B',
    'data_bg': '#FFFBEB',
    'encrypt': '#10B981',
    'encrypt_bg': '#ECFDF5',
    'audit': '#EF4444',
    'audit_bg': '#FEF2F2',
    'monitor': '#64748B',
    'monitor_bg': '#F8FAFC',

    # Text
    'text_primary': '#1E293B',
    'text_secondary': '#64748B',
    'text_muted': '#94A3B8',
    'line': '#CBD5E1',
    'arrow': '#475569',
    'tls': '#059669',
}

FONT_DIR = "/Users/austin/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/canvas-design/canvas-fonts"

def load_fonts():
    fonts = {}
    try:
        fonts['title'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 36)
        fonts['subtitle'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Regular.ttf", 20)
        fonts['section'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 18)
        fonts['service'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Bold.ttf", 15)
        fonts['service_detail'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Regular.ttf", 12)
        fonts['label'] = ImageFont.truetype(f"{FONT_DIR}/IBMPlexMono-Regular.ttf", 11)
        fonts['badge'] = ImageFont.truetype(f"{FONT_DIR}/IBMPlexMono-Bold.ttf", 10)
        fonts['legend'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Regular.ttf", 12)
    except Exception as e:
        print(f"Font error: {e}")
        for key in ['title', 'subtitle', 'section', 'service', 'service_detail', 'label', 'badge', 'legend']:
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
    shadow_offset = 2
    draw_rounded_rect(draw, [x+shadow_offset, y+shadow_offset, x+w+shadow_offset, y+h+shadow_offset], radius, fill='#E2E8F0')
    draw_rounded_rect(draw, [x, y, x+w, y+h], radius, fill=bg_color, outline=color, width=2)
    draw.rectangle([x, y+radius, x+4, y+h-radius], fill=color)
    text_x = x + 12
    text_y = y + (h//2 - 14)
    draw.text((text_x, text_y), name, font=fonts['service'], fill=COLORS['text_primary'])
    if detail:
        draw.text((text_x, text_y + 18), detail, font=fonts['service_detail'], fill=COLORS['text_secondary'])

def draw_section_container(draw, x, y, w, h, title, color, fonts):
    """Draw a labeled section container"""
    radius = 10
    bg = '#FFFFFF'
    draw_rounded_rect(draw, [x, y, x+w, y+h], radius, fill=bg, outline=color, width=2)

    # Title badge
    badge_w = len(title) * 8 + 24
    badge_h = 24
    badge_x = x + 16
    badge_y = y - 12
    draw_rounded_rect(draw, [badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], 4, fill=color)
    draw.text((badge_x + 12, badge_y + 5), title, font=fonts['badge'], fill='#FFFFFF')

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

def draw_tls_badge(draw, x, y, fonts):
    """Draw a TLS 1.2+ badge"""
    badge_w = 60
    badge_h = 20
    draw_rounded_rect(draw, [x, y, x+badge_w, y+badge_h], 3, fill=COLORS['tls'])
    draw.text((x+8, y+4), "TLS 1.2+", font=fonts['badge'], fill='#FFFFFF')

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

def create_security_diagram():
    img = Image.new('RGB', (WIDTH, HEIGHT), COLORS['background'])
    draw = ImageDraw.Draw(img)
    fonts = load_fonts()

    # Title
    draw.text((MARGIN, 30), "Security Architecture", font=fonts['title'], fill=COLORS['text_primary'])
    draw.text((MARGIN, 72), "Defense in Depth · Zero Trust Principles", font=fonts['subtitle'], fill=COLORS['text_secondary'])

    # ========== Users ==========
    user_x = MARGIN + 40
    user_y = 180
    user_w = 160
    user_h = 70
    draw_service_box(draw, user_x, user_y, user_w, user_h,
                    "Users / Admins", "Web browsers",
                    COLORS['user'], COLORS['user_bg'], fonts)

    # ========== Edge Layer ==========
    edge_x = MARGIN + 300
    edge_y = 140
    edge_w = 340
    edge_h = 150
    draw_section_container(draw, edge_x, edge_y, edge_w, edge_h, "EDGE LAYER", COLORS['edge'], fonts)

    cf_x = edge_x + 30
    cf_y = edge_y + 35
    cf_w = 280
    cf_h = 55
    draw_service_box(draw, cf_x, cf_y, cf_w, cf_h, "CloudFront", "DDoS protection + Security headers", COLORS['edge'], COLORS['edge_bg'], fonts)

    rate_x = edge_x + 30
    rate_y = edge_y + 95
    rate_w = 280
    rate_h = 40
    draw.text((rate_x + 10, rate_y + 10), "Rate Limiting · HSTS · CSP · X-Frame-Options", font=fonts['service_detail'], fill=COLORS['text_secondary'])

    # TLS badge between user and edge
    draw_tls_badge(draw, user_x + user_w + 35, user_y + 25, fonts)

    # ========== Authentication Section ==========
    auth_x = MARGIN + 100
    auth_y = 350
    auth_w = 540
    auth_h = 280
    draw_section_container(draw, auth_x, auth_y, auth_w, auth_h, "AUTHENTICATION", COLORS['auth'], fonts)

    ba_x = auth_x + 30
    ba_y = auth_y + 50
    ba_w = 200
    ba_h = 60
    draw_service_box(draw, ba_x, ba_y, ba_w, ba_h, "Better Auth", "Identity provider", COLORS['auth'], COLORS['auth_bg'], fonts)

    mfa_x = auth_x + 260
    mfa_y = auth_y + 50
    mfa_w = 240
    mfa_h = 60
    draw_service_box(draw, mfa_x, mfa_y, mfa_w, mfa_h, "MFA", "TOTP + Backup codes", COLORS['auth'], COLORS['auth_bg'], fonts)

    sess_x = auth_x + 30
    sess_y = auth_y + 140
    sess_w = 200
    sess_h = 60
    draw_service_box(draw, sess_x, sess_y, sess_w, sess_h, "Session Tokens", "Secure cookies", COLORS['auth'], COLORS['auth_bg'], fonts)

    lockout_x = auth_x + 260
    lockout_y = auth_y + 140
    lockout_w = 240
    lockout_h = 60
    draw_service_box(draw, lockout_x, lockout_y, lockout_w, lockout_h, "Account Lockout", "Brute force protection", COLORS['auth'], COLORS['auth_bg'], fonts)

    # Password policy note
    draw.text((auth_x + 30, auth_y + 225), "Configurable password policy · Step-up auth for sensitive operations", font=fonts['service_detail'], fill=COLORS['text_secondary'])

    # ========== App Layer ==========
    app_x = MARGIN + 700
    app_y = 140
    app_w = 220
    app_h = 150
    draw_section_container(draw, app_x, app_y, app_w, app_h, "APPLICATION", COLORS['encrypt'], fonts)

    api_x = app_x + 30
    api_y = app_y + 45
    api_w = 160
    api_h = 70
    draw_service_box(draw, api_x, api_y, api_w, api_h, "App API", "Lambda", COLORS['encrypt'], COLORS['encrypt_bg'], fonts)

    # TLS badge between edge and app
    draw_tls_badge(draw, edge_x + edge_w + 20, edge_y + 65, fonts)

    # ========== Authorization Section ==========
    authz_x = MARGIN + 700
    authz_y = 350
    authz_w = 540
    authz_h = 280
    draw_section_container(draw, authz_x, authz_y, authz_w, authz_h, "AUTHORIZATION", COLORS['authz'], fonts)

    rbac_x = authz_x + 30
    rbac_y = authz_y + 50
    rbac_w = 230
    rbac_h = 60
    draw_service_box(draw, rbac_x, rbac_y, rbac_w, rbac_h, "RBAC", "Owner/Admin/Reporter/Viewer", COLORS['authz'], COLORS['authz_bg'], fonts)

    org_x = authz_x + 280
    org_y = authz_y + 50
    org_w = 230
    org_h = 60
    draw_service_box(draw, org_x, org_y, org_w, org_h, "Org Scoping", "Data isolation by org", COLORS['authz'], COLORS['authz_bg'], fonts)

    feat_x = authz_x + 30
    feat_y = authz_y + 140
    feat_w = 230
    feat_h = 60
    draw_service_box(draw, feat_x, feat_y, feat_w, feat_h, "Feature Gates", "Capability controls", COLORS['authz'], COLORS['authz_bg'], fonts)

    field_x = authz_x + 280
    field_y = authz_y + 140
    field_w = 230
    field_h = 60
    draw_service_box(draw, field_x, field_y, field_w, field_h, "Field Permissions", "Sensitive data masking", COLORS['authz'], COLORS['authz_bg'], fonts)

    # Access note
    draw.text((authz_x + 30, authz_y + 225), "All queries scoped to user's organization · Least privilege by default", font=fonts['service_detail'], fill=COLORS['text_secondary'])

    # ========== Data Layer ==========
    data_x = MARGIN + 100
    data_y = 700
    data_w = 540
    data_h = 260
    draw_section_container(draw, data_x, data_y, data_w, data_h, "DATA LAYER", COLORS['data'], fonts)

    dal_x = data_x + 30
    dal_y = data_y + 50
    dal_w = 200
    dal_h = 60
    draw_service_box(draw, dal_x, dal_y, dal_w, dal_h, "Data Access Layer", "Query sanitization", COLORS['data'], COLORS['data_bg'], fonts)

    # RDS
    rds_cx = data_x + 380
    rds_cy = data_y + 100
    draw_database_icon(draw, rds_cx, rds_cy, 80, 100, COLORS['data'], COLORS['data_bg'])
    draw.text((rds_cx - 55, rds_cy + 60), "RDS PostgreSQL", font=fonts['service'], fill=COLORS['text_primary'])

    # S3
    s3_x = data_x + 30
    s3_y = data_y + 140
    s3_w = 200
    s3_h = 55
    draw_service_box(draw, s3_x, s3_y, s3_w, s3_h, "S3 Storage", "Object Lock enabled", COLORS['data'], COLORS['data_bg'], fonts)

    # S3 Glacier Deep Archive
    glacier_x = data_x + 260
    glacier_y = data_y + 140
    glacier_w = 250
    glacier_h = 55
    draw_service_box(draw, glacier_x, glacier_y, glacier_w, glacier_h, "S3 Glacier Archive", "7yr retention, anti-ransomware", COLORS['data'], COLORS['data_bg'], fonts)

    # ========== Encryption Section ==========
    enc_x = MARGIN + 700
    enc_y = 700
    enc_w = 540
    enc_h = 260
    draw_section_container(draw, enc_x, enc_y, enc_w, enc_h, "ENCRYPTION", COLORS['encrypt'], fonts)

    kms_x = enc_x + 30
    kms_y = enc_y + 50
    kms_w = 200
    kms_h = 60
    draw_service_box(draw, kms_x, kms_y, kms_w, kms_h, "AWS KMS", "Key management", COLORS['encrypt'], COLORS['encrypt_bg'], fonts)

    aes_x = enc_x + 260
    aes_y = enc_y + 50
    aes_w = 240
    aes_h = 60
    draw_service_box(draw, aes_x, aes_y, aes_w, aes_h, "AES-256", "At-rest encryption", COLORS['encrypt'], COLORS['encrypt_bg'], fonts)

    tls_x = enc_x + 30
    tls_y = enc_y + 140
    tls_w = 200
    tls_h = 55
    draw_service_box(draw, tls_x, tls_y, tls_w, tls_h, "TLS 1.2+", "In-transit encryption", COLORS['encrypt'], COLORS['encrypt_bg'], fonts)

    ssm_x = enc_x + 260
    ssm_y = enc_y + 140
    ssm_w = 240
    ssm_h = 55
    draw_service_box(draw, ssm_x, ssm_y, ssm_w, ssm_h, "SSM Parameters", "Secrets management", COLORS['encrypt'], COLORS['encrypt_bg'], fonts)

    # ========== Audit & Monitoring Section ==========
    audit_x = MARGIN + 100
    audit_y = 1030
    audit_w = 540
    audit_h = 200
    draw_section_container(draw, audit_x, audit_y, audit_w, audit_h, "AUDIT TRAIL", COLORS['audit'], fonts)

    log_x = audit_x + 30
    log_y = audit_y + 50
    log_w = 230
    log_h = 60
    draw_service_box(draw, log_x, log_y, log_w, log_h, "Audit Log", "Append-only, hash chain", COLORS['audit'], COLORS['audit_bg'], fonts)

    retain_x = audit_x + 280
    retain_y = audit_y + 50
    retain_w = 230
    retain_h = 60
    draw_service_box(draw, retain_x, retain_y, retain_w, retain_h, "Retention Policy", "Legal holds supported", COLORS['audit'], COLORS['audit_bg'], fonts)

    draw.text((audit_x + 30, audit_y + 135), "All user actions · Data changes · Auth events · Immutable records", font=fonts['service_detail'], fill=COLORS['text_secondary'])

    # Monitor section
    mon_x = MARGIN + 700
    mon_y = 1030
    mon_w = 540
    mon_h = 200
    draw_section_container(draw, mon_x, mon_y, mon_w, mon_h, "MONITORING", COLORS['monitor'], fonts)

    cw_x = mon_x + 30
    cw_y = mon_y + 50
    cw_w = 230
    cw_h = 55
    draw_service_box(draw, cw_x, cw_y, cw_w, cw_h, "CloudWatch", "Logs, Metrics & Alarms", COLORS['monitor'], COLORS['monitor_bg'], fonts)

    ct_x = mon_x + 280
    ct_y = mon_y + 50
    ct_w = 230
    ct_h = 55
    draw_service_box(draw, ct_x, ct_y, ct_w, ct_h, "CloudTrail", "CIS Benchmark Alarms", COLORS['monitor'], COLORS['monitor_bg'], fonts)

    draw.text((mon_x + 30, mon_y + 130), "Root account · IAM changes · VPC changes · Security group changes · Unauthorized API calls", font=fonts['service_detail'], fill=COLORS['text_secondary'])

    # ========== Connections ==========
    # User -> Edge
    draw_arrow(draw, (user_x + user_w, user_y + user_h//2), (edge_x, edge_y + edge_h//2), COLORS['arrow'], 2)

    # Edge -> App
    draw_arrow(draw, (edge_x + edge_w, edge_y + edge_h//2), (app_x, app_y + app_h//2), COLORS['arrow'], 2)

    # App -> Auth (down-left)
    draw_arrow(draw, (app_x + app_w//2, app_y + app_h), (auth_x + auth_w, auth_y + 50), COLORS['arrow'], 2)

    # App -> Authz (down-right)
    draw_arrow(draw, (app_x + app_w, app_y + app_h//2 + 30), (authz_x, authz_y + 50), COLORS['arrow'], 2)

    # Auth -> Authz
    draw_arrow(draw, (auth_x + auth_w, auth_y + auth_h//2), (authz_x, authz_y + auth_h//2), COLORS['arrow'], 2)

    # Authz -> Data
    draw_arrow(draw, (authz_x, authz_y + authz_h), (data_x + data_w//2, data_y), COLORS['arrow'], 2)

    # Data -> Encryption
    draw_arrow(draw, (data_x + data_w, data_y + data_h//2), (enc_x, enc_y + enc_h//2), COLORS['arrow'], 2)
    draw.text((data_x + data_w + 20, data_y + data_h//2 - 20), "encrypts", font=fonts['label'], fill=COLORS['text_muted'])

    # App -> Audit
    draw_arrow(draw, (app_x + app_w//2 - 100, app_y + app_h), (audit_x + audit_w//2, audit_y), COLORS['text_muted'], 1)

    # ========== Legend ==========
    legend_x = MARGIN + 1300
    legend_y = 140
    legend_w = 380
    legend_h = 380

    draw_rounded_rect(draw, [legend_x, legend_y, legend_x + legend_w, legend_y + legend_h], 10, fill='#FFFFFF', outline=COLORS['line'], width=1)
    draw.text((legend_x + 20, legend_y + 16), "Security Controls", font=fonts['section'], fill=COLORS['text_primary'])

    legend_items = [
        ("Edge Protection", COLORS['edge'], COLORS['edge_bg']),
        ("Authentication", COLORS['auth'], COLORS['auth_bg']),
        ("Authorization", COLORS['authz'], COLORS['authz_bg']),
        ("Data Layer", COLORS['data'], COLORS['data_bg']),
        ("Encryption", COLORS['encrypt'], COLORS['encrypt_bg']),
        ("Audit Trail", COLORS['audit'], COLORS['audit_bg']),
        ("Monitoring", COLORS['monitor'], COLORS['monitor_bg']),
    ]

    for i, (label, color, bg) in enumerate(legend_items):
        ly = legend_y + 55 + i * 42
        draw_rounded_rect(draw, [legend_x + 20, ly, legend_x + 60, ly + 28], 4, fill=bg, outline=color, width=2)
        draw.text((legend_x + 75, ly + 5), label, font=fonts['legend'], fill=COLORS['text_primary'])

    # ========== Footer ==========
    footer_y = HEIGHT - 40
    draw.text((MARGIN, footer_y), "Solstice Platform · Defense in Depth Architecture", font=fonts['label'], fill=COLORS['text_muted'])
    draw.text((WIDTH - 350, footer_y), "PIPEDA Aligned · SOC2 Type II Controls", font=fonts['label'], fill=COLORS['text_muted'])

    return img

if __name__ == "__main__":
    img = create_security_diagram()
    output_path = "/Users/austin/dev/solstice/docs/sin-rfp/response/08-appendices/diagrams/security-architecture-v2.png"
    img.save(output_path, "PNG", dpi=(300, 300))
    print(f"Saved: {output_path}")
