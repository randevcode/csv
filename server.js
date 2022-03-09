const express = require('express');
const multer = require('multer');
const csv = require('csvtojson');
const { parse } = require('json2csv');
const fs = require('fs');

var zip = require('express-zip');
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
  deleteFiles();
  res.redirect('/combiner');
});

app.get('/combiner', (req, res) => {
  res.render('combiner');
});

app.get('/splitter', (req, res) => {
  res.render('splitter');
});

app.post('/combine', upload.fields(uploadConfig), async (req, res) => {
  deleteFiles();

  var csv2jsonList = [];
  for (var file of req.files.csv_file) {
    csv2jsonList.push(await csv().fromString(file.buffer.toString()));
  }

  writeFile(csv2jsonList.flat(), null);

  var path_list = [
    {
      path: __dirname + '/public/uploads/output.csv',
      name: 'output.csv',
    },
  ];
  res.zip(path_list);
});

app.post('/split', upload.fields(uploadConfig), async (req, res) => {
  var csv2jsonList = [];
  var input = req.body.number_files;
  for (var file of req.files.csv_file) {
    csv2jsonList.push(await csv().fromString(file.buffer.toString()));
  }

  const splitResult = split(csv2jsonList[0], input);

  for (var i = 0; i < splitResult.length; i++) {
    const json = splitResult[i];
    const index = i + 1;
    const file_path = `${__dirname}/public/uploads/`;
    const file_name = `output${index ? '_' + index : ''}.csv`;

    try {
      const csv = parse(json, { fields: Object.keys(json[0]) });
      await fs.writeFile(file_path + file_name, csv, (err) => {
        if (index == splitResult.length) {
          fs.readdir('public/uploads', (err, files) => {
            if (err) throw err;

            var index = 0;
            var path_list = [];

            for (const file of files) {
              index++;
              path_list.push({
                path: __dirname + '/public/uploads/' + file,
                name: `output_${index}.csv`,
              });
            }
            console.log('downloading now');
            res.zip(path_list);
          });
        } else {
          console.log('File Written');
        }
      });
    } catch (err) {
      console.error('Error writing File:', err);
    }
  }
});

app.listen(process.env.PORT || 3000);

async function writeFile(json, index) {
  const file_path = `${__dirname}/public/uploads/`;
  const file_name = `output${index ? '_' + index : ''}.csv`;

  try {
    const csv = parse(json, { fields: Object.keys(json[0]) });
    await fs.writeFile(file_path + file_name, csv, (err) =>
      console.log('File Written')
    );
  } catch (err) {
    console.error('Error writing File:', err);
  }
}

function split(arr, parts) {
  let result = [];
  for (let i = parts; i > 0; i--) {
    result.push(arr.splice(0, Math.ceil(arr.length / i)));
  }
  return result;
}

function deleteFiles() {
  fs.readdir('public/uploads', (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(__dirname + '/public/uploads/' + file, (err) => {
        if (err) throw err;
      });
    }
  });
}
