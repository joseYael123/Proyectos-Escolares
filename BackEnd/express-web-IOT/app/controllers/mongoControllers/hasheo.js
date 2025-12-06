const bcrypt = require('bcryptjs');

const password = '123456';
const rounds = 10;

bcrypt.genSalt(rounds, (err, salt) => {
  if (err) throw err;
  bcrypt.hash(password, salt, (err, hash) => {
    if (err) throw err;
    console.log('Hash bcryptjs:', hash);
  });
});
