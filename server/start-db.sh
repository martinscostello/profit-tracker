#!/bin/bash
# Start MongoDB locally
echo "Starting local MongoDB on port 27017..."
./mongodb/bin/mongod --dbpath ./mongodb/data --port 27017 --bind_ip 0.0.0.0
