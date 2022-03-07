const express = require('express');
const multer = require('multer');
const csv = require('csvtojson');
const { parse } = require('json2csv');
const fs = require('fs');

const uploadConfig = [{ name: 'csv_file', maxCount: 3 }];
var bodyParser = require('body-parser');
var storage = multer.memoryStorage();

var upload = multer({ storage: storage });

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public/'));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/parser', upload.fields(uploadConfig), async (req, res) => {
  deleteFiles();

  var csv2jsonList = [];
  for (var file of req.files.csv_file) {
    csv2jsonList.push(await csv().fromString(file.buffer.toString()));
  }

  writeFile(csv2jsonList.flat(), res);
});

app.listen(process.env.PORT || 3000);

function deleteFiles() {
  fs.readdir('public/uploads', (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(__dirname + '\\public\\uploads\\' + file, (err) => {
        if (err) throw err;
      });
    }
  });
}

function writeFile(json, res) {
  try {
    const csv = parse(json, { fields: Object.keys(json[0]) });
    fs.writeFile('output.csv', csv, (err) => res.download('output.csv'));
  } catch (err) {
    console.error(err);
  }
}
