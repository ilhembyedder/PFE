# Extra CA certificates for Docker builds

Drop PEM-encoded CA certificates here as `*.crt` files. `docker compose build`
passes this directory to every image build (`additional_contexts: certs`), and
each Dockerfile adds any certificate it finds to the build's trust store:

- backend: imported into the JDK `cacerts` keystore (Maven downloads)
- frontend: `NODE_EXTRA_CA_CERTS` for npm, plus the system bundle with
  `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1` for the Google Fonts
  download Turbopack performs during `next build`
- ai-service: system bundle + `PIP_CERT` (pip install)

This is for networks where a proxy or endpoint-security product (e.g. Trend
Micro Web Security) re-signs HTTPS traffic with its own CA. On a network without
interception the directory can stay empty; the builds skip the step.

Only `README.md` is tracked by git. The certificates themselves are specific to
the machine or organisation and must not be committed.

Building a single image without compose:

    docker build --build-context certs=./certs ./backend