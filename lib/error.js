'use strict';

class OtomatkError extends Error {
  constructor(reason, code, httpCode) {
    super(reason);
    if (reason instanceof Error) {
      this.reason = {};
      if (reason.isValidationError) {
        this.reason.message = reason.messages && reason.messages.length ? reason.messages.join(',') : reason.message;
        this.reason.httpStatusCode = 400;
        this.reason.errorCode = code || 400;
      } else {
        this.reason.message = reason.toString();
        this.reason.errorCode = code || 500;
        this.reason.httpStatusCode = httpCode || code || 500;
      }
    } else {
      this.reason = {
        errorCode: code,
        message: reason,
        httpStatusCode: httpCode || code || 500
      };
    }
  }
  toString() {
    return JSON.stringify(this.reason, null, 2);
  }
  toJSON() {
    return this.reason;
  }
}

module.exports = OtomatkError;