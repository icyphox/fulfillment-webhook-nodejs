// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Dialogflow fulfillment getting started guide:
// https://dialogflow.com/docs/how-tos/getting-started-fulfillment

'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:*'; // enables lib debugging statements
admin.initializeApp(functions.config().firebase);
var db = admin.firestore();


exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log("dialogflowFirebaseFulfillment: Body: " + JSON.stringify(request.body));

  function writeToDb (agent) {
    // Get parameter from Dialogflow with the string to add to the database
    let type = agent.parameters['event_type'];
    let count = agent.parameters['event_count'];
    let name = agent.parameters['coordinator_name'];
    let date = agent.parameters['event_date'];
    let institution = agent.parameters['event_institution'];
    let city = agent.parameters['event_city'];
    let feedback = agent.parameters['event_feedback'];
    
    let EventSummary = {
      "name": name,
      "type": type,
      "count": count,
      "date": date,
      "institution": institution,
      "city": city,
      "feedback": feedback
    }    
    // const databaseEntry = agent.parameters.databaseEntry;
    const databaseEntry = agent.parameters;
    const dialogflowAgentRef = db.collection('event-summary').doc();
    return db.runTransaction(t => {
      t.set(dialogflowAgentRef, {entry: databaseEntry});
      return Promise.resolve('Write complete');
    }).then(doc => {
      agent.add(`Thanks for submitting the information and all the best. Please submit the complete feedback with attendee information (if available, for *public* events) at our Events Portal: events.heartfulness.org`);
    }).catch(err => {
      console.error(`error writing to Firestore: ${err}`);
      agent.add(`Sorry, There was an error. Please try again later!!`);
    });
  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('event.info', writeToDb);
  agent.handleRequest(intentMap);
});
