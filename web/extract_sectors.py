#!/usr/bin/env python3
import re
import json

# Read the locations.ts file
with open('src/hooks/locations.ts', 'r') as file:
    content = file.read()

# Extract the locations object using regex
# Find the part between 'export const locations: Locations = ' and the closing brace
locations_match = re.search(r'export const locations: Locations = ({.*});', content, re.DOTALL)

if locations_match:
    locations_str = locations_match.group(1)
    
    # Find all sectors in the structure
    sector_pattern = r'"id":\s*"(\d{5})",\s*"name":\s*"([^"]+)",\s*"district_id":'
    sectors = re.findall(sector_pattern, locations_str)
    
    # Extract just the sector names
    sector_names = [sector[1] for sector in sectors]
    
    # Sort alphabetically and remove duplicates
    unique_sectors = sorted(list(set(sector_names)))
    
    print(f"Found {len(unique_sectors)} unique sectors:")
    for sector in unique_sectors:
        print(f'"{sector}"')
    
    # Also save as a JavaScript array
    js_array = '[\n  ' + ',\n  '.join([f'"{sector}"' for sector in unique_sectors]) + '\n]'
    with open('sectors_list.js', 'w') as output_file:
        output_file.write(f'export const sectors = {js_array};\n')
    
    print(f"\nSector names saved to sectors_list.js")
else:
    print("Could not find locations object in the file")