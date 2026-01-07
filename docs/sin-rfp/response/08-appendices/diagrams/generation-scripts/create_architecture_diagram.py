#!/usr/bin/env python3
"""
High-Fidelity AWS Architecture Diagram Generator
Following the Systematic Clarity design philosophy
"""

from PIL import Image, ImageDraw, ImageFont
import math

# Canvas dimensions (high resolution for print quality)
WIDTH = 2400
HEIGHT = 1600
MARGIN = 80

# Color palette - AWS-inspired with systematic clarity
COLORS = {
    'background': '#FAFBFC',
    'region_bg': '#F8FAFC',
    'region_border': '#CBD5E1',
    'vpc_bg': '#F1F5F9',
    'vpc_border': '#94A3B8',

    # Service category colors
    'edge': '#3B82F6',        # Blue - Edge/CDN
    'edge_bg': '#EFF6FF',
    'compute': '#10B981',     # Green - Compute
    'compute_bg': '#ECFDF5',
    'data': '#F59E0B',        # Amber - Data stores
    'data_bg': '#FFFBEB',
    'async': '#8B5CF6',       # Purple - Async/Events
    'async_bg': '#F5F3FF',
    'security': '#64748B',    # Slate - Security/Monitoring
    'security_bg': '#F8FAFC',
    'user': '#1E293B',        # Dark slate - Users
    'user_bg': '#F1F5F9',

    # Text and lines
    'text_primary': '#1E293B',
    'text_secondary': '#64748B',
    'text_muted': '#94A3B8',
    'line': '#CBD5E1',
    'line_dark': '#64748B',
    'arrow': '#475569',
}

# Font paths
FONT_DIR = "/Users/austin/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/canvas-design/canvas-fonts"

def load_fonts():
    """Load fonts with fallbacks"""
    fonts = {}
    try:
        fonts['title'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 36)
        fonts['subtitle'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Regular.ttf", 20)
        fonts['service'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Bold.ttf", 16)
        fonts['service_detail'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Regular.ttf", 13)
        fonts['label'] = ImageFont.truetype(f"{FONT_DIR}/IBMPlexMono-Regular.ttf", 11)
        fonts['region'] = ImageFont.truetype(f"{FONT_DIR}/IBMPlexMono-Bold.ttf", 14)
        fonts['legend'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Regular.ttf", 12)
    except Exception as e:
        print(f"Font loading error: {e}, using defaults")
        for key in ['title', 'subtitle', 'service', 'service_detail', 'label', 'region', 'legend']:
            fonts[key] = ImageFont.load_default()
    return fonts

def draw_rounded_rect(draw, coords, radius, fill=None, outline=None, width=1):
    """Draw a rounded rectangle"""
    x1, y1, x2, y2 = coords

    # Draw the four corners
    draw.ellipse([x1, y1, x1 + 2*radius, y1 + 2*radius], fill=fill, outline=outline, width=width)
    draw.ellipse([x2 - 2*radius, y1, x2, y1 + 2*radius], fill=fill, outline=outline, width=width)
    draw.ellipse([x1, y2 - 2*radius, x1 + 2*radius, y2], fill=fill, outline=outline, width=width)
    draw.ellipse([x2 - 2*radius, y2 - 2*radius, x2, y2], fill=fill, outline=outline, width=width)

    # Draw the rectangles
    draw.rectangle([x1 + radius, y1, x2 - radius, y2], fill=fill)
    draw.rectangle([x1, y1 + radius, x2, y2 - radius], fill=fill)

    # Draw outline if specified
    if outline:
        draw.arc([x1, y1, x1 + 2*radius, y1 + 2*radius], 180, 270, fill=outline, width=width)
        draw.arc([x2 - 2*radius, y1, x2, y1 + 2*radius], 270, 360, fill=outline, width=width)
        draw.arc([x1, y2 - 2*radius, x1 + 2*radius, y2], 90, 180, fill=outline, width=width)
        draw.arc([x2 - 2*radius, y2 - 2*radius, x2, y2], 0, 90, fill=outline, width=width)
        draw.line([x1 + radius, y1, x2 - radius, y1], fill=outline, width=width)
        draw.line([x1 + radius, y2, x2 - radius, y2], fill=outline, width=width)
        draw.line([x1, y1 + radius, x1, y2 - radius], fill=outline, width=width)
        draw.line([x2, y1 + radius, x2, y2 - radius], fill=outline, width=width)

def draw_service_box(draw, x, y, w, h, name, detail, color, bg_color, fonts, icon_char=None):
    """Draw a styled service box"""
    radius = 8

    # Shadow
    shadow_offset = 3
    draw_rounded_rect(draw, [x+shadow_offset, y+shadow_offset, x+w+shadow_offset, y+h+shadow_offset],
                      radius, fill='#E2E8F0')

    # Main box
    draw_rounded_rect(draw, [x, y, x+w, y+h], radius, fill=bg_color, outline=color, width=2)

    # Color accent bar on left
    draw.rectangle([x, y+radius, x+4, y+h-radius], fill=color)

    # Service name
    text_x = x + 14
    text_y = y + (h//2 - 18)
    draw.text((text_x, text_y), name, font=fonts['service'], fill=COLORS['text_primary'])

    # Detail text
    if detail:
        draw.text((text_x, text_y + 20), detail, font=fonts['service_detail'], fill=COLORS['text_secondary'])

def draw_database_icon(draw, cx, cy, w, h, color, bg_color):
    """Draw a database cylinder icon"""
    ellipse_h = h // 5

    # Shadow
    shadow = 3
    draw.ellipse([cx-w//2+shadow, cy-h//2+shadow, cx+w//2+shadow, cy-h//2+ellipse_h+shadow], fill='#E2E8F0')
    draw.rectangle([cx-w//2+shadow, cy-h//2+ellipse_h//2+shadow, cx+w//2+shadow, cy+h//2-ellipse_h//2+shadow], fill='#E2E8F0')
    draw.ellipse([cx-w//2+shadow, cy+h//2-ellipse_h+shadow, cx+w//2+shadow, cy+h//2+shadow], fill='#E2E8F0')

    # Main body
    draw.ellipse([cx-w//2, cy-h//2, cx+w//2, cy-h//2+ellipse_h], fill=bg_color, outline=color, width=2)
    draw.rectangle([cx-w//2, cy-h//2+ellipse_h//2, cx+w//2, cy+h//2-ellipse_h//2], fill=bg_color)
    draw.line([cx-w//2, cy-h//2+ellipse_h//2, cx-w//2, cy+h//2-ellipse_h//2], fill=color, width=2)
    draw.line([cx+w//2, cy-h//2+ellipse_h//2, cx+w//2, cy+h//2-ellipse_h//2], fill=color, width=2)
    draw.ellipse([cx-w//2, cy+h//2-ellipse_h, cx+w//2, cy+h//2], fill=bg_color, outline=color, width=2)

def draw_arrow(draw, start, end, color, width=2):
    """Draw an arrow with arrowhead"""
    x1, y1 = start
    x2, y2 = end

    # Main line
    draw.line([x1, y1, x2, y2], fill=color, width=width)

    # Arrowhead
    angle = math.atan2(y2 - y1, x2 - x1)
    arrow_len = 12
    arrow_angle = math.pi / 6

    ax1 = x2 - arrow_len * math.cos(angle - arrow_angle)
    ay1 = y2 - arrow_len * math.sin(angle - arrow_angle)
    ax2 = x2 - arrow_len * math.cos(angle + arrow_angle)
    ay2 = y2 - arrow_len * math.sin(angle + arrow_angle)

    draw.polygon([(x2, y2), (ax1, ay1), (ax2, ay2)], fill=color)

def draw_curved_arrow(draw, start, end, color, curve_direction='right', width=2):
    """Draw a curved arrow"""
    x1, y1 = start
    x2, y2 = end

    # Calculate control point for bezier-like curve
    mid_x = (x1 + x2) / 2
    mid_y = (y1 + y2) / 2

    if curve_direction == 'right':
        ctrl_x = mid_x + abs(y2 - y1) * 0.3
        ctrl_y = mid_y
    else:
        ctrl_x = mid_x - abs(y2 - y1) * 0.3
        ctrl_y = mid_y

    # Draw approximated curve with line segments
    points = []
    for t in range(21):
        t = t / 20.0
        # Quadratic bezier
        px = (1-t)**2 * x1 + 2*(1-t)*t * ctrl_x + t**2 * x2
        py = (1-t)**2 * y1 + 2*(1-t)*t * ctrl_y + t**2 * y2
        points.append((px, py))

    for i in range(len(points) - 1):
        draw.line([points[i], points[i+1]], fill=color, width=width)

    # Arrowhead at end
    angle = math.atan2(points[-1][1] - points[-2][1], points[-1][0] - points[-2][0])
    arrow_len = 10
    arrow_angle = math.pi / 6

    ax1 = x2 - arrow_len * math.cos(angle - arrow_angle)
    ay1 = y2 - arrow_len * math.sin(angle - arrow_angle)
    ax2 = x2 - arrow_len * math.cos(angle + arrow_angle)
    ay2 = y2 - arrow_len * math.sin(angle + arrow_angle)

    draw.polygon([(x2, y2), (ax1, ay1), (ax2, ay2)], fill=color)

def create_architecture_diagram():
    """Create the main architecture diagram"""
    # Create high-resolution image
    img = Image.new('RGB', (WIDTH, HEIGHT), COLORS['background'])
    draw = ImageDraw.Draw(img)
    fonts = load_fonts()

    # Title
    draw.text((MARGIN, 30), "Solstice Platform Architecture", font=fonts['title'], fill=COLORS['text_primary'])
    draw.text((MARGIN, 72), "AWS Serverless Infrastructure — ca-central-1", font=fonts['subtitle'], fill=COLORS['text_secondary'])

    # ========== AWS Region Container ==========
    region_x = 580
    region_y = 110
    region_w = 1740
    region_h = 1420

    # Region background
    draw_rounded_rect(draw, [region_x, region_y, region_x + region_w, region_y + region_h],
                      16, fill=COLORS['region_bg'], outline=COLORS['region_border'], width=2)

    # Region label
    draw.text((region_x + 20, region_y + 12), "AWS ca-central-1", font=fonts['region'], fill=COLORS['text_secondary'])
    draw.text((region_x + 180, region_y + 12), "Canadian Data Residency", font=fonts['label'], fill=COLORS['text_muted'])

    # ========== VPC Container ==========
    vpc_x = region_x + 40
    vpc_y = region_y + 180
    vpc_w = 700
    vpc_h = 520

    draw_rounded_rect(draw, [vpc_x, vpc_y, vpc_x + vpc_w, vpc_y + vpc_h],
                      12, fill=COLORS['vpc_bg'], outline=COLORS['vpc_border'], width=2)
    draw.text((vpc_x + 16, vpc_y + 10), "VPC", font=fonts['region'], fill=COLORS['text_secondary'])

    # ========== Private Subnet Container (around RDS) ==========
    private_x = vpc_x + 340
    private_y = vpc_y + 60
    private_w = 340
    private_h = 440
    draw_rounded_rect(draw, [private_x, private_y, private_x + private_w, private_y + private_h],
                      8, fill='#FEF2F2', outline='#EF4444', width=2)
    draw.text((private_x + 12, private_y + 8), "Private Subnet", font=fonts['label'], fill='#EF4444')
    draw.text((private_x + 12, private_y + 22), "No Internet Access", font=fonts['label'], fill=COLORS['text_muted'])

    # ========== User Box (Outside Region) ==========
    user_x = MARGIN
    user_y = 280
    user_w = 180
    user_h = 90

    draw_service_box(draw, user_x, user_y, user_w, user_h,
                    "Users & Admins", "Web browsers",
                    COLORS['user'], COLORS['user_bg'], fonts)

    # ========== Edge Services ==========
    # WAF
    waf_x = region_x + 60
    waf_y = region_y + 60
    waf_w = 160
    waf_h = 70
    draw_service_box(draw, waf_x, waf_y, waf_w, waf_h,
                    "AWS WAF", "Web Application Firewall",
                    COLORS['edge'], COLORS['edge_bg'], fonts)

    # CloudFront
    cf_x = waf_x + waf_w + 40
    cf_y = waf_y
    cf_w = 160
    cf_h = 70
    draw_service_box(draw, cf_x, cf_y, cf_w, cf_h,
                    "CloudFront", "CDN & Edge",
                    COLORS['edge'], COLORS['edge_bg'], fonts)

    # ========== Compute (in VPC) ==========
    lambda_x = vpc_x + 80
    lambda_y = vpc_y + 80
    lambda_w = 280
    lambda_h = 100
    draw_service_box(draw, lambda_x, lambda_y, lambda_w, lambda_h,
                    "Lambda", "TanStack Start App + API",
                    COLORS['compute'], COLORS['compute_bg'], fonts)

    # RDS Proxy
    proxy_x = vpc_x + 80
    proxy_y = lambda_y + lambda_h + 60
    proxy_w = 200
    proxy_h = 70
    draw_service_box(draw, proxy_x, proxy_y, proxy_w, proxy_h,
                    "RDS Proxy", "Connection pooling",
                    COLORS['compute'], COLORS['compute_bg'], fonts)

    # ========== Data Stores ==========
    # RDS PostgreSQL (in VPC)
    rds_cx = vpc_x + 520
    rds_cy = vpc_y + 280
    rds_w = 120
    rds_h = 140
    draw_database_icon(draw, rds_cx, rds_cy, rds_w, rds_h, COLORS['data'], COLORS['data_bg'])
    draw.text((rds_cx - 60, rds_cy + 85), "RDS PostgreSQL", font=fonts['service'], fill=COLORS['text_primary'])
    draw.text((rds_cx - 40, rds_cy + 105), "Primary DB", font=fonts['service_detail'], fill=COLORS['text_secondary'])

    # S3 (outside VPC, in region)
    s3_x = region_x + 800
    s3_y = region_y + 200
    s3_w = 180
    s3_h = 70
    draw_service_box(draw, s3_x, s3_y, s3_w, s3_h,
                    "S3", "Object Storage",
                    COLORS['data'], COLORS['data_bg'], fonts)

    # S3 Glacier Archive (anti-ransomware, compliance retention)
    glacier_x = region_x + 1040
    glacier_y = region_y + 200
    glacier_w = 200
    glacier_h = 70
    draw_service_box(draw, glacier_x, glacier_y, glacier_w, glacier_h,
                    "S3 Glacier", "Audit Archive (7yr)",
                    COLORS['data'], COLORS['data_bg'], fonts)

    # ========== Async Services ==========
    sqs_x = region_x + 800
    sqs_y = region_y + 320
    sqs_w = 180
    sqs_h = 70
    draw_service_box(draw, sqs_x, sqs_y, sqs_w, sqs_h,
                    "SQS", "Message Queue",
                    COLORS['async'], COLORS['async_bg'], fonts)

    eb_x = region_x + 800
    eb_y = region_y + 420
    eb_w = 180
    eb_h = 70
    draw_service_box(draw, eb_x, eb_y, eb_w, eb_h,
                    "EventBridge", "Scheduler",
                    COLORS['async'], COLORS['async_bg'], fonts)

    ses_x = region_x + 1040
    ses_y = region_y + 320
    ses_w = 180
    ses_h = 70
    draw_service_box(draw, ses_x, ses_y, ses_w, ses_h,
                    "SES", "Email Service",
                    COLORS['async'], COLORS['async_bg'], fonts)

    # ========== Security/Monitoring Services ==========
    cw_x = region_x + 800
    cw_y = region_y + 560
    cw_w = 200
    cw_h = 70
    draw_service_box(draw, cw_x, cw_y, cw_w, cw_h,
                    "CloudWatch", "Logs & Alarms",
                    COLORS['security'], COLORS['security_bg'], fonts)

    ct_x = region_x + 1040
    ct_y = region_y + 560
    ct_w = 200
    ct_h = 70
    draw_service_box(draw, ct_x, ct_y, ct_w, ct_h,
                    "CloudTrail", "API Audit",
                    COLORS['security'], COLORS['security_bg'], fonts)

    gd_x = region_x + 1280
    gd_y = region_y + 560
    gd_w = 200
    gd_h = 70
    draw_service_box(draw, gd_x, gd_y, gd_w, gd_h,
                    "GuardDuty", "Threat Detection",
                    COLORS['security'], COLORS['security_bg'], fonts)

    # KMS
    kms_x = region_x + 1280
    kms_y = region_y + 320
    kms_w = 180
    kms_h = 70
    draw_service_box(draw, kms_x, kms_y, kms_w, kms_h,
                    "KMS", "Encryption Keys",
                    COLORS['security'], COLORS['security_bg'], fonts)

    # ========== Connections ==========
    # User -> WAF
    draw_arrow(draw, (user_x + user_w, user_y + user_h//2), (waf_x, waf_y + waf_h//2), COLORS['arrow'], 2)
    draw.text((user_x + user_w + 30, user_y + user_h//2 - 20), "HTTPS", font=fonts['label'], fill=COLORS['text_muted'])

    # WAF -> CloudFront
    draw_arrow(draw, (waf_x + waf_w, waf_y + waf_h//2), (cf_x, cf_y + cf_h//2), COLORS['arrow'], 2)

    # CloudFront -> Lambda
    draw_arrow(draw, (cf_x + cf_w//2, cf_y + cf_h), (lambda_x + lambda_w//2, lambda_y), COLORS['arrow'], 2)

    # Lambda -> RDS Proxy
    draw_arrow(draw, (lambda_x + lambda_w//2, lambda_y + lambda_h), (proxy_x + proxy_w//2, proxy_y), COLORS['arrow'], 2)

    # RDS Proxy -> RDS
    draw_arrow(draw, (proxy_x + proxy_w, proxy_y + proxy_h//2), (rds_cx - rds_w//2 - 10, rds_cy), COLORS['arrow'], 2)

    # Lambda -> S3
    draw_arrow(draw, (lambda_x + lambda_w, lambda_y + 30), (s3_x, s3_y + s3_h//2), COLORS['arrow'], 2)

    # Lambda -> SQS
    draw_arrow(draw, (lambda_x + lambda_w, lambda_y + 60), (sqs_x, sqs_y + sqs_h//2), COLORS['arrow'], 2)

    # SQS -> SES
    draw_arrow(draw, (sqs_x + sqs_w, sqs_y + sqs_h//2), (ses_x, ses_y + ses_h//2), COLORS['arrow'], 2)

    # EventBridge -> SQS
    draw_arrow(draw, (eb_x + eb_w//2, eb_y), (sqs_x + sqs_w//2, sqs_y + sqs_h), COLORS['arrow'], 2)

    # Lambda -> CloudWatch (dashed conceptually)
    draw_arrow(draw, (lambda_x + lambda_w, lambda_y + 80), (cw_x, cw_y + cw_h//2), COLORS['text_muted'], 1)

    # KMS encryption lines (dashed)
    draw.line([kms_x, kms_y + kms_h//2, s3_x + s3_w, s3_y + s3_h//2], fill=COLORS['text_muted'], width=1)
    draw.text((kms_x - 80, kms_y - 20), "encrypts", font=fonts['label'], fill=COLORS['text_muted'])

    # ========== Legend ==========
    legend_x = MARGIN
    legend_y = HEIGHT - 320
    legend_w = 420
    legend_h = 280

    draw_rounded_rect(draw, [legend_x, legend_y, legend_x + legend_w, legend_y + legend_h],
                      12, fill='#FFFFFF', outline=COLORS['line'], width=1)
    draw.text((legend_x + 20, legend_y + 16), "Legend", font=fonts['service'], fill=COLORS['text_primary'])

    # Legend items
    legend_items = [
        ("Edge / CDN", COLORS['edge'], COLORS['edge_bg']),
        ("Compute", COLORS['compute'], COLORS['compute_bg']),
        ("Data Stores", COLORS['data'], COLORS['data_bg']),
        ("Async / Events", COLORS['async'], COLORS['async_bg']),
        ("Security / Monitoring", COLORS['security'], COLORS['security_bg']),
    ]

    for i, (label, color, bg) in enumerate(legend_items):
        ly = legend_y + 50 + i * 42
        draw_rounded_rect(draw, [legend_x + 20, ly, legend_x + 60, ly + 28], 4, fill=bg, outline=color, width=2)
        draw.text((legend_x + 75, ly + 5), label, font=fonts['legend'], fill=COLORS['text_primary'])

    # ========== Footer text ==========
    footer_y = HEIGHT - 40
    draw.text((MARGIN, footer_y), "Solstice Platform · Austin Wallace Tech", font=fonts['label'], fill=COLORS['text_muted'])
    draw.text((WIDTH - 300, footer_y), "All data resides in AWS Canada (ca-central-1)", font=fonts['label'], fill=COLORS['text_muted'])

    return img

if __name__ == "__main__":
    img = create_architecture_diagram()
    output_path = "/Users/austin/dev/solstice/docs/sin-rfp/response/08-appendices/diagrams/high-level-system-architecture-v2.png"
    img.save(output_path, "PNG", dpi=(300, 300))
    print(f"Saved: {output_path}")
