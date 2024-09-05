require('dotenv').config();

const path = __dirname + '/public/';
const port = 3000;

const express = require('express')
const multer  = require('multer')
const cors = require('cors');

const app = express()

const router = express.Router();
router.use(cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/public/avatars/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const file1 = file.originalname
    const [ext, ...fileName] = file1.split('.').reverse();
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext)
  }
})
const MulterUpload = multer({ storage: storage })
router.post('/upload', MulterUpload.single('avatar'), function (req, res, next) {
  res.json({message: req.file.filename, ok: 1});
})


router.post('/upload', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
    } else if (err) {
      // An unknown error occurred when uploading.
    }
    // Everything went fine.
  })
})

router.use(function (req,res,next) {
	next();
});

router.get('/template/:name', function (req, res) {
	var fileName = req.params.name
	res.sendFile(path + '/javascripts/views/templates/' + fileName + '.html');
})


router.get('/get_env', function (req, res) {
  res.json({
    HOST: process.env.HOST,
    URL_BACK: process.env.URL_BACK,
    URL_FRONT: process.env.URL_FRONT,
    URL_WSS: process.env.URL_WSS,
    API42_URL: process.env.API42_URL
  });
});

router.get('/*', function(req,res){
	res.sendFile(path + 'index.html');
});

router.get('/', function(req,res){
	res.sendFile(path + 'index.html');
});

app.use(express.static(path));
app.use('/', router);
app.listen(port, function () {
	//console.log('Example app listening on port %s!', port)
})
