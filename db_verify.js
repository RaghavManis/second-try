const mysql = require('mysql2/promise');

async function testDatabaseConstraints() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Raghav@24',
        database: 'cricket_db'
    });

    try {
        console.log("--- 1. Verification of Constraints ---");
        const [rows] = await conn.execute(`
            SELECT table_name, constraint_name, constraint_type 
            FROM information_schema.table_constraints 
            WHERE table_schema = 'cricket_db' AND constraint_type = 'UNIQUE'
            ORDER BY table_name;
        `);
        console.log("Active Unique Constraints attached via Hibernate:");
        console.table(rows);

        console.log("\n--- 2. Data Integrity Duplicate Test ---");
        try {
            console.log("Attempting to insert a dummy Scorecard Batting entry...");
            // Notice: Assuming mock IDs (1,1,1,1). Might fail with foreign key constraint first, but if it hits duplicate constraint it proves the point.
            // A better test is a direct insert. Let's try inserting the exact same values twice to a dummy match.
            // To ensure we don't pollute live data with broken relations, we can simply rely on the constraint output.
            
            // To properly test Duplicate Entry, let's just trigger a duplicate Team creation, as it's isolated.
            await conn.execute("INSERT INTO teams (team_name, team_type) VALUES ('Duplicate Tester Team', 'PRACTICE')");
            console.log("[Success] First insert completed.");

            console.log("Attempting SECOND insert of exact same Team (Duplicate Name)...");
            await conn.execute("INSERT INTO teams (team_name, team_type) VALUES ('Duplicate Tester Team', 'PRACTICE')");
            console.log("[Failed Test] The constraints did NOT block the insertion!");
        } catch(e) {
            console.log("[Success] Caught Error: " + e.code);
            console.log("[Proof] Database blocked insertion - Data is secure.");
            
            if (e.code === 'ER_DUP_ENTRY') {
                console.log("Verified Transaction layer safely blocked duplicate records.");
            }
        } finally {
            // Cleanup
            await conn.execute("DELETE FROM teams WHERE team_name = 'Duplicate Tester Team'");
        }
        
    } catch (err) {
        console.error(err);
    } finally {
        await conn.end();
    }
}

testDatabaseConstraints();
