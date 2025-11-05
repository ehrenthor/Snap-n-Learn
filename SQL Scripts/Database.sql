-- DROP DATABASE snapnlearn_db;
-- CREATE DATABASE snapnlearn_db;
-- use snapnlearn_db;

CREATE TABLE User (
  userid CHAR(36) NOT NULL,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL, -- Note: This holds the bcrypt‑hashed password.
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isDeleted BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (userid)
);

CREATE TABLE ChildUser (
  userid CHAR(36) NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,  -- An adult can lock this account.
  can_upload_image BOOLEAN NOT NULL DEFAULT TRUE,  -- Whether the child can upload images.
  daily_session_limit INT,  -- Daily screen time limit in minutes, adjustable by an adult.
  complexity_level INT NOT NULL DEFAULT 2,  -- Ranging from 0 to 4 to match the child’s learning capacity.
  last_seen TIMESTAMP,  -- Last time the child was active.
  PRIMARY KEY (userid),
  FOREIGN KEY (userid) REFERENCES User(userid),
  CHECK (complexity_level BETWEEN 0 AND 4)
);

CREATE TABLE UserProfile (
  userid CHAR(36) NOT NULL,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  profileImageFilePath VARCHAR(1024),
  dob DATE,
  PRIMARY KEY (userid),
  FOREIGN KEY (userid) REFERENCES User(userid)
);

CREATE TABLE AdultUser (
  userid CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  PRIMARY KEY (userid),
  FOREIGN KEY (userid) REFERENCES User(userid)
);

CREATE TABLE AdminUser (
  userid CHAR(36) NOT NULL,      
  email VARCHAR(255) NOT NULL,   
  role VARCHAR(50),              
  PRIMARY KEY (userid),          
  FOREIGN KEY (userid) REFERENCES User(userid)  -- Reference to the User table
);

-- Many-to-many relationship for adult-child associations
CREATE TABLE AdultChild (
  adultId CHAR(36) NOT NULL,
  childId CHAR(36) NOT NULL,
  PRIMARY KEY (adultId, childId),
  FOREIGN KEY (adultId) REFERENCES AdultUser(userid),
  FOREIGN KEY (childId) REFERENCES ChildUser(userid)
);

-- Table to manage password reuse policy by saving the history
CREATE TABLE PasswordHistory (
  userid CHAR(36) NOT NULL,
  password VARCHAR(255) NOT NULL,  -- Stores the bcrypt‑hashed passwords.
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (userid, createdAt),
  FOREIGN KEY (userid) REFERENCES User(userid)
);

-- Image table for user uploads
CREATE TABLE Image (
  serial CHAR(36) NOT NULL,
  userid CHAR(36) NOT NULL,
  filePath VARCHAR(1024) NOT NULL,
  audioFilePath VARCHAR(1024) NOT NULL,
  caption JSON,
  metadata JSON,
  uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isBookmarked BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('active', 'trashed', 'deleted') NOT NULL DEFAULT 'active',
  challengeDone TINYINT(1) NOT NULL DEFAULT 0,
  challengeDetails JSON NOT NULL,
  objectAudioPaths JSON,
  PRIMARY KEY (serial),
  FOREIGN KEY (userid) REFERENCES User(userid)
);

CREATE TABLE Session (
  sessionId CHAR(36) NOT NULL,
  childId CHAR(36) NOT NULL,
  startTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  endTime TIMESTAMP NULL,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (sessionId),
  FOREIGN KEY (childId) REFERENCES ChildUser(userid)
);

CREATE TABLE SessionParticipant (
  sessionId CHAR(36) NOT NULL,
  userId CHAR(36) NOT NULL,
  userType ENUM('Child', 'Adult') NOT NULL,
  joinTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastHeartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isOnline BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (sessionId, userId),
  FOREIGN KEY (sessionId) REFERENCES Session(sessionId)
);

CREATE TABLE AdultNote (
  adultId CHAR(36) NOT NULL,
  childId CHAR(36) NOT NULL,
  sessionId CHAR(36) NOT NULL,
  imageSerial CHAR(36),
  noteId CHAR(36) NOT NULL,
  note TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (noteId),
  FOREIGN KEY (sessionId) REFERENCES Session(sessionId),
  FOREIGN KEY (adultId) REFERENCES AdultUser(userid),
  FOREIGN KEY (childId) REFERENCES ChildUser(userid),
  FOREIGN KEY (imageSerial) REFERENCES Image(serial)
);

CREATE TABLE Quiz (
  quizId CHAR(36) NOT NULL,
  childId CHAR(36) NOT NULL,
  quizName TEXT NOT NULL,
  quizDescription TEXT NOT NULL,
  questions JSON NOT NULL,
  PRIMARY KEY (quizId),
  FOREIGN KEY (childId) REFERENCES ChildUser(userid)
);

CREATE TABLE QuizTaken (
    quizId CHAR(36) NOT NULL,
    childId CHAR(36) NOT NULL,
    datetimeTaken TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answers JSON NOT NULL,
    PRIMARY KEY (quizId, childId, datetimeTaken),
    FOREIGN KEY (quizId) REFERENCES Quiz(quizId),
    FOREIGN KEY (childId) REFERENCES ChildUser(userid)
);

