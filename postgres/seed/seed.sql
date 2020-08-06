BEGIN TRANSACTION;

INSERT into users (name, email, entries, joined) values ('Jessie', 'jessie@gmail.com', 5, '2018-01-01');
INSERT into login (hash, email) values ('$2a$10$7whLb.sl1l6AuNr0FMgiMeMUCJJe4fz8Un6ncbjMajCoO0YAR9/9e', 'jessie@gmail.com');

COMMIT;