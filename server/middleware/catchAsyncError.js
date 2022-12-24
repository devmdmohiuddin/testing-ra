module.exports = (acceptedFunction) => (req,res,next) => {
    Promise.resolve(acceptedFunction(req,res,next)).catch(next)
}