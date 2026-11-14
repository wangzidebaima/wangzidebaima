# 方案 B：轻量应用服务器 / VPS 部署（长期稳定）

适合：想 7×24 稳定跑、不怕微信拦截、要 https。推荐腾讯云/阿里云**轻量应用服务器（香港节点，免备案）**，一年几十块。

## 一、买机器 & 基础
1. 买轻量云（2核2G 够用），系统选 Ubuntu 22.04。
2. 控制台把防火墙/安全组放通 **80、443** 端口（22 留着 SSH）。
3. 域名 DNS 的 A 记录指向这台服务器公网 IP。
   - 用香港/海外节点：不用备案，直接能用。
   - 用国内节点：域名需先 ICP 备案才能用 80/443。

## 二、登录服务器，一键装环境
```bash
ssh root@你的服务器IP

# 1) 装依赖
apt update && apt install -y python3-venv python3-pip nginx

# 2) 放代码（把本地 huoma/ 用 scp/rsync 传上去，或 git clone）
mkdir -p /opt/huoma && cd /opt/huoma
# （把 huoma 目录内容弄到 /opt/huoma 下，含 server.py / templates / static / requirements.txt）

# 3) 建虚拟环境并装包
python3 -m venv venv
./venv/bin/pip install -r requirements.txt

# 4) 建运行用户（systemd 里用 www-data）
id www-data || useradd -r -s /usr/sbin/nologin www-data
chown -R www-data:www-data /opt/huoma
```

## 三、开机自启（gunicorn 由 systemd 管）
```bash
# 把本目录的 huoma.service 传上去
cp huoma.service /etc/systemd/system/huoma.service
# 编辑文件，把 ADMIN_TOKEN 改成你的复杂口令
systemctl daemon-reload
systemctl enable --now huoma
systemctl status huoma   # 看到 active(running) 就对了
```

## 四、Nginx 反代 + 免费 SSL
```bash
cp nginx_huoma.conf /etc/nginx/sites-available/huoma
ln -s /etc/nginx/sites-available/huoma /etc/nginx/sites-enabled/
# 编辑文件，把 server_name 改成你的域名
nginx -t && systemctl restart nginx

# 免费 SSL 证书（Let's Encrypt）
apt install -y certbot python3-certbot-nginx
certbot --nginx -d huoma.你的域名.com   # 按提示填邮箱，自动签发并配置 https
```
> certbot 会自动把 80 跳转 443、配好证书并续期。微信里打开就是绿色小锁，不拦截。

## 五、验收 & 生成印刷码
```bash
# 本地浏览器访问 https://huoma.你的域名.com 看到进群页
# 后台 https://huoma.你的域名.com/admin?token=你的口令 上传群码
```
本地电脑重生成印刷码（换成你的域名）：
```bash
python3 generate_qr.py "https://huoma.你的域名.com"
```

## 排错速查
- 页面打不开：先 `systemctl status huoma` 看服务是否起；再 `nginx -t` 看配置；`curl 127.0.0.1:8000` 测内网。
- 502：gunicorn 没起或端口不对（服务里 8000，nginx 里也 8000）。
- https 红锁：certbot 没跑成功，重跑 `certbot --nginx -d 你的域名`。
