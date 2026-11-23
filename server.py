"""Local static server with same-origin CORS proxy for Renri Festival."""

from __future__ import annotations

import base64
from email.parser import BytesParser
from email.policy import default as email_default
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
import time
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

HOST = "127.0.0.1"
PORT = int(os.environ.get("PORT", "8765"))
LK_DEFAULT_BASE = "https://api.lk888.ai"
KLING_DEFAULT_BASE = "https://api-beijing.klingai.com"
KLING_IMAGE_MODELS = [
    {"id": "kling-4.0", "name": "Kling Image 4.0 (kling-4.0)", "object": "model", "owned_by": "kling"},
    {"id": "kling-v3", "name": "Kling Image 3.0 (kling-v3)", "object": "model", "owned_by": "kling"},
    {"id": "kling-v3-omni", "name": "Kling Image 3.0 Omni (kling-v3-omni)", "object": "model", "owned_by": "kling"},
    {"id": "kling-image-o1", "name": "Kling Image O1 (kling-image-o1)", "object": "model", "owned_by": "kling"},
    {"id": "kling-v2-1", "name": "Kling Image 2.1 · 人脸参考 (kling-v2-1)", "object": "model", "owned_by": "kling"},
]
PRESET_PROMPTS = {
    "floral": (
        "中国传统正月初七人日节庆人像，身穿淡青与朱砂色汉服春衫，发髻佩戴精致金银花胜与梅花簪饰，"
        "春日暖阳柔光，工笔国风与写实人像融合，保留人物五官特征，端庄典雅"
    ),
    "paper": (
        "中国传统正月初七人日节庆人像，身穿朱红织金汉服春袄，发髻佩戴传统剪纸人胜与彩胜发饰，"
        "新春暖光背景，工笔国风与写实人像融合，保留人物五官特征，喜庆吉祥"
    ),
}


def _is_lk_host(host: str) -> bool:
    return host in ("api.lk888.ai", "api.lk666.ai", "lk888.ai", "lk666.ai") or host.endswith((".lk888.ai", ".lk666.ai"))


def _detect_image_mime(data: bytes) -> str:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return "image/webp"
    return "image/jpeg"


def _parse_multipart(content_type: str, body: bytes) -> dict[str, bytes]:
    raw = b"Content-Type: " + content_type.encode("latin-1") + b"\r\nMIME-Version: 1.0\r\n\r\n" + body
    msg = BytesParser(policy=email_default).parsebytes(raw)
    fields: dict[str, bytes] = {}
    if not msg.is_multipart():
        return fields
    for part in msg.iter_parts():
        name = part.get_param("name", header="content-disposition")
        if name:
            fields[name] = part.get_payload(decode=True) or b""
    return fields


def _http_json(
    url: str,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    payload: dict | None = None,
    timeout: int = 20,
) -> tuple[int, dict]:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req_headers = {"Accept": "application/json", **(headers or {})}
    if data is not None:
        req_headers.setdefault("Content-Type", "application/json")
    req = Request(url, data=data, headers=req_headers, method=method)
    try:
        with urlopen(req, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except HTTPError as err:
        raw = err.read().decode("utf-8", errors="replace")
        try:
            return err.code, json.loads(raw)
        except Exception:
            return err.code, {"error": {"message": raw or f"HTTP {err.code}"}}


def _kling_bases(base_url: str) -> list[str]:
    clean = base_url.rstrip("/")
    if clean == "https://api.klingai.com":
        return ["https://api-beijing.klingai.com", "https://api-singapore.klingai.com", "https://api.klingai.com"]
    candidates = [clean]
    for fallback in ("https://api-beijing.klingai.com", "https://api-singapore.klingai.com"):
        if fallback not in candidates:
            candidates.append(fallback)
    return candidates


def _is_auth_error(status: int, payload: dict) -> bool:
    msg = str(payload.get("message") or payload.get("error", {}).get("message") or "").lower()
    code = payload.get("code")
    return status == 401 or code in (1000, 1001, 1002, 1003, 1004) or "auth" in msg or "api key" in msg


def _extract_error(status: int, payload: dict) -> str:
    detail = payload.get("data", {}).get("详情") if isinstance(payload.get("data"), dict) else None
    return str(detail or payload.get("msg") or payload.get("message") or payload.get("error", {}).get("message") or f"HTTP {status}")


def _kling_request_spec(model_name: str, preset: str, b64_img: str) -> tuple[str, dict, str]:
    """Return (create_path, payload, api_kind) matching official Kling Image API docs."""
    prompt = PRESET_PROMPTS.get(preset, PRESET_PROMPTS["floral"])
    if model_name == "kling-4.0":
        return (
            "/image-generation/kling-4.0",
            {
                "contents": [
                    {"type": "refer_image", "url": b64_img, "id": "selfie"},
                    {"type": "prompt", "text": f"以 @selfie 中的人物为主体，保持人物相貌与五官一致，{prompt}"},
                ],
                "settings": {"result_type": "single", "n": 1, "resolution": "2k", "aspect_ratio": "3:4"},
            },
            "v4",
        )
    if model_name in ("kling-v3-omni", "kling-image-o1"):
        return (
            "/v1/images/omni-image",
            {
                "model_name": model_name,
                "prompt": f"以 <<<image_1>>> 中的人物为主体，保持人物相貌与五官一致，{prompt}",
                "image_list": [{"image": b64_img}],
                "resolution": "1k",
                "aspect_ratio": "3:4",
                "n": 1,
            },
            "omni",
        )
    payload: dict = {
        "model_name": model_name if model_name in ("kling-v3", "kling-v2-1") else "kling-v2-1",
        "prompt": prompt,
        "image": b64_img,
        "resolution": "1k",
        "aspect_ratio": "3:4",
        "n": 1,
    }
    if payload["model_name"] == "kling-v2-1":
        payload["image_reference"] = "face"
        payload["image_fidelity"] = 0.5
    return ("/v1/images/generations", payload, "v1")


def _build_lk_params(param_defs: list[dict], data_uri: str) -> dict:
    params: dict = {}
    upload_param = next((p for p in param_defs if p.get("type") == "upload" and p.get("name")), None)
    if upload_param:
        uname = upload_param["name"]
        plural_names = ("images", "image_urls", "ref_images", "reference_images", "files", "attachments")
        params[uname] = [data_uri] if (uname.endswith("s") or uname in plural_names) else data_uri
    else:
        params["images"] = [data_uri]

    for p in param_defs:
        if not p.get("required") or not p.get("name") or p.get("name") == "prompt" or p.get("type") == "upload":
            continue
        pname = p["name"]
        opts = [o["value"] if isinstance(o, dict) else o for o in (p.get("options") or [])]
        opts = [o for o in opts if o is not None and o != ""]
        if not opts:
            continue
        lower = pname.lower()
        if "aspect" in lower or ("size" in lower and "3:4" in opts):
            params[pname] = "3:4" if "3:4" in opts else ("1:1" if "1:1" in opts else opts[0])
        elif "size" in lower or "resolution" in lower:
            chosen = next((cand for cand in ("1K", "1k", "2K", "2k") if cand in opts), None)
            params[pname] = chosen or opts[0]
        else:
            params[pname] = opts[0]
    return params


class FestivalHandler(SimpleHTTPRequestHandler):
    def _send_json(self, status: int, data: dict) -> None:
        raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def _send_bytes(self, status: int, content_type: str, data: bytes) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/proxy/models":
            self._handle_models(parsed.query)
            return
        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/kling/image":
            self._handle_kling_image()
            return
        self._send_json(HTTPStatus.NOT_FOUND, {"error": {"message": "Not found"}})

    def _handle_models(self, query: str) -> None:
        target = (parse_qs(query).get("target") or [""])[0].strip()
        parsed_target = urlparse(target)
        if parsed_target.scheme != "https" or not parsed_target.netloc:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": {"message": "Invalid target URL"}})
            return
        auth = self.headers.get("Authorization", "").strip()
        host = (parsed_target.hostname or "").lower()
        origin = f"{parsed_target.scheme}://{parsed_target.netloc}"

        if _is_lk_host(host):
            if not auth:
                self._send_json(HTTPStatus.UNAUTHORIZED, {"error": {"message": "Missing API key"}})
                return
            try:
                status, payload = _http_json(
                    f"{origin}/v1/skills/models?type=image",
                    headers={"Authorization": auth, "Accept-Language": "zh-CN"},
                    timeout=15,
                )
            except URLError as err:
                self._send_json(HTTPStatus.BAD_GATEWAY, {"error": {"message": str(err.reason)}})
                return
            if status >= 400:
                self._send_json(status, {"error": {"message": _extract_error(status, payload)}})
                return
            available = [m for m in payload.get("models", []) if isinstance(m, dict) and m.get("name") and m.get("available_for_this_key", True) is not False]
            data = [
                {
                    "id": m["name"],
                    "name": f"{m.get('display_name') or m['name']} ({m['name']})",
                    "object": "model",
                    "owned_by": "lingkeai",
                }
                for m in available
            ]
            self._send_json(HTTPStatus.OK, {"object": "list", "endpoint": origin, "data": data})
            return

        if host == "klingai.com" or host.endswith(".klingai.com"):
            if not auth:
                self._send_json(HTTPStatus.UNAUTHORIZED, {"error": {"message": "Missing Kling API key"}})
                return
            last_status, last_payload = HTTPStatus.UNAUTHORIZED, {"error": {"message": "Auth failed"}}
            try:
                for candidate in _kling_bases(origin):
                    status, payload = _http_json(
                        f"{candidate}/v1/images/generations?pageNum=1&pageSize=1",
                        headers={"Authorization": auth},
                        timeout=10,
                    )
                    if status < 400 and payload.get("code", 0) == 0:
                        self._send_json(
                            HTTPStatus.OK,
                            {"object": "list", "endpoint": candidate, "data": KLING_IMAGE_MODELS},
                        )
                        return
                    last_status, last_payload = status, payload
                    if not _is_auth_error(status, payload):
                        break
            except URLError as err:
                self._send_json(HTTPStatus.BAD_GATEWAY, {"error": {"message": str(err.reason)}})
                return
            self._send_json(
                last_status if last_status >= 400 else HTTPStatus.UNAUTHORIZED,
                {"error": {"message": _extract_error(last_status, last_payload)}},
            )
            return

        try:
            status, payload = _http_json(target, headers={"Authorization": auth} if auth else {})
            if status == 404 and "/v1/models" not in target:
                status, payload = _http_json(f"{origin}/v1/models", headers={"Authorization": auth} if auth else {})
            self._send_json(status, payload)
        except URLError as err:
            self._send_json(HTTPStatus.BAD_GATEWAY, {"error": {"message": str(err.reason)}})

    def _handle_lk_image(self, base_url: str, auth: str, image_bytes: bytes, preset: str, model_name: str) -> None:
        chosen_model = model_name or "banana-2"
        mime = _detect_image_mime(image_bytes)
        b64_img = base64.b64encode(image_bytes).decode("ascii")
        data_uri = f"data:{mime};base64,{b64_img}"
        try:
            param_defs: list[dict] = []
            info_status, info_payload = _http_json(
                f"{base_url}/v1/skills/models/{chosen_model}",
                headers={"Authorization": auth, "Accept-Language": "zh-CN"},
                timeout=12,
            )
            if info_status < 400 and isinstance(info_payload.get("params"), list):
                param_defs = info_payload["params"]

            params = _build_lk_params(param_defs, data_uri)
            base_prompt = PRESET_PROMPTS.get(preset, PRESET_PROMPTS["floral"])
            if chosen_model == "kling-v3-omni":
                prompt = f"以 <<<image_1>>> 中的人物为主体，严格保持参考图中人物的面部五官与相貌特征，{base_prompt}"
            else:
                prompt = f"以参考图中的人物为主体，严格保持参考图中人物的面部五官、脸型与相貌特征，{base_prompt}"

            status, created = _http_json(
                f"{base_url}/v1/media/generate",
                method="POST",
                headers={"Authorization": auth},
                payload={"model": chosen_model, "prompt": prompt, "params": params},
                timeout=30,
            )
            if status >= 400 or created.get("code") != 200:
                code_val = created.get("code")
                err_status = status if status >= 400 else (code_val if isinstance(code_val, int) and 400 <= code_val < 600 else HTTPStatus.BAD_GATEWAY)
                self._send_json(err_status, {"error": {"message": _extract_error(err_status, created)}})
                return

            created_data = created.get("data") or {}
            task_id = created_data.get("task_id") or (created_data.get("task_ids") or [None])[0]
            if not task_id:
                self._send_json(HTTPStatus.BAD_GATEWAY, {"error": {"message": "Missing task_id"}})
                return

            deadline = time.monotonic() + 110.0
            image_url = ""
            while time.monotonic() < deadline:
                time.sleep(2.0)
                poll_status, polled = _http_json(
                    f"{base_url}/v1/skills/task-status?task_id={task_id}",
                    headers={"Authorization": auth, "Accept-Language": "zh-CN"},
                    timeout=15,
                )
                if poll_status >= 400:
                    continue
                if polled.get("is_final"):
                    if polled.get("state") == "success":
                        image_url = polled.get("result_url") or (polled.get("result_urls") or [""])[0]
                        break
                    msg = polled.get("error") or polled.get("status") or "Image generation failed"
                    self._send_json(HTTPStatus.BAD_GATEWAY, {"error": {"message": str(msg)}})
                    return

            if not image_url:
                self._send_json(HTTPStatus.GATEWAY_TIMEOUT, {"error": {"message": "Image generation timed out"}})
                return

            with urlopen(Request(image_url, headers={"User-Agent": "RenriFestival/1.0"}), timeout=25) as img_resp:
                img_ct = img_resp.headers.get("Content-Type", "image/jpeg")
                img_data = img_resp.read()
            self._send_bytes(HTTPStatus.OK, img_ct, img_data)
        except URLError as err:
            self._send_json(HTTPStatus.BAD_GATEWAY, {"error": {"message": str(err.reason)}})

    def _handle_kling_image(self) -> None:
        content_type = self.headers.get("Content-Type", "")
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0 or length > 20 * 1024 * 1024:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": {"message": "Invalid request size"}})
            return
        fields = _parse_multipart(content_type, self.rfile.read(length))
        image_bytes = fields.get("image", b"")
        if not image_bytes:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": {"message": "Missing image"}})
            return
        preset = fields.get("preset", b"floral").decode("utf-8", "ignore").strip() or "floral"
        model_name = fields.get("model", b"").decode("utf-8", "ignore").strip()
        target_raw = fields.get("target", LK_DEFAULT_BASE.encode("ascii")).decode("utf-8", "ignore").strip()
        parsed_target = urlparse(target_raw or LK_DEFAULT_BASE)
        if parsed_target.scheme != "https" or not parsed_target.netloc:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": {"message": "Invalid Image API URL"}})
            return
        base_url = f"{parsed_target.scheme}://{parsed_target.netloc}"
        auth = self.headers.get("Authorization", "").strip()
        if not auth:
            self._send_json(HTTPStatus.UNAUTHORIZED, {"error": {"message": "Missing API key"}})
            return

        host = (parsed_target.hostname or "").lower()
        if _is_lk_host(host):
            self._handle_lk_image(base_url, auth, image_bytes, preset, model_name)
            return

        b64_img = base64.b64encode(image_bytes).decode("ascii")
        create_path, payload, api_kind = _kling_request_spec(model_name or "kling-v3", preset, b64_img)
        try:
            active_base = base_url
            status, created = 0, {}
            for candidate in _kling_bases(base_url):
                active_base = candidate
                status, created = _http_json(
                    f"{candidate}{create_path}",
                    method="POST",
                    headers={"Authorization": auth},
                    payload=payload,
                    timeout=30,
                )
                if _is_auth_error(status, created):
                    continue
                break
            if status >= 400 or created.get("code", 0) != 0:
                self._send_json(
                    status if status >= 400 else HTTPStatus.BAD_GATEWAY,
                    {"error": {"message": _extract_error(status, created)}},
                )
                return

            created_data = created.get("data") or {}
            task_id = created_data.get("id") if api_kind == "v4" else created_data.get("task_id")
            if not task_id:
                self._send_json(HTTPStatus.BAD_GATEWAY, {"error": {"message": "Missing Kling task_id"}})
                return

            if api_kind == "v4":
                poll_url = f"{active_base}/tasks?task_ids={task_id}"
            elif api_kind == "omni":
                poll_url = f"{active_base}/v1/images/omni-image/{task_id}"
            else:
                poll_url = f"{active_base}/v1/images/generations/{task_id}"

            deadline = time.monotonic() + 90.0
            image_url = ""
            while time.monotonic() < deadline:
                time.sleep(2.0)
                poll_status, polled = _http_json(poll_url, headers={"Authorization": auth}, timeout=15)
                if poll_status >= 400:
                    continue
                if api_kind == "v4":
                    items = polled.get("data") or []
                    item = items[0] if isinstance(items, list) and items else {}
                    task_status = item.get("status")
                    if task_status == "succeeded":
                        outputs = item.get("outputs") or []
                        for out in outputs:
                            if out.get("url"):
                                image_url = out["url"]
                                break
                        break
                    if task_status == "failed":
                        msg = item.get("message") or "Kling generation failed"
                        self._send_json(HTTPStatus.BAD_GATEWAY, {"error": {"message": msg}})
                        return
                else:
                    data = polled.get("data") or {}
                    task_status = data.get("task_status")
                    if task_status == "succeed":
                        result = data.get("task_result") or {}
                        images = result.get("images") or result.get("series_images") or []
                        if images and images[0].get("url"):
                            image_url = images[0]["url"]
                        break
                    if task_status == "failed":
                        msg = data.get("task_status_msg") or "Kling generation failed"
                        self._send_json(HTTPStatus.BAD_GATEWAY, {"error": {"message": msg}})
                        return

            if not image_url:
                self._send_json(HTTPStatus.GATEWAY_TIMEOUT, {"error": {"message": "Kling generation timed out"}})
                return

            with urlopen(Request(image_url, headers={"User-Agent": "RenriFestival/1.0"}), timeout=25) as img_resp:
                img_ct = img_resp.headers.get("Content-Type", "image/png")
                img_data = img_resp.read()
            self._send_bytes(HTTPStatus.OK, img_ct, img_data)
        except URLError as err:
            self._send_json(HTTPStatus.BAD_GATEWAY, {"error": {"message": str(err.reason)}})


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), FestivalHandler)
    print(f"Serving Renri Festival with proxy at http://{HOST}:{PORT}/")
    server.serve_forever()
