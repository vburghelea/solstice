#!/usr/bin/env python3
"""
SVG Architecture Diagram Generator
Creates vector versions of all architecture diagrams
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
    'auth': '#8B5CF6',
    'auth_bg': '#F5F3FF',
    'authz': '#EC4899',
    'authz_bg': '#FDF2F8',
    'audit': '#EF4444',
    'audit_bg': '#FEF2F2',
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

    # Shadow
    g.add(dwg.rect((x+2, y+2), (w, h), rx=6, ry=6, fill='#E2E8F0'))

    # Main box
    g.add(dwg.rect((x, y), (w, h), rx=6, ry=6, fill=bg_color, stroke=color, stroke_width=2))

    # Accent bar
    g.add(dwg.rect((x, y+6), (4, h-12), fill=color))

    # Text
    g.add(dwg.text(name, insert=(x+14, y+h//2-2), font_family='system-ui, -apple-system, sans-serif',
                   font_size='14px', font_weight='600', fill=COLORS['text_primary']))
    if detail:
        g.add(dwg.text(detail, insert=(x+14, y+h//2+14), font_family='system-ui, sans-serif',
                       font_size='12px', fill=COLORS['text_secondary']))

    if parent:
        parent.add(g)
    else:
        dwg.add(g)
    return g

def add_database_icon(dwg, cx, cy, w, h, color, bg_color, label, parent=None):
    """Add a database cylinder icon"""
    g = dwg.g()
    ellipse_h = h // 5

    # Shadow
    g.add(dwg.ellipse((cx+2, cy-h//2+ellipse_h//2+2), (w//2, ellipse_h//2), fill='#E2E8F0'))
    g.add(dwg.rect((cx-w//2+2, cy-h//2+ellipse_h//2+2), (w, h-ellipse_h), fill='#E2E8F0'))

    # Body
    g.add(dwg.rect((cx-w//2, cy-h//2+ellipse_h//2), (w, h-ellipse_h), fill=bg_color))
    g.add(dwg.line((cx-w//2, cy-h//2+ellipse_h//2), (cx-w//2, cy+h//2-ellipse_h//2), stroke=color, stroke_width=2))
    g.add(dwg.line((cx+w//2, cy-h//2+ellipse_h//2), (cx+w//2, cy+h//2-ellipse_h//2), stroke=color, stroke_width=2))

    # Top ellipse
    g.add(dwg.ellipse((cx, cy-h//2+ellipse_h//2), (w//2, ellipse_h//2), fill=bg_color, stroke=color, stroke_width=2))

    # Bottom ellipse
    g.add(dwg.ellipse((cx, cy+h//2-ellipse_h//2), (w//2, ellipse_h//2), fill=bg_color, stroke=color, stroke_width=2))

    # Label
    g.add(dwg.text(label, insert=(cx-40, cy+h//2+20), font_family='system-ui, sans-serif',
                   font_size='14px', font_weight='600', fill=COLORS['text_primary']))

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

    # Define arrowhead marker
    marker_id = f"arrow_{x1}_{y1}_{x2}_{y2}"
    marker = dwg.marker(insert=(10, 5), size=(10, 10), orient='auto', id=marker_id)
    marker.add(dwg.path(d='M0,0 L10,5 L0,10 Z', fill=color))
    dwg.defs.add(marker)

    # Line with marker
    line = dwg.line(start, end, stroke=color, stroke_width=2)
    line['marker-end'] = f'url(#{marker_id})'
    g.add(line)

    if parent:
        parent.add(g)
    else:
        dwg.add(g)
    return g

def create_system_architecture_svg():
    """Create high-level system architecture SVG"""
    dwg = svgwrite.Drawing(f"{OUTPUT_DIR}/high-level-system-architecture-v2.svg",
                           size=('1200px', '800px'), profile='full')

    # Background
    dwg.add(dwg.rect((0, 0), ('100%', '100%'), fill=COLORS['background']))

    # Title
    dwg.add(dwg.text('Solstice Platform Architecture', insert=(40, 35),
                     font_family='system-ui, sans-serif', font_size='24px', font_weight='700', fill=COLORS['text_primary']))
    dwg.add(dwg.text('AWS Serverless Infrastructure — ca-central-1', insert=(40, 55),
                     font_family='system-ui, sans-serif', font_size='14px', fill=COLORS['text_secondary']))

    # Region container
    dwg.add(dwg.rect((290, 70), (870, 680), rx=12, ry=12, fill='#F8FAFC', stroke='#CBD5E1', stroke_width=2))
    dwg.add(dwg.text('AWS ca-central-1', insert=(310, 95),
                     font_family='monospace', font_size='12px', font_weight='600', fill=COLORS['text_secondary']))
    dwg.add(dwg.text('Canadian Data Residency', insert=(420, 95),
                     font_family='monospace', font_size='10px', fill=COLORS['text_muted']))

    # VPC container
    dwg.add(dwg.rect((310, 150), (350, 300), rx=10, ry=10, fill='#F1F5F9', stroke='#94A3B8', stroke_width=2))
    dwg.add(dwg.text('VPC — Private Subnets', insert=(325, 175),
                     font_family='monospace', font_size='11px', font_weight='600', fill=COLORS['text_secondary']))

    # Users box
    add_service_box(dwg, 40, 160, 140, 60, 'Users & Admins', 'Web browsers', COLORS['user'], COLORS['user_bg'])

    # Edge services
    add_service_box(dwg, 320, 90, 120, 50, 'AWS WAF', 'Firewall', COLORS['edge'], COLORS['edge_bg'])
    add_service_box(dwg, 460, 90, 120, 50, 'CloudFront', 'CDN & Edge', COLORS['edge'], COLORS['edge_bg'])

    # Lambda in VPC
    add_service_box(dwg, 340, 200, 180, 70, 'Lambda', 'TanStack Start App + API', COLORS['compute'], COLORS['compute_bg'])

    # RDS Proxy
    add_service_box(dwg, 340, 300, 140, 50, 'RDS Proxy', 'Connection pool', COLORS['compute'], COLORS['compute_bg'])

    # RDS
    add_database_icon(dwg, 580, 340, 80, 100, COLORS['data'], COLORS['data_bg'], 'RDS PostgreSQL')

    # Other services
    add_service_box(dwg, 700, 150, 140, 50, 'S3', 'Object Storage', COLORS['data'], COLORS['data_bg'])
    add_service_box(dwg, 700, 220, 140, 50, 'SQS', 'Message Queue', COLORS['async'], COLORS['async_bg'])
    add_service_box(dwg, 700, 290, 140, 50, 'EventBridge', 'Scheduler', COLORS['async'], COLORS['async_bg'])
    add_service_box(dwg, 860, 220, 120, 50, 'SES', 'Email Service', COLORS['async'], COLORS['async_bg'])
    add_service_box(dwg, 860, 150, 120, 50, 'KMS', 'Encryption', COLORS['security'], COLORS['security_bg'])

    # Monitoring
    add_service_box(dwg, 700, 380, 130, 50, 'CloudWatch', 'Logs & Alarms', COLORS['security'], COLORS['security_bg'])
    add_service_box(dwg, 850, 380, 130, 50, 'CloudTrail', 'API Audit', COLORS['security'], COLORS['security_bg'])
    add_service_box(dwg, 1000, 380, 130, 50, 'GuardDuty', 'Threats', COLORS['security'], COLORS['security_bg'])

    # Arrows
    add_arrow(dwg, (180, 190), (320, 115), COLORS['line'])
    add_arrow(dwg, (440, 115), (460, 115), COLORS['line'])
    add_arrow(dwg, (520, 140), (430, 200), COLORS['line'])
    add_arrow(dwg, (430, 270), (410, 300), COLORS['line'])
    add_arrow(dwg, (480, 325), (540, 340), COLORS['line'])
    add_arrow(dwg, (520, 220), (700, 175), COLORS['line'])
    add_arrow(dwg, (520, 240), (700, 245), COLORS['line'])
    add_arrow(dwg, (840, 245), (860, 245), COLORS['line'])

    # Legend
    legend_y = 500
    dwg.add(dwg.rect((40, legend_y), (200, 220), rx=8, ry=8, fill='white', stroke='#CBD5E1', stroke_width=1))
    dwg.add(dwg.text('Legend', insert=(60, legend_y+25), font_family='system-ui, sans-serif',
                     font_size='14px', font_weight='600', fill=COLORS['text_primary']))

    legend_items = [
        ('Edge / CDN', COLORS['edge'], COLORS['edge_bg']),
        ('Compute', COLORS['compute'], COLORS['compute_bg']),
        ('Data Stores', COLORS['data'], COLORS['data_bg']),
        ('Async / Events', COLORS['async'], COLORS['async_bg']),
        ('Security', COLORS['security'], COLORS['security_bg']),
    ]
    for i, (label, color, bg) in enumerate(legend_items):
        ly = legend_y + 50 + i * 32
        dwg.add(dwg.rect((55, ly), (30, 20), rx=4, ry=4, fill=bg, stroke=color, stroke_width=2))
        dwg.add(dwg.text(label, insert=(95, ly+15), font_family='system-ui, sans-serif',
                         font_size='12px', fill=COLORS['text_primary']))

    # Footer
    dwg.add(dwg.text('Solstice Platform · Austin Wallace Tech', insert=(40, 780),
                     font_family='monospace', font_size='10px', fill=COLORS['text_muted']))

    dwg.save()
    print(f"Saved: {OUTPUT_DIR}/high-level-system-architecture-v2.svg")

def create_security_architecture_svg():
    """Create security architecture SVG"""
    dwg = svgwrite.Drawing(f"{OUTPUT_DIR}/security-architecture-v2.svg",
                           size=('1200px', '900px'), profile='full')

    dwg.add(dwg.rect((0, 0), ('100%', '100%'), fill=COLORS['background']))

    # Title
    dwg.add(dwg.text('Security Architecture', insert=(40, 35),
                     font_family='system-ui, sans-serif', font_size='24px', font_weight='700', fill=COLORS['text_primary']))
    dwg.add(dwg.text('Defense in Depth · Zero Trust Principles', insert=(40, 55),
                     font_family='system-ui, sans-serif', font_size='14px', fill=COLORS['text_secondary']))

    # Users
    add_service_box(dwg, 40, 100, 120, 50, 'Users/Admins', 'Browsers', COLORS['user'], COLORS['user_bg'])

    # Edge Layer
    dwg.add(dwg.rect((200, 80), (250, 90), rx=8, ry=8, fill='white', stroke=COLORS['edge'], stroke_width=2))
    dwg.add(dwg.rect((210, 68), (80, 20), rx=4, ry=4, fill=COLORS['edge']))
    dwg.add(dwg.text('EDGE', insert=(225, 82), font_family='monospace', font_size='10px', font_weight='600', fill='white'))
    add_service_box(dwg, 215, 100, 100, 45, 'WAF', 'Filtering', COLORS['edge'], COLORS['edge_bg'])
    add_service_box(dwg, 330, 100, 100, 45, 'CloudFront', 'DDoS', COLORS['edge'], COLORS['edge_bg'])

    # TLS badges
    dwg.add(dwg.rect((165, 110), (30, 16), rx=3, ry=3, fill='#059669'))
    dwg.add(dwg.text('TLS', insert=(170, 122), font_family='monospace', font_size='9px', fill='white'))

    # Authentication section
    dwg.add(dwg.rect((40, 200), (400, 180), rx=8, ry=8, fill='white', stroke=COLORS['auth'], stroke_width=2))
    dwg.add(dwg.rect((50, 188), (120, 20), rx=4, ry=4, fill=COLORS['auth']))
    dwg.add(dwg.text('AUTHENTICATION', insert=(60, 202), font_family='monospace', font_size='9px', font_weight='600', fill='white'))
    add_service_box(dwg, 60, 225, 150, 45, 'Better Auth', 'Identity', COLORS['auth'], COLORS['auth_bg'])
    add_service_box(dwg, 230, 225, 150, 45, 'MFA', 'TOTP + Backup', COLORS['auth'], COLORS['auth_bg'])
    add_service_box(dwg, 60, 290, 150, 45, 'Session Tokens', 'Secure cookies', COLORS['auth'], COLORS['auth_bg'])
    add_service_box(dwg, 230, 290, 150, 45, 'Account Lockout', 'Brute force', COLORS['auth'], COLORS['auth_bg'])

    # Authorization section
    dwg.add(dwg.rect((480, 200), (400, 180), rx=8, ry=8, fill='white', stroke=COLORS['authz'], stroke_width=2))
    dwg.add(dwg.rect((490, 188), (120, 20), rx=4, ry=4, fill=COLORS['authz']))
    dwg.add(dwg.text('AUTHORIZATION', insert=(500, 202), font_family='monospace', font_size='9px', font_weight='600', fill='white'))
    add_service_box(dwg, 500, 225, 160, 45, 'RBAC', 'Role-based access', COLORS['authz'], COLORS['authz_bg'])
    add_service_box(dwg, 680, 225, 160, 45, 'Org Scoping', 'Data isolation', COLORS['authz'], COLORS['authz_bg'])
    add_service_box(dwg, 500, 290, 160, 45, 'Feature Gates', 'Capabilities', COLORS['authz'], COLORS['authz_bg'])
    add_service_box(dwg, 680, 290, 160, 45, 'Field Perms', 'Masking', COLORS['authz'], COLORS['authz_bg'])

    # App
    add_service_box(dwg, 480, 100, 120, 50, 'App API', 'Lambda', COLORS['compute'], COLORS['compute_bg'])

    # Data Layer
    dwg.add(dwg.rect((40, 420), (400, 150), rx=8, ry=8, fill='white', stroke=COLORS['data'], stroke_width=2))
    dwg.add(dwg.rect((50, 408), (100, 20), rx=4, ry=4, fill=COLORS['data']))
    dwg.add(dwg.text('DATA LAYER', insert=(60, 422), font_family='monospace', font_size='9px', font_weight='600', fill='white'))
    add_service_box(dwg, 60, 445, 150, 45, 'Data Access', 'Query sanitize', COLORS['data'], COLORS['data_bg'])
    add_database_icon(dwg, 330, 490, 70, 80, COLORS['data'], COLORS['data_bg'], 'PostgreSQL')

    # Encryption
    dwg.add(dwg.rect((480, 420), (400, 150), rx=8, ry=8, fill='white', stroke=COLORS['compute'], stroke_width=2))
    dwg.add(dwg.rect((490, 408), (100, 20), rx=4, ry=4, fill=COLORS['compute']))
    dwg.add(dwg.text('ENCRYPTION', insert=(500, 422), font_family='monospace', font_size='9px', font_weight='600', fill='white'))
    add_service_box(dwg, 500, 445, 140, 45, 'AWS KMS', 'Key mgmt', COLORS['compute'], COLORS['compute_bg'])
    add_service_box(dwg, 660, 445, 140, 45, 'AES-256', 'At-rest', COLORS['compute'], COLORS['compute_bg'])
    add_service_box(dwg, 500, 505, 140, 45, 'TLS 1.2+', 'In-transit', COLORS['compute'], COLORS['compute_bg'])
    add_service_box(dwg, 660, 505, 140, 45, 'SSM', 'Secrets', COLORS['compute'], COLORS['compute_bg'])

    # Audit
    dwg.add(dwg.rect((40, 610), (400, 100), rx=8, ry=8, fill='white', stroke=COLORS['audit'], stroke_width=2))
    dwg.add(dwg.rect((50, 598), (100, 20), rx=4, ry=4, fill=COLORS['audit']))
    dwg.add(dwg.text('AUDIT TRAIL', insert=(60, 612), font_family='monospace', font_size='9px', font_weight='600', fill='white'))
    add_service_box(dwg, 60, 635, 160, 45, 'Audit Log', 'Hash chain', COLORS['audit'], COLORS['audit_bg'])
    add_service_box(dwg, 240, 635, 160, 45, 'Retention', 'Legal holds', COLORS['audit'], COLORS['audit_bg'])

    # Monitoring
    dwg.add(dwg.rect((480, 610), (400, 100), rx=8, ry=8, fill='white', stroke=COLORS['security'], stroke_width=2))
    dwg.add(dwg.rect((490, 598), (100, 20), rx=4, ry=4, fill=COLORS['security']))
    dwg.add(dwg.text('MONITORING', insert=(500, 612), font_family='monospace', font_size='9px', font_weight='600', fill='white'))
    add_service_box(dwg, 500, 635, 110, 45, 'CloudWatch', 'Logs', COLORS['security'], COLORS['security_bg'])
    add_service_box(dwg, 625, 635, 110, 45, 'CloudTrail', 'API', COLORS['security'], COLORS['security_bg'])
    add_service_box(dwg, 750, 635, 110, 45, 'GuardDuty', 'Threats', COLORS['security'], COLORS['security_bg'])

    # Arrows
    add_arrow(dwg, (160, 125), (200, 125), COLORS['line'])
    add_arrow(dwg, (450, 125), (480, 125), COLORS['line'])
    add_arrow(dwg, (540, 150), (240, 200), COLORS['line'])
    add_arrow(dwg, (600, 150), (680, 200), COLORS['line'])
    add_arrow(dwg, (440, 290), (480, 290), COLORS['line'])

    # Footer
    dwg.add(dwg.text('PIPEDA Aligned · SOC2 Controls', insert=(40, 780),
                     font_family='monospace', font_size='10px', fill=COLORS['text_muted']))

    dwg.save()
    print(f"Saved: {OUTPUT_DIR}/security-architecture-v2.svg")

def create_multitenant_architecture_svg():
    """Create multi-tenant architecture SVG"""
    dwg = svgwrite.Drawing(f"{OUTPUT_DIR}/multi-tenant-architecture-v2.svg",
                           size=('1200px', '700px'), profile='full')

    dwg.add(dwg.rect((0, 0), ('100%', '100%'), fill=COLORS['background']))

    # Title
    dwg.add(dwg.text('Multi-Tenant Architecture', insert=(40, 35),
                     font_family='system-ui, sans-serif', font_size='24px', font_weight='700', fill=COLORS['text_primary']))
    dwg.add(dwg.text('Tenant Isolation · Organization Hierarchy · Data Segregation', insert=(40, 55),
                     font_family='system-ui, sans-serif', font_size='14px', fill=COLORS['text_secondary']))

    # Platform
    dwg.add(dwg.rect((40, 80), (200, 120), rx=10, ry=10, fill=COLORS['user_bg'], stroke=COLORS['user'], stroke_width=2))
    dwg.add(dwg.text('Solstice Platform', insert=(55, 105), font_family='system-ui, sans-serif',
                     font_size='14px', font_weight='600', fill=COLORS['text_primary']))
    dwg.add(dwg.text('Single codebase', insert=(55, 125), font_family='system-ui, sans-serif',
                     font_size='11px', fill=COLORS['text_secondary']))
    add_service_box(dwg, 55, 140, 170, 45, 'Tenant Router', 'TENANT_KEY', COLORS['security'], COLORS['security_bg'])

    # viaSport Tenant
    dwg.add(dwg.rect((280, 80), (450, 520), rx=12, ry=12, fill=COLORS['viasport_bg'],
                     stroke=COLORS['viasport'], stroke_width=2, stroke_dasharray='8,4'))
    dwg.add(dwg.rect((290, 68), (100, 22), rx=4, ry=4, fill=COLORS['viasport']))
    dwg.add(dwg.text('viaSport', insert=(305, 84), font_family='monospace', font_size='11px', font_weight='600', fill='white'))
    dwg.add(dwg.text('viaSport BC', insert=(300, 120), font_family='system-ui, sans-serif',
                     font_size='16px', font_weight='700', fill=COLORS['viasport']))

    # RBAC section
    dwg.add(dwg.rect((300, 145), (200, 150), rx=6, ry=6, fill='white', stroke=COLORS['viasport'], stroke_width=1))
    dwg.add(dwg.text('RBAC Roles', insert=(315, 168), font_family='system-ui, sans-serif',
                     font_size='12px', font_weight='600', fill=COLORS['text_primary']))
    roles = [('Owner', '#1E40AF'), ('Admin', '#3B82F6'), ('Reporter', '#60A5FA'), ('Viewer', '#93C5FD')]
    for i, (role, color) in enumerate(roles):
        ry = 180 + i * 26
        dwg.add(dwg.rect((315, ry), (60, 20), rx=3, ry=3, fill=color))
        dwg.add(dwg.text(role, insert=(325, ry+14), font_family='monospace', font_size='10px', fill='white'))

    # Org hierarchy
    dwg.add(dwg.text('Organization Hierarchy', insert=(520, 165), font_family='system-ui, sans-serif',
                     font_size='12px', font_weight='600', fill=COLORS['text_primary']))
    add_service_box(dwg, 520, 180, 120, 40, 'Gov Body', 'Top-level', COLORS['viasport'], COLORS['viasport_bg'])
    add_service_box(dwg, 540, 240, 120, 40, 'PSO', 'Provincial', COLORS['auth'], COLORS['auth_bg'])
    add_service_box(dwg, 560, 300, 120, 40, 'Club', 'Local', COLORS['data'], COLORS['data_bg'])
    dwg.add(dwg.line((580, 220), (600, 240), stroke=COLORS['line'], stroke_width=2))
    dwg.add(dwg.line((600, 280), (620, 300), stroke=COLORS['line'], stroke_width=2))

    # viaSport data stores
    add_database_icon(dwg, 380, 440, 60, 70, COLORS['viasport'], COLORS['viasport_bg'], 'RDS-viaSport')
    add_service_box(dwg, 480, 400, 120, 40, 'S3-viaSport', 'Files', COLORS['viasport'], COLORS['viasport_bg'])

    # QC Tenant
    dwg.add(dwg.rect((760, 80), (250, 300), rx=12, ry=12, fill=COLORS['qc_bg'],
                     stroke=COLORS['qc'], stroke_width=2, stroke_dasharray='8,4'))
    dwg.add(dwg.rect((770, 68), (100, 22), rx=4, ry=4, fill=COLORS['qc']))
    dwg.add(dwg.text('Quadball CA', insert=(780, 84), font_family='monospace', font_size='11px', font_weight='600', fill='white'))
    dwg.add(dwg.text('Quadball Canada', insert=(780, 120), font_family='system-ui, sans-serif',
                     font_size='16px', font_weight='700', fill=COLORS['qc']))
    dwg.add(dwg.text('Separate AWS account', insert=(780, 140), font_family='system-ui, sans-serif',
                     font_size='11px', fill=COLORS['text_secondary']))

    add_service_box(dwg, 780, 160, 120, 40, 'QC Hierarchy', 'Full tree', COLORS['qc'], COLORS['qc_bg'])
    add_database_icon(dwg, 840, 280, 50, 60, COLORS['qc'], COLORS['qc_bg'], 'RDS-QC')
    add_service_box(dwg, 900, 240, 90, 35, 'S3-QC', 'Files', COLORS['qc'], COLORS['qc_bg'])

    # Isolation callout
    dwg.add(dwg.rect((760, 420), (250, 150), rx=8, ry=8, fill='#FEF2F2', stroke='#EF4444', stroke_width=2))
    dwg.add(dwg.text('Isolation Guarantees', insert=(780, 445), font_family='system-ui, sans-serif',
                     font_size='12px', font_weight='600', fill='#B91C1C'))
    guarantees = ['• Data segregation', '• Separate KMS keys', '• Independent backup', '• No cross-tenant access']
    for i, g in enumerate(guarantees):
        dwg.add(dwg.text(g, insert=(780, 470+i*22), font_family='system-ui, sans-serif',
                         font_size='11px', fill=COLORS['text_primary']))

    # Arrows
    add_arrow(dwg, (240, 140), (280, 140), COLORS['line'])
    add_arrow(dwg, (240, 170), (760, 170), COLORS['line'])

    # Footer
    dwg.add(dwg.text('Single codebase · Complete tenant isolation', insert=(40, 680),
                     font_family='monospace', font_size='10px', fill=COLORS['text_muted']))

    dwg.save()
    print(f"Saved: {OUTPUT_DIR}/multi-tenant-architecture-v2.svg")

def create_dataflow_svg():
    """Create data flow diagram SVG"""
    dwg = svgwrite.Drawing(f"{OUTPUT_DIR}/data-flow-diagram-v2.svg",
                           size=('1200px', '800px'), profile='full')

    dwg.add(dwg.rect((0, 0), ('100%', '100%'), fill=COLORS['background']))

    # Title
    dwg.add(dwg.text('Data Flow Diagrams', insert=(40, 35),
                     font_family='system-ui, sans-serif', font_size='24px', font_weight='700', fill=COLORS['text_primary']))
    dwg.add(dwg.text('User Submission · Reporting · Notifications', insert=(40, 55),
                     font_family='system-ui, sans-serif', font_size='14px', fill=COLORS['text_secondary']))

    def add_step_number(x, y, num, color):
        dwg.add(dwg.circle((x, y), 12, fill=color))
        dwg.add(dwg.text(str(num), insert=(x-4, y+5), font_family='monospace', font_size='12px', font_weight='700', fill='white'))

    # Flow 1: Submission
    dwg.add(dwg.rect((40, 80), (1100, 180), rx=10, ry=10, fill=COLORS['edge_bg'], stroke=COLORS['edge'], stroke_width=2))
    dwg.add(dwg.rect((50, 68), (130, 22), rx=4, ry=4, fill=COLORS['edge']))
    dwg.add(dwg.text('USER SUBMISSION', insert=(60, 84), font_family='monospace', font_size='10px', font_weight='600', fill='white'))

    add_step_number(70, 130, 1, COLORS['edge'])
    add_service_box(dwg, 90, 110, 100, 45, 'Browser', 'Form entry', COLORS['user'], COLORS['user_bg'])
    add_step_number(220, 130, 2, COLORS['edge'])
    add_service_box(dwg, 240, 110, 100, 45, 'API', 'Lambda', COLORS['compute'], COLORS['compute_bg'])
    add_step_number(370, 130, 3, COLORS['edge'])
    add_service_box(dwg, 390, 110, 120, 45, 'Validation', 'Schema rules', COLORS['compute'], COLORS['compute_bg'])
    add_step_number(540, 130, 4, COLORS['edge'])
    add_database_icon(dwg, 590, 135, 50, 60, COLORS['data'], COLORS['data_bg'], 'PostgreSQL')
    add_step_number(680, 130, 5, COLORS['edge'])
    add_service_box(dwg, 700, 110, 120, 45, 'Audit Log', 'Hash chain', COLORS['audit'], COLORS['audit_bg'])

    add_arrow(dwg, (190, 132), (220, 132), COLORS['edge'])
    add_arrow(dwg, (340, 132), (370, 132), COLORS['edge'])
    add_arrow(dwg, (510, 132), (540, 132), COLORS['edge'])
    add_arrow(dwg, (620, 132), (680, 132), COLORS['edge'])

    dwg.add(dwg.text('Form data → Validated → Stored with version history → Audit record created', insert=(60, 200),
                     font_family='system-ui, sans-serif', font_size='11px', fill=COLORS['text_secondary']))

    # Flow 2: Reporting
    dwg.add(dwg.rect((40, 280), (1100, 180), rx=10, ry=10, fill=COLORS['compute_bg'], stroke=COLORS['compute'], stroke_width=2))
    dwg.add(dwg.rect((50, 268), (120, 22), rx=4, ry=4, fill=COLORS['compute']))
    dwg.add(dwg.text('REPORTING FLOW', insert=(60, 284), font_family='monospace', font_size='10px', font_weight='600', fill='white'))

    add_step_number(70, 330, 1, COLORS['compute'])
    add_service_box(dwg, 90, 310, 110, 45, 'Report Builder', 'UI', COLORS['user'], COLORS['user_bg'])
    add_step_number(230, 330, 2, COLORS['compute'])
    add_service_box(dwg, 250, 310, 100, 45, 'Query API', 'Handler', COLORS['compute'], COLORS['compute_bg'])
    add_step_number(380, 330, 3, COLORS['compute'])
    add_service_box(dwg, 400, 310, 120, 45, 'Access Control', 'RBAC+scope', COLORS['authz'], COLORS['authz_bg'])
    add_step_number(550, 330, 4, COLORS['compute'])
    add_service_box(dwg, 570, 310, 110, 45, 'Aggregation', 'Compute', COLORS['compute'], COLORS['compute_bg'])
    add_step_number(710, 330, 5, COLORS['compute'])
    add_service_box(dwg, 730, 310, 100, 45, 'Export', 'CSV/PDF', COLORS['data'], COLORS['data_bg'])

    add_arrow(dwg, (200, 332), (230, 332), COLORS['compute'])
    add_arrow(dwg, (350, 332), (380, 332), COLORS['compute'])
    add_arrow(dwg, (520, 332), (550, 332), COLORS['compute'])
    add_arrow(dwg, (680, 332), (710, 332), COLORS['compute'])

    dwg.add(dwg.text('Filtered by org scope → Data aggregated server-side → Exported in requested format', insert=(60, 400),
                     font_family='system-ui, sans-serif', font_size='11px', fill=COLORS['text_secondary']))

    # Flow 3: Notifications
    dwg.add(dwg.rect((40, 480), (1100, 180), rx=10, ry=10, fill=COLORS['async_bg'], stroke=COLORS['async'], stroke_width=2))
    dwg.add(dwg.rect((50, 468), (140, 22), rx=4, ry=4, fill=COLORS['async']))
    dwg.add(dwg.text('NOTIFICATION FLOW', insert=(60, 484), font_family='monospace', font_size='10px', font_weight='600', fill='white'))

    add_step_number(70, 530, 1, COLORS['async'])
    add_service_box(dwg, 90, 510, 110, 45, 'Domain Event', 'Trigger', COLORS['compute'], COLORS['compute_bg'])
    add_step_number(230, 530, 2, COLORS['async'])
    add_service_box(dwg, 250, 510, 100, 45, 'SQS Queue', 'Buffer', COLORS['async'], COLORS['async_bg'])
    add_step_number(380, 530, 3, COLORS['async'])
    add_service_box(dwg, 400, 510, 120, 45, 'Worker Lambda', 'Process', COLORS['compute'], COLORS['compute_bg'])
    add_step_number(550, 510, 4, COLORS['async'])
    add_service_box(dwg, 570, 495, 100, 40, 'SES Email', 'External', COLORS['async'], COLORS['async_bg'])
    add_service_box(dwg, 570, 545, 100, 40, 'In-App', 'Alerts', COLORS['async'], COLORS['async_bg'])

    add_arrow(dwg, (200, 532), (230, 532), COLORS['async'])
    add_arrow(dwg, (350, 532), (380, 532), COLORS['async'])
    add_arrow(dwg, (520, 520), (550, 515), COLORS['async'])
    add_arrow(dwg, (520, 545), (550, 565), COLORS['async'])

    dwg.add(dwg.text('Events queued async → Workers process with retry → Email and/or in-app delivery', insert=(60, 610),
                     font_family='system-ui, sans-serif', font_size='11px', fill=COLORS['text_secondary']))

    # Legend
    dwg.add(dwg.rect((900, 80), (230, 160), rx=8, ry=8, fill='white', stroke='#CBD5E1', stroke_width=1))
    dwg.add(dwg.text('Component Types', insert=(920, 105), font_family='system-ui, sans-serif',
                     font_size='12px', font_weight='600', fill=COLORS['text_primary']))
    legend_items = [
        ('User Interface', COLORS['user'], COLORS['user_bg']),
        ('App Logic', COLORS['compute'], COLORS['compute_bg']),
        ('Async', COLORS['async'], COLORS['async_bg']),
        ('Audit', COLORS['audit'], COLORS['audit_bg']),
    ]
    for i, (label, color, bg) in enumerate(legend_items):
        ly = 120 + i * 28
        dwg.add(dwg.rect((920, ly), (25, 18), rx=3, ry=3, fill=bg, stroke=color, stroke_width=2))
        dwg.add(dwg.text(label, insert=(955, ly+13), font_family='system-ui, sans-serif',
                         font_size='11px', fill=COLORS['text_primary']))

    # Footer
    dwg.add(dwg.text('Async processing · Audit trail · Access control', insert=(40, 780),
                     font_family='monospace', font_size='10px', fill=COLORS['text_muted']))

    dwg.save()
    print(f"Saved: {OUTPUT_DIR}/data-flow-diagram-v2.svg")

if __name__ == "__main__":
    create_system_architecture_svg()
    create_security_architecture_svg()
    create_multitenant_architecture_svg()
    create_dataflow_svg()
    print("\nAll SVG diagrams created!")
