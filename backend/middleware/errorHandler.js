export default function errorHandler(err, req, res, next){
  console.log(err);

  return res.status(err.cause).json({
    "error" : err.message
  });
}