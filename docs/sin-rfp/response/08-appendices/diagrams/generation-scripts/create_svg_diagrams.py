#!/usr/bin/env python3
"""
SVG Architecture Diagram Generator v3
Creates vector versions of all architecture diagrams
Updated with Redis, ECS Fargate, Object Lock, CIS Alarms, SNS, DLQ
"""

import svgwrite
from svgwrite import cm, mm
import os

OUTPUT_DIR = "/Users/austin/dev/solstice/docs/sin-rfp/response/08-appendices/diagrams"

# Color palette
COLORS = {
    'background': '#FAFBFC',
    'edge': '#3B82F6',
    'edge_bg': '#EFF6FF',
    'compute': '#10B981',
    'compute_bg': '#ECFDF5',
    'data': '#F59E0B',
    'data_bg': '#FFFBEB',
    'async': '#8B5CF6',
    'async_bg': '#F5F3FF',
    'security': '#64748B',
    'security_bg': '#F8FAFC',
    'user': '#1E293B',
    'user_bg': '#F1F5F9',
    'auth': '#10B981',
    'auth_bg': '#ECFDF5',
    'authz': '#8B5CF6',
    'authz_bg': '#F5F3FF',
    'audit': '#EF4444',
    'audit_bg': '#FEF2F2',
    'cache': '#06B6D4',
    'cache_bg': '#ECFEFF',
    'batch': '#F97316',
    'batch_bg': '#FFF7ED',
    'dlq': '#DC2626',
    'dlq_bg': '#FEF2F2',
    'storage': '#6366F1',
    'storage_bg': '#EEF2FF',
    'monitor': '#EC4899',
    'monitor_bg': '#FDF2F8',
    'text_primary': '#1E293B',
    'text_secondary': '#64748B',
    'text_muted': '#94A3B8',
    'line': '#CBD5E1',
    'viasport': '#3B82F6',
    'viasport_bg': '#DBEAFE',
    'qc': '#10B981',
    'qc_bg': '#D1FAE5',
}

def add_service_box(dwg, x, y, w, h, name, detail, color, bg_color, parent=None):
    """Add a service box to the SVG"""
    g = dwg.g()
    g.add(dwg.rect((x+2, y+2), (w, h), rx=6, ry=6, fill='#E2E8F0'))
    g.add(dwg.rect((x, y), (w, h), rx=6, ry=6, fill=bg_color, stroke=color, stroke_width=2))
    g.add(dwg.rect((x, y+6), (4, h-12), fill=color))
    g.add(dwg.text(name, insert=(x+14, y+h//2-2), font_family='system-ui, -apple-system, sans-serif',
                   font_size='13px', font_weight='600', fill=COLORS['text_primary']))
    if detail:
        g.add(dwg.text(detail, insert=(x+14, y+h//2+12), font_family='system-ui, sans-serif',
                       font_size='11px', fill=COLORS['text_secondary']))
    if parent:
        parent.add(g)
    else:
        dwg.add(g)
    return g

def add_database_icon(dwg, cx, cy, w, h, color, bg_color, label, parent=None):
    """Add a database cylinder icon"""
    g = dwg.g()
    ellipse_h = h // 5
    g.add(dwg.ellipse((cx+2, cy-h//2+ellipse_h//2+2), (w//2, ellipse_h//2), fill='#E2E8F0'))
    g.add(dwg.rect((cx-w//2+2, cy-h//2+ellipse_h//2+2), (w, h-ellipse_h), fill='#E2E8F0'))
    g.add(dwg.rect((cx-w//2, cy-h//2+ellipse_h//2), (w, h-ellipse_h), fill=bg_color))
    g.add(dwg.line((cx-w//2, cy-h//2+ellipse_h//2), (cx-w//2, cy+h//2-ellipse_h//2), stroke=color, stroke_width=2))
    g.add(dwg.line((cx+w//2, cy-h//2+ellipse_h//2), (cx+w//2, cy+h//2-ellipse_h//2), stroke=color, stroke_width=2))
    g.add(dwg.ellipse((cx, cy-h//2+ellipse_h//2), (w//2, ellipse_h//2), fill=bg_color, stroke=color, stroke_width=2))
    g.add(dwg.ellipse((cx, cy+h//2-ellipse_h//2), (w//2, ellipse_h//2), fill=bg_color, stroke=color, stroke_width=2))
    g.add(dwg.text(label, insert=(cx-35, cy+h//2+18), font_family='system-ui, sans-serif',
                   font_size='12px', font_weight='600', fill=COLORS['text_primary']))
    if parent:
        parent.add(g)
    else:
        dwg.add(g)
    return g

def add_arrow(dwg, start, end, color, parent=None):
    """Add an arrow with arrowhead"""
    g = dwg.g()
    x1, y1 = start
    x2, y2 = end
    marker_id = f"arrow_{x1}_{y1}_{x2}_{y2}"
    marker = dwg.marker(insert=(10, 5), size=(10, 10), orient='auto', id=marker_id)
    marker.add(dwg.path(d='M0,0 L10,5 L0,10 Z', fill=color))
    dwg.defs.add(marker)
    line = dwg.line(start, end, stroke=color, stroke_width=2)
    line['marker-end'] = f'url(#{marker_id})'
    g.add(line)
    if parent:
        parent.add(g)
    else:
        dwg.add(g)
    return g

def add_polyline_arrow(dwg, points, color, width=2, parent=None):
    """Add a multi-segment arrow with an arrowhead on the final segment"""
    if not hasattr(add_polyline_arrow, "marker_count"):
        add_polyline_arrow.marker_count = 0

    marker_id = f"arrow_poly_{add_polyline_arrow.marker_count}"
    add_polyline_arrow.marker_count += 1

    marker = dwg.marker(insert=(10, 5), size=(10, 10), orient='auto', id=marker_id)
    marker.add(dwg.path(d='M0,0 L10,5 L0,10 Z', fill=color))
    dwg.defs.add(marker)

    polyline = dwg.polyline(points=points, fill='none', stroke=color, stroke_width=width)
    polyline['marker-end'] = f'url(#{marker_id})'

    g = dwg.g()
    g.add(polyline)
    if parent:
        parent.add(g)
    else:
        dwg.add(g)
    return g

def create_system_architecture_svg():
    """Create high-level system architecture SVG v3"""
    dwg = svgwrite.Drawing(f"{OUTPUT_DIR}/high-level-system-architecture-v3.svg",
                           size=('1200px', '850px'), profile='full')
    dwg.add(dwg.rect((0, 0), ('100%', '100%'), fill=COLORS['background']))

    # Title
    dwg.add(dwg.text('Solstice Platform Architecture v3', insert=(40, 35),
                     font_family='system-ui, sans-serif', font_size='24px', font_weight='700', fill=COLORS['text_primary']))
    dwg.add(dwg.text('AWS Serverless Infrastructure — ca-central-1 (Canadian Data Residency)', insert=(40, 55),
                     font_family='system-ui, sans-serif', font_size='14px', fill=COLORS['text_secondary']))

    # Region container
    dwg.add(dwg.rect((270, 70), (900, 720), rx=12, ry=12, fill='#F8FAFC', stroke='#CBD5E1', stroke_width=2))
    dwg.add(dwg.text('AWS ca-central-1', insert=(290, 95),
                     font_family='monospace', font_size='12px', font_weight='600', fill=COLORS['text_secondary']))

    # VPC container
    dwg.add(dwg.rect((290, 130), (400, 250), rx=10, ry=10, fill='#F1F5F9', stroke='#94A3B8', stroke_width=2))
    dwg.add(dwg.text('VPC — Private Subnets', insert=(305, 155),
                     font_family='monospace', font_size='11px', font_weight='600', fill=COLORS['text_secondary']))

    # Users box
    add_service_box(dwg, 40, 160, 140, 55, 'Users & Admins', 'Web browsers', COLORS['user'], COLORS['user_bg'])

    # Edge services
    add_service_box(dwg, 300, 90, 110, 42, 'AWS WAF v2', 'Firewall', COLORS['edge'], COLORS['edge_bg'])
    add_service_box(dwg, 420, 90, 110, 42, 'CloudFront', 'CDN', COLORS['edge'], COLORS['edge_bg'])
    add_service_box(dwg, 540, 90, 130, 42, 'Security Headers', 'HSTS, CSP', COLORS['edge'], COLORS['edge_bg'])

    # Lambda in VPC
    add_service_box(dwg, 310, 175, 160, 55, 'Lambda', 'TanStack Start API', COLORS['compute'], COLORS['compute_bg'])

    # Redis (NEW)
    add_service_box(dwg, 490, 175, 130, 55, 'Redis', 'Rate Limit/Cache', COLORS['cache'], COLORS['cache_bg'])

    # RDS Proxy
    add_service_box(dwg, 310, 260, 130, 45, 'RDS Proxy', 'Connection pool', COLORS['compute'], COLORS['compute_bg'])

    # RDS
    add_database_icon(dwg, 550, 300, 70, 85, COLORS['data'], COLORS['data_bg'], 'PostgreSQL 16.11')

    # ECS Fargate (NEW)
    dwg.add(dwg.rect((290, 400), (400, 100), rx=8, ry=8, fill=COLORS['batch_bg'], stroke=COLORS['batch'], stroke_width=2))
    dwg.add(dwg.text('ECS Fargate Cluster', insert=(310, 425),
                     font_family='monospace', font_size='11px', font_weight='600', fill=COLORS['batch']))
    add_service_box(dwg, 310, 440, 150, 45, 'Import Batch Task', '2 vCPU, 4GB', COLORS['batch'], COLORS['batch_bg'])

    # S3 Buckets (3 separate)
    add_service_box(dwg, 720, 130, 130, 45, 'S3 Artifacts', 'Object Lock', COLORS['storage'], COLORS['storage_bg'])
    add_service_box(dwg, 720, 190, 130, 45, 'S3 Audit Archive', '7yr WORM', COLORS['storage'], COLORS['storage_bg'])
    add_service_box(dwg, 720, 250, 130, 45, 'S3 CloudTrail', 'API logs', COLORS['storage'], COLORS['storage_bg'])

    # Async services
    add_service_box(dwg, 880, 130, 120, 45, 'SQS Queue', 'Notifications', COLORS['async'], COLORS['async_bg'])
    add_service_box(dwg, 880, 190, 120, 45, 'SQS DLQ', 'Dead letters', COLORS['dlq'], COLORS['dlq_bg'])
    add_service_box(dwg, 880, 250, 120, 45, 'SES', 'Email', COLORS['async'], COLORS['async_bg'])

    # Lambda Cron jobs (NEW)
    dwg.add(dwg.rect((720, 320), (280, 110), rx=8, ry=8, fill='white', stroke=COLORS['compute'], stroke_width=1))
    dwg.add(dwg.text('Lambda Cron Jobs', insert=(740, 345),
                     font_family='monospace', font_size='11px', font_weight='600', fill=COLORS['compute']))
    add_service_box(dwg, 730, 360, 120, 40, 'Notifications', 'every 5 min', COLORS['compute'], COLORS['compute_bg'])
    add_service_box(dwg, 860, 360, 120, 40, 'Retention', 'daily', COLORS['compute'], COLORS['compute_bg'])

    # Security & Monitoring
    dwg.add(dwg.rect((720, 450), (430, 130), rx=8, ry=8, fill='white', stroke=COLORS['security'], stroke_width=1))
    dwg.add(dwg.text('Security & Monitoring', insert=(740, 475),
                     font_family='monospace', font_size='11px', font_weight='600', fill=COLORS['security']))
    add_service_box(dwg, 730, 490, 100, 40, 'CloudWatch', 'Dashboard', COLORS['security'], COLORS['security_bg'])
    add_service_box(dwg, 840, 490, 100, 40, 'CloudTrail', 'CIS Alarms', COLORS['security'], COLORS['security_bg'])
    add_service_box(dwg, 950, 490, 100, 40, 'GuardDuty', 'Threats', COLORS['security'], COLORS['security_bg'])
    add_service_box(dwg, 1060, 490, 80, 40, 'SNS', 'Alerts', COLORS['async'], COLORS['async_bg'])

    # KMS
    add_service_box(dwg, 1020, 130, 100, 45, 'KMS', 'Encryption', COLORS['security'], COLORS['security_bg'])

    # Arrows
    add_arrow(dwg, (180, 185), (300, 115), COLORS['line'])
    add_arrow(dwg, (410, 115), (420, 115), COLORS['line'])
    add_arrow(dwg, (530, 115), (540, 115), COLORS['line'])
    add_arrow(dwg, (470, 200), (490, 200), COLORS['line'])
    add_arrow(dwg, (390, 230), (380, 260), COLORS['line'])
    add_arrow(dwg, (440, 280), (510, 300), COLORS['line'])
    add_polyline_arrow(dwg, [
        (470, 195),
        (470, 160),
        (700, 160),
        (700, 152),
        (720, 152),
    ], COLORS['line'])
    add_arrow(dwg, (600, 300), (720, 212), COLORS['line'])
    add_arrow(dwg, (850, 152), (880, 152), COLORS['line'])

    # Legend
    legend_y = 600
    dwg.add(dwg.rect((40, legend_y), (200, 200), rx=8, ry=8, fill='white', stroke='#CBD5E1', stroke_width=1))
    dwg.add(dwg.text('Legend', insert=(60, legend_y+25), font_family='system-ui, sans-serif',
                     font_size='14px', font_weight='600', fill=COLORS['text_primary']))

    legend_items = [
        ('Edge / CDN', COLORS['edge'], COLORS['edge_bg']),
        ('Compute', COLORS['compute'], COLORS['compute_bg']),
        ('Cache (Redis)', COLORS['cache'], COLORS['cache_bg']),
        ('Data Stores', COLORS['data'], COLORS['data_bg']),
        ('Object Storage', COLORS['storage'], COLORS['storage_bg']),
        ('Async / Events', COLORS['async'], COLORS['async_bg']),
    ]
    for i, (label, color, bg) in enumerate(legend_items):
        ly = legend_y + 45 + i * 24
        dwg.add(dwg.rect((55, ly), (25, 16), rx=3, ry=3, fill=bg, stroke=color, stroke_width=2))
        dwg.add(dwg.text(label, insert=(90, ly+12), font_family='system-ui, sans-serif',
                         font_size='11px', fill=COLORS['text_primary']))

    # Footer
    dwg.add(dwg.text('Solstice Platform v3 · Redis + ECS Fargate + Object Lock', insert=(40, 830),
                     font_family='monospace', font_size='10px', fill=COLORS['text_muted']))

    dwg.save()
    print(f"Saved: {OUTPUT_DIR}/high-level-system-architecture-v3.svg")

def create_security_architecture_svg():
    """Create security architecture SVG v3"""
    dwg = svgwrite.Drawing(f"{OUTPUT_DIR}/security-architecture-v3.svg",
                           size=('1200px', '700px'), profile='full')

    dwg.add(dwg.rect((0, 0), ('100%', '100%'), fill=COLORS['background']))

    # Title
    dwg.add(dwg.text('Security Architecture v3', insert=(40, 35),
                     font_family='system-ui, sans-serif', font_size='24px', font_weight='700', fill=COLORS['text_primary']))
    dwg.add(dwg.text('Defense in Depth · AWS ca-central-1 · PIPEDA Compliant', insert=(40, 55),
                     font_family='system-ui, sans-serif', font_size='14px', fill=COLORS['text_secondary']))

    # Edge Layer
    dwg.add(dwg.rect((40, 80), (360, 130), rx=8, ry=8, fill='white', stroke=COLORS['edge'], stroke_width=2))
    dwg.add(dwg.rect((50, 68), (100, 20), rx=4, ry=4, fill=COLORS['edge']))
    dwg.add(dwg.text('EDGE SECURITY', insert=(58, 82), font_family='monospace', font_size='9px', font_weight='600', fill='white'))
    add_service_box(dwg, 55, 100, 100, 40, 'WAF v2', 'Managed', COLORS['edge'], COLORS['edge_bg'])
    add_service_box(dwg, 165, 100, 100, 40, 'CloudFront', 'CDN', COLORS['edge'], COLORS['edge_bg'])
    add_service_box(dwg, 275, 100, 110, 40, 'Redis Rate Limit', 'Per-IP', COLORS['cache'], COLORS['cache_bg'])
    dwg.add(dwg.text('Security Headers: HSTS, CSP, COOP, X-Frame-Options', insert=(55, 165),
                     font_family='system-ui, sans-serif', font_size='9px', fill=COLORS['text_muted']))

    # Authentication section
    dwg.add(dwg.rect((40, 230), (360, 140), rx=8, ry=8, fill='white', stroke=COLORS['auth'], stroke_width=2))
    dwg.add(dwg.rect((50, 218), (110, 20), rx=4, ry=4, fill=COLORS['auth']))
    dwg.add(dwg.text('AUTHENTICATION', insert=(58, 232), font_family='monospace', font_size='9px', font_weight='600', fill='white'))
    add_service_box(dwg, 55, 250, 100, 40, 'Better Auth', 'Sessions', COLORS['auth'], COLORS['auth_bg'])
    add_service_box(dwg, 165, 250, 100, 40, 'TOTP MFA', 'TOTP+Backup', COLORS['auth'], COLORS['auth_bg'])
    add_service_box(dwg, 275, 250, 110, 40, 'Account Lockout', '5 attempts', COLORS['auth'], COLORS['auth_bg'])
    add_service_box(dwg, 55, 300, 100, 40, 'Session Tokens', 'HttpOnly', COLORS['auth'], COLORS['auth_bg'])
    add_service_box(dwg, 165, 300, 100, 40, 'Passkeys', 'WebAuthn', COLORS['auth'], COLORS['auth_bg'])

    # Authorization section
    dwg.add(dwg.rect((420, 80), (360, 130), rx=8, ry=8, fill='white', stroke=COLORS['authz'], stroke_width=2))
    dwg.add(dwg.rect((430, 68), (110, 20), rx=4, ry=4, fill=COLORS['authz']))
    dwg.add(dwg.text('AUTHORIZATION', insert=(438, 82), font_family='monospace', font_size='9px', font_weight='600', fill='white'))
    add_service_box(dwg, 435, 100, 100, 40, 'RBAC', 'Role-based', COLORS['authz'], COLORS['authz_bg'])
    add_service_box(dwg, 545, 100, 100, 40, 'Org Scoping', 'Isolation', COLORS['authz'], COLORS['authz_bg'])
    add_service_box(dwg, 655, 100, 110, 40, 'Field Perms', 'Masking', COLORS['authz'], COLORS['authz_bg'])
    dwg.add(dwg.text('Roles: Owner, Admin, Reporter, Viewer', insert=(435, 165),
                     font_family='system-ui, sans-serif', font_size='9px', fill=COLORS['text_muted']))

    # Data Layer
    dwg.add(dwg.rect((420, 230), (360, 140), rx=8, ry=8, fill='white', stroke=COLORS['data'], stroke_width=2))
    dwg.add(dwg.rect((430, 218), (110, 20), rx=4, ry=4, fill=COLORS['data']))
    dwg.add(dwg.text('DATA PROTECTION', insert=(438, 232), font_family='monospace', font_size='9px', font_weight='600', fill='white'))
    add_service_box(dwg, 435, 250, 100, 40, 'RDS PostgreSQL', '16.11', COLORS['data'], COLORS['data_bg'])
    add_service_box(dwg, 545, 250, 100, 40, 'S3 Object Lock', 'Immutable', COLORS['storage'], COLORS['storage_bg'])
    add_service_box(dwg, 655, 250, 110, 40, 'WORM Archive', '7yr retention', COLORS['storage'], COLORS['storage_bg'])
    add_service_box(dwg, 435, 300, 100, 40, 'VPC Isolation', 'Private', COLORS['data'], COLORS['data_bg'])
    add_service_box(dwg, 545, 300, 100, 40, 'Legal Holds', 'Compliance', COLORS['data'], COLORS['data_bg'])
    dwg.add(dwg.text('Canadian data residency: ca-central-1 only', insert=(435, 360),
                     font_family='system-ui, sans-serif', font_size='9px', fill=COLORS['text_muted']))

    # Encryption
    dwg.add(dwg.rect((800, 80), (360, 130), rx=8, ry=8, fill='white', stroke=COLORS['cache'], stroke_width=2))
    dwg.add(dwg.rect((810, 68), (90, 20), rx=4, ry=4, fill=COLORS['cache']))
    dwg.add(dwg.text('ENCRYPTION', insert=(820, 82), font_family='monospace', font_size='9px', font_weight='600', fill='white'))
    add_service_box(dwg, 815, 100, 100, 40, 'AWS KMS', 'Key mgmt', COLORS['cache'], COLORS['cache_bg'])
    add_service_box(dwg, 925, 100, 100, 40, 'AES-256', 'At-rest', COLORS['cache'], COLORS['cache_bg'])
    add_service_box(dwg, 1035, 100, 110, 40, 'TLS 1.2+', 'In-transit', COLORS['cache'], COLORS['cache_bg'])
    dwg.add(dwg.text('Secrets Manager + App-level crypto', insert=(815, 165),
                     font_family='system-ui, sans-serif', font_size='9px', fill=COLORS['text_muted']))

    # Audit
    dwg.add(dwg.rect((800, 230), (360, 140), rx=8, ry=8, fill='white', stroke=COLORS['audit'], stroke_width=2))
    dwg.add(dwg.rect((810, 218), (90, 20), rx=4, ry=4, fill=COLORS['audit']))
    dwg.add(dwg.text('AUDIT TRAIL', insert=(820, 232), font_family='monospace', font_size='9px', font_weight='600', fill='white'))
    add_service_box(dwg, 815, 250, 100, 40, 'Audit Log', 'Hash chain', COLORS['audit'], COLORS['audit_bg'])
    add_service_box(dwg, 925, 250, 100, 40, 'S3 Deep Archive', 'Long-term', COLORS['audit'], COLORS['audit_bg'])
    add_service_box(dwg, 1035, 250, 110, 40, 'Verification API', 'Integrity', COLORS['audit'], COLORS['audit_bg'])
    add_service_box(dwg, 815, 300, 100, 40, 'Retention Policy', 'Config', COLORS['audit'], COLORS['audit_bg'])
    add_service_box(dwg, 925, 300, 100, 40, 'Export Logs', 'Compliance', COLORS['audit'], COLORS['audit_bg'])
    dwg.add(dwg.text('SHA-256 hash chain · 7-year WORM compliance', insert=(815, 360),
                     font_family='system-ui, sans-serif', font_size='9px', fill=COLORS['text_muted']))

    # Monitoring (bottom)
    dwg.add(dwg.rect((40, 420), (1120, 100), rx=8, ry=8, fill='white', stroke=COLORS['monitor'], stroke_width=2))
    dwg.add(dwg.rect((50, 408), (150, 20), rx=4, ry=4, fill=COLORS['monitor']))
    dwg.add(dwg.text('SECURITY MONITORING', insert=(58, 422), font_family='monospace', font_size='9px', font_weight='600', fill='white'))
    add_service_box(dwg, 55, 445, 120, 40, 'CloudWatch', 'Dashboard', COLORS['monitor'], COLORS['monitor_bg'])
    add_service_box(dwg, 185, 445, 120, 40, 'CloudTrail', 'API logs', COLORS['monitor'], COLORS['monitor_bg'])
    add_service_box(dwg, 315, 445, 120, 40, 'CIS Alarms', 'Benchmark', COLORS['monitor'], COLORS['monitor_bg'])
    add_service_box(dwg, 445, 445, 120, 40, 'GuardDuty', 'Threats', COLORS['monitor'], COLORS['monitor_bg'])
    add_service_box(dwg, 575, 445, 120, 40, 'SNS Alerts', 'Notifications', COLORS['async'], COLORS['async_bg'])
    add_service_box(dwg, 705, 445, 130, 40, 'Security Events', 'Real-time', COLORS['monitor'], COLORS['monitor_bg'])
    dwg.add(dwg.text('CIS Benchmark alarms: root usage, IAM changes, security group changes', insert=(55, 500),
                     font_family='system-ui, sans-serif', font_size='9px', fill=COLORS['text_muted']))

    # Footer
    dwg.add(dwg.text('Defense in depth · Zero trust · Canadian data residency', insert=(40, 680),
                     font_family='monospace', font_size='10px', fill=COLORS['text_muted']))

    dwg.save()
    print(f"Saved: {OUTPUT_DIR}/security-architecture-v3.svg")

def create_multitenant_architecture_svg():
    """Create multi-tenant architecture SVG v3"""
    dwg = svgwrite.Drawing(f"{OUTPUT_DIR}/multi-tenant-architecture-v3.svg",
                           size=('1200px', '600px'), profile='full')

    dwg.add(dwg.rect((0, 0), ('100%', '100%'), fill=COLORS['background']))

    # Title
    dwg.add(dwg.text('Multi-Tenant Architecture v3', insert=(40, 35),
                     font_family='system-ui, sans-serif', font_size='24px', font_weight='700', fill=COLORS['text_primary']))
    dwg.add(dwg.text('Tenant Isolation · Organization Hierarchy · Data Segregation', insert=(40, 55),
                     font_family='system-ui, sans-serif', font_size='14px', fill=COLORS['text_secondary']))

    # Platform
    dwg.add(dwg.rect((40, 80), (220, 180), rx=10, ry=10, fill=COLORS['user_bg'], stroke=COLORS['user'], stroke_width=2))
    dwg.add(dwg.text('Solstice Platform', insert=(55, 105), font_family='system-ui, sans-serif',
                     font_size='14px', font_weight='600', fill=COLORS['text_primary']))
    dwg.add(dwg.text('Single codebase', insert=(55, 125), font_family='system-ui, sans-serif',
                     font_size='11px', fill=COLORS['text_secondary']))
    add_service_box(dwg, 55, 140, 180, 40, 'Tenant Router', 'TENANT_KEY', COLORS['security'], COLORS['security_bg'])
    add_service_box(dwg, 55, 190, 180, 40, 'Redis', 'sin:{stage}:* prefix', COLORS['cache'], COLORS['cache_bg'])

    # viaSport Tenant
    dwg.add(dwg.rect((300, 80), (420, 420), rx=12, ry=12, fill=COLORS['viasport_bg'],
                     stroke=COLORS['viasport'], stroke_width=2, stroke_dasharray='8,4'))
    dwg.add(dwg.rect((310, 68), (100, 22), rx=4, ry=4, fill=COLORS['viasport']))
    dwg.add(dwg.text('viaSport', insert=(325, 84), font_family='monospace', font_size='11px', font_weight='600', fill='white'))
    dwg.add(dwg.text('viaSport BC', insert=(320, 118), font_family='system-ui, sans-serif',
                     font_size='16px', font_weight='700', fill=COLORS['viasport']))

    # RBAC section
    dwg.add(dwg.rect((320, 140), (180, 130), rx=6, ry=6, fill='white', stroke=COLORS['viasport'], stroke_width=1))
    dwg.add(dwg.text('RBAC Roles', insert=(335, 163), font_family='system-ui, sans-serif',
                     font_size='12px', font_weight='600', fill=COLORS['text_primary']))
    roles = [('Owner', '#1E40AF'), ('Admin', '#3B82F6'), ('Reporter', '#60A5FA'), ('Viewer', '#93C5FD')]
    for i, (role, color) in enumerate(roles):
        ry = 175 + i * 22
        dwg.add(dwg.rect((335, ry), (55, 16), rx=3, ry=3, fill=color))
        dwg.add(dwg.text(role, insert=(343, ry+12), font_family='monospace', font_size='9px', fill='white'))

    # Org hierarchy
    dwg.add(dwg.text('Organization Hierarchy', insert=(520, 155), font_family='system-ui, sans-serif',
                     font_size='11px', font_weight='600', fill=COLORS['text_primary']))
    add_service_box(dwg, 520, 170, 110, 35, 'Gov Body', 'Top-level', COLORS['viasport'], COLORS['viasport_bg'])
    add_service_box(dwg, 540, 220, 110, 35, 'PSO', 'Provincial', COLORS['auth'], COLORS['auth_bg'])
    add_service_box(dwg, 560, 270, 110, 35, 'Club', 'Local', COLORS['data'], COLORS['data_bg'])
    dwg.add(dwg.line((575, 205), (595, 220), stroke=COLORS['line'], stroke_width=2))
    dwg.add(dwg.line((595, 255), (615, 270), stroke=COLORS['line'], stroke_width=2))

    # viaSport data stores
    add_service_box(dwg, 320, 330, 130, 40, 'S3-viaSport', 'Object Lock', COLORS['storage'], COLORS['storage_bg'])
    add_database_icon(dwg, 540, 365, 55, 65, COLORS['viasport'], COLORS['viasport_bg'], 'RDS-viaSport')
    add_service_box(dwg, 320, 390, 130, 40, 'ECS Batch', 'Isolated tasks', COLORS['batch'], COLORS['batch_bg'])

    # Other tenants (generic)
    other_y = 80
    other_w = 200
    other_h = 220
    other_gap = 20
    other_a_x = 760
    other_b_x = other_a_x + other_w + other_gap

    for tenant_x, label, name, prefix in [
        (other_a_x, "Partner A", "Partner Org A", "tenant-a:*"),
        (other_b_x, "Partner B", "Partner Org B", "tenant-b:*"),
    ]:
        dwg.add(dwg.rect((tenant_x, other_y), (other_w, other_h), rx=12, ry=12, fill=COLORS['qc_bg'],
                         stroke=COLORS['qc'], stroke_width=2, stroke_dasharray='8,4'))
        dwg.add(dwg.rect((tenant_x + 10, 68), (110, 22), rx=4, ry=4, fill=COLORS['qc']))
        dwg.add(dwg.text(label, insert=(tenant_x + 20, 84), font_family='monospace', font_size='10px', font_weight='600', fill='white'))
        dwg.add(dwg.text(name, insert=(tenant_x + 15, 118), font_family='system-ui, sans-serif',
                         font_size='14px', font_weight='700', fill=COLORS['qc']))
        dwg.add(dwg.text('Isolated tenant', insert=(tenant_x + 15, 138), font_family='system-ui, sans-serif',
                         font_size='10px', fill=COLORS['text_secondary']))
        add_service_box(dwg, tenant_x + 15, 150, 120, 35, 'Org Tree', 'Scoped', COLORS['qc'], COLORS['qc_bg'])
        add_service_box(dwg, tenant_x + 15, 195, 120, 35, 'S3 Buckets', 'Object Lock', COLORS['qc'], COLORS['qc_bg'])
        dwg.add(dwg.text(f"Redis: {prefix}", insert=(tenant_x + 15, 245), font_family='system-ui, sans-serif',
                         font_size='9px', fill=COLORS['text_muted']))
        dwg.add(dwg.text("Batch: Isolated tasks", insert=(tenant_x + 15, 262), font_family='system-ui, sans-serif',
                         font_size='9px', fill=COLORS['text_muted']))

    # Isolation callout
    dwg.add(dwg.rect((760, 360), (260, 130), rx=8, ry=8, fill='#FEF2F2', stroke='#EF4444', stroke_width=2))
    dwg.add(dwg.text('Tenant Isolation Guarantees', insert=(775, 385), font_family='system-ui, sans-serif',
                     font_size='11px', font_weight='600', fill='#B91C1C'))
    guarantees = ['• Complete data segregation', '• Redis key prefixing (tenant-id:*)', '• S3 buckets with Object Lock',
                  '• Isolated ECS batch tasks', '• Separate KMS encryption keys']
    for i, g in enumerate(guarantees):
        dwg.add(dwg.text(g, insert=(775, 405+i*18), font_family='system-ui, sans-serif',
                         font_size='10px', fill=COLORS['text_primary']))

    # Arrows
    add_arrow(dwg, (260, 160), (300, 160), COLORS['line'])
    tenant_rail_y = other_y - 20
    add_polyline_arrow(dwg, [
        (260, 200),
        (260, tenant_rail_y),
        (other_a_x - 15, tenant_rail_y),
        (other_a_x - 15, other_y + 100),
        (other_a_x, other_y + 100),
    ], COLORS['line'])

    add_polyline_arrow(dwg, [
        (260, 220),
        (260, tenant_rail_y),
        (other_b_x - 15, tenant_rail_y),
        (other_b_x - 15, other_y + 100),
        (other_b_x, other_y + 100),
    ], COLORS['line'])

    # Footer
    dwg.add(dwg.text('Single codebase · Complete tenant isolation · Redis prefixing', insert=(40, 580),
                     font_family='monospace', font_size='10px', fill=COLORS['text_muted']))

    dwg.save()
    print(f"Saved: {OUTPUT_DIR}/multi-tenant-architecture-v3.svg")

def create_dataflow_svg():
    """Create data flow diagram SVG v3"""
    dwg = svgwrite.Drawing(f"{OUTPUT_DIR}/data-flow-diagram-v3.svg",
                           size=('1200px', '950px'), profile='full')

    dwg.add(dwg.rect((0, 0), ('100%', '100%'), fill=COLORS['background']))

    # Title
    dwg.add(dwg.text('Data Flow Diagrams v3', insert=(40, 35),
                     font_family='system-ui, sans-serif', font_size='24px', font_weight='700', fill=COLORS['text_primary']))
    dwg.add(dwg.text('User Submission · Reporting · Notifications · Batch Import', insert=(40, 55),
                     font_family='system-ui, sans-serif', font_size='14px', fill=COLORS['text_secondary']))

    def add_step_number(x, y, num, color):
        dwg.add(dwg.circle((x, y), 12, fill=color))
        dwg.add(dwg.text(str(num), insert=(x-4, y+5), font_family='monospace', font_size='12px', font_weight='700', fill='white'))

    # Flow 1: Submission (with Redis)
    dwg.add(dwg.rect((40, 80), (1100, 160), rx=10, ry=10, fill=COLORS['edge_bg'], stroke=COLORS['edge'], stroke_width=2))
    dwg.add(dwg.rect((50, 68), (130, 22), rx=4, ry=4, fill=COLORS['edge']))
    dwg.add(dwg.text('USER SUBMISSION', insert=(60, 84), font_family='monospace', font_size='10px', font_weight='600', fill='white'))

    add_step_number(60, 120, 1, COLORS['edge'])
    add_service_box(dwg, 80, 105, 90, 38, 'Browser', 'Form', COLORS['user'], COLORS['user_bg'])
    add_step_number(195, 120, 2, COLORS['edge'])
    add_service_box(dwg, 215, 105, 90, 38, 'API', 'Lambda', COLORS['compute'], COLORS['compute_bg'])
    add_step_number(330, 120, 3, COLORS['edge'])
    add_service_box(dwg, 350, 105, 100, 38, 'Validation', 'Schema', COLORS['compute'], COLORS['compute_bg'])
    add_step_number(475, 120, 4, COLORS['edge'])
    add_service_box(dwg, 495, 105, 90, 38, 'Redis', 'Rate limit', COLORS['cache'], COLORS['cache_bg'])
    add_step_number(610, 120, 5, COLORS['edge'])
    add_database_icon(dwg, 660, 125, 45, 55, COLORS['data'], COLORS['data_bg'], 'PostgreSQL')
    add_step_number(750, 120, 6, COLORS['edge'])
    add_service_box(dwg, 770, 100, 90, 35, 'Audit Log', 'Hash chain', COLORS['audit'], COLORS['audit_bg'])
    add_service_box(dwg, 770, 140, 90, 35, 'S3 Archive', 'WORM', COLORS['storage'], COLORS['storage_bg'])

    add_arrow(dwg, (170, 122), (195, 122), COLORS['edge'])
    add_arrow(dwg, (305, 122), (330, 122), COLORS['edge'])
    add_arrow(dwg, (450, 122), (475, 122), COLORS['edge'])
    add_arrow(dwg, (585, 122), (610, 122), COLORS['edge'])
    add_arrow(dwg, (695, 110), (770, 118), COLORS['edge'])
    add_arrow(dwg, (695, 135), (770, 155), COLORS['edge'])

    dwg.add(dwg.text('Form → Validated → Rate limit (Redis) → Stored → Audit in DB + S3 archive', insert=(60, 180),
                     font_family='system-ui, sans-serif', font_size='10px', fill=COLORS['text_secondary']))

    # Flow 2: Reporting (with Redis cache)
    dwg.add(dwg.rect((40, 260), (1100, 160), rx=10, ry=10, fill=COLORS['compute_bg'], stroke=COLORS['compute'], stroke_width=2))
    dwg.add(dwg.rect((50, 248), (120, 22), rx=4, ry=4, fill=COLORS['compute']))
    dwg.add(dwg.text('REPORTING FLOW', insert=(60, 264), font_family='monospace', font_size='10px', font_weight='600', fill='white'))

    add_step_number(60, 300, 1, COLORS['compute'])
    add_service_box(dwg, 80, 285, 100, 38, 'Report Builder', 'UI', COLORS['user'], COLORS['user_bg'])
    add_step_number(205, 300, 2, COLORS['compute'])
    add_service_box(dwg, 225, 285, 90, 38, 'Query API', 'Handler', COLORS['compute'], COLORS['compute_bg'])
    add_step_number(340, 300, 3, COLORS['compute'])
    add_service_box(dwg, 360, 285, 110, 38, 'Access Control', 'RBAC+scope', COLORS['authz'], COLORS['authz_bg'])
    add_step_number(495, 300, 4, COLORS['compute'])
    add_service_box(dwg, 515, 285, 100, 38, 'Redis Cache', 'Query cache', COLORS['cache'], COLORS['cache_bg'])
    add_step_number(640, 300, 5, COLORS['compute'])
    add_service_box(dwg, 660, 285, 100, 38, 'Aggregation', 'Compute', COLORS['compute'], COLORS['compute_bg'])
    add_step_number(785, 300, 6, COLORS['compute'])
    add_service_box(dwg, 805, 285, 90, 38, 'Export', 'CSV/PDF', COLORS['data'], COLORS['data_bg'])

    add_arrow(dwg, (180, 302), (205, 302), COLORS['compute'])
    add_arrow(dwg, (315, 302), (340, 302), COLORS['compute'])
    add_arrow(dwg, (470, 302), (495, 302), COLORS['compute'])
    add_arrow(dwg, (615, 302), (640, 302), COLORS['compute'])
    add_arrow(dwg, (760, 302), (785, 302), COLORS['compute'])

    dwg.add(dwg.text('Filtered by org scope → Redis cache checked → Aggregated → Exported', insert=(60, 360),
                     font_family='system-ui, sans-serif', font_size='10px', fill=COLORS['text_secondary']))

    # Flow 3: Notifications (with DLQ)
    dwg.add(dwg.rect((40, 440), (1100, 170), rx=10, ry=10, fill=COLORS['async_bg'], stroke=COLORS['async'], stroke_width=2))
    dwg.add(dwg.rect((50, 428), (140, 22), rx=4, ry=4, fill=COLORS['async']))
    dwg.add(dwg.text('NOTIFICATION FLOW', insert=(60, 444), font_family='monospace', font_size='10px', font_weight='600', fill='white'))

    add_step_number(60, 480, 1, COLORS['async'])
    add_service_box(dwg, 80, 465, 100, 38, 'Domain Event', 'Trigger', COLORS['compute'], COLORS['compute_bg'])
    add_step_number(205, 480, 2, COLORS['async'])
    add_service_box(dwg, 225, 465, 90, 38, 'SQS Queue', 'Buffer', COLORS['async'], COLORS['async_bg'])
    add_step_number(340, 480, 3, COLORS['async'])
    add_service_box(dwg, 360, 465, 110, 38, 'Worker Lambda', 'Process', COLORS['compute'], COLORS['compute_bg'])
    add_step_number(495, 465, 4, COLORS['async'])
    add_service_box(dwg, 515, 455, 90, 35, 'SES Email', 'External', COLORS['async'], COLORS['async_bg'])
    add_service_box(dwg, 515, 495, 90, 35, 'In-App', 'Alerts', COLORS['async'], COLORS['async_bg'])

    # DLQ
    add_service_box(dwg, 225, 520, 100, 38, 'SQS DLQ', 'Failed msgs', COLORS['dlq'], COLORS['dlq_bg'])
    dwg.add(dwg.text('Max 3 retries', insert=(225, 570), font_family='system-ui, sans-serif', font_size='9px', fill=COLORS['text_muted']))

    add_arrow(dwg, (180, 482), (205, 482), COLORS['async'])
    add_arrow(dwg, (315, 482), (340, 482), COLORS['async'])
    add_arrow(dwg, (470, 475), (495, 472), COLORS['async'])
    add_arrow(dwg, (470, 490), (495, 512), COLORS['async'])
    add_arrow(dwg, (270, 503), (270, 520), COLORS['dlq'])

    dwg.add(dwg.text('Events queued → Workers process → Email/in-app delivery · Failed → DLQ', insert=(60, 600),
                     font_family='system-ui, sans-serif', font_size='10px', fill=COLORS['text_secondary']))

    # Flow 4: Batch Import (NEW)
    dwg.add(dwg.rect((40, 630), (1100, 170), rx=10, ry=10, fill=COLORS['batch_bg'], stroke=COLORS['batch'], stroke_width=2))
    dwg.add(dwg.rect((50, 618), (110, 22), rx=4, ry=4, fill=COLORS['batch']))
    dwg.add(dwg.text('BATCH IMPORT', insert=(60, 634), font_family='monospace', font_size='10px', font_weight='600', fill='white'))
    dwg.add(dwg.rect((170, 618), (40, 22), rx=4, ry=4, fill='#22C55E'))
    dwg.add(dwg.text('NEW', insert=(180, 634), font_family='monospace', font_size='10px', font_weight='600', fill='white'))

    add_step_number(60, 670, 1, COLORS['batch'])
    add_service_box(dwg, 80, 655, 90, 38, 'CSV Upload', 'User file', COLORS['user'], COLORS['user_bg'])
    add_step_number(195, 670, 2, COLORS['batch'])
    add_service_box(dwg, 215, 655, 100, 38, 'S3 Artifacts', 'Object Lock', COLORS['storage'], COLORS['storage_bg'])
    add_step_number(340, 670, 3, COLORS['batch'])
    add_service_box(dwg, 360, 655, 90, 38, 'Lambda', 'S3 trigger', COLORS['compute'], COLORS['compute_bg'])
    add_step_number(475, 670, 4, COLORS['batch'])
    add_service_box(dwg, 495, 655, 110, 38, 'ECS Fargate', 'Batch task', COLORS['batch'], COLORS['batch_bg'])
    add_step_number(630, 670, 5, COLORS['batch'])
    add_service_box(dwg, 650, 655, 90, 38, 'Validation', 'Row by row', COLORS['compute'], COLORS['compute_bg'])
    add_step_number(765, 670, 6, COLORS['batch'])
    add_database_icon(dwg, 810, 680, 40, 50, COLORS['data'], COLORS['data_bg'], 'PostgreSQL')
    add_step_number(890, 670, 7, COLORS['batch'])
    add_service_box(dwg, 910, 655, 80, 35, 'Audit', 'Batch entry', COLORS['audit'], COLORS['audit_bg'])
    add_service_box(dwg, 910, 695, 80, 35, 'Notify', 'Complete', COLORS['async'], COLORS['async_bg'])

    dwg.add(dwg.text('2 vCPU, 4GB RAM', insert=(495, 705), font_family='system-ui, sans-serif', font_size='9px', fill=COLORS['text_muted']))

    add_arrow(dwg, (170, 672), (195, 672), COLORS['batch'])
    add_arrow(dwg, (315, 672), (340, 672), COLORS['batch'])
    add_arrow(dwg, (450, 672), (475, 672), COLORS['batch'])
    add_arrow(dwg, (605, 672), (630, 672), COLORS['batch'])
    add_arrow(dwg, (740, 672), (765, 672), COLORS['batch'])
    add_arrow(dwg, (840, 665), (910, 672), COLORS['batch'])
    add_arrow(dwg, (840, 690), (910, 712), COLORS['batch'])

    dwg.add(dwg.text('CSV → S3 → Lambda trigger → ECS Fargate (1M+ rows) → Validate → Insert → Audit + notify', insert=(60, 760),
                     font_family='system-ui, sans-serif', font_size='10px', fill=COLORS['text_secondary']))

    # Legend
    dwg.add(dwg.rect((40, 800), (1100, 70), rx=8, ry=8, fill='white', stroke='#CBD5E1', stroke_width=1))
    dwg.add(dwg.text('Component Types', insert=(60, 825), font_family='system-ui, sans-serif',
                     font_size='12px', font_weight='600', fill=COLORS['text_primary']))
    legend_items = [
        ('User Interface', COLORS['user'], COLORS['user_bg']),
        ('App Logic', COLORS['compute'], COLORS['compute_bg']),
        ('Cache (Redis)', COLORS['cache'], COLORS['cache_bg']),
        ('Object Storage', COLORS['storage'], COLORS['storage_bg']),
        ('Async', COLORS['async'], COLORS['async_bg']),
        ('Audit', COLORS['audit'], COLORS['audit_bg']),
        ('DLQ', COLORS['dlq'], COLORS['dlq_bg']),
        ('Batch', COLORS['batch'], COLORS['batch_bg']),
    ]
    for i, (label, color, bg) in enumerate(legend_items):
        lx = 60 + i * 130
        ly = 838
        dwg.add(dwg.rect((lx, ly), (22, 15), rx=3, ry=3, fill=bg, stroke=color, stroke_width=2))
        dwg.add(dwg.text(label, insert=(lx+28, ly+12), font_family='system-ui, sans-serif',
                         font_size='10px', fill=COLORS['text_primary']))

    # Footer
    dwg.add(dwg.text('Redis caching · ECS Fargate batch · DLQ · S3 WORM archive', insert=(40, 930),
                     font_family='monospace', font_size='10px', fill=COLORS['text_muted']))

    dwg.save()
    print(f"Saved: {OUTPUT_DIR}/data-flow-diagram-v3.svg")

if __name__ == "__main__":
    create_system_architecture_svg()
    create_security_architecture_svg()
    create_multitenant_architecture_svg()
    create_dataflow_svg()
    print("\nAll SVG v3 diagrams created!")
