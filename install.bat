CALL npm install
CALL npm install electron@28.0.0 --global
CALL npx playwright install-deps firefox
CALL npx playwright install firefox

CALL cd .\main\
CALL npm run build