class AppError extends Error {
  constructor (statusCode, message){
    super(message);

    if(Error.captureStackTrace){
      Error.captureStackTrace(this, AppError);
    }

    this.statusCode = statusCode;
  }
}

export default AppError;