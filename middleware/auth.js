const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = async function(request, response, next) {
  const token = request.header("x-auth-token");
  if (!token)
    return response.status(401).send("Access denied. No token provided.");

  try {
    const payload = jwt.verify(token, config.jwtPrivateKey);
    request.user = payload;
    next();
  } catch (ex) {
    response.status(400).send("Access denied. Invalid token.");
  }
};
