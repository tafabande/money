import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from databas_logic import insert_deposit, init_db, mark_sheet_sync, upsert_goal, get_all_deposits
from sheets import append_with_retries, SHEET_ID
from datetime import datetime, timezone

BASE_DIR = Path(__file__).resolve().parent

class AppHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        if path in {"", "/"}:
            path = "/index.html"
        return str(BASE_DIR / path.lstrip("/"))

    def do_POST(self):
        if self.path == '/api/deposit':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)

            # data: {amount, goal, note, who, when}
            # insert_deposit expects keys: time, amount, depositor, reason, category
            db_data = {
                'time': data.get('when') or datetime.now(timezone.utc).strftime('%Y-%m-%d'),
                'amount': data.get('amount'),
                'depositor': data.get('who'),
                'reason': data.get('note'),
                'category': data.get('goal')
            }

            try:
                inserted_id = insert_deposit(db_data)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success', 'id': inserted_id}).encode())

                # Async sheet sync
                try:
                    if SHEET_ID:
                        row = [db_data['time'], db_data['amount'], db_data['depositor'], db_data['reason'], db_data['category']]
                        sheet_ok = append_with_retries(SHEET_ID, row)
                        mark_sheet_sync(inserted_id, sheet_ok)
                except Exception:
                    pass
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode())
        elif self.path == '/api/sync':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            # data: { goals: [...], activities: [...] }
            try:
                # Sync Goals
                for g in data.get('goals', []):
                    upsert_goal(g['name'], g['target'], g['saved'], g.get('id'))
                
                # Sync Activities (Deposits)
                existing_firebase_ids = {d.firebase_id for d in get_all_deposits() if d.firebase_id}
                for a in data.get('activities', []):
                    if a.get('id') not in existing_firebase_ids:
                        # Convert Firebase timestamp if present
                        ts = a.get('timestamp')
                        dt_ts = None
                        if ts:
                            # Firebase web SDK timestamp usually has seconds/nanoseconds
                            if isinstance(ts, dict) and 'seconds' in ts:
                                dt_ts = datetime.fromtimestamp(ts['seconds'])
                        
                        insert_deposit({
                            'time': a.get('date') or (dt_ts.strftime('%Y-%m-%d') if dt_ts else datetime.now(timezone.utc).strftime('%Y-%m-%d')),
                            'amount': a.get('amount'),
                            'depositor': a.get('partner'),
                            'reason': a.get('note'),
                            'category': a.get('goal'),
                            'firebase_id': a.get('id'),
                            'timestamp': dt_ts
                        })
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success'}).encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode())
        else:
            self.send_response(404)
            self.end_headers()


def main():
    init_db()
    server = ThreadingHTTPServer(("0.0.0.0", 8000), AppHandler)
    print("Serving Couple Goals Vault on http://0.0.0.0:8000")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
