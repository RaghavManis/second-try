const mysql = require('mysql2/promise');

async function checkData() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Raghav@24',
        database: 'cricket_db'
    });

    try {
        console.log("--- Scorecard Batting ---");
        const [batting] = await conn.execute("SELECT * FROM scorecard_batting LIMIT 5");
        console.table(batting);

        console.log("\n--- Matches ---");
        const [matches] = await conn.execute("SELECT id, match_type, status FROM matches LIMIT 5");
        console.table(matches);

        console.log("\n--- Top Scorers Aggregation ---");
        const [topScorers] = await conn.execute(`
            SELECT p.name, SUM(s.runs) as totalRuns 
            FROM scorecard_batting s 
            JOIN players p ON s.player_id = p.id 
            GROUP BY s.player_id, p.name 
            ORDER BY totalRuns DESC 
            LIMIT 5
        `);
        console.table(topScorers);
    } catch (err) {
        console.error(err);
    } finally {
        await conn.end();
    }
}

checkData();
