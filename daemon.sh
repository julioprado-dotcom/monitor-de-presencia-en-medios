#!/bin/bash
PIDFILE="/tmp/connect-daemon.pid"
LOGFILE="/tmp/connect-server.log"
cd /home/z/my-project/connect

# Stop existing
if [ -f "$PIDFILE" ]; then
  OLDPID=$(cat "$PIDFILE")
  kill -9 "$OLDPID" 2>/dev/null
  rm -f "$PIDFILE"
fi

# Launch as fully detached process
nohup npx next dev --port 3000 >> "$LOGFILE" 2>&1 &
echo $! > "$PIDFILE"
echo "Started PID $(cat $PIDFILE)"
