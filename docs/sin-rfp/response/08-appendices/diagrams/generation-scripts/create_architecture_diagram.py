#!/usr/bin/env python3
"""
High-Fidelity AWS Architecture Diagram Generator v3
Following the Systematic Clarity design philosophy
Updated to reflect current SST infrastructure
"""

from PIL import Image, ImageDraw, ImageFont
import math

# Canvas dimensions (high resolution for print quality)
WIDTH = 2600
HEIGHT = 980
MARGIN = 60
EXPORT_SCALE = 2

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
    'cache': '#EC4899',       # Pink - Cache (Redis)
    'cache_bg': '#FDF2F8',
    'async': '#8B5CF6',       # Purple - Async/Events
    'async_bg': '#F5F3FF',
    'security': '#64748B',    # Slate - Security/Monitoring
    'security_bg': '#F8FAFC',
    'user': '#1E293B',        # Dark slate - Users
    'user_bg': '#F1F5F9',
    'batch': '#0EA5E9',       # Sky - Batch processing
    'batch_bg': '#F0F9FF',

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
        fonts['service'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Bold.ttf", 15)
        fonts['service_detail'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Regular.ttf", 12)
        fonts['label'] = ImageFont.truetype(f"{FONT_DIR}/IBMPlexMono-Regular.ttf", 11)
        fonts['region'] = ImageFont.truetype(f"{FONT_DIR}/IBMPlexMono-Bold.ttf", 14)
        fonts['legend'] = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Regular.ttf", 12)
        fonts['section'] = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 13)
    except Exception as e:
        print(f"Font loading error: {e}, using defaults")
        for key in ['title', 'subtitle', 'service', 'service_detail', 'label', 'region', 'legend', 'section']:
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
    radius = 6

    # Shadow
    shadow_offset = 2
    draw_rounded_rect(draw, [x+shadow_offset, y+shadow_offset, x+w+shadow_offset, y+h+shadow_offset],
                      radius, fill='#E2E8F0')

    # Main box
    draw_rounded_rect(draw, [x, y, x+w, y+h], radius, fill=bg_color, outline=color, width=2)

    # Color accent bar on left
    draw.rectangle([x, y+radius, x+3, y+h-radius], fill=color)

    # Service name
    text_x = x + 12
    text_y = y + (h//2 - 16)
    draw.text((text_x, text_y), name, font=fonts['service'], fill=COLORS['text_primary'])

    # Detail text
    if detail:
        draw.text((text_x, text_y + 18), detail, font=fonts['service_detail'], fill=COLORS['text_secondary'])

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
    arrow_len = 10
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
    arrow_len = 10
    arrow_angle = math.pi / 6

    ax1 = x2 - arrow_len * math.cos(angle - arrow_angle)
    ay1 = y2 - arrow_len * math.sin(angle - arrow_angle)
    ax2 = x2 - arrow_len * math.cos(angle + arrow_angle)
    ay2 = y2 - arrow_len * math.sin(angle + arrow_angle)

    draw.polygon([(x2, y2), (ax1, ay1), (ax2, ay2)], fill=color)

def draw_section_header(draw, x, y, text, fonts):
    """Draw a section header label"""
    draw.text((x, y), text, font=fonts['section'], fill=COLORS['text_secondary'])

def create_architecture_diagram():
    """Create the main architecture diagram"""
    # Create high-resolution image
    img = Image.new('RGB', (WIDTH, HEIGHT), COLORS['background'])
    draw = ImageDraw.Draw(img)
    fonts = load_fonts()

    # Title
    draw.text((MARGIN, 25), "Solstice Platform Architecture v3", font=fonts['title'], fill=COLORS['text_primary'])
    draw.text((MARGIN, 67), "AWS Serverless Infrastructure — ca-central-1 (Canadian Data Residency)", font=fonts['subtitle'], fill=COLORS['text_secondary'])

    # ========== AWS Region Container ==========
    region_x = 480
    region_y = 100
    region_w = 2060
    region_h = 820

    # Region background
    draw_rounded_rect(draw, [region_x, region_y, region_x + region_w, region_y + region_h],
                      16, fill=COLORS['region_bg'], outline=COLORS['region_border'], width=2)

    # Region label
    draw.text((region_x + 20, region_y + 12), "AWS ca-central-1", font=fonts['region'], fill=COLORS['text_secondary'])

    # ========== User Box (Outside Region) ==========
    user_x = MARGIN
    user_y = 230
    user_w = 160
    user_h = 80

    draw_service_box(draw, user_x, user_y, user_w, user_h,
                    "Users & Admins", "Web browsers",
                    COLORS['user'], COLORS['user_bg'], fonts)

    # ========== Edge Services Section ==========
    edge_section_y = region_y + 45
    draw_section_header(draw, region_x + 40, edge_section_y, "EDGE SERVICES", fonts)

    # WAF
    waf_x = region_x + 40
    waf_y = edge_section_y + 25
    waf_w = 150
    waf_h = 58
    draw_service_box(draw, waf_x, waf_y, waf_w, waf_h,
                    "AWS WAF v2", "Rate limiting",
                    COLORS['edge'], COLORS['edge_bg'], fonts)

    # CloudFront
    cf_x = waf_x + waf_w + 30
    cf_y = waf_y
    cf_w = 170
    cf_h = 58
    draw_service_box(draw, cf_x, cf_y, cf_w, cf_h,
                    "CloudFront", "CDN + Security Headers",
                    COLORS['edge'], COLORS['edge_bg'], fonts)

    # ========== VPC Container ==========
    vpc_x = region_x + 40
    vpc_y = region_y + 160
    vpc_w = 780
    vpc_h = 420

    draw_rounded_rect(draw, [vpc_x, vpc_y, vpc_x + vpc_w, vpc_y + vpc_h],
                      12, fill=COLORS['vpc_bg'], outline=COLORS['vpc_border'], width=2)
    draw.text((vpc_x + 16, vpc_y + 10), "VPC (Private Subnets)", font=fonts['region'], fill=COLORS['text_secondary'])

    # ========== Compute Section in VPC ==========
    # Lambda
    lambda_x = vpc_x + 30
    lambda_y = vpc_y + 50
    lambda_w = 220
    lambda_h = 70
    draw_service_box(draw, lambda_x, lambda_y, lambda_w, lambda_h,
                    "Lambda", "TanStack Start App",
                    COLORS['compute'], COLORS['compute_bg'], fonts)

    # RDS Proxy
    proxy_x = vpc_x + 30
    proxy_y = lambda_y + lambda_h + 30
    proxy_w = 180
    proxy_h = 58
    draw_service_box(draw, proxy_x, proxy_y, proxy_w, proxy_h,
                    "RDS Proxy", "Connection pooling",
                    COLORS['compute'], COLORS['compute_bg'], fonts)

    # Redis (ElastiCache) - NEW in v3
    redis_x = lambda_x + lambda_w + 40
    redis_y = lambda_y
    redis_w = 200
    redis_h = 70
    draw_service_box(draw, redis_x, redis_y, redis_w, redis_h,
                    "Redis (ElastiCache)", "Rate limit + Cache",
                    COLORS['cache'], COLORS['cache_bg'], fonts)

    # ========== Private Subnet Container (around RDS) ==========
    private_x = vpc_x + 30
    private_y = proxy_y + proxy_h + 25
    private_w = 300
    private_h = 165
    draw_rounded_rect(draw, [private_x, private_y, private_x + private_w, private_y + private_h],
                      8, fill='#FEF2F2', outline='#EF4444', width=2)
    draw.text((private_x + 12, private_y + 8), "Private Subnet", font=fonts['label'], fill='#EF4444')

    # RDS PostgreSQL (in Private Subnet)
    rds_cx = private_x + 150
    rds_cy = private_y + 90
    rds_w = 90
    rds_h = 90
    draw_database_icon(draw, rds_cx, rds_cy, rds_w, rds_h, COLORS['data'], COLORS['data_bg'])
    draw.text((rds_cx - 55, rds_cy + 55), "RDS PostgreSQL", font=fonts['service'], fill=COLORS['text_primary'])
    draw.text((rds_cx - 20, rds_cy + 72), "16.11", font=fonts['service_detail'], fill=COLORS['text_secondary'])

    # ========== ECS Fargate Cluster - NEW in v3 ==========
    ecs_x = vpc_x + 380
    ecs_y = vpc_y + 130
    ecs_w = 370
    ecs_h = 130
    draw_rounded_rect(draw, [ecs_x, ecs_y, ecs_x + ecs_w, ecs_y + ecs_h],
                      8, fill=COLORS['batch_bg'], outline=COLORS['batch'], width=2)
    draw.text((ecs_x + 12, ecs_y + 8), "ECS Fargate Cluster", font=fonts['section'], fill=COLORS['batch'])

    # Import Batch Task
    task_x = ecs_x + 20
    task_y = ecs_y + 40
    task_w = 330
    task_h = 70
    draw_service_box(draw, task_x, task_y, task_w, task_h,
                    "Import Batch Task", "Large CSV imports (2 vCPU, 4GB)",
                    COLORS['batch'], COLORS['batch_bg'], fonts)

    # ========== Storage Section ==========
    storage_section_x = region_x + 860
    storage_section_y = region_y + 160
    draw_section_header(draw, storage_section_x, storage_section_y, "STORAGE", fonts)

    # S3 Artifacts - Split into 3 buckets for v3
    s3_art_x = storage_section_x
    s3_art_y = storage_section_y + 25
    s3_art_w = 190
    s3_art_h = 70
    draw_service_box(draw, s3_art_x, s3_art_y, s3_art_w, s3_art_h,
                    "S3 Artifacts", "Object Lock + Glacier",
                    COLORS['data'], COLORS['data_bg'], fonts)

    # S3 Audit Archives
    s3_audit_x = s3_art_x + s3_art_w + 20
    s3_audit_y = s3_art_y
    s3_audit_w = 190
    s3_audit_h = 70
    draw_service_box(draw, s3_audit_x, s3_audit_y, s3_audit_w, s3_audit_h,
                    "S3 Audit Archives", "7-year WORM",
                    COLORS['data'], COLORS['data_bg'], fonts)

    # S3 CloudTrail
    s3_ct_x = s3_audit_x + s3_audit_w + 20
    s3_ct_y = s3_art_y
    s3_ct_w = 180
    s3_ct_h = 70
    draw_service_box(draw, s3_ct_x, s3_ct_y, s3_ct_w, s3_ct_h,
                    "S3 CloudTrail", "API Logs",
                    COLORS['data'], COLORS['data_bg'], fonts)

    # ========== Async / Messaging Section ==========
    async_section_x = storage_section_x
    async_section_y = s3_art_y + s3_art_h + 40
    draw_section_header(draw, async_section_x, async_section_y, "ASYNC / MESSAGING", fonts)

    # SQS Notifications
    sqs_x = async_section_x
    sqs_y = async_section_y + 25
    sqs_w = 180
    sqs_h = 60
    draw_service_box(draw, sqs_x, sqs_y, sqs_w, sqs_h,
                    "SQS Queue", "Notifications",
                    COLORS['async'], COLORS['async_bg'], fonts)

    # SQS DLQ - NEW in v3
    dlq_x = sqs_x + sqs_w + 20
    dlq_y = sqs_y
    dlq_w = 150
    dlq_h = 60
    draw_service_box(draw, dlq_x, dlq_y, dlq_w, dlq_h,
                    "SQS DLQ", "Dead Letters",
                    COLORS['async'], COLORS['async_bg'], fonts)

    # SES
    ses_x = dlq_x + dlq_w + 20
    ses_y = sqs_y
    ses_w = 150
    ses_h = 60
    draw_service_box(draw, ses_x, ses_y, ses_w, ses_h,
                    "SES", "Email Service",
                    COLORS['async'], COLORS['async_bg'], fonts)

    # SNS Alarms - NEW in v3
    sns_x = ses_x + ses_w + 20
    sns_y = sqs_y
    sns_w = 150
    sns_h = 60
    draw_service_box(draw, sns_x, sns_y, sns_w, sns_h,
                    "SNS Topic", "Alarm Alerts",
                    COLORS['async'], COLORS['async_bg'], fonts)

    # ========== Scheduled Jobs Section - NEW in v3 (replaces EventBridge) ==========
    cron_section_x = storage_section_x
    cron_section_y = sqs_y + sqs_h + 40
    draw_section_header(draw, cron_section_x, cron_section_y, "SCHEDULED JOBS (LAMBDA CRON)", fonts)

    # Notification Cron
    cron1_x = cron_section_x
    cron1_y = cron_section_y + 25
    cron1_w = 170
    cron1_h = 60
    draw_service_box(draw, cron1_x, cron1_y, cron1_w, cron1_h,
                    "Notifications", "Every 5 minutes",
                    COLORS['compute'], COLORS['compute_bg'], fonts)

    # Retention Cron
    cron2_x = cron1_x + cron1_w + 20
    cron2_y = cron1_y
    cron2_w = 170
    cron2_h = 60
    draw_service_box(draw, cron2_x, cron2_y, cron2_w, cron2_h,
                    "Retention", "Daily",
                    COLORS['compute'], COLORS['compute_bg'], fonts)

    # Data Quality Cron
    cron3_x = cron2_x + cron2_w + 20
    cron3_y = cron1_y
    cron3_w = 170
    cron3_h = 60
    draw_service_box(draw, cron3_x, cron3_y, cron3_w, cron3_h,
                    "Data Quality", "Daily",
                    COLORS['compute'], COLORS['compute_bg'], fonts)

    # ========== Security / Monitoring Section ==========
    sec_section_x = storage_section_x
    sec_section_y = cron1_y + cron1_h + 40
    draw_section_header(draw, sec_section_x, sec_section_y, "SECURITY & MONITORING", fonts)

    # CloudWatch
    cw_x = sec_section_x
    cw_y = sec_section_y + 25
    cw_w = 180
    cw_h = 60
    draw_service_box(draw, cw_x, cw_y, cw_w, cw_h,
                    "CloudWatch", "Dashboard + Alarms",
                    COLORS['security'], COLORS['security_bg'], fonts)

    # CloudTrail
    ct_x = cw_x + cw_w + 20
    ct_y = cw_y
    ct_w = 180
    ct_h = 60
    draw_service_box(draw, ct_x, ct_y, ct_w, ct_h,
                    "CloudTrail", "CIS Benchmark Alarms",
                    COLORS['security'], COLORS['security_bg'], fonts)

    # GuardDuty
    gd_x = ct_x + ct_w + 20
    gd_y = cw_y
    gd_w = 170
    gd_h = 60
    draw_service_box(draw, gd_x, gd_y, gd_w, gd_h,
                    "GuardDuty", "Threat Detection",
                    COLORS['security'], COLORS['security_bg'], fonts)

    # KMS
    kms_x = gd_x + gd_w + 20
    kms_y = cw_y
    kms_w = 150
    kms_h = 60
    draw_service_box(draw, kms_x, kms_y, kms_w, kms_h,
                    "KMS", "Encryption Keys",
                    COLORS['security'], COLORS['security_bg'], fonts)

    # ========== Connections ==========
    # User -> WAF
    draw_arrow(draw, (user_x + user_w, user_y + user_h//2), (waf_x, waf_y + waf_h//2), COLORS['arrow'], 2)
    draw.text((user_x + user_w + 15, user_y + user_h//2 - 18), "HTTPS", font=fonts['label'], fill=COLORS['text_muted'])

    # WAF -> CloudFront
    draw_arrow(draw, (waf_x + waf_w, waf_y + waf_h//2), (cf_x, cf_y + cf_h//2), COLORS['arrow'], 2)

    # CloudFront -> Lambda
    draw_arrow(draw, (cf_x + cf_w//2, cf_y + cf_h), (lambda_x + lambda_w//2, lambda_y), COLORS['arrow'], 2)

    # Lambda -> Redis
    draw_arrow(draw, (lambda_x + lambda_w, lambda_y + 20), (redis_x, redis_y + 20), COLORS['arrow'], 2)

    # Lambda -> RDS Proxy
    draw_arrow(draw, (lambda_x + lambda_w//3, lambda_y + lambda_h), (proxy_x + proxy_w//2, proxy_y), COLORS['arrow'], 2)

    # RDS Proxy -> RDS
    draw_arrow(draw, (proxy_x + proxy_w//2, proxy_y + proxy_h), (rds_cx, private_y), COLORS['arrow'], 2)

    # Lambda -> ECS Task (for batch imports)
    draw_arrow(draw, (lambda_x + lambda_w, lambda_y + 50), (task_x, task_y + task_h//2), COLORS['arrow'], 2)

    # Lambda -> S3 Artifacts
    draw_arrow(draw, (vpc_x + vpc_w, lambda_y + 35), (s3_art_x, s3_art_y + s3_art_h//2), COLORS['arrow'], 2)

    # Lambda -> SQS
    draw_arrow(draw, (vpc_x + vpc_w, proxy_y + proxy_h//2), (sqs_x, sqs_y + sqs_h//2), COLORS['arrow'], 2)

    # SQS -> DLQ (failed messages)
    draw_arrow(draw, (sqs_x + sqs_w, sqs_y + sqs_h//2), (dlq_x, dlq_y + dlq_h//2), COLORS['text_muted'], 1)

    # SQS -> SES (email delivery)
    draw_arrow(draw, (dlq_x + dlq_w, sqs_y + sqs_h//2), (ses_x, ses_y + ses_h//2), COLORS['arrow'], 2)

    # CloudWatch -> SNS (alarms)
    right_rail_x = region_x + region_w - 30
    security_rail_y = cw_y - 12
    async_gap_y = sns_y + sns_h + 12
    draw_polyline_arrow(draw, [
        (cw_x + cw_w//2, cw_y),
        (cw_x + cw_w//2, security_rail_y),
        (right_rail_x, security_rail_y),
        (right_rail_x, async_gap_y),
        (sns_x + sns_w//2, async_gap_y),
        (sns_x + sns_w//2, sns_y + sns_h),
    ], COLORS['text_muted'], 1)

    # CloudTrail -> S3 CloudTrail
    storage_gap_y = s3_ct_y + s3_ct_h + 12
    draw_polyline_arrow(draw, [
        (ct_x + ct_w//2, ct_y),
        (ct_x + ct_w//2, security_rail_y),
        (right_rail_x, security_rail_y),
        (right_rail_x, storage_gap_y),
        (s3_ct_x + s3_ct_w//2, storage_gap_y),
        (s3_ct_x + s3_ct_w//2, s3_ct_y + s3_ct_h),
    ], COLORS['text_muted'], 1)

    # ========== Legend ==========
    legend_x = MARGIN
    legend_y = 460
    legend_w = 360
    legend_h = 300

    draw_rounded_rect(draw, [legend_x, legend_y, legend_x + legend_w, legend_y + legend_h],
                      12, fill='#FFFFFF', outline=COLORS['line'], width=1)
    draw.text((legend_x + 20, legend_y + 16), "Legend", font=fonts['service'], fill=COLORS['text_primary'])

    # Legend items
    legend_items = [
        ("Edge / CDN", COLORS['edge'], COLORS['edge_bg']),
        ("Compute", COLORS['compute'], COLORS['compute_bg']),
        ("Cache (Redis)", COLORS['cache'], COLORS['cache_bg']),
        ("Batch Processing", COLORS['batch'], COLORS['batch_bg']),
        ("Data Stores", COLORS['data'], COLORS['data_bg']),
        ("Async / Messaging", COLORS['async'], COLORS['async_bg']),
        ("Security / Monitoring", COLORS['security'], COLORS['security_bg']),
    ]

    for i, (label, color, bg) in enumerate(legend_items):
        ly = legend_y + 45 + i * 35
        draw_rounded_rect(draw, [legend_x + 18, ly, legend_x + 50, ly + 22], 4, fill=bg, outline=color, width=2)
        draw.text((legend_x + 60, ly + 3), label, font=fonts['legend'], fill=COLORS['text_primary'])

    # ========== Footer text ==========
    footer_y = HEIGHT - 35
    draw.text((MARGIN, footer_y), "Solstice Platform · Austin Wallace Tech", font=fonts['label'], fill=COLORS['text_muted'])
    draw.text((WIDTH - 340, footer_y), "All data resides in AWS Canada (ca-central-1)", font=fonts['label'], fill=COLORS['text_muted'])

    return img

if __name__ == "__main__":
    img = create_architecture_diagram()
    output_path = "/Users/austin/dev/solstice/docs/sin-rfp/response/08-appendices/diagrams/high-level-system-architecture-v3.png"
    if EXPORT_SCALE != 1:
        img = img.resize((WIDTH * EXPORT_SCALE, HEIGHT * EXPORT_SCALE), Image.LANCZOS)
    img.save(output_path, "PNG", dpi=(300 * EXPORT_SCALE, 300 * EXPORT_SCALE))
    print(f"Saved: {output_path}")
