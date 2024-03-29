#!/usr/bin/env bash

echo "Recompiling TypeScript"
rm -f .lugo/.done || true
npm run tsc
touch .lugo/.done
echo "Done"