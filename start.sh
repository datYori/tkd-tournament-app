#! /usr/bin/env bash

existing_container="$(docker ps -aq --filter "name=.*tournament*")"

if [ -z "$existing_container" ]; then
  docker run --name tournament-mongo -p 27017:27017 -d mongo
else
  docker start $existing_container
fi

node server.js
