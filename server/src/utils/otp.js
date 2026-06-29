// 6-digit numeric OTP generator
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { generateOtp };
