#!/bin/bash

npm install
npm install electron --global
npx playwright install-deps firefox
npx playwright install firefox

cd ./main/
npm run build