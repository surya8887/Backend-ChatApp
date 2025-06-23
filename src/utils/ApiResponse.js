class ApiResponse {
  /**
   * Constructs a standardized API response object.
   *
   * @param {number} statusCode - HTTP status code.
   * @param {any} data - Response payload.
   * @param {string} message - Optional message to include.
   */
  constructor(statusCode, data = null, message = "") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode >= 200 && statusCode < 400;
  }
}

export default ApiResponse;
