# TestURLs - NodeJS based CLI utility

A NodeJS based CLI utility to parse a CSV file and test URLs whether they're valid links that return a valid server response

## Requirements

NodeJS v12.10.x (May work in older versions as well)

## Installation

Within the TestURLs directory:

```
$ npm install
```

## CLI Arguments

# | Description | Expected Type | Default | Required
- | ----------- | ------------- | ------- | --------
1 | The Path to the CSV that contains the URLs you want to test | `string` | `''` | `true`
2 | The column name within the CSV that contains your URLs | `string` | `url` | `false`
3 | A JavaScript based Regular Expression to be used on each URL | `string` | `''` | `false`
4 | Text that will be used to replace if found by the RegEx | `string` | `''` | `false`
5 | The Maximum amount of simultaneous URL requests/tests made at a time | `number` | `5` | `false`
6 | The Amount of Milliseconds to wait in between Requests if the maximum has been reached | `number` | `1000` | `false`

## Usage

In order to run the script, you must first use the `node` CLI followed by the path to this CLI utility script followed by your arguments.

Use the arguments table above to learn what each argument does.

Example:

```
$ node ./testURLs/ ./MyURLS.csv WebsiteURL www dev 5 2000
```
