#!/bin/bash
./vnc.sh

export DISPLAY=:1
exec node --max-http-header-size=65535 --http-parser=legacy ./node_modules/.bin/worker-entrypoint
