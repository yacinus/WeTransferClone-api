//DEFINE VARIABLES FOR OUR API

const smtp = { host: "smtp.mailtrap.io",
port: 2525,
secure: false, // true for 465, false for other ports
auth: {
  user: "fcae316ebac545", // generated ethereal user
  pass: "f11c6fdba1e905" // generated ethereal password
} 
}

const urlDownload = 'http://localhost:3000';

const s3AccessKey = {
  accessKeyId: "KO67HYLBUBH6DXZVJQC7",
  secretAccessKey: "AgdEy8FWKNJwAU+r64689ICBXrI4Kg4pVYRRNccMU24"
}

const s3Region = 'europe-west3';

const bucket = 'tetawood-transfer';

module.exports = {
    smtp,
    urlDownload,
    s3AccessKey,
    s3Region, 
    bucket
}