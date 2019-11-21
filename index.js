const process = require('process');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const request = require('request');

const debug = false;
const problematicURLs = [];
const requestQueue = [];
const maxRequests = ~~process.argv[6] || 5;
const timeout = ~~process.argv[7] || 1000;
let currentRequests = 0;

const isFile = path =>
  typeof path === 'string' &&
  fs.existsSync(path) &&
  fs.lstatSync(path).isFile();
const isCSV = path => typeof path === 'string' && path.match(/\.csv$/i);

function writeCSV() {
  if (problematicURLs.length) {
    const outputFilename = 'urls.csv';
    const csvWriter = createCsvWriter({
      path: outputFilename,
      header: [
        { id: 'source', title: 'Source' },
        { id: 'requested', title: 'Requested' },
        { id: 'response', title: 'Response' },
      ],
    });

    csvWriter.writeRecords(problematicURLs).then(() => {
      const outputPath = `${process.cwd()}/${outputFilename}`;
      if (isFile(outputPath)) {
        console.log(`The CSV file was written successfully. => ${outputPath}`);
        process.exit(0);
      } else {
        console.error(`An error happened while writing the file. Good luck.`);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
    console.log('All URLs responded succesfully!');
  }
}

function requestURL(url = '', callback = (error, response, body) => {}) {
  if (url)
    requestQueue.push(
      new Promise(resolve => {
        const requestWhenReady = () => {
          if (currentRequests < maxRequests) {
            currentRequests++;
            request(url, (...kwargs) => {
              if (callback) callback(...kwargs);
              resolve();
            });
          } else {
            if (debug)
              console.log(
                `Too many requests(${maxRequests}) at once. Waiting ${timeout /
                  1000}s to request ${url}...`
              );
            setTimeout(() => requestWhenReady(), timeout);
          }
        };
        requestWhenReady();
      }).then(() => currentRequests--)
    );
}

function writeWhenReady() {
  Promise.all(requestQueue).then(() => {
    console.log('All URL tests complete!');
    if (debug) console.log(JSON.stringify(problematicURLs, null, 2));
    writeCSV();
  });
}

if (process.argv.length > 2) {
  const [
    ,
    ,
    source = '',
    column = 'url',
    regex = '',
    substring = '',
  ] = process.argv;
  const sourcePath = path.resolve(source);
  if (debug) console.log({ sourcePath, column, regex, substring });

  if (source && sourcePath && isFile(sourcePath)) {
    if (isCSV(sourcePath)) {
      const stream = fs.createReadStream(sourcePath).pipe(csv());
      (async () => {
        console.log('Processing CSV file... This may take a while.');
        for await (const row of stream) {
          if (row) {
            const { [column]: url } = row;
            if (url !== undefined) {
              const testURL =
                regex && substring ? url.replace(regex, substring) : url;

              requestURL(testURL, (error, response) => {
                const requested = {
                  source: url,
                  requested: testURL,
                };
                if (!error) {
                  const statusCode = response && response.statusCode;
                  requested.response = statusCode;
                  if (statusCode !== 200) problematicURLs.push(requested);
                } else {
                  requested.response = 'Error';
                  problematicURLs.push(requested);
                  if (debug) {
                    console.error(`Error processing URL: '${testURL}'`);
                    console.error(error);
                  }
                }
                if (debug) console.log('Requested: ', requested);
              });
            } else {
              console.error(
                `Argument(2) Error: No Data found for the column: '${column}'. Perhaps try a different column name.`
              );
              process.exit(1);
            }
          }
        }
        if (debug) console.log('CSV file successfully processed.');
        writeWhenReady();
      })();
    } else {
      console.error(
        'Argument(1) Error: Path to source file is not a CSV file!'
      );
      process.exit(1);
    }
  } else {
    console.error('Argument(1) Error: Path to source file is not valid!');
    process.exit(1);
  }
} else {
  console.error('Argument Required: Path to source file is required!');
  process.exit(1);
}
