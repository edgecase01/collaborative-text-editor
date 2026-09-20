export default function errorHandler(err, req, res, next){
  if(!err.statusCode){
    console.log(err.message);

    return res.status(500).json({
      "error" : "Internal Server Error"
    });
  }

  return res.status(err.statusCode).json({
    "error" : err.message
  });
}