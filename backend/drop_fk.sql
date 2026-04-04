USE cricket_db;

SET @ConstraintName = (
    SELECT CONSTRAINT_NAME
    FROM information_schema.key_column_usage
    WHERE TABLE_NAME = 'players' AND COLUMN_NAME = 'team_id' AND table_schema = 'cricket_db' LIMIT 1
);

SET @SQL = IF(@ConstraintName IS NOT NULL, CONCAT('ALTER TABLE players DROP FOREIGN KEY ', @ConstraintName), 'SELECT "No FK found"');
PREPARE stmt FROM @SQL;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE players DROP COLUMN team_id;
