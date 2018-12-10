/*
 * Copyright 2018 Amazon.com, Inc. and its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

'use strict';

const Alexa = require('ask-sdk-core');
const Jargon = require('@jargon/alexa-skill-sdk')
const ri = Jargon.ri

// Gadget Directives Builder
const GadgetDirectives = require('util/gadgetDirectives.js');
// import the skill settings constants 
const Settings = require('settings.js');

const RollCall = require('rollcall.js');
const GamePlay = require('gameplay.js');

const util = require('util')
util.inspect.defaultOptions.depth = null

let skill;
 
exports.handler = function (event, context) {
     // Prints Alexa Event Request to CloudWatch logs for easier debugging
     console.log(`===EVENT===${util.inspect(event)}`);
     if (!skill) {
      const opts = {
        mergeSpeakAndReprompt: true
      }
      const skillBuilder = new Jargon.JargonSkillBuilder(opts).wrap(Alexa.SkillBuilders.custom());
      skill = skillBuilder
         .addRequestHandlers(
             GlobalHandlers.LaunchRequestHandler,
             GlobalHandlers.GameEngineInputHandler,
             GlobalHandlers.HelpIntentHandler,
             GlobalHandlers.StopIntentHandler,
             GlobalHandlers.YesIntentHandler,
             GlobalHandlers.NoIntentHandler,
             GlobalHandlers.SessionEndedRequestHandler,
             GlobalHandlers.DefaultHandler
         )
         .addResponseInterceptors(GlobalHandlers.ResponseInterceptor)
         .addErrorHandlers(GlobalHandlers.ErrorHandler)
         .create();
     }

     // TODO: show example of setting up DynamoDB persistance using new Alexa SDK v2
 
     return skill.invoke(event,context);
 }

// ***********************************************************************
//   Global Handlers
//     set up some handlers for events that will have to be handled
//     regardless of what state the skill is in
// ***********************************************************************
const GlobalHandlers = {
    LaunchRequestHandler: {
        canHandle(handlerInput) {
            let { request } = handlerInput.requestEnvelope;
            console.log("LaunchRequestHandler: checking if it can handle " + request.type);
            return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
        },
        handle(handlerInput) {
            console.log("LaunchRequestHandler: handling request");

            return RollCall.NewSession(handlerInput);
        }
    },
    ErrorHandler: {
        canHandle(handlerInput, error) {
            let { request } = handlerInput.requestEnvelope;
            console.log("Global.ErrorHandler: checking if it can handle " 
                + request.type + ": [" + error.name + "] -> " + !!error.name);
            return !!error.name;     //error.name.startsWith('AskSdk');
        },
        handle(handlerInput, error) {
            console.log("Global.ErrorHandler: error = " + error.stack);

            return handlerInput.jrb
                .speak(ri("Error"))
                .getResponse();
        }
    },
    HelpIntentHandler: {
        canHandle(handlerInput) {
            const { request } = handlerInput.requestEnvelope;
            const intentName = request.intent ? request.intent.name : '';
            console.log("Global.HelpIntentHandler: checking if it can handle " 
                + request.type + " for " + intentName);
            return request.type === 'IntentRequest'
                && intentName === 'AMAZON.HelpIntent';
        },
        handle(handlerInput) {
            console.log("Global.HelpIntentHandler: handling request for help");

            const { attributesManager } = handlerInput;
            const sessionAttributes = attributesManager.getSessionAttributes();
            const ctx = attributesManager.getRequestAttributes();

            if (sessionAttributes.CurrentInputHandlerID) {
                // if there is an active input handler, stop it so it doesn't interrup Alexa speaking the Help prompt
                // see: https://developer.amazon.com/docs/gadget-skills/receive-echo-button-events.html#stop
                handlerInput.jrb.addDirective(
                  GadgetDirectives.stopInputHandler({ 
                    'id': sessionAttributes.CurrentInputHandlerID
                }))
            }

            if (sessionAttributes.isRollCallComplete === true) {
                // roll call is complete
                handlerInput.jrb.reprompt(ri("Help.PostRollCallReprompt"))
                handlerInput.jrb.speak(ri("Help.PostRollCallSpeak"))            
            } else {            
                // the user hasn't yet completed roll call
                handlerInput.jrb.reprompt(ri("Help.PreRollCallReprompt"))
                handlerInput.jrb.speak(ri("Help.PreRollCallSpeak"))  
                                
                sessionAttributes.expectingEndSkillConfirmation = true;
            }  
            
            return handlerInput.jrb.getResponse();
        }
    },
    StopIntentHandler: {
        canHandle(handlerInput) {
            const { request } = handlerInput.requestEnvelope;
            const intentName = request.intent ? request.intent.name : '';
                    
            console.log("Global.StopIntentHandler: checking if it can handle " 
                + request.type + " for " + intentName);
            return request.type === 'IntentRequest'
                && intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent';
        },
        handle(handlerInput) {
            console.log("Global.StopIntentHandler: handling request");
            return GlobalHandlers.SessionEndedRequestHandler.handle(handlerInput);
        }
    },
    GameEngineInputHandler: {
        canHandle(handlerInput) {
            let { request } = handlerInput.requestEnvelope;
            console.log("Global.GameEngineInputHandler: checking if it can handle " 
                + request.type);
            return request.type === 'GameEngine.InputHandlerEvent';
        },
        handle(handlerInput) { 
            let { attributesManager } = handlerInput;
            let request = handlerInput.requestEnvelope.request;
            const sessionAttributes = attributesManager.getSessionAttributes();
            const ctx = attributesManager.getRequestAttributes();
            if (request.originatingRequestId !== sessionAttributes.CurrentInputHandlerID) {
                console.log("Global.GameEngineInputHandler: stale input event received -> " 
                           +"received event from " + request.originatingRequestId 
                           +" (was expecting " + sessionAttributes.CurrentInputHandlerID + ")");
                ctx.openMicrophone = false;
                return handlerInput.jrb.getResponse();
            }

            var gameEngineEvents = request.events || [];
            for (var i = 0; i < gameEngineEvents.length; i++) {
                // In this request type, we'll see one or more incoming events
                // that correspond to the StartInputHandler we sent above.
                switch (gameEngineEvents[i].name) {
                    case 'first_button_checked_in':
                        ctx.gameInputEvents = gameEngineEvents[i].inputEvents;
                        return RollCall.HandleFirstButtonCheckIn(handlerInput);
                    case 'second_button_checked_in':
                        ctx.gameInputEvents = gameEngineEvents[i].inputEvents;
                        return RollCall.HandleSecondButtonCheckIn(handlerInput);
                    case 'button_down_event':
                        if (sessionAttributes.state == Settings.SKILL_STATES.PLAY_MODE) {
                            ctx.gameInputEvents = gameEngineEvents[i].inputEvents;
                            return GamePlay.HandleButtonPressed(handlerInput);
                        }
                        break;
                    case 'timeout':                        
                        if (sessionAttributes.state == Settings.SKILL_STATES.PLAY_MODE) {
                            return GamePlay.HandleTimeout(handlerInput);
                        } else {
                            RollCall.HandleTimeout(handlerInput);
                        }
                        break;
                }
            }
            return handlerInput.jrb.getResponse();
        }
    },
    YesIntentHandler: {
        canHandle(handlerInput) {
            let { request } = handlerInput.requestEnvelope;
            let intentName = request.intent ? request.intent.name : '';
            console.log("Global.YesIntentHandler: checking if it can handle " 
                + request.type + " for " + intentName);
            return request.type === 'IntentRequest'
                && intentName === 'AMAZON.YesIntent';
        },
        handle(handlerInput) {
            console.log("Global.YesIntentHandler: handling request");
            let { attributesManager } = handlerInput;         
            const sessionAttributes = attributesManager.getSessionAttributes();
            const ctx = attributesManager.getRequestAttributes();
            const state = sessionAttributes.state || '';
            // ---- Hanlde "Yes" when we're in the context of Roll Call ...
            if (state === Settings.SKILL_STATES.ROLL_CALL_MODE 
                && sessionAttributes.expectingEndSkillConfirmation === true) {
                // pass control to the StartRollCall event handler to restart the rollcall process
                handlerInput.jrb.speak(ri("RollCall.Instructions"))
                ctx.timeout = 30000;
                return RollCall.StartRollCall(handlerInput);
            } else if (state === Settings.SKILL_STATES.EXIT_MODE 
                && sessionAttributes.expectingEndSkillConfirmation === true) {
                return GlobalHandlers.SessionEndedRequestHandler.handle(handlerInput);                                
            } else if (state === Settings.SKILL_STATES.EXIT_MODE) {
                // ---- Hanlde "Yes", if we're in EXIT_MODE, but not expecting exit confirmation
                return GlobalHandlers.DefaultHandler.handle(handlerInput);
            } else {
                // ---- Hanlde "Yes" in other cases .. just fall back on the help intent
                return GlobalHandlers.HelpIntentHandler.handle(handlerInput);
            }
        }
    },
    NoIntentHandler: {
        canHandle(handlerInput) {
            let { request } = handlerInput.requestEnvelope;
            let intentName = request.intent ? request.intent.name : '';
            console.log("Global.NoIntentHandler: checking if it can handle " 
                + request.type + " for " + intentName);
            return request.type === 'IntentRequest'
                && intentName === 'AMAZON.NoIntent';
        },
        handle(handlerInput) {
            console.log("Global.NoIntentHandler: handling request");
            let { attributesManager } = handlerInput;
            const sessionAttributes = attributesManager.getSessionAttributes();
            const ctx = attributesManager.getRequestAttributes();
            const state = sessionAttributes.state || '';
            
            // ---- Hanlde "No" when we're in the context of Roll Call ...
            if (state === Settings.SKILL_STATES.ROLL_CALL_MODE 
                && sessionAttributes.expectingEndSkillConfirmation === true) {
                // if user says No when prompted whether they will to continue with rollcall then just exit
                return GlobalHandlers.StopIntentHandler.handle(handlerInput);
            } if (state === Settings.SKILL_STATES.EXIT_MODE 
                && sessionAttributes.expectingEndSkillConfirmation === true) { 
                handlerInput.jrb
                  .reprompt(ri("PickDifferentColor"))
                  .speak(ri("KeepGoing"))
                  .speak(ri("PickDifferentColor"))
                ctx.openMicrophone = true;
                sessionAttributes.state = Settings.SKILL_STATES.PLAY_MODE;
                return handlerInput.responseBuilder.getResponse();
            } else if (state === Settings.SKILL_STATES.EXIT_MODE) {
                // ---- Hanlde "No" in other cases .. just fall back on the help intent
                return GlobalHandlers.DefaultHandler.handle(handlerInput);
            } else {
                // ---- Hanlde "No" in other cases .. just fall back on the help intent
                return GlobalHandlers.HelpIntentHandler.handle(handlerInput);
            }
        }
    },
    DefaultHandler: {
        canHandle(handlerInput) {
            let { request } = handlerInput.requestEnvelope;
            let intentName = request.intent ? request.intent.name : '';
            console.log("Global.DefaultHandler: checking if it can handle " 
                + request.type + " for " + intentName);
            return true;
        },
        handle(handlerInput) {            
            console.log("Global.DefaultHandler: handling request");
            if (handlerInput.requestEnvelope.request.type === 'IntentRequest'
                && handlerInput.requestEnvelope.request.intent.name === 'colorIntent') {
                return GamePlay.ColorIntentHandler(handlerInput);
            }
 
            const ctx = handlerInput.attributesManager.getRequestAttributes();
 
            // otherwise, try to let the user know that we couldn't understand the request 
            //  and prompt for what to do next
            handlerInput.jrb
              .reprompt(ri("SayAgainOrHelp"))
              .speak(ri("Sorry"))
              .speak(ri("SayAgainOrHelp"))
            
            ctx.openMicrophone = true;        
            return handlerInput.jrb.getResponse();
        }
    },
    SessionEndedRequestHandler: {
        canHandle(handlerInput) {
            return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
        },
        handle(handlerInput) {
            console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
            return handlerInput.jrb
              .speak(ri("Goodbye"))
              .withShouldEndSession(true)
              .getResponse()
        },
    },
    ResponseInterceptor: {
        process(handlerInput) {        
            let {attributesManager, responseBuilder} = handlerInput;                        
            const ctx = attributesManager.getRequestAttributes();   
            console.log("Global.ResponseInterceptor: post-processing response " + util.inspect(ctx)); 
            
            let response = responseBuilder.getResponse();
            
            if ('openMicrophone' in ctx) {
                if (ctx.openMicrophone) {
                    // setting shouldEndSession = fase  -  lets Alexa know that we want an answer from the user 
                    // see: https://developer.amazon.com/docs/gadget-skills/receive-voice-input.html#open
                    //      https://developer.amazon.com/docs/gadget-skills/keep-session-open.html
                    response.shouldEndSession = false;
                    console.log("Global.ResponseInterceptor: request to open microphone -> shouldEndSession = false"); 
                } else {
                    // deleting shouldEndSession will keep the skill session going, 
                    //  while the input handler is active, waiting for button presses
                    // see: https://developer.amazon.com/docs/gadget-skills/keep-session-open.html
                    delete response.shouldEndSession;
                    console.log("Global.ResponseInterceptor: request to open microphone -> delete shouldEndSession"); 
                }
            }

            console.log(`==Response==${util.inspect(response)}`);
            console.log(`==SessionAttributes==${util.inspect(attributesManager.getSessionAttributes())}`);

            return response;
        }
    }
};