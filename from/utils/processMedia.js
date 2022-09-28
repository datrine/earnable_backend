const sharp = require("sharp");
const uploadToS3 = require("./upload/toS3");
const { getExtension } = require('mime');
/**
 * 
 * @param {object} data 
 * @param {string} data.name: e.g "car.jpg"
 * @param {function} data.mv: A function to move the file elsewhere on your server. Can take a callback or return a promise.
 * @param {string} data.mimetype: The mimetype of your file
 * @param {string} data.data: A buffer representation of your file, returns empty buffer in case useTempFiles option was set to true.
 * @param {string} data.tempFilePath: A path to the temporary file in case useTempFiles option was set to true.
 * @param {boolean} data.truncated: A boolean that represents if the file is over the size limit
 * @param {number} data.size: Uploaded size in bytes
 * @param {string} data.md5: MD5 checksum of the uploaded file
 */
async function processImg({ data, folderName }) {
    try {
        let imgData = {}
        let formats = processFormats({ data, folderName });
        let res = uploadBuild({ data, folderName }, false).catch(err => {
            console.log(err)
        })
        let promArray = [formats, res];
        let responseArray = [];
        for (const item of promArray) {
            responseArray.push(item)
        }
        if (responseArray[0]) {
            imgData.formats = responseArray[0]
        }
        if (responseArray[1]) {
            imgData = { ...imgData, ...responseArray[1] }
        }
        if (imgData.name) {
            return imgData;
        } else {
            throw "prof_pic not saved"
        }
    } catch (error) {
        console.log(error)
        throw error
    }
}

async function processFormats(opts = { folderName, data }) {
    let imgsUploaded = {}
    let formats = {}
    try {
        let formatObj = formatPredictor(opts.data.size)
        let optsTo = {}
        let arrayedImgData = []
        let setInArray = async (optsTo) => {
            let asyncFn = uploadBuild(optsTo);
            arrayedImgData.push(asyncFn)
        }

        if (formatObj.large) {
            optsTo = { sizeWidth: 1600, quality: 75, ...opts, format: "large" }
            setInArray(optsTo)
        }
        if (formatObj.medium) {
            optsTo = { sizeWidth: 1024, quality: 50, ...opts, format: "medium" }
            setInArray(optsTo)
        }
        if (formatObj.small) {
            optsTo = { sizeWidth: 512, quality: 25, ...opts, format: "small" }
            setInArray(optsTo)
        }
        if (formatObj.thumbnail) {
            optsTo = { sizeWidth: 150, quality: 10, ...opts, format: "thumbnail" }
            setInArray(optsTo)
        }
        for await (const result of arrayedImgData) {
            let { format, ...rest } = result;
            formats = { ...formats, [format]: rest }
        }
        return formats
    } catch (error) {
        throw error
    }
}

let uploadBuild = async ({ sizeWidth, quality, data, folderName, format }, needRework = true) => {
    try {
        let mySharp = sharp(data.data)
        if (needRework) {
            switch (getExtension(data.mimetype)) {
                case "jpeg":
                case "jpg":
                    mySharp.resize(sizeWidth).jpeg({ quality })
                    break;

                default:
                    mySharp.resize(sizeWidth)
                    break;
            }
        }
        let { data: newBuf, info } = await mySharp.withMetadata().toBuffer({ resolveWithObject: true });
        data = { ...data, data: newBuf, size: info.size }
        console.log(data.size)
        let res = await uploadToS3({ data, folderName });
        let { width, height } = info
        return buildImgUrlData({ data: { ...data, ...res, width, height }, format })

    } catch (error) {
        console.log(error);
    }
}

function formatPredictor(size) {
    let formats = { thumbnail: true, small: false, medium: false, large: false }
    if (size <= 25000) {
        //formats.thumbnail = true;
    }
    if (size > 25000) {
        formats.small = true;
    }
    if (size > 100000) {
        formats.medium = true;
    }
    if (size > 500000) {
        formats.large = true;
    }
    console.log(formats)
    return formats
}

function buildImgUrlData({ data, format = "" }) {
    let urlData = buildUrlData({ data })
    let obj = {
        ...urlData,
        mime: data.mimetype,
        width: data.width,
        height: data.height,
        format
    }
    return obj
}

function buildUrlData({ data, }) {
    let fullNames = data.keyName.split("/");
    let name = fullNames[fullNames.length - 1];
    let path = fullNames.slice(0, fullNames.length - 1).join("/")
    let obj = {
        ext: getExtension(data.mimetype),
        url: `https://${data.bucketName}.s3.amazonaws.com/${data.keyName}`,
        size: data.size,
        name,
        path,
    }
    return obj
}
module.exports = { processImg }