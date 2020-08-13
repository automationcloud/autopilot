#!/bin/bash
./vnc.sh

export DISPLAY=:1
exec node --max-http-header-size=65535 ./node_modules/.bin/worker-entrypoint
