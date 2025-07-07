#!/bin/bash

# Hệ thống Chat Real-time - Script Cài đặt Tự động
# Dành cho Ubuntu 20.04/22.04 LTS
# Phiên bản: 1.0

set -e

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
PROJECT_NAME="chat-realtime"
DOMAIN=""
EMAIL=""
NODE_VERSION="20"
POSTGRES_PASSWORD=""
JWT_SECRET=""
APP_PORT="5000"
NGINX_ENABLED="true"
SSL_ENABLED="false"

# Functions
print_banner() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "    HỆ THỐNG CHAT REAL-TIME - UBUNTU INSTALLER"
    echo "=================================================="
    echo -e "${NC}"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "Script này không nên chạy với quyền root"
        log_info "Hãy chạy với user thường có quyền sudo"
        exit 1
    fi
}

check_ubuntu() {
    if ! grep -q "Ubuntu" /etc/os-release; then
        log_error "Script này chỉ hỗ trợ Ubuntu 20.04/22.04"
        exit 1
    fi
    
    local version=$(lsb_release -rs)
    if [[ "$version" != "20.04" && "$version" != "22.04" ]]; then
        log_warn "Phiên bản Ubuntu không được test chính thức: $version"
        log_warn "Khuyến nghị sử dụng Ubuntu 20.04 hoặc 22.04"
        read -p "Bạn có muốn tiếp tục? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

collect_info() {
    echo -e "${BLUE}=== THÔNG TIN CẤU HÌNH ===${NC}"
    
    # Domain
    read -p "Nhập domain/IP của server (ví dụ: chat.example.com): " DOMAIN
    if [[ -z "$DOMAIN" ]]; then
        log_error "Domain không được để trống"
        exit 1
    fi
    
    # Email for SSL
    if [[ "$DOMAIN" != *"localhost"* && "$DOMAIN" != "127.0.0.1" ]]; then
        read -p "Bạn có muốn cài đặt SSL miễn phí? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            SSL_ENABLED="true"
            read -p "Nhập email để đăng ký SSL (Let's Encrypt): " EMAIL
            if [[ -z "$EMAIL" ]]; then
                log_error "Email không được để trống khi cài SSL"
                exit 1
            fi
        fi
    fi
    
    # PostgreSQL password
    read -s -p "Nhập mật khẩu cho PostgreSQL (để trống = tự động tạo): " POSTGRES_PASSWORD
    echo
    if [[ -z "$POSTGRES_PASSWORD" ]]; then
        POSTGRES_PASSWORD=$(openssl rand -base64 32)
        log_info "Mật khẩu PostgreSQL được tạo tự động"
    fi
    
    # JWT Secret
    JWT_SECRET=$(openssl rand -base64 64)
    
    # Port
    read -p "Port cho ứng dụng (mặc định: 5000): " input_port
    if [[ ! -z "$input_port" ]]; then
        APP_PORT="$input_port"
    fi
    
    echo
    echo -e "${GREEN}=== THÔNG TIN ĐÃ NHẬP ===${NC}"
    echo "Domain: $DOMAIN"
    echo "SSL: $SSL_ENABLED"
    echo "Port: $APP_PORT"
    echo "PostgreSQL Password: ********"
    echo "JWT Secret: ********"
    echo
    
    read -p "Xác nhận cài đặt? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Hủy cài đặt"
        exit 0
    fi
}

update_system() {
    log_info "Cập nhật hệ thống..."
    sudo apt update
    sudo apt upgrade -y
    sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
}

install_nodejs() {
    log_info "Cài đặt Node.js ${NODE_VERSION}..."
    
    # Install NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt install -y nodejs
    
    # Install global packages
    sudo npm install -g pm2 pnpm
    
    log_info "Node.js version: $(node --version)"
    log_info "NPM version: $(npm --version)"
    log_info "PM2 version: $(pm2 --version)"
}

install_postgresql() {
    log_info "Cài đặt PostgreSQL..."
    
    sudo apt install -y postgresql postgresql-contrib
    
    # Start and enable PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres psql -c "CREATE DATABASE ${PROJECT_NAME};"
    sudo -u postgres psql -c "CREATE USER ${PROJECT_NAME} WITH PASSWORD '${POSTGRES_PASSWORD}';"
    sudo -u postgres psql -c "ALTER USER ${PROJECT_NAME} CREATEDB;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${PROJECT_NAME} TO ${PROJECT_NAME};"
    
    log_info "PostgreSQL cài đặt thành công"
}

install_nginx() {
    if [[ "$NGINX_ENABLED" == "true" ]]; then
        log_info "Cài đặt Nginx..."
        sudo apt install -y nginx
        sudo systemctl start nginx
        sudo systemctl enable nginx
        
        # Allow Nginx through firewall
        sudo ufw allow 'Nginx Full'
        log_info "Nginx cài đặt thành công"
    fi
}

setup_firewall() {
    log_info "Cấu hình firewall..."
    sudo ufw --force enable
    sudo ufw allow ssh
    sudo ufw allow ${APP_PORT}
    if [[ "$NGINX_ENABLED" == "true" ]]; then
        sudo ufw allow 'Nginx Full'
    fi
    sudo ufw status
}

clone_project() {
    log_info "Tải source code từ GitHub repository..."
    
    # Create project directory
    sudo mkdir -p /var/www
    sudo chown -R $USER:$USER /var/www
    
    cd /var/www
    
    # Backup existing directory if exists
    if [[ -d "$PROJECT_NAME" ]]; then
        log_warn "Thư mục $PROJECT_NAME đã tồn tại, đổi tên thành ${PROJECT_NAME}_backup_$(date +%Y%m%d_%H%M%S)"
        mv $PROJECT_NAME ${PROJECT_NAME}_backup_$(date +%Y%m%d_%H%M%S)
    fi
    
    # Clone repository
    log_info "Cloning repository từ GitHub..."
    git clone https://github.com/doctruyenai/RealtimeChatConnect.git $PROJECT_NAME
    
    if [[ ! -d "$PROJECT_NAME" ]]; then
        log_error "Không thể clone repository. Kiểm tra kết nối internet và repository URL."
        exit 1
    fi
    
    cd $PROJECT_NAME
    
    # Verify package.json exists
    if [[ ! -f "package.json" ]]; then
        log_error "Repository không chứa package.json. Vui lòng kiểm tra repository."
        exit 1
    fi
    
    log_info "Source code đã được tải thành công"
}

install_dependencies() {
    log_info "Cài đặt dependencies..."
    cd /var/www/$PROJECT_NAME
    
    # Install with npm (fallback to npm if pnpm fails)
    if command -v pnpm &> /dev/null; then
        pnpm install
    else
        npm install
    fi
}

setup_environment() {
    log_info "Cấu hình environment variables..."
    cd /var/www/$PROJECT_NAME
    
    # Create .env file
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://${PROJECT_NAME}:${POSTGRES_PASSWORD}@localhost:5432/${PROJECT_NAME}"

# JWT
JWT_SECRET="${JWT_SECRET}"

# App
NODE_ENV=production
PORT=${APP_PORT}
HOST=0.0.0.0

# CORS
CORS_ORIGIN="https://${DOMAIN},http://${DOMAIN}"

# Security
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000

# Logging
LOG_LEVEL=info
EOF

    # Set proper permissions
    chmod 600 .env
    chown $USER:$USER .env
    
    log_info "Environment variables đã được cấu hình"
}

build_application() {
    log_info "Build ứng dụng..."
    cd /var/www/$PROJECT_NAME
    
    # Build the application
    if [[ -f "package.json" ]] && grep -q "build" package.json; then
        npm run build
    else
        log_warn "Script build không tồn tại, bỏ qua bước build"
    fi
}

setup_pm2() {
    log_info "Cấu hình PM2..."
    cd /var/www/$PROJECT_NAME
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '${PROJECT_NAME}',
    script: './dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: ${APP_PORT}
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '500M',
    node_args: '--max_old_space_size=512'
  }]
};
EOF

    # Create logs directory
    mkdir -p logs
    
    # Start application with PM2
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    
    log_info "PM2 đã được cấu hình và khởi động"
}

setup_nginx_config() {
    if [[ "$NGINX_ENABLED" == "true" ]]; then
        log_info "Cấu hình Nginx..."
        
        # Create Nginx config
        sudo tee /etc/nginx/sites-available/$PROJECT_NAME << EOF
server {
    listen 80;
    server_name ${DOMAIN};
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    # Main proxy
    location / {
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files
    location /chat-widget.js {
        proxy_pass http://localhost:${APP_PORT};
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Security
    location ~ /\. {
        deny all;
    }
    
    # File size limit
    client_max_body_size 10M;
}
EOF

        # Enable site
        sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        
        # Test and reload Nginx
        sudo nginx -t
        sudo systemctl reload nginx
        
        log_info "Nginx đã được cấu hình"
    fi
}

install_ssl() {
    if [[ "$SSL_ENABLED" == "true" && "$NGINX_ENABLED" == "true" ]]; then
        log_info "Cài đặt SSL certificate..."
        
        # Install Certbot
        sudo apt install -y certbot python3-certbot-nginx
        
        # Get SSL certificate
        sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect
        
        # Auto-renewal
        sudo systemctl enable certbot.timer
        
        log_info "SSL certificate đã được cài đặt"
    fi
}

setup_monitoring() {
    log_info "Cấu hình monitoring và logging..."
    
    # Setup log rotation
    sudo tee /etc/logrotate.d/$PROJECT_NAME << EOF
/var/www/${PROJECT_NAME}/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    copytruncate
    postrotate
        pm2 reload ${PROJECT_NAME}
    endscript
}
EOF

    # Create monitoring script
    sudo tee /usr/local/bin/monitor-$PROJECT_NAME << EOF
#!/bin/bash
# Monitor script for $PROJECT_NAME

APP_NAME="$PROJECT_NAME"
LOG_FILE="/var/log/monitor-\${APP_NAME}.log"

# Check if PM2 process is running
if ! pm2 list | grep -q "\$APP_NAME.*online"; then
    echo "\$(date): \$APP_NAME is not running, restarting..." >> \$LOG_FILE
    pm2 restart \$APP_NAME
fi

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "\$(date): Nginx is not running, starting..." >> \$LOG_FILE
    sudo systemctl start nginx
fi

# Check disk space
DISK_USAGE=\$(df / | awk 'NR==2 {print \$5}' | sed 's/%//')
if [ \$DISK_USAGE -gt 90 ]; then
    echo "\$(date): Disk usage is \${DISK_USAGE}%, cleaning logs..." >> \$LOG_FILE
    find /var/www/\$APP_NAME/logs -name "*.log" -mtime +7 -delete
fi
EOF

    sudo chmod +x /usr/local/bin/monitor-$PROJECT_NAME
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/monitor-$PROJECT_NAME") | crontab -
    
    log_info "Monitoring đã được cấu hình"
}

create_backup_script() {
    log_info "Tạo script backup..."
    
    sudo tee /usr/local/bin/backup-$PROJECT_NAME << EOF
#!/bin/bash
# Backup script for $PROJECT_NAME

BACKUP_DIR="/var/backups/$PROJECT_NAME"
DATE=\$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/$PROJECT_NAME"

# Create backup directory
mkdir -p \$BACKUP_DIR

# Backup database
pg_dump -h localhost -U $PROJECT_NAME $PROJECT_NAME > \$BACKUP_DIR/db_\$DATE.sql

# Backup application files
tar -czf \$BACKUP_DIR/app_\$DATE.tar.gz -C \$APP_DIR .

# Keep only last 7 backups
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "\$(date): Backup completed successfully" >> /var/log/backup-$PROJECT_NAME.log
EOF

    sudo chmod +x /usr/local/bin/backup-$PROJECT_NAME
    
    # Add daily backup to crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-$PROJECT_NAME") | crontab -
    
    log_info "Script backup đã được tạo"
}

print_completion_info() {
    echo
    echo -e "${GREEN}=================================================="
    echo "           CÀI ĐẶT HOÀN TẤT THÀNH CÔNG!"
    echo -e "==================================================${NC}"
    echo
    echo -e "${BLUE}THÔNG TIN HỆ THỐNG:${NC}"
    echo "• URL ứng dụng: http://$DOMAIN"
    if [[ "$SSL_ENABLED" == "true" ]]; then
        echo "• URL SSL: https://$DOMAIN"
    fi
    echo "• Port ứng dụng: $APP_PORT"
    echo "• Thư mục source: /var/www/$PROJECT_NAME"
    echo
    echo -e "${BLUE}THÔNG TIN ĐĂNG NHẬP:${NC}"
    echo "• Email: agent1@company.com"
    echo "• Password: password123"
    echo
    echo -e "${BLUE}DATABASE:${NC}"
    echo "• PostgreSQL Database: $PROJECT_NAME"
    echo "• Username: $PROJECT_NAME"
    echo "• Password: $POSTGRES_PASSWORD"
    echo
    echo -e "${BLUE}QUẢN LÝ DỊCH VỤ:${NC}"
    echo "• Xem logs: pm2 logs $PROJECT_NAME"
    echo "• Restart app: pm2 restart $PROJECT_NAME"
    echo "• Backup: /usr/local/bin/backup-$PROJECT_NAME"
    echo "• Monitor: /usr/local/bin/monitor-$PROJECT_NAME"
    echo
    echo -e "${BLUE}TÍCH HỢP WIDGET:${NC}"
    echo "• File widget: https://$DOMAIN/chat-widget.js"
    echo "• Trang demo: https://$DOMAIN/widget-embed.html"
    echo
    echo -e "${YELLOW}LƯU Ý:${NC}"
    echo "• Thông tin cấu hình đã được lưu trong file /var/www/$PROJECT_NAME/.env"
    echo "• Backup tự động chạy hàng ngày lúc 2:00 AM"
    echo "• Monitor tự động chạy mỗi 5 phút"
    if [[ "$SSL_ENABLED" == "true" ]]; then
        echo "• SSL certificate sẽ tự động gia hạn"
    fi
    echo
    echo -e "${GREEN}Cài đặt hoàn tất! Hệ thống đã sẵn sàng sử dụng.${NC}"
    echo
}

# Main execution
main() {
    print_banner
    check_root
    check_ubuntu
    collect_info
    
    log_info "Bắt đầu cài đặt hệ thống..."
    
    update_system
    install_nodejs
    install_postgresql
    install_nginx
    setup_firewall
    clone_project
    install_dependencies
    setup_environment
    build_application
    setup_pm2
    setup_nginx_config
    install_ssl
    setup_monitoring
    create_backup_script
    
    print_completion_info
}

# Run main function
main "$@"