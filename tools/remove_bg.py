#!/usr/bin/env python3
"""
Script mínimo para eliminar fondo usando rembg.
Uso:
    python tools/remove_bg.py input.jpg output.png

Devuelve código 0 en éxito. Requiere `rembg` y `pillow` instalados en el entorno.
"""
import sys
import os

try:
    from rembg import remove
except Exception:
    remove = None

import subprocess



def usage():
    print("Usage: python remove_bg.py <input_path> <output_path>")


def main():
    if len(sys.argv) < 3:
        usage()
        sys.exit(1)

    # Soporta: python remove_bg.py [--cli] input_path output_path
    use_cli = False
    args = sys.argv[1:]
    if args[0] == '--cli':
        use_cli = True
        args = args[1:]

    if len(args) < 2:
        usage()
        sys.exit(1)

    input_path = args[0]
    output_path = args[1]

    if not os.path.isfile(input_path):
        print(f"Input file not found: {input_path}", file=sys.stderr)
        sys.exit(3)

    try:
        # Si se forzó uso de CLI o la importación falló, usar subprocess para llamar al CLI de rembg
        if use_cli or remove is None:
            # Construir comando: preferir el lanzador py -3.10 si está disponible en el PATH
            # Usar "py -3.10 -m rembg.cli i input output" como fallback portable en Windows
            cmd = ['py', '-3.10', '-m', 'rembg.cli', 'i', input_path, output_path]
            # Intentar ejecutar
            proc = subprocess.run(cmd, capture_output=True, text=True)
            if proc.returncode != 0:
                # Intentar con rembg.exe si existe en Scripts
                # No asumimos ruta fija; el usuario puede pasar ruta absoluta en env REMBG_EXE
                rembg_exe = os.environ.get('REMBG_EXE')
                if rembg_exe:
                    cmd2 = [rembg_exe, 'i', input_path, output_path]
                    proc2 = subprocess.run(cmd2, capture_output=True, text=True)
                    if proc2.returncode != 0:
                        print('rembg CLI failed:', proc2.stderr or proc2.stdout, file=sys.stderr)
                        sys.exit(4)
                else:
                    print('rembg CLI failed:', proc.stderr or proc.stdout, file=sys.stderr)
                    sys.exit(4)
        else:
            with open(input_path, 'rb') as f:
                input_bytes = f.read()

            result_bytes = remove(input_bytes)

            # Asegurarse de que la carpeta de salida exista
            out_dir = os.path.dirname(output_path)
            if out_dir and not os.path.exists(out_dir):
                os.makedirs(out_dir, exist_ok=True)

            with open(output_path, 'wb') as out_f:
                out_f.write(result_bytes)

    except Exception as e:
        print("Processing error:", e, file=sys.stderr)
        sys.exit(4)

    print("OK")


if __name__ == '__main__':
    main()
