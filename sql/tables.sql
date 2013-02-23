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

CREATE TABLE likes(
    blog VARCHAR(200),
    post VARCHAR(200),
    KEY(blog, post)
);

CREATE TABLE updates(
    url VARCHAR(200),
    time DATETIME,
    sequence_index INTEGER,
    increment INTEGER,
    KEY(url, sequence)
);

CREATE TABLE unicorns(
    magicPower VARCHAR(100),
    age INTEGER
);
