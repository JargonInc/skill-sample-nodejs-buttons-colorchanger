![](https://images-na.ssl-images-amazon.com/images/G/01/kindle/dp/2017/4911315144/LP_AG_HERO_BANNER_1334x389.jpg)


# Color Changer Skill for Echo Buttons

**Important: The Gadgets Skill API is in beta and is subject to change at any time without notice. We welcome your feedback.**

## Pre-requisites

* Node.js (> v8.10)
* Register for an [AWS Account](https://aws.amazon.com/)
* Install and Setup [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/installing.html)
* Configure a named [AWS CLI Profile](https://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html)  
* Register for an [Amazon Developer Account](https://developer.amazon.com/)
* Install and Setup [ASK CLI](https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html)

### Installation
1. **Make sure** you are running the latest version of the CLI

   ```bash
   $ npm update -g ask-cli
   ```

2. If it's your first time using it, **initialize** the [ASK CLI](https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html) by running `ask init`. Follow the prompts.

   ```bash
   $ ask init
   ```

3. Create a new skill from the template

   ``` bash
   $ ask new --url https://github.com/JargonInc/skill-sample-nodejs-buttons-colorchanger.git
   ```

Note that you'll receive a warning message about downloading from an unofficial resource. The scripts for this template are the same as the source Amazon template (as of the time of forking).
### Deployment

ASK CLI **will create the skill and the Lambda function for you**. The Lambda function will be created in ```us-east-1 (Northern Virginia)``` by default.

1. Navigate to the project's root directory. You should see a file named 'skill.json' there.

2. Deploy the skill and the Lambda function in one step by running the following command:

   ```bash
   $ ask deploy
   ``` 

### Testing

1. To test, you need to login to Alexa Developer Console, and **enable the "Test" switch on your skill from the "Test" Tab**.

2. Simulate verbal interaction with your skill through the command line (this might take a few moments) using the following example (and be sure to use your invocation name if you've changed it):

   ```bash
   $ ask simulate -l en-US -t "open color changer"
   
   ✓ Simulation created for simulation id: 4a7a9ed8-94b2-40c0-b3bd-fb63d9887fa7
   ◡ Waiting for simulation response{
   "status": "SUCCESSFUL",
   ...
   ```

3. Once the "Test" switch is enabled, your skill can be tested on devices associated with the developer account as well. Speak to Alexa from any enabled device, from your browser at [echosim.io](https://echosim.io/welcome), or through your Amazon Mobile App and say:

   ```text
   Alexa, open color changer
   ```
## Customization

1. ```./skill.json```

   Change the skill name, example phrase, icons, testing instructions etc...

   Remember than many pieces of information are locale-specific and must be changed for each locale (e.g. en-US, en-GB, de-DE, etc.)

   See the Skill [Manifest Documentation](https://developer.amazon.com/docs/smapi/skill-manifest.html) for more information.

2. ```./lambda/custom/index.js```

   Change the core skill logic, and new intent handlers, etc.

3. ```./lambda/custom/resources/*```

   Customize the content your skill outputs to the user.

4. ```./models/*.json```

   Change the model definition to replace the invocation name and the sample phrase for each intent.  Repeat the operation for each locale you are planning to support.

5. Remember to re-deploy your skill and Lambda function for your changes to take effect.

   ```bash
   $ ask deploy
   ```
