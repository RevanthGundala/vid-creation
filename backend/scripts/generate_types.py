#!/usr/bin/env python3
"""
Script to generate OpenAPI YAML schema and TypeScript types using openapi-typescript.
This script fetches the OpenAPI JSON from FastAPI server, converts it to YAML,
and then uses npx openapi-typescript to generate TypeScript types.
"""

import json
import yaml
import requests
import subprocess
import sys
from pathlib import Path

def fetch_openapi_schema(base_url: str = "http://localhost:8000") -> dict:
    """Fetch OpenAPI schema from FastAPI server."""
    try:
        response = requests.get(f"{base_url}/openapi.json")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching OpenAPI schema: {e}")
        print("Make sure your FastAPI server is running on http://localhost:8000")
        sys.exit(1)

def save_openapi_schema(schema: dict, output_path: str = "openapi.yaml"):
    """Save OpenAPI schema to YAML file."""
    with open(output_path, "w") as f:
        yaml.dump(schema, f, default_flow_style=False, sort_keys=False, indent=2)
    print(f"OpenAPI schema saved to {output_path}")

def generate_typescript_types(openapi_file: str = "openapi.yaml"):
    """Generate TypeScript types using openapi-typescript npm package."""
    output_file = Path("../frontend/src/types/api.d.ts")
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        subprocess.run([
            "bunx", "openapi-typescript", 
            openapi_file, 
            "-o", str(output_file)
        ], check=True)
        print(f"TypeScript types generated successfully: {output_file}")
    except subprocess.CalledProcessError as e:
        print(f"Error generating TypeScript types: {e}")
        print("Make sure you have Node.js and npm installed")
        sys.exit(1)

def main():
    """Main function to generate OpenAPI YAML and TypeScript types."""
    print("Fetching OpenAPI schema from FastAPI server...")
    schema = fetch_openapi_schema()
    
    print("Saving OpenAPI schema as YAML...")
    save_openapi_schema(schema)
    
    print("Generating TypeScript types using openapi-typescript...")
    generate_typescript_types()
    
    print("Type generation completed successfully!")
    print("\nGenerated files:")
    print("- openapi.yaml - OpenAPI schema file")
    print("- ../frontend/src/types/api.d.ts - TypeScript type definitions")

if __name__ == "__main__":
    main() 