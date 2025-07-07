# Hướng Dẫn Triển Khai Hệ Thống Chat Real-time

## 📋 Tổng Quan

Hệ thống chat real-time này được thiết kế để tích hợp vào bất kỳ website nào thông qua widget JavaScript. Hệ thống bao gồm:

- **Frontend Dashboard**: Giao diện quản trị cho agent
- **Chat Widget**: Widget có thể nhúng vào website
- **Backend API**: Server xử lý logic và lưu trữ dữ liệu
- **Database**: PostgreSQL để lưu trữ dữ liệu

## 🚀 Cài Đặt Nhanh (1 Dòng Lệnh)

```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/chat-realtime/main/deploy/install.sh | bash
```

**Hoặc tải về và chạy:**

```bash
wget https://raw.githubusercontent.com/your-repo/chat-realtime/main/deploy/install.sh
chmod +x install.sh
./install.sh
```

## 🖥️ Yêu Cầu Hệ Thống

### Server Requirements
- **OS**: Ubuntu 20.04/22.04 LTS
- **RAM**: Tối thiểu 1GB (khuyến nghị 2GB+)
- **Storage**: Tối thiểu 10GB (khuyến nghị 20GB+)
- **CPU**: 1 core (khuyến nghị 2 cores+)
- **Network**: Public IP hoặc domain

### Software Requirements
- Node.js 20.x
- PostgreSQL 14+
- Nginx (tùy chọn)
- PM2 (process manager)
- Certbot (cho SSL)

## 📖 Hướng Dẫn Cài Đặt Chi Tiết

### Bước 1: Chuẩn Bị VPS

1. **Tạo VPS Ubuntu 20.04/22.04**
   ```bash
   # Cập nhật hệ thống
   sudo apt update && sudo apt upgrade -y
   
   # Tạo user mới (nếu cần)
   sudo adduser deploy
   sudo usermod -aG sudo deploy
   su - deploy
   ```

2. **Cấu hình SSH Key (khuyến nghị)**
   ```bash
   # Trên máy local
   ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
   ssh-copy-id deploy@your-server-ip
   ```

3. **Cấu hình Firewall cơ bản**
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 80
   sudo ufw allow 443
   ```

### Bước 2: Chạy Script Cài Đặt

1. **Tải script cài đặt**
   ```bash
   wget https://raw.githubusercontent.com/your-repo/chat-realtime/main/deploy/install.sh
   chmod +x install.sh
   ```

2. **Chạy script**
   ```bash
   ./install.sh
   ```

3. **Nhập thông tin khi được yêu cầu:**
   - Domain/IP của server
   - Email để đăng ký SSL (nếu muốn)
   - Mật khẩu PostgreSQL (để trống = tự động tạo)
   - Port ứng dụng (mặc định: 5000)

### Bước 3: Upload Source Code

Nếu bạn có source code riêng:

```bash
# Upload source code lên server
scp -r ./your-project deploy@your-server:/tmp/

# Di chuyển vào thư mục đúng
sudo mv /tmp/your-project/* /var/www/chat-realtime/
sudo chown -R deploy:deploy /var/www/chat-realtime/

# Cài đặt dependencies và build
cd /var/www/chat-realtime/
npm install
npm run build

# Restart ứng dụng
pm2 restart chat-realtime
```

## ⚙️ Cấu Hình Nâng Cao

### Environment Variables

File `.env` trong `/var/www/chat-realtime/`:

```env
# Database
DATABASE_URL="postgresql://chat-realtime:password@localhost:5432/chat-realtime"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# App
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# CORS
CORS_ORIGIN="https://yourdomain.com,http://yourdomain.com"

# Security
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000

# Logging
LOG_LEVEL=info
```

### Nginx Configuration

File `/etc/nginx/sites-available/chat-realtime`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Widget file with caching
    location /chat-widget.js {
        proxy_pass http://localhost:5000;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
}
```

### PM2 Configuration

File `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'chat-realtime',
    script: './dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '500M'
  }]
};
```

## 🔧 Quản Lý Hệ Thống

### Các Lệnh Quan Trọng

```bash
# Xem logs ứng dụng
pm2 logs chat-realtime

# Restart ứng dụng
pm2 restart chat-realtime

# Reload ứng dụng (zero downtime)
pm2 reload chat-realtime

# Xem trạng thái
pm2 status

# Xem monitoring
pm2 monit

# Restart Nginx
sudo systemctl restart nginx

# Xem logs Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Kiểm tra PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -l
```

### Backup và Restore

**Backup tự động:**
```bash
# Script backup chạy hàng ngày lúc 2:00 AM
/usr/local/bin/backup-chat-realtime
```

**Backup thủ công:**
```bash
# Backup database
pg_dump -h localhost -U chat-realtime chat-realtime > backup_$(date +%Y%m%d).sql

# Backup files
tar -czf app_backup_$(date +%Y%m%d).tar.gz -C /var/www/chat-realtime .
```

**Restore:**
```bash
# Restore database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS chat-realtime;"
sudo -u postgres psql -c "CREATE DATABASE chat-realtime;"
psql -h localhost -U chat-realtime chat-realtime < backup_20240107.sql

# Restore files
cd /var/www
tar -xzf app_backup_20240107.tar.gz -C chat-realtime/
sudo chown -R deploy:deploy chat-realtime/
```

## 🔗 Tích Hợp Widget

### Cách 1: Script Tag Đơn Giản

```html
<!-- Thêm vào cuối thẻ </body> -->
<script>
  window.ChatWidgetConfig = {
    apiUrl: 'https://yourdomain.com/api',
    primaryColor: '#2196F3',
    position: 'bottom-right'
  };
</script>
<script src="https://yourdomain.com/chat-widget.js" async></script>
```

### Cách 2: Cấu Hình Nâng Cao

```html
<script>
  window.ChatWidgetConfig = {
    apiUrl: 'https://yourdomain.com/api',
    primaryColor: '#ff5722',
    position: 'bottom-left',
    websiteId: 'my-website-123',
    autoOpen: false,
    showOnPages: ['/contact', '/support'],
    hiddenOnPages: ['/admin', '/login']
  };
  
  // Custom event handlers
  window.addEventListener('chatWidgetReady', function() {
    console.log('Chat widget is ready');
  });
  
  window.addEventListener('chatStarted', function(event) {
    console.log('Chat started:', event.detail);
  });
</script>
<script src="https://yourdomain.com/chat-widget.js" async></script>
```

### Cách 3: Dynamically Load

```javascript
// Load widget conditionally
function loadChatWidget() {
  if (shouldShowChat()) {
    const script = document.createElement('script');
    script.src = 'https://yourdomain.com/chat-widget.js';
    script.async = true;
    
    window.ChatWidgetConfig = {
      apiUrl: 'https://yourdomain.com/api',
      primaryColor: '#2196F3'
    };
    
    document.head.appendChild(script);
  }
}

function shouldShowChat() {
  // Your logic here
  return !window.location.pathname.startsWith('/admin');
}

// Load when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadChatWidget);
} else {
  loadChatWidget();
}
```

## 👥 Quản Lý Agent

### Tài Khoản Mặc Định

```
Agent 1:
Email: agent1@company.com
Password: password123

Agent 2: 
Email: agent2@company.com
Password: password123
```

### Thêm Agent Mới

```sql
-- Kết nối PostgreSQL
sudo -u postgres psql chat-realtime

-- Thêm agent mới
INSERT INTO agents (email, password, name, is_online) 
VALUES ('agent3@company.com', 'newpassword123', 'Nguyễn Văn C', false);
```

### Đổi Mật Khẩu

```sql
-- Đổi mật khẩu agent
UPDATE agents 
SET password = 'newpassword123' 
WHERE email = 'agent1@company.com';
```

## 📊 Monitoring và Analytics

### Health Check

```bash
# Kiểm tra ứng dụng
curl http://localhost:5000/health

# Kiểm tra qua Nginx
curl https://yourdomain.com/health
```

### Logs

```bash
# Application logs
tail -f /var/www/chat-realtime/logs/combined.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# System logs
sudo journalctl -f -u nginx
sudo journalctl -f -u postgresql
```

### Performance Monitoring

```bash
# CPU và Memory usage
htop

# Disk usage
df -h

# Network usage
netstat -tulpn | grep :5000

# PM2 monitoring
pm2 monit
```

## 🚨 Troubleshooting

### Vấn Đề Thường Gặp

**1. Ứng dụng không khởi động**
```bash
# Kiểm tra logs
pm2 logs chat-realtime

# Kiểm tra port
sudo netstat -tulpn | grep :5000

# Restart
pm2 restart chat-realtime
```

**2. Database connection error**
```bash
# Kiểm tra PostgreSQL
sudo systemctl status postgresql

# Kiểm tra user và database
sudo -u postgres psql -l
sudo -u postgres psql -c "\du"

# Reset password
sudo -u postgres psql -c "ALTER USER chat-realtime PASSWORD 'newpassword';"
```

**3. Nginx 502 Error**
```bash
# Kiểm tra upstream
curl http://localhost:5000

# Kiểm tra Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

**4. SSL Certificate Issues**
```bash
# Renew certificate
sudo certbot renew

# Check certificate
sudo certbot certificates

# Manual renewal
sudo certbot --nginx -d yourdomain.com
```

**5. High Memory Usage**
```bash
# Check memory
free -h

# PM2 memory usage
pm2 list

# Restart app to free memory
pm2 restart chat-realtime
```

### Performance Tuning

**1. Database Optimization**
```sql
-- Add indexes for better performance
CREATE INDEX idx_conversations_agent ON conversations(assigned_agent_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);
```

**2. Nginx Tuning**
```nginx
# Add to /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 1024;

# Gzip compression
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript;

# Keep alive
keepalive_timeout 65;
keepalive_requests 100;
```

**3. Node.js Tuning**
```bash
# Increase memory limit
export NODE_OPTIONS="--max-old-space-size=1024"

# Update PM2 config
pm2 restart chat-realtime --node-args="--max-old-space-size=1024"
```

## 🔒 Security Best Practices

### 1. Server Hardening

```bash
# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Change default SSH port
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

# Restart SSH
sudo systemctl restart ssh

# Install fail2ban
sudo apt install fail2ban
```

### 2. Database Security

```sql
-- Change default passwords
ALTER USER postgres PASSWORD 'strong-password';
ALTER USER chat-realtime PASSWORD 'strong-password';

-- Restrict connections
-- Edit /etc/postgresql/14/main/pg_hba.conf
-- Change "trust" to "md5" for local connections
```

### 3. Application Security

```bash
# Strong JWT secret
openssl rand -base64 64

# Environment file permissions
chmod 600 /var/www/chat-realtime/.env

# Regular updates
sudo apt update && sudo apt upgrade -y
npm update
```

### 4. Nginx Security

```nginx
# Hide Nginx version
server_tokens off;

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Rate limiting
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
limit_req zone=login burst=5 nodelay;
```

## 📞 Hỗ Trợ

### Liên Hệ
- **Email**: support@yourcompany.com
- **Documentation**: https://docs.yourcompany.com
- **GitHub**: https://github.com/yourcompany/chat-realtime

### Resources
- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

---

## 📝 Changelog

### Version 1.0.0 (2024-01-07)
- Initial release
- Basic chat functionality
- Agent dashboard
- Widget integration
- PostgreSQL storage
- Nginx reverse proxy
- SSL support
- Automated backup system

---

**Chúc bạn triển khai thành công! 🎉**