"""Anteprima locale per PyCharm. Il sito pubblicato funziona senza Python."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Timer
import webbrowser


def main():
    parser = argparse.ArgumentParser(description="Il tavolo del master: anteprima locale")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    except OSError as error:
        parser.exit(1, f"Impossibile avviare l'anteprima: {error}. Prova --port 8001.\n")
    url = f"http://127.0.0.1:{server.server_port}/"
    print(f"Il tavolo del master: {url}\nPremi Ctrl+C per terminare.", flush=True)
    if not args.no_browser:
        Timer(0.5, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
