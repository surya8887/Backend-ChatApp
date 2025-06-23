class ApiError extends Error {
  /**
   * Constructs a standardized API error object.
   *
   * @param {number} statusCode - HTTP status code.
   * @param {string} message - Error message.
   * @param {Array|Object} errors - Optional array or object of error details.
   * @param {string} stack - Optional stack trace.
   */
  constructor(statusCode, message = "Something went wrong", errors = [], stack = "") {
    super(message);

    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.data = null;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
