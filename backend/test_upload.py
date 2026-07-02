import urllib.request
import json
import os

def upload_file(filename):
    url = 'http://localhost:8000/api/upload'
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    
    with open(filename, 'rb') as f:
        file_content = f.read()
        
    body = (
        b'--' + boundary.encode() + b'\r\n'
        b'Content-Disposition: form-data; name="file"; filename="' + os.path.basename(filename).encode() + b'"\r\n'
        b'Content-Type: text/csv\r\n\r\n' +
        file_content + b'\r\n'
        b'--' + boundary.encode() + b'--\r\n'
    )
    
    req = urllib.request.Request(url, data=body, method='POST')
    req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
    try:
        r = urllib.request.urlopen(req, timeout=10)
        print(f'{filename} Upload Success:', json.loads(r.read()))
    except Exception as e:
        print(f'{filename} Upload Failed:', e)
        if hasattr(e, 'read'):
            print(e.read().decode())

upload_file('../demo_ec2.csv')
upload_file('../demo_s3.csv')
