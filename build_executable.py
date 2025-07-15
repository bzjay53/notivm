#!/usr/bin/env python3
"""
Oracle VM Hunter - Executable Builder
PyInstaller를 사용하여 실행 파일을 생성하는 스크립트
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

def build_executable():
    """Build executable using PyInstaller"""
    
    # 현재 디렉토리 확인
    project_root = Path(__file__).parent.absolute()
    src_dir = project_root / "src"
    dist_dir = project_root / "dist"
    build_dir = project_root / "build"
    
    print(f"🏗️  Building Oracle VM Hunter executable...")
    print(f"📁 Project root: {project_root}")
    
    # PyInstaller 명령어 구성
    pyinstaller_cmd = [
        "pyinstaller",
        "--onefile",                    # 단일 실행 파일
        "--windowed",                   # GUI 모드 (콘솔 창 숨김)
        "--name", "OracleVMHunter",     # 실행 파일 이름
        "--add-data", f"{project_root}/config;config",  # 설정 파일 포함
        "--hidden-import", "oci",       # OCI SDK
        "--hidden-import", "yaml",      # PyYAML
        "--hidden-import", "requests",  # Requests
        "--hidden-import", "dotenv",    # python-dotenv
        "--clean",                      # 이전 빌드 정리
        str(src_dir / "main.py")        # 메인 파일
    ]
    
    # Windows용 아이콘 추가 (있는 경우)
    icon_path = project_root / "icon.ico"
    if icon_path.exists():
        pyinstaller_cmd.extend(["--icon", str(icon_path)])
    
    # 빌드 실행
    try:
        print("🔨 Running PyInstaller...")
        result = subprocess.run(pyinstaller_cmd, cwd=project_root, check=True)
        print("✅ Build completed successfully!")
        
        # 실행 파일 위치 확인
        if sys.platform.startswith('win'):
            exe_name = "OracleVMHunter.exe"
        else:
            exe_name = "OracleVMHunter"
        
        exe_path = dist_dir / exe_name
        if exe_path.exists():
            print(f"📦 Executable created: {exe_path}")
            print(f"📏 File size: {exe_path.stat().st_size / 1024 / 1024:.1f} MB")
        
        # 설정 파일 복사
        config_dist = dist_dir / "config"
        if not config_dist.exists():
            shutil.copytree(project_root / "config", config_dist)
            print("📋 Configuration files copied to dist/config/")
        
        # README 파일 복사
        readme_src = project_root / "README.md"
        readme_dist = dist_dir / "README.md"
        if readme_src.exists():
            shutil.copy2(readme_src, readme_dist)
            print("📖 README.md copied to dist/")
        
        # 라이센스 파일 생성
        license_template = dist_dir / "license.key.template"
        with open(license_template, 'w') as f:
            f.write("# Oracle VM Hunter License Key\n")
            f.write("# Replace this text with your license key\n")
            f.write("# Format: ORACLEVM-XXXX-XXXX-XXXX\n")
            f.write("\n")
            f.write("YOUR-LICENSE-KEY-HERE")
        print("🔑 License template created")
        
        # 사용법 안내
        print("\n🎉 Build completed successfully!")
        print(f"📂 Distribution folder: {dist_dir}")
        print(f"🚀 Executable: {exe_path}")
        print("\n📋 Next steps:")
        print("1. Copy your Oracle Cloud API key (.pem file) to the same folder")
        print("2. Edit config/.env with your credentials")
        print("3. Replace license.key.template with your actual license")
        print("4. Run the executable!")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Build failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def install_dependencies():
    """Install required dependencies for building"""
    dependencies = [
        "pyinstaller",
        "oci",
        "requests",
        "PyYAML",
        "python-dotenv"
    ]
    
    print("📦 Installing build dependencies...")
    for dep in dependencies:
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", dep], check=True)
            print(f"✅ {dep} installed")
        except subprocess.CalledProcessError:
            print(f"❌ Failed to install {dep}")
            return False
    
    return True

def clean_build():
    """Clean build artifacts"""
    project_root = Path(__file__).parent.absolute()
    
    dirs_to_clean = [
        project_root / "build",
        project_root / "dist",
        project_root / "__pycache__"
    ]
    
    files_to_clean = [
        project_root / "OracleVMHunter.spec"
    ]
    
    print("🧹 Cleaning build artifacts...")
    
    for dir_path in dirs_to_clean:
        if dir_path.exists():
            shutil.rmtree(dir_path)
            print(f"🗑️  Removed {dir_path}")
    
    for file_path in files_to_clean:
        if file_path.exists():
            file_path.unlink()
            print(f"🗑️  Removed {file_path}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Build Oracle VM Hunter executable")
    parser.add_argument("--install-deps", action="store_true", help="Install build dependencies")
    parser.add_argument("--clean", action="store_true", help="Clean build artifacts")
    parser.add_argument("--build", action="store_true", help="Build executable")
    
    args = parser.parse_args()
    
    if args.clean:
        clean_build()
    
    if args.install_deps:
        if not install_dependencies():
            sys.exit(1)
    
    if args.build or (not args.clean and not args.install_deps):
        # 기본 동작은 빌드
        success = build_executable()
        sys.exit(0 if success else 1)