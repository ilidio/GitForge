#!/bin/bash
set -e

echo "Running Client Tests..."
cd gitforge-client
npm test -- --run

echo ""
echo "Running Server Tests..."
cd ../gitforge-server.Tests
dotnet test

echo ""
echo "All tests passed!"
