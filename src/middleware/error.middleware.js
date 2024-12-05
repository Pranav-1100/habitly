const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    if (err.message === 'User already exists') {
      return res.status(400).json({ message: err.message });
    }
  
    if (err.message === 'Invalid credentials') {
      return res.status(401).json({ message: err.message });
    }
  
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  };
  
  module.exports = errorHandler;
  