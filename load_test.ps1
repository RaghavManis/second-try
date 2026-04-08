Write-Host "Running 20 users..."
npx -y autocannon -c 20 -d 10 --json http://localhost:8081/api/teams > test_20.json
Write-Host "Running 50 users..."
npx -y autocannon -c 50 -d 10 --json http://localhost:8081/api/teams > test_50.json
Write-Host "Running 100 users..."
npx -y autocannon -c 100 -d 10 --json http://localhost:8081/api/teams > test_100.json
Write-Host "Running 200 users..."
npx -y autocannon -c 200 -d 10 --json http://localhost:8081/api/teams > test_200.json
Write-Host "Done"
