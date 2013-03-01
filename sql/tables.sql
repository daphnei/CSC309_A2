DROP TABLE IF EXISTS tracked_blogs;
DROP TABLE If EXISTS liked_posts;
DROP TABLE IF EXISTS updates;
DROP TABLE IF EXISTS unicorns;

CREATE TABLE tracked_blogs(
    url VARCHAR(200),
    username VARCHAR(100),
    PRIMARY KEY(url) --some sites say that username also needs to be a primary key here in order for it to be a foreign key later on
) ENGINE=INNODB;
    
CREATE TABLE liked_posts(
	url VARCHAR(200),
    username VARCHAR(100),
    date DATETIME,
    image VARCHAR(100),
    text VARCHAR(1000),
    note_count INTEGER,
    num_updates INTEGER,
    PRIMARY KEY(url, username) --I am debating whether username should also be a key here
) ENGINE=INNODB;

/* This line doesn't work. Why? I don't know.
ALTER TABLE liked_posts Add Constraint const Foreign Key (username) References tracked_blogs (username);
*/

CREATE TABLE updates(
    url VARCHAR(200),
    time DATETIME,
    sequence_index INTEGER,
    increment INTEGER,
    PRIMARY KEY(url, sequence_index)
) ENGINE=INNODB;

CREATE TABLE unicorns(
    magicPower VARCHAR(100),
    age INTEGER
) ENGINE=INNODB;
