#!/bin/bash

PORT=5901

USER=node vncserver :1 -geometry 1280x800 -depth 24 2>/dev/null 1>/dev/null

while ! nc -q 1 localhost $PORT </dev/null; do sleep 1; done

echo "VNC server is listening on port $PORT"
