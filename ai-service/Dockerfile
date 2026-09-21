# syntax=docker/dockerfile:1

FROM python:3.11-slim

WORKDIR /app

# Extra CA certificates for networks that intercept HTTPS (see certs/README.md).
# `certs` is a named build context supplied by compose. pip uses its own
# bundle by default, so point it at the system one once ours is merged in.
COPY --from=certs . /tmp/certs/
RUN for f in /tmp/certs/*.crt; do [ -e "$f" ] && cp "$f" /usr/local/share/ca-certificates/; done; \
    update-ca-certificates
ENV PIP_CERT=/etc/ssl/certs/ca-certificates.crt

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
