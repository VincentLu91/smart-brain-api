const jwt = require('jsonwebtoken');
const redis = require('redis');

// setup Redis
const redisClient = redis.createClient(process.env.REDIS_URI);

const handleSignin = (db, bcrypt, req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    //return res.status(400).json('incorrect form submission');
	return Promise.reject('incorrect form submission');
  }
  //db.select('email', 'hash').from('login')
  return db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db.select('*').from('users')
          .where('email', '=', email)
          .then(user => user[0])
          //.catch(err => res.status(400).json('unable to get user'))
		  .catch(err => Promise.reject('unable to get user'))
      } else {
        //res.status(400).json('wrong credentials')
		  Promise.reject('wrong credentials')
      }
    })
    .catch(err => res.status(400).json('wrong credentials'))
}

const getAuthTokenId = (req, res) => {
	const { authorization } = req.headers;
	return redisClient.get(authorization, (err, reply) => {
		if (err || !reply) {
			return res.status(401).json('Unauthorized');
		}
		return res.json({id: reply})
	})
}

const signToken = (email) => {
	const jwtPayload = { email };
	return jwt.sign(jwtPayload, 'JWT_SECRET', { expiresIn: '2 days' })
}

const setToken = (key, value) => {
	return Promise.resolve(redisClient.set(key, value));
}

const createSessions = (user) => {
	// JWT token, return user data
	const { email, id } = user;
	const token = signToken(email);
	return setToken(token, id) // to return promise
		.then(() => {
			return {success: 'true', userId: id, token, user}
		})
		.catch(console.log('some session error'))
}

const signinAuthentication = (db, bcrypt) => (req, res) => {
	const { authorization } = req.headers;
	return authorization ? 
		getAuthTokenId(req, res) : 
		handleSignin(db, bcrypt, req, res)
			.then(data => {
				return data.id && data.email ? createSessions(data) : Promise.reject(data)
			})
			.then(session => res.json(session))
			.catch(err => res.status(400).json(err))
}

module.exports = {
  //handleSignin: handleSignin
	signinAuthentication: signinAuthentication,
	redisClient: redisClient
}