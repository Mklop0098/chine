"""Đọc danh sách OPENINGS trong src/world/openingsData.js (mảng JSON thuần)."""
import json, re


def load(path):
    src = open(path, encoding='utf-8').read()
    m = re.search(r'OPENINGS\s*=\s*(\[.*?\]);', src, re.S)
    return json.loads(m.group(1)) if m else []
