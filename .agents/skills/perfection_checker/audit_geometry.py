# ANTIGRAVITY GEOMETRIC AUDITOR
import re

FILE_PATH = "artifacts/dayz-builder/src/lib/shapeMasterpieces.ts"

def audit_density():
    try:
        with open(FILE_PATH, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"ERR: Failed to read file: {e}")
        return
    
    # Split content by function to handle massive bodies
    functions = re.split(r'export function ', content)
    print(f"Auditing {len(functions)-1} Mastery Generators...")

    for body in functions[1:]:
        header_match = re.match(r'(gen_\w+)', body)
        if not header_match: continue
        gen = header_match.group(1)
        
        fixed_steps = re.findall(r'steps\s*=\s*(\d+)', body)
        if fixed_steps:
             rad_match = re.search(r'R\s*=\s*(\d+)', body)
             if rad_match:
                 rad = int(rad_match.group(1))
                 for val_str in fixed_steps:
                     val = int(val_str)
                     if rad > 10 and val < 16:
                         print(f"FAILURE: '{gen}' flagged for LOW RESOLUTION BLOB RISK (Radius {rad}, Steps {val})")

        if "applyGovernor" not in body and "gen_" in gen:
             print(f"WARNING: '{gen}' missing Healthy Scale Governor.")

if __name__ == "__main__":
    audit_density()
