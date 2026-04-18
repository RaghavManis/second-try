const mysql = require('mysql2/promise');

async function checkPlayerTeams() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Raghav@24',
        database: 'cricket_db'
    });

    try {
        console.log("--- Player to Team Mappings ---");
        const [rows] = await conn.execute(`
            SELECT p.id as player_id, p.name as player_name, t.team_name, t.team_type
            FROM players p
            JOIN team_players tp ON p.id = tp.player_id
            JOIN teams t ON tp.team_id = t.id
            ORDER BY t.team_name;
        `);
        console.table(rows);

        console.log("\n--- Teams Count ---");
        const [teams] = await conn.execute("SELECT count(*) as count FROM teams");
        console.log("Total Teams:", teams[0].count);

        console.log("\n--- Team Players Count ---");
        const [tpCount] = await conn.execute("SELECT count(*) as count FROM team_players");
        console.log("Total Team-Player Associations:", tpCount[0].count);

    } catch (err) {
        console.error(err);
    } finally {
        await conn.end();
    }
}

checkPlayerTeams();
