// this is just to apply try and catch ka wrapper arrond the function so that hame bar bar na karna pade
// we are using a higher order function , we are passing a function to it , here "requesthandler"is function which is passed to us.
// this function contains (err,req,res,next)
// WAY-1 , to do this (using promisses -> not wait for any task , whenever it is completed thne only it do operations on it )

const asyncHandler = (requesthandlerfn)=>{
  return (req, res, next) => {
    Promise.resolve(requesthandlerfn(req, res, next)).catch((err) => next(err))
  }
}

export { asyncHandler }



// WAY-2 , to do this (try and catch(async and await))

// const asyncHandler = (requesthandler) => async (req, res, next) => {
//   try {
//     await requesthandler(req, res, next);
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "something went wrong in asynchandler",
//     });
//   }
// };

// export { asyncHandler }

