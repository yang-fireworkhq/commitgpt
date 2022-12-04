import { execSync } from 'child_process';

import { ChatGPTAPI } from 'chatgpt';
import enquirer from 'enquirer';
import ora from 'ora';
import parseArgs from 'yargs-parser';

const CUSTOM_MESSAGE_OPTION = '[write own message]...';
const MORE_OPTION = '[ask for more ideas]...';
const spinner = ora();

const argv = parseArgs(process.argv.slice(2));

const conventionalCommit = argv.conventional || argv.c;
const CONVENTIONAL_REQUEST = conventionalCommit ? `following conventional commit (<type>: <subject>)` : '';

async function run(diff) {
  const api = new ChatGPTAPI();

  spinner.start('Authorizing with OpenAI...');
  // open chromium and wait until you've logged in
  await api.init({ auth: 'blocking' });
  spinner.stop();

  const firstRequest =
    `Suggest me a few good commit messages for my commit ${CONVENTIONAL_REQUEST}.\n` +
    `\`\`\`\n` +
    diff +
    '\n' +
    `\`\`\`\n\n` +
    `Output results as a list, not more than 6 items.`;

  let firstRequestSent = false;

  while (true) {
    try {
      const choices = await getMessages(
        api,
        firstRequestSent
          ? `Suggest a few more commit messages for my changes (without explanations) ${CONVENTIONAL_REQUEST}`
          : firstRequest
      );

      const answer = await enquirer.prompt<{ message: string }>({
        type: 'select',
        name: 'message',
        message: 'Pick a message',
        choices,
      });

      firstRequestSent = true;

      if (answer.message === CUSTOM_MESSAGE_OPTION) {
        execSync('git commit', { stdio: 'inherit' });
        return;
      } else if (answer.message === MORE_OPTION) {
        continue;
      } else {
        execSync(`git commit -m '${answer.message.replace(/'/, `\\'`)}'`, { stdio: 'inherit' });
        return;
      }
    } catch (e) {
      console.log('Aborted.');
      process.exit(1);
    }
  }
}

async function getMessages(api, request: string) {
  spinner.start('Asking ChatGPT 🤖 for commit messages...');

  // send a message and wait for the response
  const response = await api.sendMessage(request);

  const messages = response
    .split('\n')
    .filter(line => line.startsWith('* ') || line.match(/^\d+\.\s+/))
    .map(normalizeMessage);

  spinner.stop();

  if (messages.length === 0) {
    console.log('No suggestions, write your own message...');
    execSync('git commit');
    return;
  }

  messages.push(CUSTOM_MESSAGE_OPTION, MORE_OPTION);
  return messages;
}

function normalizeMessage(line: string) {
  return line
    .replace(/^\*\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/^[`"']/, '')
    .replace(/[`"']$/, '')
    .replace(/[`"']:/, ':') // sometimes it formats messages like this: `feat`: message
    .replace(/:[`"']/, ':') // sometimes it formats messages like this: `feat:` message
    .replace(/\\n/g, '')
    .replace(/\\t/g, ' ');
}

run(execSync('git diff --staged').toString()).then(() => {
  process.exit(0);
});