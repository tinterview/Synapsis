#!/bin/bash

# Stop backend
if [ -f backend.pid ]; then
    kill -9 $(cat backend.pid) && rm backend.pid
    echo "Backend stopped."
else
    echo "No backend PID found."
fi

# Stop frontend
if [ -f frontend.pid ]; then
    kill -9 $(cat frontend.pid) && rm frontend.pid
    echo "Frontend stopped."
else
    echo "No frontend PID found."
fi
