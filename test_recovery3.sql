-- MySQL dump 10.13  Distrib 9.6.0, for Win64 (x86_64)
--
-- Host: localhost    Database: cricket_db
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ball_events`
--

DROP TABLE IF EXISTS `ball_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ball_events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ball_number` int NOT NULL,
  `extra_runs` int DEFAULT NULL,
  `extra_type` varchar(255) DEFAULT NULL,
  `innings` int NOT NULL,
  `is_wicket` bit(1) DEFAULT NULL,
  `over_number` int NOT NULL,
  `runs` int NOT NULL,
  `wicket_type` varchar(255) DEFAULT NULL,
  `bowler_id` bigint NOT NULL,
  `match_id` bigint NOT NULL,
  `non_striker_id` bigint NOT NULL,
  `player_out_id` bigint DEFAULT NULL,
  `striker_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK48ob45ker6k436wl21uvic8g9` (`bowler_id`),
  KEY `FKfy1b5eaopt29wiuma151my7mm` (`non_striker_id`),
  KEY `FKfm3q82yutrep20wme4r8mvbxl` (`player_out_id`),
  KEY `FKck7kt8skpcaammwvc39n8x40o` (`striker_id`),
  KEY `idx_ball_match_innings` (`match_id`,`innings`,`over_number`,`ball_number`,`id`),
  CONSTRAINT `FK48ob45ker6k436wl21uvic8g9` FOREIGN KEY (`bowler_id`) REFERENCES `players` (`id`),
  CONSTRAINT `FKck7kt8skpcaammwvc39n8x40o` FOREIGN KEY (`striker_id`) REFERENCES `players` (`id`),
  CONSTRAINT `FKfm3q82yutrep20wme4r8mvbxl` FOREIGN KEY (`player_out_id`) REFERENCES `players` (`id`),
  CONSTRAINT `FKfy1b5eaopt29wiuma151my7mm` FOREIGN KEY (`non_striker_id`) REFERENCES `players` (`id`),
  CONSTRAINT `FKpp3eeb1ommls7qsjac58jihfo` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=643 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ball_events`
--

LOCK TABLES `ball_events` WRITE;
/*!40000 ALTER TABLE `ball_events` DISABLE KEYS */;
INSERT INTO `ball_events` VALUES (563,1,0,NULL,1,_binary '\0',0,0,NULL,16,23,23,NULL,10),(564,2,0,NULL,1,_binary '\0',0,6,NULL,16,23,23,NULL,10),(565,3,0,NULL,1,_binary '\0',0,6,NULL,16,23,23,NULL,10),(566,4,0,NULL,1,_binary '\0',0,4,NULL,16,23,23,NULL,10),(567,5,0,NULL,1,_binary '',0,0,'CAUGHT',16,23,23,10,10),(568,6,0,NULL,1,_binary '',0,0,'BOWLED',16,23,23,26,26),(569,1,0,NULL,1,_binary '\0',1,0,NULL,1,23,6,NULL,23),(570,2,0,NULL,1,_binary '\0',1,1,NULL,1,23,6,NULL,23),(571,3,0,NULL,1,_binary '\0',1,6,NULL,1,23,23,NULL,6),(572,4,0,NULL,1,_binary '',1,0,'RUN_OUT',1,23,23,6,6),(573,5,0,NULL,1,_binary '\0',1,6,NULL,1,23,23,NULL,22),(574,6,0,NULL,1,_binary '\0',1,4,NULL,1,23,23,NULL,22),(575,1,0,NULL,2,_binary '\0',0,0,NULL,22,23,3,NULL,5),(576,2,0,NULL,2,_binary '\0',0,0,NULL,22,23,3,NULL,5),(577,3,0,NULL,2,_binary '\0',0,6,NULL,22,23,3,NULL,5),(578,4,0,NULL,2,_binary '\0',0,4,NULL,22,23,3,NULL,5),(579,5,0,NULL,2,_binary '\0',0,6,NULL,22,23,3,NULL,5),(580,6,0,NULL,2,_binary '\0',0,4,NULL,22,23,3,NULL,5),(581,1,0,NULL,2,_binary '\0',1,1,NULL,25,23,5,NULL,3),(582,2,0,NULL,2,_binary '',1,0,'BOWLED',25,23,3,5,5),(583,3,0,NULL,2,_binary '\0',1,4,NULL,25,23,3,NULL,19),(584,4,0,NULL,2,_binary '\0',1,6,NULL,25,23,3,NULL,19),(585,5,0,NULL,2,_binary '\0',1,6,NULL,25,23,3,NULL,19),(630,1,0,NULL,1,_binary '\0',0,3,NULL,5,27,5,NULL,17),(631,2,0,NULL,1,_binary '\0',0,6,NULL,5,27,17,NULL,5),(632,3,0,NULL,1,_binary '',0,0,'BOWLED',5,27,17,5,5),(633,4,0,NULL,1,_binary '\0',0,6,NULL,5,27,17,NULL,1),(634,5,0,NULL,1,_binary '\0',0,4,NULL,5,27,17,NULL,1),(635,5,0,'NO_BALL',1,_binary '',0,1,'LBW',5,27,17,1,1),(636,6,0,NULL,1,_binary '\0',0,6,NULL,5,27,41,NULL,17),(637,1,0,NULL,2,_binary '\0',0,0,NULL,17,27,1,NULL,20),(638,2,0,NULL,2,_binary '\0',0,0,NULL,17,27,1,NULL,20),(639,3,0,NULL,2,_binary '\0',0,2,NULL,17,27,1,NULL,20),(640,4,0,NULL,2,_binary '\0',0,6,NULL,17,27,1,NULL,20),(641,5,0,NULL,2,_binary '',0,0,'BOWLED',17,27,1,20,20),(642,6,0,NULL,2,_binary '',0,0,'BOWLED',17,27,1,3,3);
/*!40000 ALTER TABLE `ball_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gallery_images`
--

DROP TABLE IF EXISTS `gallery_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gallery_images` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `image_url` varchar(1024) NOT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gallery_images`
--

LOCK TABLES `gallery_images` WRITE;
/*!40000 ALTER TABLE `gallery_images` DISABLE KEYS */;
INSERT INTO `gallery_images` VALUES (1,'https://res.cloudinary.com/djp3qikuv/image/upload/v1773995701/qpvylv8r9m65wkfstnao.jpg','2026-03-20 08:35:01.355821'),(2,'https://res.cloudinary.com/djp3qikuv/image/upload/v1773995709/rm2o1nrdtj6mekccy4ft.jpg','2026-03-20 08:35:09.085334'),(3,'https://res.cloudinary.com/djp3qikuv/image/upload/v1773995714/aak6log3bh8ddblbcw8o.jpg','2026-03-20 08:35:14.423672'),(4,'https://res.cloudinary.com/djp3qikuv/image/upload/v1773995721/bxjrk4wpxwfuyorm0hn6.jpg','2026-03-20 08:35:20.877750'),(5,'https://res.cloudinary.com/djp3qikuv/image/upload/v1773995725/gspnpptk8cn5kargoybu.jpg','2026-03-20 08:35:25.474156'),(6,'https://res.cloudinary.com/djp3qikuv/image/upload/v1773995730/kzgkfb6avfrl1tz3y8wy.jpg','2026-03-20 08:35:30.761743'),(7,'https://res.cloudinary.com/djp3qikuv/image/upload/v1773995736/zrzukbkvbw8zl8yoxsmp.jpg','2026-03-20 08:35:36.693092'),(8,'https://res.cloudinary.com/djp3qikuv/image/upload/v1773995741/bc5rweroae2dn0ejnsyk.jpg','2026-03-20 08:35:41.832345'),(9,'https://res.cloudinary.com/djp3qikuv/image/upload/v1773995747/cuye95vxspdzis9cjhy5.jpg','2026-03-20 08:35:47.338515'),(10,'https://res.cloudinary.com/djp3qikuv/image/upload/v1773995753/i14mdqusboqx4petxk4j.jpg','2026-03-20 08:35:53.377966'),(11,'https://res.cloudinary.com/djp3qikuv/image/upload/v1773995759/sxhx0uklskwjbh2qf9mf.jpg','2026-03-20 08:35:58.956852');
/*!40000 ALTER TABLE `gallery_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `match_playing_xi_a`
--

DROP TABLE IF EXISTS `match_playing_xi_a`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `match_playing_xi_a` (
  `match_id` bigint NOT NULL,
  `player_id` bigint NOT NULL,
  PRIMARY KEY (`match_id`,`player_id`),
  KEY `FKcwhce263a4xoixg83eqnu26vq` (`player_id`),
  CONSTRAINT `FKcwhce263a4xoixg83eqnu26vq` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
  CONSTRAINT `FKdmiq7n5q6o0mr4e63vyeogeqi` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `match_playing_xi_a`
--

LOCK TABLES `match_playing_xi_a` WRITE;
/*!40000 ALTER TABLE `match_playing_xi_a` DISABLE KEYS */;
INSERT INTO `match_playing_xi_a` VALUES (23,1),(27,1),(23,2),(27,2),(23,3),(27,3),(23,4),(27,4),(23,5),(27,5),(23,16),(27,16),(23,17),(27,17),(23,18),(27,18),(23,19),(27,19),(23,20),(27,20),(23,21),(27,21);
/*!40000 ALTER TABLE `match_playing_xi_a` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `match_playing_xi_b`
--

DROP TABLE IF EXISTS `match_playing_xi_b`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `match_playing_xi_b` (
  `match_id` bigint NOT NULL,
  `player_id` bigint NOT NULL,
  PRIMARY KEY (`match_id`,`player_id`),
  KEY `FK9q9a85mul3ha09cqt6r622e4q` (`player_id`),
  CONSTRAINT `FK9q9a85mul3ha09cqt6r622e4q` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
  CONSTRAINT `FKlvvvm3kqc1idvlxf2yaxhq3w4` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `match_playing_xi_b`
--

LOCK TABLES `match_playing_xi_b` WRITE;
/*!40000 ALTER TABLE `match_playing_xi_b` DISABLE KEYS */;
INSERT INTO `match_playing_xi_b` VALUES (27,1),(27,2),(27,3),(27,5),(23,6),(23,7),(23,8),(23,9),(23,10),(27,16),(27,17),(27,18),(27,19),(27,20),(23,22),(23,23),(23,24),(23,25),(23,26),(23,27),(27,41),(27,42);
/*!40000 ALTER TABLE `match_playing_xi_b` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matches`
--

DROP TABLE IF EXISTS `matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matches` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `current_balls` int DEFAULT NULL,
  `current_innings` int DEFAULT NULL,
  `current_score` int DEFAULT NULL,
  `current_wickets` int DEFAULT NULL,
  `match_date` date NOT NULL,
  `overs` int NOT NULL,
  `status` enum('SCHEDULED','ONGOING','COMPLETED') NOT NULL,
  `target_score` int DEFAULT NULL,
  `toss_decision` varchar(255) DEFAULT NULL,
  `batting_team_id` bigint DEFAULT NULL,
  `bowling_team_id` bigint DEFAULT NULL,
  `current_bowler_id` bigint DEFAULT NULL,
  `current_non_striker_id` bigint DEFAULT NULL,
  `current_striker_id` bigint DEFAULT NULL,
  `team_a_id` bigint NOT NULL,
  `team_b_id` bigint NOT NULL,
  `toss_winner_id` bigint DEFAULT NULL,
  `winner_team_id` bigint DEFAULT NULL,
  `result` varchar(255) DEFAULT NULL,
  `man_of_the_match_id` bigint DEFAULT NULL,
  `first_innings_score` int DEFAULT NULL,
  `first_innings_wickets` int DEFAULT NULL,
  `first_innings_balls` int DEFAULT NULL,
  `match_type` enum('TOURNAMENT','PRACTICE') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKdvvo8d727vumqywhahghwqh4w` (`batting_team_id`),
  KEY `FKqobxtx0acj9lqghp89f7jfw7f` (`bowling_team_id`),
  KEY `FKiiy0qvvv6y5p27qul9xhitelp` (`current_bowler_id`),
  KEY `FKl537indahn5dahm8hbnehvy2e` (`current_non_striker_id`),
  KEY `FKc8luaq6tvdv9qi10naf1ua94q` (`current_striker_id`),
  KEY `FKpf41hapqtm6mc2t8xnr7ei4b0` (`toss_winner_id`),
  KEY `FKn66swy9if3qemrk5407f81hc5` (`winner_team_id`),
  KEY `FK9faw8bon46wyynfu5o6hj3ub5` (`man_of_the_match_id`),
  KEY `idx_match_team_a` (`team_a_id`),
  KEY `idx_match_team_b` (`team_b_id`),
  KEY `idx_match_status` (`status`),
  CONSTRAINT `FK9faw8bon46wyynfu5o6hj3ub5` FOREIGN KEY (`man_of_the_match_id`) REFERENCES `players` (`id`),
  CONSTRAINT `FKc8luaq6tvdv9qi10naf1ua94q` FOREIGN KEY (`current_striker_id`) REFERENCES `players` (`id`),
  CONSTRAINT `FKdvvo8d727vumqywhahghwqh4w` FOREIGN KEY (`batting_team_id`) REFERENCES `teams` (`id`),
  CONSTRAINT `FKiiy0qvvv6y5p27qul9xhitelp` FOREIGN KEY (`current_bowler_id`) REFERENCES `players` (`id`),
  CONSTRAINT `FKl537indahn5dahm8hbnehvy2e` FOREIGN KEY (`current_non_striker_id`) REFERENCES `players` (`id`),
  CONSTRAINT `FKmrgum5di41ywbw87fdecijmvs` FOREIGN KEY (`team_a_id`) REFERENCES `teams` (`id`),
  CONSTRAINT `FKn66swy9if3qemrk5407f81hc5` FOREIGN KEY (`winner_team_id`) REFERENCES `teams` (`id`),
  CONSTRAINT `FKntr6m7io9k4xcxgn7prtyojko` FOREIGN KEY (`team_b_id`) REFERENCES `teams` (`id`),
  CONSTRAINT `FKpf41hapqtm6mc2t8xnr7ei4b0` FOREIGN KEY (`toss_winner_id`) REFERENCES `teams` (`id`),
  CONSTRAINT `FKqobxtx0acj9lqghp89f7jfw7f` FOREIGN KEY (`bowling_team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matches`
--

LOCK TABLES `matches` WRITE;
/*!40000 ALTER TABLE `matches` DISABLE KEYS */;
INSERT INTO `matches` VALUES (23,11,2,37,1,'2026-04-05',2,'COMPLETED',34,'BATTING',1,2,NULL,NULL,NULL,1,2,2,1,'FIRST won by 9 wickets',5,33,3,12,'TOURNAMENT'),(27,6,2,8,2,'2026-04-05',1,'COMPLETED',28,'BATTING',8,9,NULL,NULL,NULL,8,9,9,9,'practice_1 won by 19 runs',2,27,2,6,'PRACTICE');
/*!40000 ALTER TABLE `matches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `player_match_stats`
--

DROP TABLE IF EXISTS `player_match_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_match_stats` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `balls_faced` int NOT NULL,
  `catches` int NOT NULL,
  `fours` int NOT NULL,
  `is_out` bit(1) NOT NULL,
  `maidens` int NOT NULL,
  `match_type` enum('TOURNAMENT','PRACTICE') NOT NULL,
  `overs_bowled` double NOT NULL,
  `run_outs` int NOT NULL,
  `runs_conceded` int NOT NULL,
  `runs_scored` int NOT NULL,
  `sixes` int NOT NULL,
  `stumpings` int NOT NULL,
  `wickets` int NOT NULL,
  `match_id` bigint NOT NULL,
  `player_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6yigs5aa89688widu4u2o9o4g` (`match_id`,`player_id`),
  KEY `idx_pms_player` (`player_id`),
  KEY `idx_pms_match` (`match_id`),
  CONSTRAINT `FKcx7ci6xt0fkxsdca9axsxemmh` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
  CONSTRAINT `FKk297a8jtsdibs8thlv8pt0qhw` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player_match_stats`
--

LOCK TABLES `player_match_stats` WRITE;
/*!40000 ALTER TABLE `player_match_stats` DISABLE KEYS */;
INSERT INTO `player_match_stats` VALUES (13,0,0,0,_binary '\0',0,'TOURNAMENT',1,0,16,0,0,0,2,23,16),(14,0,0,0,_binary '\0',0,'TOURNAMENT',1,0,17,0,0,0,0,23,1),(15,3,0,1,_binary '\0',0,'TOURNAMENT',0,0,0,16,2,0,0,23,19),(16,1,0,0,_binary '\0',0,'TOURNAMENT',0,0,0,1,0,0,0,23,3),(17,7,0,2,_binary '',0,'TOURNAMENT',0,0,0,20,2,0,0,23,5),(18,2,0,1,_binary '\0',0,'TOURNAMENT',1,0,20,10,1,0,0,23,22),(19,2,0,0,_binary '',0,'TOURNAMENT',0,0,0,6,1,0,0,23,6),(20,2,0,0,_binary '\0',0,'TOURNAMENT',0,0,0,1,0,0,0,23,23),(21,0,0,0,_binary '\0',0,'TOURNAMENT',0.5,0,17,0,0,0,1,23,25),(22,1,0,0,_binary '',0,'TOURNAMENT',0,0,0,0,0,0,0,23,26),(23,5,0,1,_binary '',0,'TOURNAMENT',0,0,0,16,2,0,0,23,10),(55,2,0,0,_binary '\0',0,'PRACTICE',1,0,8,9,1,0,2,27,17),(56,3,0,1,_binary '',0,'PRACTICE',0,0,0,11,1,0,0,27,1),(57,1,0,0,_binary '',0,'PRACTICE',0,0,0,0,0,0,0,27,3),(58,5,0,0,_binary '',0,'PRACTICE',0,0,0,8,1,0,0,27,20),(59,0,0,0,_binary '\0',0,'PRACTICE',0,0,0,0,0,0,0,27,21),(60,2,0,0,_binary '',0,'PRACTICE',1,0,27,6,1,0,2,27,5),(61,0,0,0,_binary '\0',0,'PRACTICE',0,0,0,0,0,0,0,27,41);
/*!40000 ALTER TABLE `player_match_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `players`
--

DROP TABLE IF EXISTS `players`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `players` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `balls_faced` int DEFAULT NULL,
  `batting_average` double DEFAULT NULL,
  `batting_style` varchar(255) DEFAULT NULL,
  `best_bowling` varchar(255) DEFAULT NULL,
  `bowling_average` double DEFAULT NULL,
  `bowling_strike_rate` double DEFAULT NULL,
  `bowling_style` varchar(255) DEFAULT NULL,
  `economy_rate` double DEFAULT NULL,
  `fifties` int DEFAULT NULL,
  `highest_score` int DEFAULT NULL,
  `hundreds` int DEFAULT NULL,
  `innings_played` int DEFAULT NULL,
  `is_captain` bit(1) DEFAULT NULL,
  `is_vice_captain` bit(1) DEFAULT NULL,
  `jersey_number` int DEFAULT NULL,
  `matches_played` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `overs_bowled` double DEFAULT NULL,
  `role` enum('BATSMAN','BOWLER','ALL_ROUNDER','WICKETKEEPER') NOT NULL,
  `runs_conceded` int DEFAULT NULL,
  `runs_scored` int DEFAULT NULL,
  `strike_rate` double DEFAULT NULL,
  `wickets` int DEFAULT NULL,
  `player_image` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `players`
--

LOCK TABLES `players` WRITE;
/*!40000 ALTER TABLE `players` DISABLE KEYS */;
INSERT INTO `players` VALUES (1,43,10.75,'',NULL,0,0,'',18.545454545454547,0,30,0,4,_binary '',_binary '\0',11,5,'a1',1.5,'BATSMAN',34,43,100,2,'https://res.cloudinary.com/djp3qikuv/image/upload/v1773993764/dbjin2yzqtb7jwmlgeym.jpg'),(2,16,7.5,'',NULL,0,0,'',3.8181818181818183,0,36,0,6,_binary '\0',_binary '',9,6,'a2',1.5,'BOWLER',7,45,281.25,5,'https://res.cloudinary.com/djp3qikuv/image/upload/v1773993779/fcvfomavyfxmgxcaywtf.jpg'),(3,14,8,'Right Hand Bat',NULL,0,0,'Right Arm Legbreak',13.304347826086957,0,40,0,5,_binary '\0',_binary '\0',13,8,'a3',3.5,'ALL_ROUNDER',51,40,285.7142857142857,0,'https://res.cloudinary.com/djp3qikuv/image/upload/v1773993860/k1erakhlmcyz4tixkkfu.jpg'),(4,4,0,'Right Hand Bat',NULL,0,0,'Right Arm Legbreak',32.142857142857146,0,0,0,5,_binary '\0',_binary '\0',14,7,'a4',2.2,'WICKETKEEPER',75,0,0,0,'https://res.cloudinary.com/djp3qikuv/image/upload/v1773993828/h9zjneskrcfs5rgoyblr.jpg'),(5,34,2.6666666666666665,NULL,NULL,0,0,NULL,8.647058823529411,0,10,0,6,_binary '\0',_binary '\0',14,8,'a5',5.4,'BATSMAN',49,16,47.05882352941177,4,NULL),(6,13,6.8,NULL,NULL,0,0,NULL,15.214285714285714,0,19,0,5,_binary '',_binary '\0',21,6,'b1',4.4,'BATSMAN',71,34,261.53846153846155,7,NULL),(7,24,5.25,NULL,NULL,0,0,NULL,11.636363636363637,0,11,0,4,_binary '\0',_binary '',22,5,'b2',5.3,'BOWLER',64,21,87.5,1,NULL),(8,25,8.714285714285714,NULL,NULL,0,0,NULL,7.5,0,14,0,7,_binary '\0',_binary '\0',23,7,'b3',2,'BATSMAN',15,61,244,2,NULL),(9,14,1.6,NULL,NULL,0,0,NULL,4.666666666666667,0,7,0,5,_binary '\0',_binary '\0',24,6,'b4',3,'BATSMAN',14,8,57.142857142857146,0,NULL),(10,14,4,NULL,NULL,0,0,NULL,7,0,10,0,5,_binary '\0',_binary '\0',25,6,'b5',3,'WICKETKEEPER',21,20,142.85714285714286,0,NULL),(11,8,14.5,'Right Hand Bat',NULL,0,0,'Left Arm Fast',0,0,23,0,2,_binary '',_binary '\0',31,2,'c1',0,'BATSMAN',0,29,362.5,0,NULL),(12,7,3.3333333333333335,'Right Hand Bat',NULL,0,0,'Right Arm Legbreak',10,0,10,0,3,_binary '\0',_binary '',30,3,'c2',1,'BOWLER',10,10,142.85714285714286,0,NULL),(13,8,16,'Left Hand Bat',NULL,0,0,'Left Arm Fast',0,0,16,0,1,_binary '\0',_binary '\0',32,1,'c3',0,'WICKETKEEPER',0,16,200,0,NULL),(14,2,1,'Left Hand Bat',NULL,0,0,'Right Arm Offbreak',3.6,0,2,0,2,_binary '\0',_binary '\0',34,2,'c4',1.4,'BOWLER',6,2,100,6,NULL),(15,4,0,'Left Hand Bat',NULL,0,0,'Right Arm Medium',25,0,0,0,1,_binary '\0',_binary '\0',35,2,'c5',1,'WICKETKEEPER',25,0,0,2,NULL),(16,8,0.7142857142857143,'Right Hand Bat',NULL,0,0,'Left Arm Orthodox',13,0,5,0,7,_binary '\0',_binary '\0',15,10,'a6',4,'BATSMAN',52,5,62.5,4,NULL),(17,23,5.4,'Left Hand Bat',NULL,0,0,'Right Arm Medium',19.75,0,21,0,5,_binary '\0',_binary '\0',17,7,'a7',4,'BOWLER',79,27,117.3913043478261,2,NULL),(18,11,3.857142857142857,'Left Hand Bat',NULL,0,0,'Right Arm Offbreak',9.473684210526315,0,14,0,7,_binary '\0',_binary '\0',18,10,'a8',3.1,'ALL_ROUNDER',30,27,245.45454545454547,3,NULL),(19,29,4,'Right Hand Bat',NULL,0,0,'Right Arm Offbreak',2.4,0,24,0,8,_binary '\0',_binary '\0',19,8,'a9',1.4,'ALL_ROUNDER',4,32,110.34482758620689,1,NULL),(20,3,2.3333333333333335,'Right Hand Bat',NULL,0,0,'Left Arm Fast',0,0,7,0,3,_binary '\0',_binary '\0',110,4,'a10',1,'BATSMAN',0,7,233.33333333333334,0,NULL),(21,36,9.285714285714286,'Left Hand Bat',NULL,0,0,'Left Arm Fast',25.5,0,26,0,7,_binary '\0',_binary '\0',111,8,'a11',1.2,'BATSMAN',34,65,180.55555555555554,0,NULL),(22,14,11.5,'Right Hand Bat',NULL,NULL,NULL,NULL,5,NULL,22,NULL,4,NULL,NULL,26,5,'b6',2,'BATSMAN',10,46,328.57142857142856,1,NULL),(23,48,15.714285714285714,'Left Hand Bat',NULL,NULL,NULL,NULL,10.8,NULL,44,NULL,7,NULL,NULL,27,9,'b7',1.4,'BATSMAN',18,110,229.16666666666666,4,NULL),(24,11,13.333333333333334,'Right Hand Bat',NULL,NULL,NULL,'Right Arm Fast',11.333333333333334,NULL,25,NULL,3,NULL,NULL,28,5,'b8',3,'BOWLER',34,40,363.6363636363636,2,NULL),(25,12,3.75,'Left Hand Bat',NULL,NULL,NULL,'Left Arm Fast',12.363636363636363,NULL,9,NULL,4,NULL,NULL,29,8,'b9',5.3,'ALL_ROUNDER',68,15,125,3,NULL),(26,8,17,'Right Hand Bat',NULL,NULL,NULL,'',20.181818181818183,NULL,24,NULL,2,NULL,NULL,210,4,'b10',1.5,'BATSMAN',37,34,425,6,NULL),(27,3,0.5,'Left Hand Bat',NULL,NULL,NULL,'Right Arm Offbreak',12.352941176470589,NULL,1,NULL,2,NULL,NULL,211,5,'b11',2.5,'BOWLER',35,1,33.333333333333336,6,NULL),(28,NULL,NULL,'Right Hand Bat',NULL,NULL,NULL,'Left Arm Orthodox',NULL,NULL,NULL,NULL,NULL,NULL,NULL,212,NULL,'b12',NULL,'ALL_ROUNDER',NULL,NULL,NULL,NULL,NULL),(29,NULL,NULL,'Right Hand Bat',NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,213,NULL,'b13',NULL,'WICKETKEEPER',NULL,NULL,NULL,NULL,NULL),(30,7,22,'Right Hand Bat',NULL,0,0,'Right Arm Legbreak',10.8,0,22,0,1,_binary '\0',_binary '\0',36,1,'c6',0.5,'BATSMAN',9,22,314.2857142857143,4,NULL),(31,2,12,'Left Hand Bat',NULL,0,0,'Left Arm Fast',0,0,12,0,1,_binary '\0',_binary '\0',37,1,'c7',0,'ALL_ROUNDER',0,12,600,0,NULL),(32,1,0,'Left Hand Bat',NULL,0,0,'Right Arm Offbreak',0,0,0,0,1,_binary '\0',_binary '\0',38,2,'c8',1,'BOWLER',0,0,0,6,NULL),(33,0,0,'Right Hand Bat',NULL,0,0,'Left Arm Fast',0,0,0,0,0,_binary '\0',_binary '\0',39,1,'c9',1,'BATSMAN',0,0,0,0,NULL),(34,3,3,'Left Hand Bat',NULL,0,0,'Right Arm Fast',0,0,6,0,2,_binary '\0',_binary '\0',310,2,'c10',0,'WICKETKEEPER',0,6,200,0,NULL),(35,2,3,'Right Hand Bat',NULL,0,0,'Left Arm Fast',0,0,6,0,2,_binary '\0',_binary '\0',311,2,'c11',0,'BOWLER',0,6,300,0,NULL),(40,0,0,'Right Hand Bat',NULL,0,0,'Right Arm Offbreak',0,0,0,0,0,_binary '',_binary '\0',41,0,'D1',0,'BATSMAN',0,0,0,0,''),(41,NULL,NULL,'Right Hand Bat',NULL,NULL,NULL,'Right Arm Offbreak',NULL,NULL,NULL,NULL,NULL,_binary '\0',_binary '\0',112,NULL,'a12',NULL,'BATSMAN',NULL,NULL,NULL,NULL,''),(42,NULL,NULL,'Left Hand Bat',NULL,NULL,NULL,'Right Arm Medium',NULL,NULL,NULL,NULL,NULL,_binary '\0',_binary '\0',113,NULL,'a13',NULL,'BATSMAN',NULL,NULL,NULL,NULL,'');
/*!40000 ALTER TABLE `players` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scorecard_batting`
--

DROP TABLE IF EXISTS `scorecard_batting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scorecard_batting` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `balls` int DEFAULT NULL,
  `fours` int DEFAULT NULL,
  `how_out` varchar(255) DEFAULT NULL,
  `innings` int NOT NULL,
  `runs` int DEFAULT NULL,
  `sixes` int DEFAULT NULL,
  `strike_rate` double DEFAULT NULL,
  `match_id` bigint NOT NULL,
  `player_id` bigint NOT NULL,
  `team_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKb6q4y51xg3k5ofcchfw70jy3d` (`match_id`,`innings`,`player_id`),
  KEY `FKl7w47aw7s68ucrwqkdrd1vf0j` (`player_id`),
  KEY `FKng7mv8taxqcu2dvio5tnkjr7u` (`team_id`),
  KEY `idx_batting_match_innings_player` (`match_id`,`innings`,`player_id`),
  CONSTRAINT `FKe596j160n4nayxk5q4heoq6an` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`),
  CONSTRAINT `FKl7w47aw7s68ucrwqkdrd1vf0j` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
  CONSTRAINT `FKng7mv8taxqcu2dvio5tnkjr7u` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=177 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scorecard_batting`
--

LOCK TABLES `scorecard_batting` WRITE;
/*!40000 ALTER TABLE `scorecard_batting` DISABLE KEYS */;
INSERT INTO `scorecard_batting` VALUES (135,5,1,'c a10 b a6',1,16,2,320,23,10,2),(136,2,0,'Not Out',1,1,0,50,23,23,2),(137,1,0,'b a6',1,0,0,0,23,26,2),(138,2,0,'run out (a3)',1,6,1,300,23,6,2),(139,2,1,'Not Out',1,10,1,500,23,22,2),(140,7,2,'b b9',2,20,2,285.7142857142857,23,5,1),(141,1,0,'Not Out',2,1,0,100,23,3,1),(142,3,1,'Not Out',2,16,2,533.3333333333334,23,19,1),(169,2,0,'Not Out',1,9,1,450,27,17,9),(170,2,0,'b a5',1,6,1,300,27,5,9),(171,3,1,'b a5',1,11,1,366.6666666666667,27,1,9),(172,0,0,'Not Out',1,0,0,0,27,41,9),(173,5,0,'b a7',2,8,1,160,27,20,8),(174,0,0,'Not Out',2,0,0,0,27,1,8),(175,1,0,'b a7',2,0,0,0,27,3,8),(176,0,0,'Not Out',2,0,0,0,27,21,8);
/*!40000 ALTER TABLE `scorecard_batting` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scorecard_bowling`
--

DROP TABLE IF EXISTS `scorecard_bowling`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scorecard_bowling` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `economy_rate` double DEFAULT NULL,
  `innings` int NOT NULL,
  `maidens` int DEFAULT NULL,
  `overs` double DEFAULT NULL,
  `runs` int DEFAULT NULL,
  `wickets` int DEFAULT NULL,
  `match_id` bigint NOT NULL,
  `player_id` bigint NOT NULL,
  `team_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK4vd7ajt5skk861efryp7yigft` (`match_id`,`innings`,`player_id`),
  KEY `FKnhcgnwmwomg7423af4k27ecv0` (`player_id`),
  KEY `FK7aw8ho6lm894r2y013klasv2u` (`team_id`),
  KEY `idx_bowling_match_innings_player` (`match_id`,`innings`,`player_id`),
  CONSTRAINT `FK7aw8ho6lm894r2y013klasv2u` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`),
  CONSTRAINT `FKcqq6tiguk6ucqvdb4eh10cnwt` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`),
  CONSTRAINT `FKnhcgnwmwomg7423af4k27ecv0` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scorecard_bowling`
--

LOCK TABLES `scorecard_bowling` WRITE;
/*!40000 ALTER TABLE `scorecard_bowling` DISABLE KEYS */;
INSERT INTO `scorecard_bowling` VALUES (83,16,1,0,1,16,2,23,16,1),(84,17,1,0,1,17,0,23,1,1),(85,20,2,0,1,20,0,23,22,2),(86,20.4,2,0,0.5,17,1,23,25,2),(95,27,1,0,1,27,2,27,5,8),(96,8,2,0,1,8,2,27,17,9);
/*!40000 ALTER TABLE `scorecard_bowling` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scores`
--

DROP TABLE IF EXISTS `scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scores` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `overs_played` double NOT NULL,
  `team_a_runs` int NOT NULL,
  `team_a_wickets` int NOT NULL,
  `team_b_runs` int NOT NULL,
  `team_b_wickets` int NOT NULL,
  `match_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_f7hw3osmg24h82wj0oi58oa16` (`match_id`),
  CONSTRAINT `FKmhr6nu0xje0kgubcx0j405gwq` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`),
  CONSTRAINT `scores_chk_1` CHECK ((`overs_played` >= 0)),
  CONSTRAINT `scores_chk_2` CHECK ((`team_a_runs` >= 0)),
  CONSTRAINT `scores_chk_3` CHECK ((`team_a_wickets` >= 0)),
  CONSTRAINT `scores_chk_4` CHECK ((`team_b_runs` >= 0)),
  CONSTRAINT `scores_chk_5` CHECK ((`team_b_wickets` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scores`
--

LOCK TABLES `scores` WRITE;
/*!40000 ALTER TABLE `scores` DISABLE KEYS */;
/*!40000 ALTER TABLE `scores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_players`
--

DROP TABLE IF EXISTS `team_players`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_players` (
  `team_id` bigint NOT NULL,
  `player_id` bigint NOT NULL,
  KEY `FKddxneji5ow8j3171oe6mc2gu0` (`player_id`),
  KEY `FK3bhsykltbdhsmmb61l2ml12h` (`team_id`),
  CONSTRAINT `FK3bhsykltbdhsmmb61l2ml12h` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`),
  CONSTRAINT `FKddxneji5ow8j3171oe6mc2gu0` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_players`
--

LOCK TABLES `team_players` WRITE;
/*!40000 ALTER TABLE `team_players` DISABLE KEYS */;
INSERT INTO `team_players` VALUES (8,1),(8,2),(8,3),(8,4),(8,5),(8,16),(8,17),(8,18),(8,19),(8,20),(8,21),(2,6),(2,7),(2,8),(2,9),(2,10),(2,22),(2,23),(2,24),(2,25),(2,26),(2,27),(2,28),(2,29),(1,1),(1,2),(1,3),(1,4),(1,5),(1,16),(1,17),(1,18),(1,19),(1,20),(1,21),(1,41),(9,1),(9,2),(9,3),(9,4),(9,5),(9,16),(9,17),(9,18),(9,19),(9,20),(9,21),(9,41),(9,42);
/*!40000 ALTER TABLE `team_players` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `coach_name` varchar(255) DEFAULT NULL,
  `team_name` varchar(255) NOT NULL,
  `team_logo` varchar(1024) DEFAULT NULL,
  `team_type` enum('TOURNAMENT','PRACTICE') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_dsqu2wx93en6lbl2bnrjy7kol` (`team_name`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES (1,'aa','FIRST','https://res.cloudinary.com/djp3qikuv/image/upload/v1773993533/kezinc5dahja80khwimk.jpg','TOURNAMENT'),(2,'bb','SECOND','https://res.cloudinary.com/djp3qikuv/image/upload/v1773993549/ip7uckd2rq82vkjqv5ap.jpg','TOURNAMENT'),(3,'C','THIRD','https://res.cloudinary.com/djp3qikuv/image/upload/v1773993964/g9mspfi8k3mknpq4rmqw.avif','TOURNAMENT'),(5,'DDDDD','FOURTH','','TOURNAMENT'),(8,'22222222','practice_2','','PRACTICE'),(9,'111111111','practice_1','','PRACTICE');
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-08 15:25:31
