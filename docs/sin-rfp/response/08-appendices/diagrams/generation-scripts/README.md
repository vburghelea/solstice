# Diagram Generation Scripts

These Python scripts generate the high-fidelity architecture diagrams for the SIN RFP proposal.

## Requirements

```bash
pip install pillow svgwrite
```

## Scripts

| Script                           | Output | Description                              |
| -------------------------------- | ------ | ---------------------------------------- |
| `create_architecture_diagram.py` | PNG    | High-level system architecture           |
| `create_security_diagram.py`     | PNG    | Security architecture (defense in depth) |
| `create_multitenant_diagram.py`  | PNG    | Multi-tenant architecture                |
| `create_dataflow_diagram.py`     | PNG    | Data flow diagrams (3 flows)             |
| `create_svg_diagrams.py`         | SVG    | All 4 diagrams in vector format          |

## Usage

```bash
# Create virtual environment (one-time)
python3 -m venv venv
source venv/bin/activate
pip install pillow svgwrite

# Generate PNG diagrams
python create_architecture_diagram.py
python create_security_diagram.py
python create_multitenant_diagram.py
python create_dataflow_diagram.py

# Generate SVG diagrams
python create_svg_diagrams.py
```

## Output

All diagrams are saved to the parent `diagrams/` directory as `*-v2.png` and `*-v2.svg`.

## Fonts

The scripts use fonts from the canvas-design skill plugin. If fonts are unavailable, system defaults are used.
