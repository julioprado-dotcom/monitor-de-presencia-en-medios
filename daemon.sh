#!/bin/bash
PIDFILE="/tmp/connect-daemon.pid"
LOGFILE="/tmp/connect-server.log"
cd /home/z/my-project/connect

# Stop existing
if [ -f "$PIDFILE" ]; then
  OLDPID=$(cat "$PIDFILE")
  kill -9 "$OLDPID" 2>/dev/null
  rm -f "$PIDFILE"
  sleep 1
fi

# Clean turbopack dev cache if corrupted (stale chunks from previous dev sessions)
if [ -d ".next/dev/cache/turbopack" ]; then
  rm -rf ".next/dev/cache/turbopack"/*
fi
if [ -d ".next/dev/static/chunks" ]; then
  rm -rf ".next/dev/static/chunks"/*
fi

# PROTOCOLO CONTEXTO.md: Usar next start (produccion), NUNCA next dev
# Sin NODE_OPTIONS — el container tiene 8192 MB, el baseline es ~2.5 GB
nohup npx next start -p 3000 >> "$LOGFILE" 2>&1 &
echo $! > "$PIDFILE"
echo "Started PID $(cat $PIDFILE)"
