const fs = require('fs-extra');
const AWS = require('aws-sdk');
const glob = require('glob');
const path = require('path');

const dir = {
  root: `${__dirname}/`,
  build: `${__dirname}/build/`,
  package: `${__dirname}/package/`,
};

const production = require(`${dir.build}production`);

const awsCreds = {
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

const s3 = new AWS.S3(awsCreds);
const cloudfront = new AWS.CloudFront(awsCreds);

const bucketName = (production) ? 'www.briananders.net' : 'staging.briananders.net';

const getContentType = (fileName) => {
  const extn = path.extname(fileName);

  switch (extn) {
    case '.html':
      return 'text/html';
    case '.css':
      return 'text/css';
    case '.js':
      return 'application/javascript';
    case '.png':
    case '.jpg':
    case '.gif':
      return `image/${extn}`;
    default:
      return 'application/octet-stream';
  }
};

const getS3Objects = () => {
  const uploadPromise = new Promise((resolve, reject) => {
    s3.listObjectsV2({
      Bucket: bucketName,
      MaxKeys: 1000,
    }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  return uploadPromise;
};

const deleteS3Files = (fileList) => {
  const deletePromise = new Promise((resolve, reject) => {
    if (fileList.length === 0) {
      resolve([]);
    } else {
      s3.deleteObjects({
        Bucket: bucketName,
        Delete: {
          Objects: fileList,
          Quiet: false,
        },
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data); // successful response
      });
    }
  });

  return deletePromise;
};

const uploadFile = (fileName, index, fileList) => {
  if (!(index % 10)) {
    console.log(`${index}/${fileList.length}: ${Math.floor((index / fileList.length) * 100)}%`);
  }

  const fileLocation = fileName.replace(dir.package, '');

  const uploadPromise = new Promise((resolve, reject) => {
    if (fs.lstatSync(fileName).isDirectory()) resolve(fileLocation);
    const fileData = fs.readFileSync(fileName);
    s3.upload({
      Bucket: bucketName,
      Key: fileLocation,
      Body: fileData,
      ContentType: getContentType(fileName),
      ACL: 'public-read',
      Expires: '2034-01-01T00:00:00Z',
      CacheControl: 'max-age=2592000,public',
      MetadataDirective: 'REPLACE',
    }, (err, uploadData) => {
      if (err) reject(err);
      else {
        console.log(`File uploaded successfully at ${uploadData.Location}`);
        resolve(fileLocation);
      }
    });
  });

  return uploadPromise;
};

const uploadFiles = (fileList) => {
  fs.chmodSync(dir.package, '0755');

  return Promise.all(fileList.map(uploadFile));
};

const invalidateCloudFront = () => {
  console.log('Invalidate Cache');

  const params = {
    DistributionId: process.env.CLOUDFRONT_ID,
    InvalidationBatch: { /* required */
      CallerReference: Date.now().toString(), /* required */
      Paths: { /* required */
        Quantity: '1', /* required */
        Items: [
          '/*'
        ],
      },
    },
  };

  cloudfront.createInvalidation(params, (err, data) => {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log(data); // successful response
  });
};

const alwaysSwapFiles = (fileName) => {
  return [
    /\.html$/,
    /\.html\.gz$/,
    /\.xml$/,
    /\.xml\.gz$/,
    /\.txt$/,
    /\.ico$/
  ].filter((regex) => regex.test(fileName)).length;
};

getS3Objects().then((data) => {
  const s3FileList = data.Contents.map(({ Key }) => Key);

  const packageGlob = glob.sync(`${dir.package}**/*`);

  const s3DeleteList = s3FileList.filter((s3File) => {
    return !packageGlob.includes(dir.package + s3File) ||
      alwaysSwapFiles(s3File);
  });

  const toUploadList = packageGlob.filter((packageFile) => {
    return !fs.lstatSync(packageFile).isDirectory() &&
    (
      !s3FileList.includes(packageFile.replace(dir.package, '')) ||
      alwaysSwapFiles(packageFile)
    );
  });

  console.log(`${s3DeleteList.length + toUploadList.length} files to change`);

  const s3DeleteListTranslate = s3DeleteList.map((file) => ({ Key: file }));

  return deleteS3Files(s3DeleteListTranslate).then(() => {
    return uploadFiles(toUploadList);
  });
}).then(() => {
  console.log('Upload Complete');

  if (production) {
    invalidateCloudFront();
  }

  console.log('Run `blc https://briananders.net -ro` to check for broken links');
});

// invalidateCloudFront();
