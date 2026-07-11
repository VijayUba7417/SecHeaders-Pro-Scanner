import os
import zlib
import struct
import math

def create_hacker_scanner_png(size, filepath):
    # 32-bit RGBA PNG generator for "Offensive Hacker Scanner" icon
    width = size
    height = size
    signature = b'\x89PNG\r\n\x1a\n'
    
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
    ihdr = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    raw_rows = []
    center = size / 2.0
    radius = size * 0.46
    
    for y in range(height):
        row = bytearray([0]) # Filter: None
        for x in range(width):
            dx = x - center
            dy = y - center
            dist = math.sqrt(dx*dx + dy*dy)
            
            # Angle in radians (-pi to pi)
            angle = math.atan2(dy, dx)
            
            # Check if point is inside the icon badge (rounded corner box or circle)
            # Let's draw a cyber rounded square shield background with radar target & crosshairs inside
            abs_x = abs(dx)
            abs_y = abs(dy)
            max_coord = max(abs_x, abs_y)
            corner_dist = math.sqrt(max(0, abs_x - size*0.35)**2 + max(0, abs_y - size*0.35)**2)
            
            if corner_dist > size * 0.12 and max_coord > size * 0.46:
                # Transparent outside rounded corners
                row.extend([0, 0, 0, 0])
                continue
                
            # Inside the background: dark cyber slate (#0b1120 / #0f172a)
            r, g, b, a = 15, 23, 42, 255
            
            # 1. Outer Hacker Radar Ring (Neon Crimson Red #ef4444 & Neon Emerald #10b981)
            if size * 0.38 < dist <= size * 0.44:
                # Pulsing sector ring
                if math.sin(angle * 4) > 0:
                    r, g, b = 239, 68, 68   # Crimson Red (#ef4444)
                else:
                    r, g, b = 16, 185, 129  # Emerald Green (#10b981)
            
            # 2. Inner Scanner Target Circle (#06b6d4 / Cyan)
            elif size * 0.22 < dist <= size * 0.26:
                r, g, b = 6, 182, 212       # Neon Cyan
                
            # 3. Target Crosshairs / Radar Sweep (Horizontal and Vertical Crosshairs)
            elif (abs(dx) <= max(1, size * 0.03) and dist < size * 0.36) or (abs(dy) <= max(1, size * 0.03) and dist < size * 0.36):
                r, g, b = 16, 185, 129      # Emerald Green Crosshairs
                
            # 4. Central Core Hacker Matrix Dot
            elif dist <= size * 0.10:
                r, g, b = 239, 68, 68       # Crimson Red Core
                
            # 5. Radar Sweep Glow Effect in one quadrant
            elif 0 <= angle <= math.pi / 2 and dist <= size * 0.38:
                glow = int((1.0 - (dist / (size * 0.38))) * 120)
                g = min(255, g + glow)
                r = min(255, r + int(glow * 0.3))
                
            row.extend([r, g, b, a])
        raw_rows.append(bytes(row))
        
    idat_data = zlib.compress(b''.join(raw_rows), 9)
    idat_crc = zlib.crc32(b'IDAT' + idat_data) & 0xffffffff
    idat = struct.pack('>I', len(idat_data)) + b'IDAT' + idat_data + struct.pack('>I', idat_crc)
    
    iend_crc = zlib.crc32(b'IEND') & 0xffffffff
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    with open(filepath, 'wb') as f:
        f.write(signature + ihdr + idat + iend)

icons_dir = os.path.join('chrome-extension', 'icons')
os.makedirs(icons_dir, exist_ok=True)

create_hacker_scanner_png(16, os.path.join(icons_dir, 'icon16.png'))
create_hacker_scanner_png(48, os.path.join(icons_dir, 'icon48.png'))
create_hacker_scanner_png(128, os.path.join(icons_dir, 'icon128.png'))
print('Offensive Hacker Scanner PNG icons (16x16, 48x48, 128x128) created successfully!')
