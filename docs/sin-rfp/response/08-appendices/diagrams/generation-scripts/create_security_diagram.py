#!/usr/bin/env python3
"""
High-Fidelity Security Architecture Diagram v3
Following the Systematic Clarity design philosophy
Shows security layers: Edge, Auth, Authorization, Data, Encryption, Audit, Monitoring
Updated with Redis rate limiting, Object Lock/WORM, CIS Alarms, SNS, Security Headers
"""

from PIL import Image, ImageDraw, ImageFont
import math

WIDTH = 2400
HEIGHT = 870
MARGIN = 80
EXPORT_SCALE = 2

COLORS = {
    'background': '#FAFBFC',

    # Layer colors
    'edge': '#3B82F6',
    'edge_bg': '#EFF6FF',
    'auth': '#10B981',
    'auth_bg': '#ECFDF5',
    'authz': '#8B5CF6',
    'authz_bg': '#F5F3FF',
    'data': '#F59E0B',
    'data_bg': '#FFFBEB',
    'encrypt': '#06B6D4',
    'encrypt_bg': '#ECFEFF',
    'audit': '#EF4444',
    'audit_bg': '#FEF2F2',
    'monitor': '#EC4899',
    'monitor_bg': '#FDF2F8',

    # Text
    'text_primary': '#1E293B',
    'text_secondary': '#64748B',
    'text_muted': '#94A3B8',
    'text_white': '#FFFFFF',
    'line': '#CBD5E1',
}

FONT_DIR = "/Users/austin/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/canvas-design/canvas-fonts"

def load_fonts():
    fonts = {}
    try:
        fonts['title'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 36)
        fonts['subtitle'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Regular.ttf", 20)
        fonts['section'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 18)
        fonts['layer'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 16)
        fonts['service'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Bold.ttf", 13)
        fonts['service_detail'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Regular.ttf", 11)
        fonts['label'] = ImageFont.truetype(f"{FONT_DIR}/IBMPlexMono-Regular.ttf", 11)
        fonts['badge'] = ImageFont.truetype(f"{FONT_DIR}/IBMPlexMono-Bold.ttf", 10)
        fonts['legend'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Regular.ttf", 12)
    except Exception as e:
        print(f"Font error: {e}")
        for key in ['title', 'subtitle', 'section', 'layer', 'service', 'service_detail', 'label', 'badge', 'legend']:
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
    text_y = y + (h//2 - 10) if detail else (h//2 - 6)
    draw.text((text_x, text_y), name, font=fonts['service'], fill=COLORS['text_primary'])
    if detail:
        draw.text((text_x, text_y + 14), detail, font=fonts['service_detail'], fill=COLORS['text_secondary'])

def draw_layer_header(draw, x, y, w, name, color, fonts):
    """Draw a layer header badge"""
    badge_w = len(name) * 8 + 30
    draw_rounded_rect(draw, [x, y - 14, x + badge_w, y + 14], 6, fill=color)
    draw.text((x + 12, y - 8), name, font=fonts['badge'], fill='#FFFFFF')

def create_security_diagram():
    img = Image.new('RGB', (WIDTH, HEIGHT), COLORS['background'])
    draw = ImageDraw.Draw(img)
    fonts = load_fonts()

    # Title
    draw.text((MARGIN, 30), "Security Architecture v3", font=fonts['title'], fill=COLORS['text_primary'])
    draw.text((MARGIN, 72), "Defense in Depth · AWS ca-central-1 · PIPEDA Compliant", font=fonts['subtitle'], fill=COLORS['text_secondary'])

    # Column layout - 3 columns
    col_w = 530
    col_spacing = 35
    start_x = MARGIN

    # ========== Column 1: Edge + Authentication ==========
    col1_x = start_x

    # Edge Layer
    edge_x = col1_x
    edge_y = 130
    edge_w = col_w
    edge_h = 230

    draw_rounded_rect(draw, [edge_x, edge_y, edge_x + edge_w, edge_y + edge_h],
                      12, fill=COLORS['edge_bg'], outline=COLORS['edge'], width=2)
    draw_layer_header(draw, edge_x + 20, edge_y, edge_w, "EDGE SECURITY", COLORS['edge'], fonts)

    # Edge services
    draw_service_box(draw, edge_x + 20, edge_y + 35, 155, 45, "WAF v2", "AWS managed rules", COLORS['edge'], COLORS['edge_bg'], fonts)
    draw_service_box(draw, edge_x + 190, edge_y + 35, 155, 45, "CloudFront", "CDN + edge cache", COLORS['edge'], COLORS['edge_bg'], fonts)
    draw_service_box(draw, edge_x + 360, edge_y + 35, 150, 45, "TLS 1.2+", "All endpoints", COLORS['edge'], COLORS['edge_bg'], fonts)

    # NEW: Redis rate limiting
    draw_service_box(draw, edge_x + 20, edge_y + 95, 155, 45, "Redis Rate Limit", "Per-IP throttling", COLORS['encrypt'], COLORS['encrypt_bg'], fonts)
    # NEW: Security Headers
    draw_service_box(draw, edge_x + 190, edge_y + 95, 320, 45, "Security Headers", "HSTS, CSP, COOP, COEP, X-Frame-Options", COLORS['edge'], COLORS['edge_bg'], fonts)

    draw.text((edge_x + 20, edge_y + 160), "Rate limiting: 5 auth/15min, 100 API/min", font=fonts['service_detail'], fill=COLORS['text_muted'])
    draw.text((edge_x + 20, edge_y + 178), "Bot protection + geo blocking available", font=fonts['service_detail'], fill=COLORS['text_muted'])

    # Authentication Layer
    auth_x = col1_x
    auth_y = edge_y + edge_h + 40
    auth_w = col_w
    auth_h = 230

    draw_rounded_rect(draw, [auth_x, auth_y, auth_x + auth_w, auth_y + auth_h],
                      12, fill=COLORS['auth_bg'], outline=COLORS['auth'], width=2)
    draw_layer_header(draw, auth_x + 20, auth_y, auth_w, "AUTHENTICATION", COLORS['auth'], fonts)

    draw_service_box(draw, auth_x + 20, auth_y + 35, 155, 45, "Better Auth", "Session management", COLORS['auth'], COLORS['auth_bg'], fonts)
    draw_service_box(draw, auth_x + 190, auth_y + 35, 155, 45, "TOTP MFA", "Authenticator app", COLORS['auth'], COLORS['auth_bg'], fonts)
    draw_service_box(draw, auth_x + 360, auth_y + 35, 150, 45, "Backup Codes", "Recovery tokens", COLORS['auth'], COLORS['auth_bg'], fonts)

    draw_service_box(draw, auth_x + 20, auth_y + 95, 155, 45, "Session Tokens", "HttpOnly cookies", COLORS['auth'], COLORS['auth_bg'], fonts)
    draw_service_box(draw, auth_x + 190, auth_y + 95, 155, 45, "Account Lockout", "5 failed attempts", COLORS['auth'], COLORS['auth_bg'], fonts)
    draw_service_box(draw, auth_x + 360, auth_y + 95, 150, 45, "Passkeys", "WebAuthn support", COLORS['auth'], COLORS['auth_bg'], fonts)

    draw.text((auth_x + 20, auth_y + 160), "Strong password policy: 12+ chars, complexity", font=fonts['service_detail'], fill=COLORS['text_muted'])
    draw.text((auth_x + 20, auth_y + 178), "Session expiry: 30 days idle, 90 days max", font=fonts['service_detail'], fill=COLORS['text_muted'])

    # ========== Column 2: Authorization + Data ==========
    col2_x = col1_x + col_w + col_spacing

    # Authorization Layer
    authz_x = col2_x
    authz_y = 130
    authz_w = col_w
    authz_h = 230

    draw_rounded_rect(draw, [authz_x, authz_y, authz_x + authz_w, authz_y + authz_h],
                      12, fill=COLORS['authz_bg'], outline=COLORS['authz'], width=2)
    draw_layer_header(draw, authz_x + 20, authz_y, authz_w, "AUTHORIZATION", COLORS['authz'], fonts)

    draw_service_box(draw, authz_x + 20, authz_y + 35, 155, 45, "RBAC", "Role-based access", COLORS['authz'], COLORS['authz_bg'], fonts)
    draw_service_box(draw, authz_x + 190, authz_y + 35, 155, 45, "Org Scoping", "Tenant isolation", COLORS['authz'], COLORS['authz_bg'], fonts)
    draw_service_box(draw, authz_x + 360, authz_y + 35, 150, 45, "Feature Gates", "Per-role features", COLORS['authz'], COLORS['authz_bg'], fonts)

    draw_service_box(draw, authz_x + 20, authz_y + 95, 155, 45, "Field Permissions", "Column-level", COLORS['authz'], COLORS['authz_bg'], fonts)
    draw_service_box(draw, authz_x + 190, authz_y + 95, 155, 45, "Hierarchy RBAC", "Inherited roles", COLORS['authz'], COLORS['authz_bg'], fonts)
    draw_service_box(draw, authz_x + 360, authz_y + 95, 150, 45, "API Scoping", "JWT claims", COLORS['authz'], COLORS['authz_bg'], fonts)

    draw.text((authz_x + 20, authz_y + 160), "Roles: Owner, Admin, Reporter, Viewer", font=fonts['service_detail'], fill=COLORS['text_muted'])
    draw.text((authz_x + 20, authz_y + 178), "All queries scoped to user's organization", font=fonts['service_detail'], fill=COLORS['text_muted'])

    # Data Layer
    data_x = col2_x
    data_y = authz_y + authz_h + 40
    data_w = col_w
    data_h = 230

    draw_rounded_rect(draw, [data_x, data_y, data_x + data_w, data_y + data_h],
                      12, fill=COLORS['data_bg'], outline=COLORS['data'], width=2)
    draw_layer_header(draw, data_x + 20, data_y, data_w, "DATA PROTECTION", COLORS['data'], fonts)

    draw_service_box(draw, data_x + 20, data_y + 35, 155, 45, "RDS PostgreSQL", "16.11 Multi-AZ", COLORS['data'], COLORS['data_bg'], fonts)
    draw_service_box(draw, data_x + 190, data_y + 35, 155, 45, "RDS Proxy", "Connection pool", COLORS['data'], COLORS['data_bg'], fonts)
    draw_service_box(draw, data_x + 360, data_y + 35, 150, 45, "VPC Isolation", "Private subnets", COLORS['data'], COLORS['data_bg'], fonts)

    # NEW: Object Lock and WORM
    draw_service_box(draw, data_x + 20, data_y + 95, 155, 45, "S3 Object Lock", "Immutable files", COLORS['data'], COLORS['data_bg'], fonts)
    draw_service_box(draw, data_x + 190, data_y + 95, 155, 45, "WORM Archive", "7-year retention", COLORS['data'], COLORS['data_bg'], fonts)
    draw_service_box(draw, data_x + 360, data_y + 95, 150, 45, "Legal Holds", "Compliance freeze", COLORS['data'], COLORS['data_bg'], fonts)

    draw.text((data_x + 20, data_y + 160), "Canadian data residency: ca-central-1 only", font=fonts['service_detail'], fill=COLORS['text_muted'])
    draw.text((data_x + 20, data_y + 178), "PITR backups: 35 days, RPO 1hr, RTO 4hr", font=fonts['service_detail'], fill=COLORS['text_muted'])

    # ========== Column 3: Encryption + Audit ==========
    col3_x = col2_x + col_w + col_spacing

    # Encryption Layer
    encrypt_x = col3_x
    encrypt_y = 130
    encrypt_w = col_w
    encrypt_h = 230

    draw_rounded_rect(draw, [encrypt_x, encrypt_y, encrypt_x + encrypt_w, encrypt_y + encrypt_h],
                      12, fill=COLORS['encrypt_bg'], outline=COLORS['encrypt'], width=2)
    draw_layer_header(draw, encrypt_x + 20, encrypt_y, encrypt_w, "ENCRYPTION", COLORS['encrypt'], fonts)

    draw_service_box(draw, encrypt_x + 20, encrypt_y + 35, 155, 45, "AWS KMS", "Key management", COLORS['encrypt'], COLORS['encrypt_bg'], fonts)
    draw_service_box(draw, encrypt_x + 190, encrypt_y + 35, 155, 45, "AES-256", "At-rest encryption", COLORS['encrypt'], COLORS['encrypt_bg'], fonts)
    draw_service_box(draw, encrypt_x + 360, encrypt_y + 35, 150, 45, "TLS 1.2+", "In-transit", COLORS['encrypt'], COLORS['encrypt_bg'], fonts)

    draw_service_box(draw, encrypt_x + 20, encrypt_y + 95, 155, 45, "Secrets Manager", "Credential vault", COLORS['encrypt'], COLORS['encrypt_bg'], fonts)
    draw_service_box(draw, encrypt_x + 190, encrypt_y + 95, 155, 45, "App-Level Crypto", "TOTP secrets", COLORS['encrypt'], COLORS['encrypt_bg'], fonts)
    draw_service_box(draw, encrypt_x + 360, encrypt_y + 95, 150, 45, "Key Rotation", "Automatic", COLORS['encrypt'], COLORS['encrypt_bg'], fonts)

    draw.text((encrypt_x + 20, encrypt_y + 160), "All data encrypted at rest and in transit", font=fonts['service_detail'], fill=COLORS['text_muted'])
    draw.text((encrypt_x + 20, encrypt_y + 178), "Application-level encryption for sensitive auth fields", font=fonts['service_detail'], fill=COLORS['text_muted'])

    # Audit Trail Layer
    audit_x = col3_x
    audit_y = encrypt_y + encrypt_h + 40
    audit_w = col_w
    audit_h = 230

    draw_rounded_rect(draw, [audit_x, audit_y, audit_x + audit_w, audit_y + audit_h],
                      12, fill=COLORS['audit_bg'], outline=COLORS['audit'], width=2)
    draw_layer_header(draw, audit_x + 20, audit_y, audit_w, "AUDIT TRAIL", COLORS['audit'], fonts)

    draw_service_box(draw, audit_x + 20, audit_y + 35, 155, 45, "Audit Log", "All actions logged", COLORS['audit'], COLORS['audit_bg'], fonts)
    draw_service_box(draw, audit_x + 190, audit_y + 35, 155, 45, "Hash Chain", "Tamper-evident", COLORS['audit'], COLORS['audit_bg'], fonts)
    draw_service_box(draw, audit_x + 360, audit_y + 35, 150, 45, "Retention Policy", "Configurable", COLORS['audit'], COLORS['audit_bg'], fonts)

    draw_service_box(draw, audit_x + 20, audit_y + 95, 155, 45, "S3 Deep Archive", "Long-term storage", COLORS['audit'], COLORS['audit_bg'], fonts)
    draw_service_box(draw, audit_x + 190, audit_y + 95, 155, 45, "Verification API", "Integrity check", COLORS['audit'], COLORS['audit_bg'], fonts)
    draw_service_box(draw, audit_x + 360, audit_y + 95, 150, 45, "Export Logs", "Compliance export", COLORS['audit'], COLORS['audit_bg'], fonts)

    draw.text((audit_x + 20, audit_y + 160), "SHA-256 hash chain prevents log tampering", font=fonts['service_detail'], fill=COLORS['text_muted'])
    draw.text((audit_x + 20, audit_y + 178), "Archived to S3 Glacier for 7-year WORM compliance", font=fonts['service_detail'], fill=COLORS['text_muted'])

    # ========== Monitoring Layer (bottom, full width) ==========
    monitor_x = MARGIN
    monitor_y = audit_y + audit_h + 50
    monitor_w = WIDTH - 2 * MARGIN
    monitor_h = 150

    draw_rounded_rect(draw, [monitor_x, monitor_y, monitor_x + monitor_w, monitor_y + monitor_h],
                      12, fill=COLORS['monitor_bg'], outline=COLORS['monitor'], width=2)
    draw_layer_header(draw, monitor_x + 20, monitor_y, monitor_w, "SECURITY MONITORING", COLORS['monitor'], fonts)

    # Monitoring services in a row
    svc_y = monitor_y + 40
    draw_service_box(draw, monitor_x + 30, svc_y, 180, 50, "CloudWatch", "Metrics + Dashboard", COLORS['monitor'], COLORS['monitor_bg'], fonts)
    draw_service_box(draw, monitor_x + 230, svc_y, 180, 50, "CloudTrail", "API audit logs", COLORS['monitor'], COLORS['monitor_bg'], fonts)
    draw_service_box(draw, monitor_x + 430, svc_y, 180, 50, "CIS Alarms", "Benchmark alerts", COLORS['monitor'], COLORS['monitor_bg'], fonts)
    draw_service_box(draw, monitor_x + 630, svc_y, 180, 50, "GuardDuty", "Threat detection", COLORS['monitor'], COLORS['monitor_bg'], fonts)
    draw_service_box(draw, monitor_x + 830, svc_y, 180, 50, "SNS Alerts", "Notification topic", COLORS['monitor'], COLORS['monitor_bg'], fonts)
    draw_service_box(draw, monitor_x + 1030, svc_y, 180, 50, "Security Events", "Real-time dashboard", COLORS['monitor'], COLORS['monitor_bg'], fonts)

    draw.text((monitor_x + 30, svc_y + 60), "CIS Benchmark alarms: root usage, IAM changes, security group changes, CloudTrail disabled",
              font=fonts['service_detail'], fill=COLORS['text_muted'])

    # ========== Footer ==========
    footer_y = HEIGHT - 40
    draw.text((MARGIN, footer_y), "Solstice Platform · Security Architecture v3", font=fonts['label'], fill=COLORS['text_muted'])
    draw.text((WIDTH - 550, footer_y), "Defense in depth · Zero trust · Canadian data residency", font=fonts['label'], fill=COLORS['text_muted'])

    return img

if __name__ == "__main__":
    img = create_security_diagram()
    output_path = "/Users/austin/dev/solstice/docs/sin-rfp/response/08-appendices/diagrams/security-architecture-v3.png"
    if EXPORT_SCALE != 1:
        img = img.resize((WIDTH * EXPORT_SCALE, HEIGHT * EXPORT_SCALE), Image.LANCZOS)
    img.save(output_path, "PNG", dpi=(300 * EXPORT_SCALE, 300 * EXPORT_SCALE))
    print(f"Saved: {output_path}")
