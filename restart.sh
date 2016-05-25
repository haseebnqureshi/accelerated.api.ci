#!/bin/bash

FOREVER_LIST=$(forever list)
FOREVER_LIST_EMPTY="info:    No forever processes running"

# Use forever to see whether we can restart, or if
# nothing's running, we start a new process.

if [ ! "$FOREVER_LIST" = "$FOREVER_LIST_EMPTY" ]; then
	forever restartall
else 
	forever start $1
fi
