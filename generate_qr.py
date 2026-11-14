#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成「线下印刷用」静态二维码
这个二维码指向活码落地页地址；群满后你只需到后台换图，此二维码无需重印。

用法：
  python3 generate_qr.py                       # 默认指向 http://localhost:8080
  python3 generate_qr.py "https://huoma.你的域名.com/"   # 部署后指向你的域名
输出：print_qr.png  （可直接印刷在海报/传单/易拉宝上）
"""
import sys
import qrcode

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
OUT = "print_qr.png"

qr = qrcode.QRCode(
    version=None,
    error_correction=qrcode.constants.ERROR_CORRECT_H,  # 高容错，印刷/磨损也能扫
    box_size=12,
    border=4,
)
qr.add_data(URL)
qr.make(fit=True)
img = qr.make_image(fill_color="#000000", back_color="#ffffff")
img.save(OUT)
print(f"已生成印刷二维码: {OUT}")
print(f"指向地址: {URL}")
print(f"建议尺寸: 实物上不小于 2cm x 2cm，海报主视觉处 4-6cm 更易扫。")
