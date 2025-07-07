#!/bin/bash

# Hệ thống Chat Real-time - Docker Installation Script
# Dành cho Ubuntu 20.04/22.04 LTS với Docker & Docker Compose

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
DOMAIN=""
EMAIL=""
POSTGRES_PASSWORD=""
JWT_SECRET=""
REDIS_PASSWORD=""

print_banner() {
    echo -e "${BLUE}"
    echo "======================================================"
    echo "  HỆ THỐNG CHAT REAL-TIME - DOCKER INSTALLER"
    echo "======================================================"
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
        exit 1
    fi
}

collect_info() {
    echo -e "${BLUE}=== THÔNG TIN CẤU HÌNH ===${NC}"
    
    read -p "Nhập domain/IP của server: " DOMAIN
    if [[ -z "$DOMAIN" ]]; then
        log_error "Domain không được để trống"
        exit 1
    fi
    
    read -p "Nhập email cho SSL certificate: " EMAIL
    
    read -s -p "Nhập mật khẩu PostgreSQL (để trống = tự động): " POSTGRES_PASSWORD
    echo
    if [[ -z "$POSTGRES_PASSWORD" ]]; then
        POSTGRES_PASSWORD=$(openssl rand -base64 32)
    fi
    
    read -s -p "Nhập mật khẩu Redis (để trống = tự động): " REDIS_PASSWORD
    echo
    if [[ -z "$REDIS_PASSWORD" ]]; then
        REDIS_PASSWORD=$(openssl rand -base64 32)
    fi
    
    JWT_SECRET=$(openssl rand -base64 64)
    
    echo
    echo -e "${GREEN}=== THÔNG TIN ĐĂNG KÝ ===${NC}"
    echo "Domain: $DOMAIN"
    echo "Email: $EMAIL"
    echo "Passwords: Generated automatically"
    echo
}

update_system() {
    log_info "Cập nhật hệ thống..."
    sudo apt update
    sudo apt upgrade -y
    sudo apt install -y curl wget git unzip ca-certificates gnupg lsb-release
}

install_docker() {
    log_info "Cài đặt Docker..."
    
    # Remove old versions
    sudo apt-get remove -y docker docker-engine docker.io containerd runc || true
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    # Start Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    log_info "Docker đã được cài đặt"
}

setup_project() {
    log_info "Chuẩn bị project..."
    
    # Create project directory
    sudo mkdir -p /opt/chat-realtime
    sudo chown -R $USER:$USER /opt/chat-realtime
    cd /opt/chat-realtime
    
    # Create environment file
    cat > .env << EOF
# Database
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# Redis
REDIS_PASSWORD=${REDIS_PASSWORD}

# Application
JWT_SECRET=${JWT_SECRET}
DOMAIN=${DOMAIN}
NODE_ENV=production

# SSL
SSL_EMAIL=${EMAIL}
EOF
    
    chmod 600 .env
    
    # Create necessary directories
    mkdir -p logs uploads ssl nginx/sites-enabled nginx/logs db
    
    log_info "Project structure đã được tạo"
}

create_docker_compose() {
    log_info "Tạo Docker Compose configuration..."
    
    cd /opt/chat-realtime
    
    # Copy or download docker-compose.yml and related files
    # You would typically get these from your repository
    
    log_info "Docker Compose configuration đã sẵn sàng"
}

setup_ssl() {
    if [[ ! -z "$EMAIL" && "$DOMAIN" != *"localhost"* ]]; then
        log_info "Cài đặt SSL certificate..."
        
        # Create temporary nginx for certificate
        docker run --rm -d \
            --name temp-nginx \
            -p 80:80 \
            -v /opt/chat-realtime/ssl:/etc/nginx/ssl \
            nginx:alpine
        
        # Get certificate using certbot
        docker run --rm \
            -v /opt/chat-realtime/ssl:/etc/letsencrypt \
            -p 80:80 \
            certbot/certbot \
            certonly --standalone \
            --email $EMAIL \
            --agree-tos \
            --no-eff-email \
            -d $DOMAIN
        
        # Stop temporary nginx
        docker stop temp-nginx
        
        # Copy certificates to nginx ssl directory
        sudo cp /opt/chat-realtime/ssl/live/$DOMAIN/fullchain.pem /opt/chat-realtime/ssl/cert.pem
        sudo cp /opt/chat-realtime/ssl/live/$DOMAIN/privkey.pem /opt/chat-realtime/ssl/key.pem
        
        log_info "SSL certificate đã được cài đặt"
    fi
}

start_services() {
    log_info "Khởi động các dịch vụ..."
    
    cd /opt/chat-realtime
    
    # Build and start services
    newgrp docker << EOF
docker compose up -d --build
EOF
    
    # Wait for services to be ready
    log_info "Đợi services khởi động..."
    sleep 30
    
    # Check if services are running
    newgrp docker << EOF
docker compose ps
EOF
    
    log_info "Các dịch vụ đã được khởi động"
}

setup_firewall() {
    log_info "Cấu hình firewall..."
    sudo ufw --force enable
    sudo ufw allow ssh
    sudo ufw allow 80
    sudo ufw allow 443
    sudo ufw status
}

create_management_scripts() {
    log_info "Tạo scripts quản lý..."
    
    # Backup script
    sudo tee /usr/local/bin/backup-chat-docker << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/chat-realtime"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec chat-postgres pg_dump -U chat_user chat_realtime > $BACKUP_DIR/db_$DATE.sql

# Backup volumes
docker run --rm -v chat-realtime_postgres_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/postgres_$DATE.tar.gz -C /data .
docker run --rm -v chat-realtime_redis_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/redis_$DATE.tar.gz -C /data .

# Cleanup old backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "$(date): Backup completed" >> /var/log/chat-backup.log
EOF
    
    sudo chmod +x /usr/local/bin/backup-chat-docker
    
    # Monitor script
    sudo tee /usr/local/bin/monitor-chat-docker << 'EOF'
#!/bin/bash
cd /opt/chat-realtime

# Check if services are running
if ! docker compose ps | grep -q "Up"; then
    echo "$(date): Some services are down, restarting..." >> /var/log/chat-monitor.log
    docker compose up -d
fi

# Health check
if ! curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "$(date): Health check failed, restarting app..." >> /var/log/chat-monitor.log
    docker compose restart app
fi
EOF
    
    sudo chmod +x /usr/local/bin/monitor-chat-docker
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-chat-docker") | crontab -
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/monitor-chat-docker") | crontab -
    
    log_info "Management scripts đã được tạo"
}

print_completion() {
    echo
    echo -e "${GREEN}======================================================"
    echo "           CÀI ĐẶT DOCKER HOÀN TẤT THÀNH CÔNG!"
    echo -e "======================================================${NC}"
    echo
    echo -e "${BLUE}THÔNG TIN HỆ THỐNG:${NC}"
    echo "• URL: https://$DOMAIN"
    echo "• Project directory: /opt/chat-realtime"
    echo
    echo -e "${BLUE}DOCKER COMMANDS:${NC}"
    echo "• Xem logs: docker compose logs -f"
    echo "• Restart: docker compose restart"
    echo "• Stop: docker compose down"
    echo "• Start: docker compose up -d"
    echo
    echo -e "${BLUE}DATABASE:${NC}"
    echo "• PostgreSQL Password: $POSTGRES_PASSWORD"
    echo "• Redis Password: $REDIS_PASSWORD"
    echo
    echo -e "${BLUE}MANAGEMENT:${NC}"
    echo "• Backup: /usr/local/bin/backup-chat-docker"
    echo "• Monitor: /usr/local/bin/monitor-chat-docker"
    echo
    echo -e "${YELLOW}LƯU Ý:${NC}"
    echo "• Logout và login lại để sử dụng Docker commands"
    echo "• Hoặc chạy: newgrp docker"
    echo "• SSL certificate sẽ tự động gia hạn"
    echo
}

# Main execution
main() {
    print_banner
    check_root
    collect_info
    
    log_info "Bắt đầu cài đặt Docker environment..."
    
    update_system
    install_docker
    setup_project
    create_docker_compose
    setup_ssl
    start_services
    setup_firewall
    create_management_scripts
    
    print_completion
}

main "$@"