from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class AppHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        if path in {"", "/"}:
            path = "/index.html"
        return str(BASE_DIR / path.lstrip("/"))


def main():
    server = ThreadingHTTPServer(("0.0.0.0", 8000), AppHandler)
    print("Serving Couple Goals Vault on http://0.0.0.0:8000")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
