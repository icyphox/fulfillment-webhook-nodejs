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
const {Card, Suggestion} = require('dialogflow-fulfillment');
admin.initializeApp(functions.config().firebase);
var db = admin.firestore();

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log("dialogflowFirebaseFulfillment: Body: " + JSON.stringify(request.body));

  function welcome (agent) {
    console.log("Welcome intent handler");
    agent.add(`Welcome to my agent!`);
  }

  function fallback (agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function es() {
    var type = request.body.queryResult.parameters['event_type'];
    var count = request.body.queryResult.parameters['event_count'];
    var name = request.body.queryResult.parameters['coordinator_name'];
    var date = request.body.queryResult.parameters['event_date'];
    var institution = request.body.queryResult.parameters['event_institution'];
    var city = request.body.queryResult.parameters['event_city'];
    var feedback = request.body.queryResult.parameters['event_feedback'];
    
    var EventSummary = {
      "name": name,
      "type": type,
      "count": count,
      "date": date,
      "institution": institution,
      "city": city,
      "feedback": feedback
    }

    console.log("*** event info" + name + ":" + type + ":" + count);
    
    return EventSummary;
  }

  function saveEvent(agent) {
    let EventSummary = es();
    console.log("Event Summary: " + EventSummary);
    let newEventRef = db.collection("event-summary").doc();
    newEventRef.set(EventSummary).then(function() {
      console.log("Document successfully written!");
    });
  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('event.info', saveEvent);
  agent.handleRequest(intentMap);
});
