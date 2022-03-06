const express = require('express');
const multer = require('multer');
const csv = require('csvtojson');
const { parse } = require('json2csv');
const fs = require('fs');

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

app.post('/parser', upload.single('csv_file'), async (req, res) => {
  fs.unlink('output.csv', (err) =>
    console.log(err ? 'Initialization..' : 'File deleted!')
  );

  const csv2json = await csv().fromString(req.file.buffer.toString());

  writeFile(csv2json, res);
});

app.listen(process.env.PORT, 3000);

function writeFile(json, res) {
  try {
    const csv = parse(json, { fields: Object.keys(json[0]) });
    fs.writeFile('output.csv', csv, (err) => res.download('output.csv'));
  } catch (err) {
    console.error(err);
  }
}
