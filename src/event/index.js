'use strict';
const AWS = require('aws-sdk');

const pipeline = new AWS.CodePipeline();
const sqs = new AWS.SQS();

const QueueUrl = process.env['QUEUE_URL'];

exports.handler = event => {

  sqs.receiveMessage({QueueUrl}, (err, data) => {
    if (err) return console.error(err);
    console.log(data);
    if (data.Messages === undefined) return console.log('null');

    data.Messages.map(message => {
      const body = JSON.parse(message.Body);
      console.log(body);
      const queueMessage = JSON.parse(body.Message);
      console.log(queueMessage);
      const pipelineParams = {
        actionName: queueMessage.approval.actionName,
        pipelineName: queueMessage.approval.pipelineName,
        result: {
          status: 'Approved',
          summary: 'Approved by Lambda',
        },
        stageName: queueMessage.approval.stageName,
        token: queueMessage.approval.token,
      };

      pipeline.putApprovalResult(pipelineParams, (err, data) => {
        if (err) return console.error(err);
        console.log(data);

        sqs.deleteMessage({QueueUrl, ReceiptHandle: message.ReceiptHandle}, (err, data) => {
          if (err) return console.error(err);
          console.log(data);
        });
      });
    });
  });
};
