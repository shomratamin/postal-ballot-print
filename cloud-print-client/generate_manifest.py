#!/usr/bin/env python3
"""
Auto Update Manifest Generator for Cloud Print Client

This script automatically generates an update manifest JSON file after compilation.
It reads the version from version.go, calculates the SHA256 checksum of main.exe,
and creates a properly formatted update-manifest.json file.

Usage:
    python generate_manifest.py

Requirements:
    - main.exe must exist in the current directory
    - version.go must exist and contain getVersion() function
"""

import os
import json
import hashlib
import re
from datetime import datetime
import sys


class ManifestGenerator:
    def __init__(self):
        self.current_dir = os.path.dirname(os.path.abspath(__file__))
        self.config_file = os.path.join(self.current_dir, "manifest_config.json")
        
        # Load configuration
        self.config = self.load_config()
        
        # Set file paths based on config
        self.exe_path = os.path.join(self.current_dir, self.config["file_settings"]["executable_name"])
        self.version_file = os.path.join(self.current_dir, self.config["file_settings"]["version_file"])
        self.manifest_file = os.path.join(self.current_dir, self.config["file_settings"]["manifest_name"])
        
        # Configuration from config file
        self.base_download_url = self.config["download_settings"]["base_download_url"]
        self.release_repo = self.config["download_settings"]["github_repo"]
        self.use_github_releases = self.config["download_settings"]["use_github_releases"]
        
    def load_config(self):
        """Load configuration from JSON file."""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                print("✓ Configuration loaded from manifest_config.json")
                return config
            else:
                # Default configuration if file doesn't exist
                default_config = {
                    "download_settings": {
                        "use_github_releases": True,
                        "github_repo": "shomratamin/cloud-print-client",
                        "base_download_url": "https://mdm.smartpostbd.com/files"
                    },
                    "file_settings": {
                        "executable_name": "main.exe",
                        "manifest_name": "update-manifest.json",
                        "version_file": "version.go"
                    },
                    "critical_update_rules": {
                        "patch_versions_critical": False
                    }
                }
                print("⚠️  Using default configuration (manifest_config.json not found)")
                return default_config
        except Exception as e:
            print(f"⚠️  Error loading config, using defaults: {e}")
            return self.load_config()  # This will use the default config
        
    def read_version_from_go(self):
        """Read version from version.go file."""
        try:
            with open(self.version_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Look for version string in getVersion() function
            # Pattern matches: return "x.x.x.x"
            pattern = r'return\s*"([^"]+)"'
            match = re.search(pattern, content)
            
            if match:
                version = match.group(1)
                print(f"✓ Found version: {version}")
                return version
            else:
                raise ValueError("Could not find version string in getVersion() function")
                
        except FileNotFoundError:
            raise FileNotFoundError(f"version.go not found at {self.version_file}")
        except Exception as e:
            raise Exception(f"Error reading version from version.go: {e}")
    
    def calculate_sha256(self, file_path):
        """Calculate SHA256 checksum of a file."""
        try:
            hash_sha256 = hashlib.sha256()
            with open(file_path, 'rb') as f:
                # Read file in chunks to handle large files efficiently
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_sha256.update(chunk)
            
            checksum = hash_sha256.hexdigest()
            print(f"✓ Calculated SHA256: {checksum}")
            return checksum
            
        except FileNotFoundError:
            raise FileNotFoundError(f"main.exe not found at {file_path}")
        except Exception as e:
            raise Exception(f"Error calculating checksum: {e}")
    
    def get_file_size(self, file_path):
        """Get file size in bytes."""
        try:
            size = os.path.getsize(file_path)
            size_mb = size / (1024 * 1024)
            print(f"✓ File size: {size:,} bytes ({size_mb:.2f} MB)")
            return size
        except Exception as e:
            print(f"Warning: Could not get file size: {e}")
            return 0
    
    def generate_download_url(self, version):
        """Generate download URL based on configuration."""
        if self.use_github_releases:
            # GitHub releases format
            url = f"https://github.com/{self.release_repo}/releases/download/v{version}/main.exe"
        else:
            # Direct URL format
            url = f"{self.base_download_url}/main.exe"
        
        print(f"✓ Generated download URL: {url}")
        return url
    
    def is_critical_update(self, version):
        """Determine if this is a critical update based on version."""
        try:
            rules = self.config["critical_update_rules"]
            
            # Check if patch versions should be critical
            if rules.get("patch_versions_critical", False):
                version_parts = version.split('.')
                if len(version_parts) >= 4 and version_parts[3] == '0':
                    return True
            
            # Add more rules as needed based on configuration
            # For now, default to non-critical
            return False
            
        except Exception:
            # Default to non-critical if there's any error
            return False
    
    def create_manifest(self):
        """Create the update manifest JSON."""
        print("🚀 Generating update manifest...")
        print("-" * 50)
        
        # Step 1: Check if main.exe exists
        if not os.path.exists(self.exe_path):
            raise FileNotFoundError(f"main.exe not found. Please compile the application first.\nExpected location: {self.exe_path}")
        
        # Step 2: Read version from version.go
        version = self.read_version_from_go()
        
        # Step 3: Calculate checksum
        checksum = self.calculate_sha256(self.exe_path)
        
        # Step 4: Get file size (optional, for logging)
        file_size = self.get_file_size(self.exe_path)
        
        # Step 5: Generate download URL
        download_url = self.generate_download_url(version)
        
        # Step 6: Determine if critical
        is_critical = self.is_critical_update(version)
        
        # Step 7: Create manifest structure
        manifest = {
            "version": version,
            "download_url": download_url,
            "checksum": f"{checksum}",
            "release_date": datetime.now().isoformat() + "Z",
            "critical": is_critical
        }
        
        # Step 8: Save manifest to file
        try:
            with open(self.manifest_file, 'w', encoding='utf-8') as f:
                json.dump(manifest, f, indent=2, ensure_ascii=False)
            
            print("-" * 50)
            print(f"✅ Update manifest generated successfully!")
            print(f"📄 File: {self.manifest_file}")
            print(f"🏷️  Version: {version}")
            print(f"🔗 Download URL: {download_url}")
            print(f"🔒 Checksum: {checksum}")
            print(f"📅 Release Date: {manifest['release_date']}")
            print(f"⚠️  Critical: {'Yes' if is_critical else 'No'}")
            
            return manifest
            
        except Exception as e:
            raise Exception(f"Error writing manifest file: {e}")
    
    def validate_manifest(self):
        """Validate the generated manifest."""
        try:
            with open(self.manifest_file, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
            
            required_fields = ['version', 'download_url', 'checksum', 'release_date', 'critical']
            
            for field in required_fields:
                if field not in manifest:
                    raise ValueError(f"Missing required field: {field}")
                if not manifest[field] and field != 'critical':  # critical can be False
                    raise ValueError(f"Empty value for field: {field}")
            
            print("✅ Manifest validation passed!")
            return True
            
        except Exception as e:
            raise Exception(f"Manifest validation failed: {e}")


def main():
    """Main function."""
    print("=" * 60)
    print("      Cloud Print Client - Update Manifest Generator")
    print("=" * 60)
    
    try:
        # Create generator instance
        generator = ManifestGenerator()
        
        # Generate manifest
        manifest = generator.create_manifest()
        
        # Validate manifest
        generator.validate_manifest()
        
        print("\n🎉 Manifest generation completed successfully!")
        print("\nNext steps:")
        print("1. Upload main.exe to your file server or GitHub releases")
        print("2. Upload update-manifest.json to your manifest URL location")
        print("3. Test the auto-update functionality")
        
    except KeyboardInterrupt:
        print("\n❌ Operation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()