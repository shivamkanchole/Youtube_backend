// this is just to apply try and catch ka wrapper arrond the function so that hame bar bar na karna pade
// we are using a higher order function , we are passing a function to it , here "requesthandler"is function which is passed to us.
// this function contains (err,req,res,next)
// WAY-1 , to do this (using promisses -> not wait for any task , whenever it is completed thne only it do operations on it )

const asyncHandler = (requesthandler) => {
  (err, req, res, next) => {
    Promise.resolve(requesthandler(err, req, res, next)).catch((err) =>
      next(err)
    );
  };
};

export { asyncHandler };



// WAY-2 , to do this (try and catch(async and await))

// const asyncHandler1 = (requesthandler) => async (err, req, res, next) => {
//   try {
//     await requesthandler(err, req, res, next);
//   } catch (error) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };
