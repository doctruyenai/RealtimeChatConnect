# 🚀 Cài Đặt Nhanh - Hệ Thống Chat Real-time

## 📋 Tổng Quan Nhanh

Hướng dẫn này giúp bạn cài đặt hệ thống chat real-time lên VPS Ubuntu chỉ với **1 dòng lệnh**.

## ⚡ Cài Đặt Siêu Nhanh (1 Dòng Lệnh)

### Phương Án 1: Cài Đặt Trực Tiếp (Không Docker)

```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/main/deploy/install.sh | bash
```

### Phương Án 2: Cài Đặt Với Docker

```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/main/deploy/docker-install.sh | bash
```

## 🔧 Yêu Cầu Tối Thiểu

- **VPS**: Ubuntu 20.04/22.04 LTS
- **RAM**: 1GB (khuyến nghị 2GB)
- **Disk**: 10GB (khuyến nghị 20GB)
- **Network**: Public IP hoặc domain name
- **User**: Sudo privileges (không chạy root)

## 📝 Thông Tin Cần Chuẩn Bị

1. **Domain/IP**: Ví dụ `chat.yourcompany.com` hoặc `123.456.789.0`
2. **Email**: Để đăng ký SSL certificate (tùy chọn)
3. **Mật khẩu**: Hệ thống sẽ tự tạo nếu bạn để trống

## 🎯 Sau Khi Cài Đặt

### Truy Cập Hệ Thống
- **Dashboard Agent**: `https://yourdomain.com`
- **Demo Widget**: `https://yourdomain.com/widget-embed.html`

### Tài Khoản Mặc Định
```
Email: agent1@company.com
Password: password123
```

### Tích Hợp Widget
```html
<script>
  window.ChatWidgetConfig = {
    apiUrl: 'https://yourdomain.com/api',
    primaryColor: '#2196F3'
  };
</script>
<script src="https://yourdomain.com/chat-widget.js"></script>
```

## 🛠️ Quản Lý Nhanh

### Kiểm Tra Trạng Thái
```bash
# Method 1: Direct install
pm2 status
sudo systemctl status nginx

# Method 2: Docker
docker compose ps
```

### Xem Logs
```bash
# Method 1: Direct install
pm2 logs chat-realtime

# Method 2: Docker  
docker compose logs -f
```

### Restart Dịch Vụ
```bash
# Method 1: Direct install
pm2 restart chat-realtime
sudo systemctl restart nginx

# Method 2: Docker
docker compose restart
```

## 🆘 Troubleshooting Nhanh

### Vấn Đề 1: Không Truy Cập Được
```bash
# Kiểm tra firewall
sudo ufw status

# Mở port
sudo ufw allow 80
sudo ufw allow 443
```

### Vấn Đề 2: SSL Error
```bash
# Kiểm tra certificate
sudo certbot certificates

# Gia hạn thủ công
sudo certbot renew
```

### Vấn Đề 3: Database Error
```bash
# Direct install
sudo systemctl status postgresql

# Docker
docker compose logs postgres
```

## 📞 Hỗ Trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. File `/var/log/syslog` cho system logs
2. Script logs tại `/tmp/install.log`
3. Application logs tại `/var/www/chat-realtime/logs/`

---

**Thời gian cài đặt trung bình: 5-10 phút**

**Hệ thống sẽ tự động:**
- ✅ Cài đặt tất cả dependencies
- ✅ Cấu hình database và security
- ✅ Thiết lập SSL certificate
- ✅ Khởi động monitoring và backup
- ✅ Sẵn sàng sử dụng ngay