// Load the SDK and UUID
var AWS = require('aws-sdk');
const sharp = require("sharp")
async function fetchFromS3({ bucketName, keyName }) {
    let fetchPromise = new AWS.S3({ apiVersion: '2006-03-01' }).
        getObject({Bucket:bucketName,Key:keyName}).promise();
    return fetchPromise.then(
        function (data) {
            console.log(data.Body)
            let buf = data.Body

           let fileObj= sharp(buf)
            return { bucketName, keyName }
        }).catch(reason => {
            console.log(reason)
        });
}

module.exports = fetchFromS3