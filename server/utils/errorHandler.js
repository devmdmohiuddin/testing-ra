//inherit node default error class
class ErrorHandler extends Error{
constructor(message,statusCode){
  super(message);
  this.statusCode = statusCode;
  Error.captureStackTrace(this,constructor);
}
}
module.exports = ErrorHandler;