#!/bin/bash

# GCS 本地部署腳本 (Shell 版本)
# 
# 純本地部署工具，不依賴 GitHub Actions
# 
# 使用方式:
#   bash scripts/deploy-gcs.sh
#   或
#   chmod +x scripts/deploy-gcs.sh && ./scripts/deploy-gcs.sh
#
# 必要環境變數:
#   GCS_BUCKET - GCS bucket 名稱（必填）
#   GCS_SA_KEY - Service Account Key JSON 檔案路徑（必填）
#
# 可選環境變數:
#   GCS_PATH - GCS 路徑（預設: event/wordgym）
#   GCS_CACHE_HTML - HTML 檔案 Cache-Control（預設: no-cache, no-store, must-revalidate）
#   GCS_CACHE_ASSETS - Assets 檔案 Cache-Control（預設: public, max-age=86400）

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 輸出函數
log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_step() {
    echo -e "\n${BLUE}📤 $1${NC}"
}

# 檢查必要工具
check_requirements() {
    log_info "檢查必要工具..."
    
    if ! command -v gsutil &> /dev/null; then
        log_error "gsutil 未安裝。請先安裝 Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    fi
    
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud 未安裝。請先安裝 Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    fi
    
    log_success "必要工具檢查通過"
}

# 檢查環境變數
check_env() {
    if [ -z "$GCS_BUCKET" ]; then
        log_error "請設定 GCS_BUCKET 環境變數\n例如: export GCS_BUCKET=your-bucket-name"
    fi
    
    if [ -z "$GCS_SA_KEY" ]; then
        log_error "請設定 GCS_SA_KEY 環境變數指向 Service Account Key JSON 檔案\n例如: export GCS_SA_KEY=/path/to/key.json"
    fi
    
    if [ ! -f "$GCS_SA_KEY" ]; then
        log_error "Service Account Key 檔案不存在: $GCS_SA_KEY"
    fi
    
    log_success "環境變數檢查通過"
    log_info "Bucket: ${GCS_BUCKET}"
    log_info "路徑: ${GCS_PATH:-event/wordgym}"
    log_info "認證檔案: ${GCS_SA_KEY}"
}

# 設定認證
setup_auth() {
    log_info "設定 Google Cloud 認證..."
    gcloud auth activate-service-account --key-file="$GCS_SA_KEY" || log_error "認證失敗"
    log_success "認證成功"
}

# 建置專案
build_project() {
    log_info "開始建置專案..."
    npm run build || log_error "建置失敗"
    log_success "建置完成"
}

# 檢查 dist 目錄
check_dist() {
    if [ ! -d "dist" ]; then
        log_error "dist 目錄不存在，請先執行 npm run build"
    fi
    
    if [ ! -f "dist/index.html" ]; then
        log_error "dist/index.html 不存在"
    fi
    
    log_success "dist 目錄檢查通過"
}

# 為 CSS/JS 添加版本參數
add_asset_versions() {
    log_step "處理資源檔案版本控制..."
    
    # 使用 Node.js 腳本來處理版本添加
    if command -v node &> /dev/null; then
        node scripts/add-asset-versions.mjs dist || log_warn "版本添加失敗，繼續部署"
    else
        log_warn "Node.js 未安裝，跳過版本控制（建議安裝 Node.js 以啟用此功能）"
    fi
}

# 部署到 GCS
deploy_to_gcs() {
    local BUCKET="$GCS_BUCKET"
    local DEPLOY_PATH="${GCS_PATH:-event/wordgym}"
    local GS_PATH="gs://${BUCKET}/${DEPLOY_PATH}"
    local CACHE_HTML="${GCS_CACHE_HTML:-no-cache, no-store, must-revalidate}"
    local CACHE_ASSETS="${GCS_CACHE_ASSETS:-public, max-age=86400}"
    
    log_info "準備部署到: ${GS_PATH}"
    
    # 上傳檔案
    log_step "上傳檔案到 GCS..."
    gsutil -m rsync -r -d ./dist "${GS_PATH}" || log_error "上傳失敗"
    log_success "檔案上傳完成"
    
    # 設定 Cache-Control
    log_step "設定 Cache-Control..."
    gsutil -m setmeta -h "Cache-Control:${CACHE_HTML}" \
        "${GS_PATH}/*.html" 2>/dev/null || log_warn "無法設定 HTML Cache-Control"
    
    gsutil -m setmeta -h "Cache-Control:${CACHE_ASSETS}" \
        "${GS_PATH}/assets/*" 2>/dev/null || log_warn "無法設定 Assets Cache-Control"
    
    log_success "Cache-Control 設定完成"
    
    # 設定公開讀取權限
    log_step "設定公開讀取權限..."
    gsutil iam ch allUsers:objectViewer "${GS_PATH}" 2>/dev/null || \
        log_warn "無法設定公開讀取權限（可能已經設定或權限不足）"
    
    log_success "部署完成！"
    
    # 顯示部署資訊
    echo ""
    echo -e "${BLUE}📋 部署資訊:${NC}"
    echo -e "${CYAN}   Bucket: ${BUCKET}${NC}"
    echo -e "${CYAN}   路徑: ${DEPLOY_PATH}${NC}"
    echo -e "${CYAN}   URL: https://storage.googleapis.com/${BUCKET}/${DEPLOY_PATH}/index.html${NC}"
    echo ""
}

# 主函數
main() {
    echo -e "\n${BLUE}🚀 開始 GCS 本地部署流程${NC}\n"
    
    check_requirements
    echo ""
    
    check_env
    echo ""
    
    setup_auth
    echo ""
    
    build_project
    echo ""
    
    check_dist
    echo ""
    
    add_asset_versions
    echo ""
    
    deploy_to_gcs
    echo ""
    
    log_success "🎉 所有步驟完成！"
}

# 執行
main
