"""最小 CDP 客户端：真的点、真的读 DOM，不靠截图猜。

为什么要有这个：截图只能证明「画出来了」，证明不了「点得动」。
排序题这种交互题，点一下有没有真的进数组、按钮会不会解锁，只有真点才知道。

用法（配合 Edge headless）：
    python tools/cdp.py --url "http://127.0.0.1:8938/index.html#/set/xxx" --script test.js
只依赖标准库，没有 websocket 库也能跑（手写的 WS 帧）。

注意：Windows 下 Edge 路径带空格，用 shell 调起时路径要引号；这里用 subprocess 列表参数，不受影响。
"""
import socket, base64, os, json, struct, urllib.request, subprocess, time, sys, argparse, shutil, tempfile

EDGE_CANDIDATES = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]


class WS:
    def __init__(self, url, timeout=20):
        assert url.startswith('ws://'), url
        hostport, path = url[5:].split('/', 1)
        host, port = hostport.rsplit(':', 1)
        self.s = socket.create_connection((host, int(port)), timeout=timeout)
        key = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall((
            f"GET /{path} HTTP/1.1\r\nHost: {hostport}\r\nUpgrade: websocket\r\n"
            f"Connection: Upgrade\r\nSec-WebSocket-Key: {key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n\r\n").encode())
        buf = b''
        while b'\r\n\r\n' not in buf:
            d = self.s.recv(4096)
            if not d:
                raise EOFError('handshake failed')
            buf += d
        head, self.buf = buf.split(b'\r\n\r\n', 1)
        if b' 101 ' not in head.split(b'\r\n')[0]:
            raise EOFError('not 101: ' + head[:200].decode('latin1'))
        self.mid = 0

    def _send_frame(self, text):
        p = text.encode()
        n, hdr = len(p), bytearray([0x81])
        if n < 126:
            hdr.append(0x80 | n)
        elif n < 65536:
            hdr.append(0x80 | 126); hdr += struct.pack('>H', n)
        else:
            hdr.append(0x80 | 127); hdr += struct.pack('>Q', n)
        mask = os.urandom(4)
        hdr += mask
        self.s.sendall(bytes(hdr) + bytes(b ^ mask[i % 4] for i, b in enumerate(p)))

    def _read(self, n):
        while len(self.buf) < n:
            d = self.s.recv(1 << 16)
            if not d:
                raise EOFError('socket closed')
            self.buf += d
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def recv(self):
        while True:
            b1, b2 = self._read(2)
            op, ln = b1 & 0x0F, b2 & 0x7F
            if ln == 126:
                ln = struct.unpack('>H', self._read(2))[0]
            elif ln == 127:
                ln = struct.unpack('>Q', self._read(8))[0]
            data = self._read(ln) if ln else b''
            if op == 1:
                return data.decode()
            if op == 8:
                raise EOFError('closed by peer')
            # 0x9 ping / 0xA pong 忽略即可

    def call(self, method, params=None, timeout=40):
        self.mid += 1
        mid = self.mid
        self._send_frame(json.dumps({'id': mid, 'method': method, 'params': params or {}}))
        t0 = time.time()
        while True:
            if time.time() - t0 > timeout:
                raise TimeoutError(method)
            m = json.loads(self.recv())
            if m.get('id') == mid:
                return m


def find_edge():
    for p in EDGE_CANDIDATES:
        if os.path.exists(p):
            return p
    w = shutil.which('msedge') or shutil.which('chrome')
    if w:
        return w
    raise SystemExit('找不到 Edge')


def wait_json(port, path, tries=60):
    for _ in range(tries):
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{port}{path}', timeout=1) as r:
                return json.loads(r.read().decode())
        except Exception:
            time.sleep(0.3)
    raise SystemExit('CDP 端口没起来: ' + str(port))


def run(url, js_file, shot=None, width=390, height=844, scale=2, inject=None, wait=2.5):
    edge = find_edge()
    prof = tempfile.mkdtemp(prefix='cdp_')
    port = 9333
    args = [edge, '--headless=old', '--disable-gpu', '--no-first-run',
            f'--user-data-dir={prof}', f'--remote-debugging-port={port}',
            f'--window-size={int(width*scale)},{int(height*scale)}',
            f'--force-device-scale-factor={scale}', 'about:blank']
    proc = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        wait_json(port, '/json/version')
        pages = [t for t in wait_json(port, '/json/list') if t.get('type') == 'page']
        if not pages:
            raise SystemExit('没有可用标签页')
        ws = WS(pages[0]['webSocketDebuggerUrl'])
        ws.call('Page.enable')
        ws.call('Runtime.enable')
        if inject:
            # 先把 localStorage 之类的东西写进去（同源才写得了）
            ws.call('Page.navigate', {'url': inject['url']})
            time.sleep(1.2)
            ws.call('Runtime.evaluate', {'expression': inject['js'], 'awaitPromise': True, 'returnByValue': True})
        ws.call('Page.navigate', {'url': url})
        time.sleep(wait)
        res = ws.call('Runtime.evaluate', {
            'expression': open(js_file, encoding='utf-8').read(),
            'awaitPromise': True, 'returnByValue': True, 'userGesture': True}, timeout=90)
        val = res.get('result', {}).get('result', {})
        if 'exceptionDetails' in res.get('result', {}):
            print('JS 抛异常:', json.dumps(res['result']['exceptionDetails'], ensure_ascii=False)[:800])
        out = val.get('value')
        print(json.dumps(out, ensure_ascii=False, indent=1) if isinstance(out, (dict, list)) else out)
        if shot:
            r = ws.call('Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': True})
            import base64 as b64
            open(shot, 'wb').write(b64.b64decode(r['result']['data']))
            print('\n截图:', shot)
        return out
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()
        shutil.rmtree(prof, ignore_errors=True)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', required=True)
    ap.add_argument('--script', required=True, help='要在这个页面里执行的 js 文件')
    ap.add_argument('--shot', default=None)
    ap.add_argument('--inject-url', default=None, help='先打开这个页面写 localStorage')
    ap.add_argument('--inject-js', default=None)
    ap.add_argument('--wait', type=float, default=2.5)
    a = ap.parse_args()
    inject = {'url': a.inject_url, 'js': a.inject_js} if a.inject_url and a.inject_js else None
    run(a.url, a.script, a.shot, inject=inject, wait=a.wait)
