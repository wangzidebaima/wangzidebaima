# 方案 A：Render 免费部署（零成本试水）

适合：先验证线下转化，不想花钱买服务器。

## 步骤
1. 把 `huoma/` 整个目录推到你的 GitHub 仓库。
2. 打开 https://render.com → 注册（可用 GitHub 登录）→ New → Web Service → 连你的仓库。
3. 设置：
   - Environment: `Python 3`
   - 计划选 **Free**
   - Build Command: `pip install -r requirements.txt`（自动读 render.yaml，一般不用手填）
   - Start Command: `gunicorn -w 2 -b 0.0.0.0:$PORT server:app`
4. 展开 **Advanced / Environment Variables**，加：
   - `ADMIN_TOKEN` = 你的复杂口令（务必改，别用默认 huoma123）
5. 点 Create Web Service，等几分钟部署完。
6. 部署成功后拿到地址，类似 `https://huoma-xxxx.onrender.com`
7. 浏览器打开 `https://huoma-xxxx.onrender.com/admin?token=你的口令` → 上传群二维码。
8. 本地重生成印刷码（把地址换成你的）：
   ```bash
   python3 generate_qr.py "https://huoma-xxxx.onrender.com"
   ```
   把生成的 `print_qr.png` 印到物料上。

## 注意事项（重要）
- **免费版会休眠**：15 分钟无人访问就睡，下次访问要等几秒冷启动。
- **文件系统是临时的**：免费版每次重启/唤醒，你后台上传的群二维码图片会丢失（重置回 git 里的状态）。
  解决三选一：
  1. 把群二维码图片也提交进 GitHub 仓库（放 `static/qrcodes/`），唤醒后自动有；
  2. 唤醒后到后台重新上传一次（群码不常变，可接受）；
  3. 升级付费版开启 Persistent Disk（持久盘），一劳永逸。
- 想长期稳定，见方案 B（轻量/VPS）。
