#!/bin/bash
export DISPLAY=:99
xvfb-run -a node /root/.openclaw/workspace/scripts/update-returnplus-kb.js >> /tmp/kb-update.log 2>&1
