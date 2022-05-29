-- users: menyimpan credential, user rating, dan list movie yang di 'plan to watch' atau completed
-- mengetahui admin atau bukan admin diliat dari usernamenya. 
CREATE TABLE users (
	username varchar(20) PRIMARY KEY,
	password text NOT NULL -- in hashed form
);

CREATE SEQUENCE gen_seq AS int START WITH 1;
CREATE TABLE genres (
	genre_id text PRIMARY KEY DEFAULT 'G'||nextval('gen_seq'), 
	genre_name varchar(15) NOT NULL
);

CREATE SEQUENCE mov_seq AS int START WITH 1;
CREATE TABLE movies (
	movie_id text PRIMARY KEY DEFAULT 'MOV'||nextval('mov_seq'), 
	title varchar(50) NOT NULL,
	release_date date NOT NULL, -- yyyy-mm-dd
	runtime varchar(10) NOT NULL, 
	genre_id text NOT NULL references genres (genre_id) -- genre has to exist
);

-- store all users' ratings
CREATE TABLE users_ratings (
	username varchar(20) references users (username), -- what user rates
	movie_id text NOT NULL references movies (movie_id),	-- what movie; has to exist
	user_rating int NOT NULL, 
	
	PRIMARY KEY (username, movie_id),
	CHECK (user_rating BETWEEN 1 AND 10) -- only 1 - 10
);

-- store all users' movie statuses 
CREATE TABLE users_mov_statuses (
	username varchar(20) references users (username),
	status int, 
	movie_id text NOT NULL references movies (movie_id), 

	PRIMARY KEY (username, movie_id),
	CHECK (status BETWEEN 0 AND 1) -- 0 = plan to watch, 1 = completed
);