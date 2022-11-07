import fs from 'fs';
import axios from 'axios';
import AWS from 'aws-sdk';

const BP_ENDPOINT = process.env.BP_ENDPOINT;
const isProd = (process.env.BP_ENV == 'production');

async function readInputFile() {
  const s3 = new AWS.S3({
    accessKeyId: process.env.BP_INPUT_ACCESS_KEY,
    secretAccessKey: process.env.BP_INPUT_ACCESS_SECRET,
    endpoint: process.env.BP_INPUT_ENDPOINT,
  });
  const data = await s3.getObject({
    Bucket: process.env.BP_INPUT_BUCKET,
    Key: process.env.BP_INPUT_FILE,
  }).promise();
  return data.Body;
}

async function writeOutputFile(content, contenttype) {
  const s3 = new AWS.S3({
    accessKeyId: process.env.BP_OUTPUT_ACCESS_KEY,
    secretAccessKey: process.env.BP_OUTPUT_ACCESS_SECRET,
    endpoint: process.env.BP_OUTPUT_ENDPOINT,
  });
  return await s3.putObject({
    Bucket: process.env.BP_OUTPUT_BUCKET,
    Key: process.env.BP_OUTPUT_FILE,
    Body: content,
    ContentType: contenttype,
  }).promise();
}

async function charge(quantity, unit) {
  if (isProd) {
    await axios.post(`${BP_ENDPOINT}/charge`, {
      jobId: process.env.BP_JOB_ID,
      quantity,
      unit,
    });
  } else {
    console.log('Charge', quantity, unit);
  }
}

async function log(...msg) {
  console.log(msg);
  if (isProd) {
    await axios.post(`${BP_ENDPOINT}/log`, {
      jobId: process.env.BP_JOB_ID,
      msg,
    });
  }
}

async function setStatus(status, msg) {
  console.log('Set job status to', status, msg);
  if (isProd) {
    await axios.post(`${BP_ENDPOINT}/status`, {
      jobId: process.env.BP_JOB_ID,
      status,
      msg,
    });
  }
}

async function reportStarted() {
  await setStatus('STARTED');
}

async function reportCompleted(msg) {
  await setStatus('COMPLETED', msg);
}

async function reportFailed(msg) {
  await setStatus('FAILED', msg);
}

export default {
  readInputFile,
  writeOutputFile,
  charge,
  log,
  reportStarted,
  reportFailed,
  reportCompleted,
}