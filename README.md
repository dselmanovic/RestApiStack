NodeJS REST API stack using BearerJS and PostgreSQL database
============
Thanks to [Brian Carlson](https://github.com/brianc) for help with connection to PostgreSQL

First you will need a database. Scripts below will create your tables and first user/Administrator.

* Roles table
```
CREATE TABLE roles
(
  rolename character varying NOT NULL,
  CONSTRAINT pk_rolename PRIMARY KEY (rolename)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE roles
  OWNER TO postgres;
```

* Users table
```
CREATE TABLE users
(
  username character varying NOT NULL,
  password character varying,
  fullname character varying,
  email character varying,
  enabled boolean DEFAULT true,
  CONSTRAINT pk_username PRIMARY KEY (username)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE users
  OWNER TO postgres;
```

* User roles table
```
CREATE TABLE userroles
(
  username character varying NOT NULL,
  rolename character varying NOT NULL,
  CONSTRAINT pk_userroles PRIMARY KEY (username, rolename),
  CONSTRAINT userroles_username_fkey FOREIGN KEY (username)
      REFERENCES users (username) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
  OIDS=FALSE
);
ALTER TABLE userroles
  OWNER TO postgres;
```

* Create roles
```
INSERT INTO roles(rolename) VALUES ('Administrator');
INSERT INTO roles(rolename) VALUES ('User');
```

* Create first user
```
INSERT INTO users(
            username, password, fullname, email, enabled)
    VALUES ('Administrator', 'will be changed', 'Administrator', 'admin@domain.com', true);
```

* Add user to Administrators role
```
INSERT INTO userroles(
            username, rolename)
    VALUES ('Administrator', 'Administrator');
```

* You need to configure connection string for your postgreSQL database.
```
helper.js
connString:"postgres://username:password@server/database",
```

* You need to set Administrators password now. To do that you need to call /account/setpassword action. If your DB connection is ok your Administrator will be enabled
```
POST http://your_url/account/setpassword
username=Administrator
password=your_new_pass
```

You got all default user management actions in this app. You can check them in routes/account.js
```javascript
        {url:'/account/getroles', method:'get', roles:["Administrator"]},
        {url:'/account/setpassword', method:'post', roles:["Administrator"]},
        {url:'/account/changepassword', method:'post'},
        {url:'/account/getusers', method:'get', roles:["Administrator"]},
        {url:'/account/getuser', method:'get', roles:["Administrator"]},
        {url:'/account/getuserroles', method:'get', roles:["Administrator"]},
        {url:'/account/adduserrole', method:'post', roles:["Administrator"]},
        {url:'/account/removeuserrole', method:'post', roles:["Administrator"]},
        {url:'/account/changeuser', method:'post'},
```
