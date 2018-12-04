# Color Changer Skill for Echo Buttons, using the Jargon SDK

This is a fork of the [](https://github.com/alexa/skill-sample-nodejs-buttons-colorchanger#readme) that uses the [Jargon SDK](https://github.com/JargonInc/jargon-sdk-nodejs/tree/master/packages/alexa-skill-sdk#readme) to manage content.

## Changes from the source template
* Add dependency on the Jargon SDK npm package (@jargon/alexa-skill-sdk)
* Use the Jargon skill builder during initialization
* Use the Jargon response builder to construct all responses
* Move response content into locale-specific resource files

The source template uses a response interceptor to merge together the content used for speak and reprompt instructions, as well as to add multiple directives. This isn't necessary with the Jargon SDK with the "mergeSpeakAndReprompt" option enabled. The response interceptor is still needed to set the end session flag correctly, but the skill's response interceptor isn't (and thus isn't present in this version of the template).

## Instructions

See https://github.com/JargonInc/skill-sample-nodejs-buttons-colorchanger/blob/master/instructions/2-deployment-cli.md for instructions on how to use this template via the ASK CLI.

In general the instructions from the source template are also applicable.