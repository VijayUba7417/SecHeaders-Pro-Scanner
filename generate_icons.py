import os
import zlib
import struct

def create_png(width, height, filepath):
    # 32-bit RGBA PNG
    signature = b'\x89PNG\r\n\x1a\n'
    
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
    ihdr = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    raw_rows = []
    for y in range(height):
        row = bytearray([0]) # Filter: None
        for x in range(width):
            dx = x - width / 2
            dy = y - height / 2
            dist = (dx**2 + dy**2) ** 0.5
            if dist < width * 0.42:
                # Emerald green shield/cyber center (#10b981)
                row.extend([16, 185, 129, 255])
            elif dist < width * 0.48:
                # Cyan neon ring (#06b6d4)
                row.extend([6, 182, 212, 255])
            else:
                # Dark slate cyber bg (#0f172a)
                row.extend([15, 23, 42, 255])
        raw_rows.append(bytes(row))
        
    idat_data = zlib.compress(b''.join(raw_rows))
    idat_crc = zlib.crc32(b'IDAT' + idat_data) & 0xffffffff
    idat = struct.pack('>I', len(idat_data)) + b'IDAT' + idat_data + struct.pack('>I', idat_crc)
    
    iend_crc = zlib.crc32(b'IEND') & 0xffffffff
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    with open(filepath, 'wb') as f:
        f.write(signature + ihdr + idat + iend)

os.makedirs(os.path.join('chrome-extension', 'icons'), exist_ok=True)
create_png(16, 16, os.path.join('chrome-extension', 'icons', 'icon16.png'))
create_png(48, 48, os.path.join('chrome-extension', 'icons', 'icon48.png'))
create_png(128, 128, os.path.join('chrome-extension', 'icons', 'icon128.png'))
print('PNG icons generated successfully via Python!')
