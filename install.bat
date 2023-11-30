CALL npm install
CALL npm install electron --global
CALL npx playwright install-deps firefox
CALL npx playwright install firefox

CALL cd .\main\
CALL npm run build