// Load the SDK and UUID
var AWS = require('aws-sdk');
var { nanoid } = require('nanoid');
let bucketName = "waleprjbucket"
/**
 * 
 * @param {object} opts 
 * @param {string} opts.folder: name of the logical folder
 * @param {object} opts.data 
 * @param {string} opts.data.name: e.g "car.jpg"
 * @param {function} opts.data.mv: A function to move the file elsewhere on your server. Can take a callback or return a promise.
 * @param {string} opts.data.mimetype: The mimetype of your file
 * @param {string} opts.data.data: A buffer representation of your file, returns empty buffer in case useTempFiles option was set to true.
 * @param {string} opts.data.tempFilePath: A path to the temporary file in case useTempFiles option was set to true.
 * @param {boolean} opts.data.truncated: A boolean that represents if the file is over the size limit
 * @param {number} opts.data.size: Uploaded size in bytes
 * @param {string} opts.data.md5: MD5 checksum of the uploaded file
 */
async function uploadToS3({ data,folderName ="public"}) {
   let keyName = (!!folderName && (folderName + "/")) + (nanoid() + `_` + data.name)
    var objectParams = { Bucket: bucketName, Key: keyName, Body: data.data };
    // Create object upload promise
    var uploadPromise = new AWS.S3({ apiVersion: '2006-03-01' }).
        putObject({...objectParams,ACL:"public-read"}).promise();
    return uploadPromise.then(
        function (data) {
            console.log("Successfully uploaded data to " + bucketName + "/" + keyName);
            console.log(data)
            return { bucketName, keyName }
        }).catch(reason => {
            throw reason
        });
}

module.exports = uploadToS3