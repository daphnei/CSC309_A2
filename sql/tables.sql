CREATE TABLE tracked_blogs(
    url VARCHAR(200),
    username VARCHAR(100),
    KEY(url)
);
    
CREATE TABLE liked_posts(
	url VARCHAR(200),
    username VARCHAR(100),
    date DATETIME,
    image VARCHAR(100),
    text VARCHAR(1000),
    note_count INTEGER,
    num_updates INTEGER,
    KEY(url)
);

CREATE TABLE updates(
    url VARCHAR(200),
    time DATETIME,
    sequence_index INTEGER,
    increment INTEGER,
    KEY(url, sequence_index)
);

CREATE TABLE unicorns(
    magicPower VARCHAR(100),
    age INTEGER
);
