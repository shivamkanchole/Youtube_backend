// this extends ia basically allowing us to use node js class Error , which is basically used for error handling
// we are doing this just to set that ki our errors from a api should be look like this , best bractises hai bs 

class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message); // By calling the super() method in the constructor method, we call the parent's constructor(that is Error class of node js) method and gets access to the parent's properties and methods:
    this.statusCode = statusCode;// below that we are just overwriting the error if we have provided...
    this.data = null; // usually we do, we set null to the data
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) { // learn more about it....
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
